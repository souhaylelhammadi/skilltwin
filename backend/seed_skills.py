"""
Script de seed du référentiel de compétences.
Usage : docker compose exec backend python seed_skills.py
"""

from sentence_transformers import SentenceTransformer

from database import SessionLocal
from models import Skill

SKILLS_SEED = [
    ("Python", "Langages de programmation"),
    ("JavaScript", "Langages de programmation"),
    ("TypeScript", "Langages de programmation"),
    ("SQL", "Langages de programmation"),
    ("React", "Frontend"),
    ("Next.js", "Frontend"),
    ("HTML/CSS", "Frontend"),
    ("Node.js", "Backend"),
    ("FastAPI", "Backend"),
    ("Django", "Backend"),
    ("Flask", "Backend"),
    ("PostgreSQL", "Bases de données"),
    ("MongoDB", "Bases de données"),
    ("MySQL", "Bases de données"),
    ("Docker", "DevOps"),
    ("Kubernetes", "DevOps"),
    ("CI/CD", "DevOps"),
    ("Git", "Outils"),
    ("Machine Learning", "Data Science / IA"),
    ("Deep Learning", "Data Science / IA"),
    ("scikit-learn", "Data Science / IA"),
    ("PyTorch", "Data Science / IA"),
    ("TensorFlow", "Data Science / IA"),
    ("Pandas", "Data Science / IA"),
    ("Power BI", "Business Intelligence"),
    ("Tableau", "Business Intelligence"),
    ("Analyse de données", "Data Science / IA"),
    ("Gestion de projet Agile", "Soft skills / Méthodologie"),
    ("Communication", "Soft skills / Méthodologie"),
    ("Travail en équipe", "Soft skills / Méthodologie"),
]


def run():
    print("Chargement du modèle d'embeddings...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    db = SessionLocal()
    try:
        created_count = 0
        skipped_count = 0

        for name, category in SKILLS_SEED:
            existing = db.query(Skill).filter(Skill.name == name).first()
            if existing:
                skipped_count += 1
                continue

            embedding = model.encode(name).tolist()
            skill = Skill(name=name, category=category, embedding=embedding)
            db.add(skill)
            created_count += 1

        db.commit()
        print(f"Terminé : {created_count} compétences créées, {skipped_count} déjà existantes.")

    finally:
        db.close()


if __name__ == "__main__":
    run()
    