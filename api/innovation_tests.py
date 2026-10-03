"""Walidacja domenowa i operacje udziału Modułu 4 (Tester innowacji).

TI01: normalizacja e-maila i stałe zgody.
TI02: tokeny, zgłoszenia, decyzje i ankieta (dopisywane osobno).
"""

from __future__ import annotations

# Stały tekst i wersja zgody dla całego Modułu 4 (MVP — Hub nie edytuje per nabór).
M4_CONSENT_VERSION = "m4-consent-v1"
M4_CONSENT_TEXT_PL = (
    "Wyrażam zgodę na kontakt w sprawie udziału w tym naborze testowym oraz na "
    "przetwarzanie podanych danych w celu obsługi zgłoszenia przez Małopolski Hub "
    "Innowacji Społecznych. Dane kontaktowe są widoczne wyłącznie dla Hubu."
)

ACTIVE_APPLICATION_STATUSES = frozenset({"SUBMITTED", "ACCEPTED"})
MAX_ACTIVE_APPLICATIONS = 3


def normalize_tester_email(email: str) -> str:
    """Identyfikator testera w MVP: strip + casefold (bez logowania wartości)."""
    return email.strip().casefold()
