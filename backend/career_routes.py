from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, JobRole
from auth import get_current_user
from career import calculate_career_score, simulate_career_score
from schemas_simulator import SimulationRequest

router = APIRouter(prefix="/career", tags=["career"])

@router.get("/roles")
def list_job_roles(db: Session = Depends(get_db)):
    job_roles = db.query(JobRole).all()
    return [
        {"id": str(role.id), "name": role.name, "description": role.description}
        for role in job_roles
    ]


@router.get("/score/{job_role_id}")
def get_career_score(
    job_role_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = calculate_career_score(db, str(current_user.id), job_role_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Métier cible introuvable.",
        )

    return result


@router.post("/simulate/{job_role_id}")
def simulate_score(
    job_role_id: str,
    payload: SimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = simulate_career_score(
        db, str(current_user.id), job_role_id, payload.skill_names
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Métier cible introuvable.",
        )

    return result