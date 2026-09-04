from collections import Counter
from typing import Iterable, Optional

from .models import BattleRound, CitizenReport, Politician, ScoreBreakdown


def clamp_score(value: float) -> float:
    return round(max(0, min(100, value)), 1)


def calculate_score(politician: Politician, reports: Iterable[CitizenReport]) -> ScoreBreakdown:
    related_reports = list(reports)
    verified_reports = [report for report in related_reports if report.verified]
    reports_for_score = verified_reports or related_reports

    if reports_for_score:
        citizen_progress = sum(report.progress_percent for report in reports_for_score) / len(reports_for_score)
        area_condition = sum(report.condition_score * 10 for report in reports_for_score) / len(reports_for_score)
    else:
        citizen_progress = politician.fulfillment_rate
        area_condition = politician.fulfillment_rate

    verified_evidence = 100 if related_reports and len(verified_reports) == len(related_reports) else 0
    if related_reports:
        verified_evidence = (len(verified_reports) / len(related_reports)) * 100

    volume_bonus = min(len(verified_reports) * 1.5, 6)
    raw_score = (
        politician.fulfillment_rate * 0.4
        + citizen_progress * 0.3
        + area_condition * 0.2
        + verified_evidence * 0.1
        + volume_bonus
    )

    return ScoreBreakdown(
        promise_delivery=clamp_score(politician.fulfillment_rate),
        citizen_progress=clamp_score(citizen_progress),
        area_condition=clamp_score(area_condition),
        verified_evidence=clamp_score(verified_evidence),
        report_volume=len(related_reports),
        neta_score=clamp_score(raw_score),
    )


def verification_for(description: str, evidence_url: Optional[str]) -> tuple[bool, str]:
    if evidence_url and len(description.strip()) >= 40:
        return True, "Evidence link and detailed citizen description present."
    return False, "Pending moderator review."


def build_battle_rounds(
    politician_a: Politician,
    politician_b: Politician,
    score_a: ScoreBreakdown,
    score_b: ScoreBreakdown,
    reports_a: list[CitizenReport],
    reports_b: list[CitizenReport],
) -> list[BattleRound]:
    rounds = [
        (
            "Round 1",
            "Promise Delivery",
            score_a.promise_delivery,
            score_b.promise_delivery,
            "Manifesto delivery rate",
        ),
        (
            "Round 2",
            "Citizen Progress",
            score_a.citizen_progress,
            score_b.citizen_progress,
            "Average progress reported from the ground",
        ),
        (
            "Round 3",
            "Area Condition",
            score_a.area_condition,
            score_b.area_condition,
            "Citizen condition score across local issues",
        ),
        (
            "Round 4",
            "Verified Evidence",
            score_a.verified_evidence,
            score_b.verified_evidence,
            "Share of reports backed by evidence",
        ),
        (
            "Final Round",
            "Neta Meter Score",
            score_a.neta_score,
            score_b.neta_score,
            "Weighted public performance score",
        ),
    ]

    return [
        BattleRound(
            name=name,
            metric=metric,
            politician_a_score=clamp_score(value_a),
            politician_b_score=clamp_score(value_b),
            winner_id=_round_winner(value_a, value_b, politician_a.id, politician_b.id),
            commentary=_battle_commentary(metric, value_a, value_b, politician_a.name, politician_b.name, reports_a, reports_b),
        )
        for name, metric, value_a, value_b, _label in rounds
    ]


def _round_winner(value_a: float, value_b: float, id_a: int, id_b: int) -> Optional[int]:
    if abs(value_a - value_b) < 0.1:
        return None
    return id_a if value_a > value_b else id_b


def _battle_commentary(
    metric: str,
    value_a: float,
    value_b: float,
    name_a: str,
    name_b: str,
    reports_a: list[CitizenReport],
    reports_b: list[CitizenReport],
) -> str:
    if abs(value_a - value_b) < 0.1:
        return f"{metric} is neck and neck. The bell saves both corners."

    leader = name_a if value_a > value_b else name_b
    gap = abs(value_a - value_b)
    if metric == "Citizen Progress":
        category = _top_category(reports_a if value_a > value_b else reports_b)
        return f"{leader} lands the cleaner round with stronger citizen progress reports, led by {category}."
    if metric == "Verified Evidence":
        return f"{leader} takes the evidence round with a {gap:.1f}-point verification edge."
    return f"{leader} wins this round by {gap:.1f} points."


def _top_category(reports: list[CitizenReport]) -> str:
    if not reports:
        return "limited uploaded data"
    category_counts = Counter(report.category.value for report in reports)
    return category_counts.most_common(1)[0][0]
