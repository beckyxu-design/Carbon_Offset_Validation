# models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union

class ProjectInfo(BaseModel):
    project_code: str
    name: str
    description: str
    location: str
    coordinates: List[float]
    status: str
    startDate: str
    endDate: str
    methodology: Optional[str] = None
    total_credits: Optional[int] = None
    remaining_credits: Optional[int] = None
    type: Optional[str] = None
    reduction_removal: Optional[str] = None
    project_developer: Optional[str] = None
    buffer: Optional[int] = None
    
class RiskMetric(BaseModel):
    category: str
    score: int
    impact: str
    likelihood: str
    description: str

class Recommendation(BaseModel):
    action: str
    priority: str

class Summary(BaseModel):
    overall_summary: str
    recommendations: List[Recommendation]
    additional_insights: Optional[str] = None
    
class OverallSummary(BaseModel):
    summary: str
    recommendations: str

class TimeSeriesPoint(BaseModel):
    year: int
    value: float

class PieChartSegment(BaseModel):
    category: str
    value: float

class ProjectAnalysisRequest(BaseModel):
    projectCode: str
    query: str
    document_text: Any
    # policy_documents: Optional[str] = None
    # regional_policies: Optional[str] = None

class ProjectAnalysisResponse(BaseModel):
    projectData: ProjectInfo
    queryResponse: str
    overallSummary: List[OverallSummary]
    summary: Summary
    riskMetrics: List[RiskMetric]
    timeSeriesData: List[Dict[str, Any]]
    # emissionsData: List[Dict[str, Any]]
    pieChartData: List[Dict[str, Any]]