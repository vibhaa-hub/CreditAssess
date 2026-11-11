"""Allowlisted JSON-lines boundary for the Python analysis workers."""

from __future__ import annotations

import base64
import binascii
import json
import os
import sys
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


AVAILABLE_COMMANDS = {
    "list-agents",
    "evaluate-all",
    "docling-extract",
}


def _read_payload() -> dict[str, Any]:
    raw_payload = sys.stdin.read()
    if not raw_payload.strip():
        return {}
    payload = json.loads(raw_payload)
    if not isinstance(payload, dict):
        raise ValueError("The worker payload must be a JSON object.")
    return payload


def _dispatch(command: str, payload: dict[str, Any]) -> Any:
    if command not in AVAILABLE_COMMANDS:
        raise ValueError("This worker command is unavailable or not configured.")

    if command == "list-agents":
        return {
            "status": "OK",
            "agents": [
                {
                    "name": "IntakeTriageAgent",
                    "capability": "Validate and summarize supplied intake fields.",
                    "external_integrations": "NONE",
                },
                {
                    "name": "FinancialAnalystAgent",
                    "capability": "Calculate ratios from supplied financial periods.",
                    "external_integrations": "NONE",
                },
                {
                    "name": "DueDiligenceScreeningAgent",
                    "capability": "Summarize supplied screening findings only.",
                    "external_integrations": "NOT_CONFIGURED",
                },
                {
                    "name": "CreditSubmissionGatewayAgent",
                    "capability": "Evaluate supplied completeness data only.",
                    "external_integrations": "NOT_CONFIGURED",
                },
            ],
        }

    if command == "evaluate-all":
        from orchestrator import CreditMultiAgentOrchestrator

        return CreditMultiAgentOrchestrator().run_full_autonomous_evaluation(payload)

    if command == "docling-extract":
        from doc_extractor import DoclingExtractionEngine, result_as_dict

        filename = payload.get("filename")
        encoded = payload.get("content_base64")
        if not isinstance(filename, str) or not isinstance(encoded, str):
            raise ValueError("A filename and base64-encoded CSV document are required.")
        try:
            document_bytes = base64.b64decode(encoded, validate=True)
        except (binascii.Error, ValueError) as error:
            raise ValueError("The uploaded document is not valid base64.") from error
        result = DoclingExtractionEngine().extract_document(
            filename=filename,
            document_bytes=document_bytes,
            doc_category=payload.get("doc_category", "UNCLASSIFIED"),
        )
        return result_as_dict(result)

    raise ValueError("This worker command is unavailable or not configured.")


def main() -> int:
    if len(sys.argv) != 2:
        print(json.dumps({"error": "A single worker command is required."}))
        return 2
    try:
        result = _dispatch(sys.argv[1], _read_payload())
        print(json.dumps(result, allow_nan=False, separators=(",", ":")))
        return 0
    except Exception as error:
        print(json.dumps({"error": str(error)}, separators=(",", ":")))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
