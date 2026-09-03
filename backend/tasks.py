import io

from celery_app import celery_app
from database import SessionLocal
from models import Document, DocumentStatus, DocumentType, Skill, UserSkill
from storage import download_file

_embedding_model = None

SIMILARITY_THRESHOLD = 0.55  # score de confiance minimum pour valider une compétence


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


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

            extract_skills_from_document.delay(str(document.id))

            return {"status": "processed", "text_length": len(extracted_text)}

        except Exception as exc:
            document.status = DocumentStatus.FAILED
            db.commit()
            return {"status": "failed", "error": str(exc)}

    finally:
        db.close()


@celery_app.task(name="extract_skills_from_document")
def extract_skills_from_document(document_id: str):
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document is None or not document.extracted_text:
            return {"error": "Document introuvable ou sans texte extrait"}

        lines = [
            line.strip()
            for line in document.extracted_text.split("\n")
            if len(line.strip()) >= 3
        ]
        if not lines:
            return {"status": "no_content"}

        model = _get_embedding_model()
        line_embeddings = model.encode(lines)

        skills = db.query(Skill).filter(Skill.embedding.isnot(None)).all()

        best_scores: dict[str, float] = {}

        for line_embedding in line_embeddings:
            for skill in skills:
                import numpy as np

                skill_vec = np.array(skill.embedding)
                line_vec = np.array(line_embedding)
                cosine_similarity = float(
                    np.dot(skill_vec, line_vec)
                    / (np.linalg.norm(skill_vec) * np.linalg.norm(line_vec))
                )

                if cosine_similarity >= SIMILARITY_THRESHOLD:
                    current_best = best_scores.get(str(skill.id), 0)
                    if cosine_similarity > current_best:
                        best_scores[str(skill.id)] = cosine_similarity

        db.query(UserSkill).filter(
            UserSkill.document_id == document.id
        ).delete()

        for skill_id, score in best_scores.items():
            user_skill = UserSkill(
                user_id=document.user_id,
                skill_id=skill_id,
                document_id=document.id,
                confidence_score=score,
            )
            db.add(user_skill)

        db.commit()

        return {"status": "processed", "skills_detected": len(best_scores)}

    finally:
        db.close()