from sqlalchemy.orm import Session

from models import JobRole, JobRoleSkill, UserSkill, Skill

MASTERED_THRESHOLD = 0.75
IMPROVE_THRESHOLD = 0.55


def calculate_career_score(db: Session, user_id: str, job_role_id: str) -> dict:
    job_role = db.query(JobRole).filter(JobRole.id == job_role_id).first()
    if job_role is None:
        return None

    required_skills = (
        db.query(JobRoleSkill, Skill)
        .join(Skill, Skill.id == JobRoleSkill.skill_id)
        .filter(JobRoleSkill.job_role_id == job_role_id)
        .all()
    )

    if not required_skills:
        return {
            "job_role": job_role.name,
            "score": 0,
            "mastered": [],
            "to_improve": [],
            "missing": [],
        }

    user_skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == user_id)
        .all()
    )
    user_skill_scores = {}
    for us in user_skills:
        current = user_skill_scores.get(str(us.skill_id), 0)
        if us.confidence_score > current:
            user_skill_scores[str(us.skill_id)] = us.confidence_score

    mastered = []
    to_improve = []
    missing = []

    total_weight = 0.0
    earned_weight = 0.0

    for job_role_skill, skill in required_skills:
        weight = job_role_skill.weight
        total_weight += weight

        user_score = user_skill_scores.get(str(skill.id))

        if user_score is None:
            missing.append({"name": skill.name, "weight": weight})
        elif user_score >= MASTERED_THRESHOLD:
            earned_weight += weight
            mastered.append(
                {"name": skill.name, "weight": weight, "confidence_score": round(user_score, 3)}
            )
        elif user_score >= IMPROVE_THRESHOLD:
            earned_weight += weight * 0.5  # crédit partiel pour une compétence en cours de maîtrise
            to_improve.append(
                {"name": skill.name, "weight": weight, "confidence_score": round(user_score, 3)}
            )
        else:
            missing.append({"name": skill.name, "weight": weight})

    score = round((earned_weight / total_weight) * 100, 1) if total_weight > 0 else 0

    return {
        "job_role": job_role.name,
        "score": score,
        "mastered": sorted(mastered, key=lambda s: s["weight"], reverse=True),
        "to_improve": sorted(to_improve, key=lambda s: s["weight"], reverse=True),
        "missing": sorted(missing, key=lambda s: s["weight"], reverse=True),
    }


def simulate_career_score(
    db: Session, user_id: str, job_role_id: str, simulated_skill_names: list[str]
) -> dict:
    """
    Recalcule le Career Score en supposant que les compétences listées dans
    simulated_skill_names sont maîtrisées (score de confiance = 1.0),
    en plus des compétences déjà détectées pour l'utilisateur.
    """
    job_role = db.query(JobRole).filter(JobRole.id == job_role_id).first()
    if job_role is None:
        return None

    required_skills = (
        db.query(JobRoleSkill, Skill)
        .join(Skill, Skill.id == JobRoleSkill.skill_id)
        .filter(JobRoleSkill.job_role_id == job_role_id)
        .all()
    )

    if not required_skills:
        return {
            "job_role": job_role.name,
            "score": 0,
            "mastered": [],
            "to_improve": [],
            "missing": [],
        }

    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
    user_skill_scores = {}
    for us in user_skills:
        current = user_skill_scores.get(str(us.skill_id), 0)
        if us.confidence_score > current:
            user_skill_scores[str(us.skill_id)] = us.confidence_score

    # On applique la simulation : les compétences choisies passent à 1.0 (maîtrise complète)
    simulated_names_set = set(simulated_skill_names)
    for job_role_skill, skill in required_skills:
        if skill.name in simulated_names_set:
            user_skill_scores[str(skill.id)] = 1.0

    mastered = []
    to_improve = []
    missing = []

    total_weight = 0.0
    earned_weight = 0.0

    for job_role_skill, skill in required_skills:
        weight = job_role_skill.weight
        total_weight += weight

        user_score = user_skill_scores.get(str(skill.id))
        is_simulated = skill.name in simulated_names_set

        if user_score is None:
            missing.append({"name": skill.name, "weight": weight})
        elif user_score >= MASTERED_THRESHOLD:
            earned_weight += weight
            mastered.append(
                {
                    "name": skill.name,
                    "weight": weight,
                    "confidence_score": round(user_score, 3),
                    "simulated": is_simulated,
                }
            )
        elif user_score >= IMPROVE_THRESHOLD:
            earned_weight += weight * 0.5
            to_improve.append(
                {"name": skill.name, "weight": weight, "confidence_score": round(user_score, 3)}
            )
        else:
            missing.append({"name": skill.name, "weight": weight})

    score = round((earned_weight / total_weight) * 100, 1) if total_weight > 0 else 0

    return {
        "job_role": job_role.name,
        "score": score,
        "mastered": sorted(mastered, key=lambda s: s["weight"], reverse=True),
        "to_improve": sorted(to_improve, key=lambda s: s["weight"], reverse=True),
        "missing": sorted(missing, key=lambda s: s["weight"], reverse=True),
    }