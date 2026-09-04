from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    ApiStatus,
    BattleResult,
    CitizenReportCreate,
    LeaderboardResponse,
    PoliticianProfile,
    PoliticiansResponse,
    ReportCreateResponse,
    ReportsResponse,
    StatesResponse,
)
from .scoring import build_battle_rounds
from .store import create_report, get_politician, list_politicians, list_reports

app = FastAPI(title="Neta-Meter API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=ApiStatus)
def root() -> ApiStatus:
    return ApiStatus(
        message="Neta-Meter API Running!",
        status="active",
        version="2.0.0",
        capabilities=["citizen_reports", "live_scoring", "share_cards", "neta_battle"],
    )


@app.get("/api/politicians", response_model=PoliticiansResponse)
def get_politicians() -> PoliticiansResponse:
    politicians = list_politicians()
    return PoliticiansResponse(politicians=politicians, total=len(politicians))


@app.get("/api/politicians/{politician_id}", response_model=PoliticianProfile)
def get_politician_profile(politician_id: int) -> PoliticianProfile:
    return get_politician(politician_id)


@app.get("/api/reports", response_model=ReportsResponse)
def get_reports(politician_id: int | None = None) -> ReportsResponse:
    reports = list_reports(politician_id)
    return ReportsResponse(reports=reports, total=len(reports))


@app.post("/api/reports", response_model=ReportCreateResponse, status_code=201)
def submit_report(payload: CitizenReportCreate) -> ReportCreateResponse:
    report, politician = create_report(payload)
    return ReportCreateResponse(report=report, politician=politician)


@app.get("/api/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(limit: int = Query(default=10, ge=1, le=50)) -> LeaderboardResponse:
    sorted_list = sorted(list_politicians(), key=lambda politician: politician.neta_score, reverse=True)
    return LeaderboardResponse(top=sorted_list[:limit])


@app.get("/api/compare", response_model=BattleResult)
def compare(ids: str = Query(..., description="Two politician ids separated by a comma")) -> BattleResult:
    politician_a, politician_b = _parse_two_politicians(ids)
    return _build_battle(politician_a.id, politician_b.id)


@app.get("/api/battle", response_model=BattleResult)
def get_battle(ids: str = Query(..., description="Two politician ids separated by a comma")) -> BattleResult:
    politician_a, politician_b = _parse_two_politicians(ids)
    return _build_battle(politician_a.id, politician_b.id)


@app.get("/api/states", response_model=StatesResponse)
def get_states() -> StatesResponse:
    states = sorted({politician.state for politician in list_politicians()})
    return StatesResponse(states=states)


def _parse_two_politicians(ids: str) -> tuple[PoliticianProfile, PoliticianProfile]:
    try:
        ids_list = [int(value.strip()) for value in ids.split(",") if value.strip()]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="ids must contain two numeric politician ids") from exc

    if len(ids_list) != 2 or ids_list[0] == ids_list[1]:
        raise HTTPException(status_code=400, detail="Choose two different politicians")

    return get_politician(ids_list[0]), get_politician(ids_list[1])


def _build_battle(politician_a_id: int, politician_b_id: int) -> BattleResult:
    politician_a = get_politician(politician_a_id)
    politician_b = get_politician(politician_b_id)
    reports_a = list_reports(politician_a_id)
    reports_b = list_reports(politician_b_id)
    rounds = build_battle_rounds(
        politician_a,
        politician_b,
        politician_a.score_breakdown,
        politician_b.score_breakdown,
        reports_a,
        reports_b,
    )

    if abs(politician_a.neta_score - politician_b.neta_score) < 0.1:
        winner_id = None
        winner = "Draw"
    else:
        winner_profile = politician_a if politician_a.neta_score > politician_b.neta_score else politician_b
        winner_id = winner_profile.id
        winner = winner_profile.name

    return BattleResult(
        politician_a=politician_a,
        politician_b=politician_b,
        rounds=rounds,
        winner_id=winner_id,
        winner=winner,
        final_score=f"{politician_a.neta_score} - {politician_b.neta_score}",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
