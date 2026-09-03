"""
Script de seed des métiers cibles et de leurs compétences requises.
Usage : docker compose exec backend python seed_job_roles.py
"""

from database import SessionLocal
from models import JobRole, JobRoleSkill, Skill

# Format : (nom_metier, description, [(nom_competence, poids), ...])
JOB_ROLES_SEED = [
    (
        "AI Engineer",
        "Conçoit, entraîne et déploie des modèles de machine learning et deep learning en production.",
        [
            ("Python", 3.0),
            ("Machine Learning", 3.0),
            ("Deep Learning", 3.0),
            ("PyTorch", 2.5),
            ("TensorFlow", 2.5),
            ("scikit-learn", 2.0),
            ("Docker", 2.0),
            ("SQL", 1.5),
            ("Git", 1.0),
            ("CI/CD", 1.0),
        ],
    ),
    (
        "Data Scientist",
        "Analyse des données complexes pour en extraire des insights et construire des modèles prédictifs.",
        [
            ("Python", 3.0),
            ("Machine Learning", 3.0),
            ("Pandas", 2.5),
            ("scikit-learn", 2.5),
            ("SQL", 2.0),
            ("Analyse de données", 2.0),
            ("Deep Learning", 1.5),
            ("Power BI", 1.0),
            ("Communication", 1.0),
        ],
    ),
    (
        "Data Analyst",
        "Explore, nettoie et visualise les données pour produire des rapports et tableaux de bord décisionnels.",
        [
            ("SQL", 3.0),
            ("Analyse de données", 3.0),
            ("Power BI", 2.5),
            ("Tableau", 2.0),
            ("Python", 2.0),
            ("Pandas", 1.5),
            ("Communication", 1.5),
            ("Gestion de projet Agile", 1.0),
        ],
    ),
    (
        "Full Stack Developer",
        "Développe des applications web complètes, du frontend au backend.",
        [
            ("JavaScript", 2.5),
            ("TypeScript", 2.0),
            ("React", 2.5),
            ("Next.js", 2.0),
            ("Node.js", 2.5),
            ("HTML/CSS", 2.0),
            ("SQL", 1.5),
            ("PostgreSQL", 1.5),
            ("Docker", 1.5),
            ("Git", 1.0),
            ("CI/CD", 1.0),
        ],
    ),
]


def run():
    db = SessionLocal()
    try:
        created_roles = 0
        skipped_roles = 0
        created_links = 0
        missing_skills = set()

        for role_name, description, required_skills in JOB_ROLES_SEED:
            existing_role = db.query(JobRole).filter(JobRole.name == role_name).first()
            if existing_role:
                skipped_roles += 1
                continue

            job_role = JobRole(name=role_name, description=description)
            db.add(job_role)
            db.flush()  # pour obtenir job_role.id avant le commit final
            created_roles += 1

            for skill_name, weight in required_skills:
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                if skill is None:
                    missing_skills.add(skill_name)
                    continue

                job_role_skill = JobRoleSkill(
                    job_role_id=job_role.id, skill_id=skill.id, weight=weight
                )
                db.add(job_role_skill)
                created_links += 1

        db.commit()

        print(f"Terminé : {created_roles} métiers créés, {skipped_roles} déjà existants.")
        print(f"{created_links} liens métier-compétence créés.")
        if missing_skills:
            print(f"⚠️  Compétences non trouvées dans le référentiel : {sorted(missing_skills)}")

    finally:
        db.close()


if __name__ == "__main__":
    run()