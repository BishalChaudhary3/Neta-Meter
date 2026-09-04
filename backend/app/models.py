from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class ReportCategory(str, Enum):
    roads = "roads"
    water = "water"
    electricity = "electricity"
    jobs = "jobs"
    healthcare = "healthcare"
    education = "education"
    safety = "safety"
    sanitation = "sanitation"
    other = "other"


class ReportStatus(str, Enum):
    improved = "improved"
    unchanged = "unchanged"
    worsened = "worsened"


class Politician(BaseModel):
    id: int
    name: str
    constituency: str
    state: str
    party: str
    image_url: str
    total_promises: int
    promises_kept: int
    promises_broken: int
    promises_in_progress: int
    fulfillment_rate: float


class CitizenReportCreate(BaseModel):
    politician_id: int
    area: str = Field(min_length=2, max_length=80)
    category: ReportCategory
    status: ReportStatus
    progress_percent: int = Field(ge=0, le=100)
    condition_score: int = Field(ge=1, le=10)
    description: str = Field(min_length=20, max_length=600)
    evidence_url: Optional[HttpUrl] = None


class CitizenReport(CitizenReportCreate):
    id: int
    created_at: datetime
    verified: bool
    verification_note: str


class ScoreBreakdown(BaseModel):
    promise_delivery: float
    citizen_progress: float
    area_condition: float
    verified_evidence: float
    report_volume: int
    neta_score: float


class PoliticianProfile(Politician):
    reports_count: int
    verified_reports_count: int
    neta_score: float
    score_breakdown: ScoreBreakdown
    recent_reports: List[CitizenReport]


class ApiStatus(BaseModel):
    message: str
    status: str
    version: str
    capabilities: List[str]


class PoliticiansResponse(BaseModel):
    politicians: List[PoliticianProfile]
    total: int


class ReportsResponse(BaseModel):
    reports: List[CitizenReport]
    total: int


class LeaderboardResponse(BaseModel):
    top: List[PoliticianProfile]


class StatesResponse(BaseModel):
    states: List[str]


class ReportCreateResponse(BaseModel):
    report: CitizenReport
    politician: PoliticianProfile


class BattleRound(BaseModel):
    name: str
    metric: str
    politician_a_score: float
    politician_b_score: float
    winner_id: Optional[int]
    commentary: str


class BattleResult(BaseModel):
    politician_a: PoliticianProfile
    politician_b: PoliticianProfile
    rounds: List[BattleRound]
    winner_id: Optional[int]
    winner: str
    final_score: str
