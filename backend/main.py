from fastapi import FastAPI

app =FastAPI(
    title="SkillTwin API",
    description="API backend pour SkillTwin — AI Career Digital Twin",
    version="0.1.0",
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "skilltwin-backend"}
 