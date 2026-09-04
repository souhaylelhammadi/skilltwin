from sqlalchemy.orm import Session

from career import calculate_career_score

PROJECT_TEMPLATES = {
    "Python": "Créez un script Python qui automatise une tâche répétitive (ex: renommer des fichiers, extraire des données d'un CSV).",
    "JavaScript": "Développez une petite application interactive en JavaScript pur (ex: une todo-list avec stockage local).",
    "TypeScript": "Reprenez un projet JavaScript existant et migrez-le progressivement vers TypeScript.",
    "SQL": "Concevez une base de données pour un cas d'usage simple (ex: gestion de bibliothèque) et écrivez des requêtes complexes.",
    "React": "Construisez une interface React avec plusieurs composants et gestion d'état (ex: un dashboard météo).",
    "Next.js": "Créez un mini-site avec Next.js utilisant le App Router et des routes API.",
    "Node.js": "Développez une API REST simple avec Node.js (ex: gestion de tâches).",
    "FastAPI": "Créez une API avec FastAPI incluant authentification et base de données.",
    "Docker": "Conteneurisez une application existante avec un Dockerfile et un docker-compose.",
    "Machine Learning": "Entraînez un modèle de classification sur un dataset public (ex: Iris, Titanic) avec scikit-learn.",
    "Deep Learning": "Construisez un réseau de neurones simple avec PyTorch ou TensorFlow sur un dataset d'images.",
    "PyTorch": "Implémentez un modèle de classification d'images avec PyTorch sur un dataset comme CIFAR-10.",
    "TensorFlow": "Créez un modèle de deep learning avec TensorFlow/Keras sur un jeu de données de votre choix.",
    "scikit-learn": "Comparez plusieurs algorithmes de classification avec scikit-learn sur un même dataset.",
    "Power BI": "Créez un tableau de bord interactif Power BI à partir d'un jeu de données public.",
    "PostgreSQL": "Modélisez et implémentez une base de données relationnelle pour un projet concret.",
    "MongoDB": "Créez une application utilisant MongoDB pour stocker des données non structurées.",
    "Git": "Contribuez à un projet open source ou créez un workflow Git avec branches et pull requests.",
    "CI/CD": "Mettez en place un pipeline CI/CD simple (ex: GitHub Actions) pour un de vos projets existants.",
}

DEFAULT_PROJECT = "Réalisez un petit projet pratique mettant en œuvre cette compétence dans un contexte concret."


def _generate_project_suggestion(skill_name: str) -> str:
    return PROJECT_TEMPLATES.get(skill_name, DEFAULT_PROJECT)


def generate_learning_path(db: Session, user_id: str, job_role_id: str) -> dict:
    score_result = calculate_career_score(db, user_id, job_role_id)

    if score_result is None:
        return None

    steps = []

    # Priorité 1 : compétences manquantes (impact le plus fort sur le score)
    for skill in score_result["missing"]:
        steps.append(
            {
                "skill": skill["name"],
                "priority": "high",
                "reason": "Compétence requise non détectée dans votre profil.",
                "project_suggestion": _generate_project_suggestion(skill["name"]),
                "weight": skill["weight"],
            }
        )

    # Priorité 2 : compétences à améliorer (déjà présentes mais confiance modérée)
    for skill in score_result["to_improve"]:
        steps.append(
            {
                "skill": skill["name"],
                "priority": "medium",
                "reason": "Compétence détectée mais à renforcer.",
                "project_suggestion": _generate_project_suggestion(skill["name"]),
                "weight": skill["weight"],
            }
        )

    # Tri par poids décroissant : les compétences les plus importantes du métier en premier
    steps.sort(key=lambda s: s["weight"], reverse=True)

    return {
        "job_role": score_result["job_role"],
        "current_score": score_result["score"],
        "steps": steps,
    }