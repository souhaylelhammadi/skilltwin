import io

from celery_app import celery_app
from database import SessionLocal
from models import Document, DocumentStatus, DocumentType
from storage import download_file


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    import pdfplumber

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_text_from_docx(file_bytes: bytes) -> str:
    import docx

    document = docx.Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in document.paragraphs if p.text]
    return "\n".join(paragraphs)


@celery_app.task(name="extract_document_text")
def extract_document_text(document_id: str):
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document is None:
            return {"error": "Document introuvable"}

        document.status = DocumentStatus.PROCESSING
        db.commit()

        try:
            file_bytes = download_file(document.storage_key)

            if document.file_type == DocumentType.PDF:
                extracted_text = _extract_text_from_pdf(file_bytes)
            else:
                extracted_text = _extract_text_from_docx(file_bytes)

            document.extracted_text = extracted_text
            document.status = DocumentStatus.PROCESSED
            db.commit()

            return {"status": "processed", "text_length": len(extracted_text)}

        except Exception as exc:
            document.status = DocumentStatus.FAILED
            db.commit()
            return {"status": "failed", "error": str(exc)}

    finally:
        db.close()