import io
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from database import get_db
from models import Document, DocumentStatus, DocumentType, User
from auth import get_current_user
from storage import upload_file, ensure_bucket_exists
from tasks import extract_document_text

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 Mo

ALLOWED_CONTENT_TYPES = {
    "application/pdf": DocumentType.PDF,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocumentType.DOCX,
}


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de fichier non supporté. Formats acceptés : PDF, DOCX.",
        )

    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Le fichier dépasse la taille maximale autorisée (5 Mo).",
        )

    file_type = ALLOWED_CONTENT_TYPES[file.content_type]
    extension = "pdf" if file_type == DocumentType.PDF else "docx"
    storage_key = f"{current_user.id}/{uuid.uuid4()}.{extension}"

    ensure_bucket_exists()
    upload_file(
        storage_key=storage_key,
        file_data=io.BytesIO(file_bytes),
        file_size=file_size,
        content_type=file.content_type,
    )

    document = Document(
        user_id=current_user.id,
        original_filename=file.filename,
        storage_key=storage_key,
        file_type=file_type,
        file_size_bytes=file_size,
        status=DocumentStatus.UPLOADED,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    extract_document_text.delay(str(document.id))

    return {
        "id": str(document.id),
        "original_filename": document.original_filename,
        "file_type": document.file_type.value,
        "file_size_bytes": document.file_size_bytes,
        "status": document.status.value,
        "uploaded_at": document.uploaded_at.isoformat(),
    }



@router.get("/{document_id}")
def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document introuvable.",
        )

    return {
        "id": str(document.id),
        "original_filename": document.original_filename,
        "file_type": document.file_type.value,
        "file_size_bytes": document.file_size_bytes,
        "status": document.status.value,
        "extracted_text": document.extracted_text,
        "uploaded_at": document.uploaded_at.isoformat(),
    }

