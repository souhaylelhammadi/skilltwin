from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db

app = FastAPI(
    title="SkillTwin API",
    description="API backend pour SkillTwin — AI Career Digital Twin",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "skilltwin-backend"}


@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}