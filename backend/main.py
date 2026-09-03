from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db
from auth import router as auth_router
from documents import router as documents_router
from profile import router as profile_router

app = FastAPI(
    title="SkillTwin API",
    description="API backend pour SkillTwin — AI Career Digital Twin",
    version="0.1.0",
)

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(profile_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "skilltwin-backend"}


@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}