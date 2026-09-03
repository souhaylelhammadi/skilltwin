from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserSkill, Skill
from auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/skills")
def get_user_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(UserSkill, Skill)
        .join(Skill, Skill.id == UserSkill.skill_id)
        .filter(UserSkill.user_id == current_user.id)
        .order_by(UserSkill.confidence_score.desc())
        .all()
    )

    grouped: dict[str, list[dict]] = defaultdict(list)
    seen_skill_names: set[str] = set()

    for user_skill, skill in results:
        if skill.name in seen_skill_names:
            continue
        seen_skill_names.add(skill.name)

        category = skill.category or "Autres"
        grouped[category].append(
            {
                "name": skill.name,
                "confidence_score": round(user_skill.confidence_score, 3),
            }
        )

    return {
        "total_skills": len(seen_skill_names),
        "categories": grouped,
    }