"""Stateless, read-only analysis of a persisted ApexCredit case."""

from __future__ import annotations

import os
import sys
import time
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.due_diligence_agent import DueDiligenceScreeningAgent
from agents.financial_analyst_agent import FinancialAnalystAgent
from agents.gateway_submission_agent import CreditSubmissionGatewayAgent
from agents.intake_triage_agent import IntakeTriageAgent


class CreditMultiAgentOrchestrator:
    """Runs bounded analyses; it does not persist, transmit, screen, or approve."""

    def __init__(self) -> None:
        self.intake_agent = IntakeTriageAgent()
        self.financial_agent = FinancialAnalystAgent()
        self.screening_agent = DueDiligenceScreeningAgent()
        self.gateway_agent = CreditSubmissionGatewayAgent()

    def run_intake_pipeline(self, raw_request: dict[str, Any]) -> dict[str, Any]:
        return self.intake_agent.run({"raw_incoming_message": raw_request, "roster": {}})

    def run_financial_pipeline(self, periods: list[Any], exposures: list[Any]) -> dict[str, Any]:
        return self.financial_agent.run({
            "financial_periods": periods,
            "cross_line_exposures": exposures,
        })

    def run_screening_pipeline(self, parties: list[Any], findings: list[Any]) -> dict[str, Any]:
        return self.screening_agent.run({
            "directors_and_shareholders": parties,
            "screening_findings": findings,
        })

    def run_gateway_completeness_check(self, case_context: dict[str, Any]) -> dict[str, Any]:
        return self.gateway_agent.run(case_context)

    def run_full_autonomous_evaluation(self, case_data: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(case_data, dict) or not isinstance(case_data.get("caseId"), str):
            raise ValueError("A persisted case object with a caseId is required.")

        started = time.monotonic()
        intake = self.intake_agent.run({
            "raw_incoming_message": {
                "case_id": case_data.get("caseId"),
                "source": case_data.get("originationSource"),
                "requested_category": case_data.get("classification", {}).get("primaryCategory"),
                "affected_lending_lines": case_data.get("classification", {}).get("affectedLendingLines"),
            },
            "roster": {},
        })
        financials = self.financial_agent.run({
            "financial_periods": case_data.get("financialPeriods"),
            "cross_line_exposures": case_data.get("crossLineExposures", []),
        })
        screening = self.screening_agent.run({
            "directors_and_shareholders": case_data.get("directorsAndShareholders", []),
            "screening_findings": case_data.get("screeningFindings", []),
        })
        gateway = self.gateway_agent.run({
            "case_id": case_data["caseId"],
            "requirement_checklist": case_data.get("requirementChecklist", []),
            "verification_attested": case_data.get("verificationAttested", False),
            "pricing_signoff": case_data.get("pricingSignoff", {}),
            "narrative_sections": case_data.get("narrativeSections", []),
            "screening_findings": case_data.get("screeningFindings", []),
            "customer_risk_assessment": case_data.get("customerRiskAssessment"),
        })

        logs = (
            self.intake_agent.execution_history
            + self.financial_agent.execution_history
            + self.screening_agent.execution_history
            + self.gateway_agent.execution_history
        )
        return {
            "status": "ANALYSIS_ONLY",
            "execution_time_ms": round((time.monotonic() - started) * 1000, 2),
            "intake_results": intake,
            "financial_analytics": financials,
            "screening_due_diligence": screening,
            "gateway_completeness": gateway,
            "agent_execution_logs": [log.__dict__ for log in logs],
            "external_integrations": {
                "screening": "NOT_CONFIGURED",
                "credit_submission": "NOT_CONFIGURED",
            },
            "warning": "Analysis is read-only and unvalidated for credit decisions; no provider checks or submission occurred.",
        }
