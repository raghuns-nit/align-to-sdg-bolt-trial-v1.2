from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field

class RecommendationCase(BaseModel):
    Test_ID: str
    Test_Dimension: str = "runtime"
    Anchor_Type: str
    Anchor_ID: str
    Course_Hint: str = ""
    Technical_Query: str = ""
    Application_Context: str = ""
    Sustainability_Mechanism_Present: str = "yes"
    Technical_System: str = ""
    Operational_Action: str = ""
    Mechanism: str = ""
    Affected_Resource_or_Function: str = ""
    Stakeholder_or_Ecological_Context: str = ""
    Boundary_Conditions: str = ""

class RecommendationExecution(BaseModel):
    request_id: str | None = None
    result: dict[str, Any] = Field(default_factory=dict)
