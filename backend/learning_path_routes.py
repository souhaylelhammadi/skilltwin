from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth import get_current_user
from learning_path import generate_learning_path

router = APIRouter(prefix="/learning-path", tags=["learning-path"])


@router.get("/{job_role_id}")
def get_learning_path(
    job_role_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = generate_learning_path(db, str(current_user.id), job_role_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Métier cible introuvable.",
        )

    return result