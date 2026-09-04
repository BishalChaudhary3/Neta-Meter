from datetime import datetime, timezone

from fastapi import HTTPException

from .data import POLITICIANS, REPORTS
from .models import CitizenReport, CitizenReportCreate, Politician, PoliticianProfile
from .scoring import calculate_score, verification_for


def list_politicians() -> list[PoliticianProfile]:
    return [build_profile(Politician(**politician)) for politician in POLITICIANS]


def get_politician(politician_id: int) -> PoliticianProfile:
    politician = _find_politician(politician_id)
    return build_profile(politician)


def list_reports(politician_id: int | None = None) -> list[CitizenReport]:
    if politician_id is None:
        return sorted(REPORTS, key=lambda report: report.created_at, reverse=True)
    _find_politician(politician_id)
    return sorted(
        [report for report in REPORTS if report.politician_id == politician_id],
        key=lambda report: report.created_at,
        reverse=True,
    )


def create_report(payload: CitizenReportCreate) -> tuple[CitizenReport, PoliticianProfile]:
    _find_politician(payload.politician_id)
    verified, note = verification_for(payload.description, str(payload.evidence_url) if payload.evidence_url else None)
    report = CitizenReport(
        id=_next_report_id(),
        created_at=datetime.now(timezone.utc),
        verified=verified,
        verification_note=note,
        **payload.model_dump(),
    )
    REPORTS.append(report)
    return report, get_politician(payload.politician_id)


def build_profile(politician: Politician) -> PoliticianProfile:
    reports = [report for report in REPORTS if report.politician_id == politician.id]
    verified_count = sum(1 for report in reports if report.verified)
    score = calculate_score(politician, reports)
    recent_reports = sorted(reports, key=lambda report: report.created_at, reverse=True)[:3]

    return PoliticianProfile(
        **politician.model_dump(),
        reports_count=len(reports),
        verified_reports_count=verified_count,
        neta_score=score.neta_score,
        score_breakdown=score,
        recent_reports=recent_reports,
    )


def _find_politician(politician_id: int) -> Politician:
    for politician in POLITICIANS:
        if politician["id"] == politician_id:
            return Politician(**politician)
    raise HTTPException(status_code=404, detail="Politician not found")


def _next_report_id() -> int:
    return max((report.id for report in REPORTS), default=0) + 1
