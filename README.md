# Neta-Meter

Neta-Meter is a citizen-powered public accountability app. Citizens upload ground reports about local progress or conditions, the backend verifies and scores those reports, and the frontend turns the result into live Neta cards, leaderboards, and a round-based Neta Battle comparison.

## What The App Does

- Citizens submit area reports for roads, water, electricity, jobs, healthcare, education, safety, sanitation, and other issues.
- Each report captures area, issue category, current status, progress percentage, condition score, description, and optional evidence URL.
- Reports with evidence and detailed descriptions are treated as verified signals in this prototype.
- Every politician gets a Neta score derived from promise delivery, citizen progress, area condition, verified evidence, and report volume.
- Users can generate a shareable Neta card from any politician profile.
- Neta Battle compares any two politicians across multiple animated rounds.

## Current Architecture

```text
frontend/
  React + Tailwind UI
  Citizen reporting dashboard
  Shareable Neta cards
  Animated Neta Battle arena

backend/
  FastAPI API
  Pydantic request/response models
  In-memory politician and report store
  Scoring and battle services
```

## High-Traffic Target Architecture

For real production traffic, evolve the prototype into these services:

- API gateway: rate limits, authentication, bot protection, request routing.
- Report service: accepts uploads, validates payloads, stores metadata.
- Media service: stores photos/videos in object storage such as S3, GCS, or R2.
- Verification service: queues reports for automated checks and human moderation.
- Scoring service: recalculates Neta scores asynchronously after verified report changes.
- Battle service: reads cached score snapshots for fast comparisons.
- Search service: indexes politicians, constituencies, categories, and report summaries.
- Notification/share service: creates image cards and share previews.
- PostgreSQL: source of truth for politicians, promises, reports, evidence, users, and moderation state.
- Redis: hot leaderboard, politician profile, and battle-result cache.
- Queue: Kafka, SQS, Pub/Sub, or Celery/RQ for verification and scoring jobs.
- CDN: serves frontend assets, generated cards, and public media at edge locations.

## Running Locally

Backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm start
```

Set `REACT_APP_API_BASE_URL` if the backend is not running at `http://localhost:8000`.
