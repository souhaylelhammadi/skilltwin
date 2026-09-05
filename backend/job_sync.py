import requests

from database import SessionLocal
from models import JobPosting

REMOTEOK_API_URL = "https://remoteok.com/api"
USER_AGENT = "SkillTwin/1.0 (contact: elhammadisouhayl@gmail.com)"


def fetch_remoteok_jobs(limit: int = 50) -> list[dict]:
    headers = {"User-Agent": USER_AGENT}
    response = requests.get(REMOTEOK_API_URL, headers=headers, timeout=15)
    response.raise_for_status()

    data = response.json()

    # Le premier élément de la réponse RemoteOK est une légende/métadonnée, pas une offre
    jobs = [item for item in data if isinstance(item, dict) and item.get("id")]

    return jobs[:limit]


def sync_job_postings(limit: int = 50) -> dict:
    jobs = fetch_remoteok_jobs(limit=limit)

    db = SessionLocal()
    created_count = 0
    updated_count = 0

    try:
        for job in jobs:
            external_id = str(job.get("id"))
            title = job.get("position") or job.get("title") or "Poste non spécifié"
            company = job.get("company")
            url = job.get("url")
            tags = job.get("tags") or []
            description = job.get("description") or ""
            description_snippet = description[:500] if description else None

            existing = (
                db.query(JobPosting)
                .filter(JobPosting.external_id == external_id)
                .first()
            )

            if existing:
                existing.title = title
                existing.company = company
                existing.url = url
                existing.tags = tags
                existing.description_snippet = description_snippet
                updated_count += 1
            else:
                posting = JobPosting(
                    external_id=external_id,
                    title=title,
                    company=company,
                    url=url,
                    tags=tags,
                    description_snippet=description_snippet,
                )
                db.add(posting)
                created_count += 1

        db.commit()

        return {
            "status": "success",
            "created": created_count,
            "updated": updated_count,
            "total_fetched": len(jobs),
        }

    finally:
        db.close()
        