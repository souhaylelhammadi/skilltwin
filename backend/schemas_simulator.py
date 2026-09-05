from pydantic import BaseModel


class SimulationRequest(BaseModel):
    skill_names: list[str]