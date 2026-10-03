"""Seed demo Modułu 4 — nabór OPEN + zgłoszenia we wszystkich statusach.

    python -m scripts.seed_innovation_tests
    python -m scripts.seed_innovation_tests --purge
    python -m scripts.seed_innovation_tests --purge-only

Dane: `data/innovation-tests-seed.json`. Solution identyfikowane przez `content_hash`.
Po seedy skrypt wypisuje linki dostępowe dla ACCEPTED/COMPLETED (plaintext tylko teraz).
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import select

from api.db import SessionLocal, engine
from api.innovation_tests import (
    M4_CONSENT_VERSION,
    create_access_token,
    normalize_tester_email,
)
from api.models import (
    ApplicationStatus,
    InnovationTest,
    InnovationTestApplication,
    InnovationTestFeedback,
    InnovationTestMaterial,
    InnovationTestStatus,
    MaterialType,
    Solution,
    SolutionKind,
    SolutionOrigin,
    SolutionStatus,
    TesterType,
    TestMode,
)

DEFAULT_FILE = "data/innovation-tests-seed.json"
SEED_HASH = "m4-seed-solution-v1"


def load_seed(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise SystemExit(f"{path}: oczekiwano obiektu JSON")
    for key in ("solution", "test", "applications"):
        if key not in data:
            raise SystemExit(f"{path}: brakuje pola {key!r}")
    return data


async def purge() -> tuple[int, int]:
    async with SessionLocal() as session:
        solution = await session.scalar(
            select(Solution).where(Solution.content_hash == SEED_HASH)
        )
        tests_deleted = 0
        solutions_deleted = 0
        if solution is not None:
            tests = (
                await session.execute(
                    select(InnovationTest).where(InnovationTest.solution_id == solution.id)
                )
            ).scalars().all()
            tests_deleted = len(tests)
            for test in tests:
                await session.delete(test)
            await session.delete(solution)
            solutions_deleted = 1
        await session.commit()
    return tests_deleted, solutions_deleted


async def seed(path: Path) -> None:
    data = load_seed(path)
    sol = data["solution"]
    test_data = data["test"]
    apps = data["applications"]

    async with SessionLocal() as session:
        existing = await session.scalar(
            select(Solution).where(Solution.content_hash == sol["content_hash"])
        )
        if existing is not None:
            raise SystemExit(
                "Seed już istnieje. Uruchom z --purge, żeby podmienić dane demo."
            )

        solution = Solution(
            kind=SolutionKind.SOLUTION,
            title=sol["title"],
            summary=sol["summary"],
            body=sol.get("body", ""),
            organization=sol.get("organization"),
            gmina=sol.get("gmina"),
            powiat=sol.get("powiat"),
            category=sol.get("category"),
            target_group=sol.get("target_group"),
            content_hash=sol["content_hash"],
            origin=SolutionOrigin.CURATED,
            status=SolutionStatus(sol.get("status", "PUBLISHED")),
        )
        session.add(solution)
        await session.flush()

        ends = datetime.now(UTC) + timedelta(days=int(test_data.get("ends_in_days", 21)))
        test = InnovationTest(
            solution_id=solution.id,
            title=test_data["title"],
            goal_description=test_data["goal_description"],
            instruction=test_data["instruction"],
            target_group=test_data["target_group"],
            tester_type=test_data["tester_type"],
            location=test_data["location"],
            seats_limit=int(test_data["seats_limit"]),
            mode=TestMode(test_data["mode"]),
            estimated_duration=test_data["estimated_duration"],
            ends_at=ends,
            status=InnovationTestStatus.OPEN,
        )
        test.materials = [
            InnovationTestMaterial(
                title=item["title"],
                type=MaterialType(item["type"]),
                locator=item["locator"],
                description=item.get("description", ""),
                sort_order=int(item.get("sort_order", 0)),
            )
            for item in test_data["materials"]
        ]
        session.add(test)
        await session.flush()

        printed_links: list[tuple[str, str]] = []
        now = datetime.now(UTC)
        for entry in apps:
            token, token_hash = create_access_token()
            status = ApplicationStatus(entry["status"])
            application = InnovationTestApplication(
                test_id=test.id,
                display_name=entry["display_name"],
                email=entry["email"],
                email_normalized=normalize_tester_email(entry["email"]),
                tester_type=TesterType(entry["tester_type"]),
                wojewodztwo=entry["wojewodztwo"],
                powiat=entry["powiat"],
                gmina=entry["gmina"],
                is_target_group_member=bool(entry["is_target_group_member"]),
                motivation=entry["motivation"],
                status=status,
                consent=True,
                consent_version=M4_CONSENT_VERSION,
                consented_at=now,
                rejection_reason=entry.get("rejection_reason"),
                cancel_reason=entry.get("cancel_reason"),
                access_token_hash=token_hash,
                access_token_created_at=now,
            )
            session.add(application)
            await session.flush()

            if status in {ApplicationStatus.ACCEPTED, ApplicationStatus.COMPLETED}:
                printed_links.append((entry["key"], token))

            feedback_data = entry.get("feedback")
            if status == ApplicationStatus.COMPLETED and feedback_data:
                feedback = InnovationTestFeedback(
                    application_id=application.id,
                    usefulness=int(feedback_data["usefulness"]),
                    ease_of_use=int(feedback_data["ease_of_use"]),
                    accessibility=int(feedback_data["accessibility"]),
                    fit_to_needs=int(feedback_data["fit_to_needs"]),
                    comment=feedback_data.get("comment"),
                    improvement=feedback_data.get("improvement"),
                    comment_visible_to_author=False,
                    submitted_at=now,
                )
                application.access_token_used_at = now
                session.add(feedback)

        await session.commit()

        print(f"OK solution_id={solution.id} test_id={test.id}")
        print(f"Public:  /testy/{test.id}")
        print(f"Panel:   /panel/testy/{test.id}")
        for key, token in printed_links:
            print(f"Access[{key}]: /testy/dostep/{token}")


async def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Seed demo Modułu 4")
    parser.add_argument("--file", default=DEFAULT_FILE)
    parser.add_argument("--purge", action="store_true")
    parser.add_argument("--purge-only", action="store_true")
    args = parser.parse_args(argv)

    if args.purge or args.purge_only:
        tests, solutions = await purge()
        print(f"Purged seed tests={tests} solutions={solutions}")
        if args.purge_only:
            await engine.dispose()
            return 0

    await seed(Path(args.file))
    await engine.dispose()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main(sys.argv[1:])))
