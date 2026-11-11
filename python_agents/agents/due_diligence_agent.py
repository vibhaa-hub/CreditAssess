"""Summarize supplied due-diligence evidence without claiming live screening."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.base_agent import BaseCreditAgent
from models import AutonomyLevel
from typing import Dict, Any, List

class DueDiligenceScreeningAgent(BaseCreditAgent):
    def __init__(self):
        super().__init__(
            name="DueDiligenceScreeningAgent",
            role="Supplied Screening Evidence Review",
            deployable_unit="DU-04 DueDiligenceScreeningUnit",
            autonomy=AutonomyLevel.HUMAN_IN_THE_LOOP
        )

    def screen_sanctions(self, parties: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Report supplied case flags; never describe them as provider screening."""
        findings = [
            {"party": p.get("name"), "status": p.get("sanctionsHit")}
            for p in parties
            if p.get("sanctionsHit") not in (None, "", "NOT_CHECKED")
        ]
        return {
            "check_type": "SANCTIONS",
            "provider_status": "NOT_CONFIGURED",
            "source": "CASE_RECORD_ONLY",
            "case_record_findings": findings,
        }

    def perform_idv(self, individuals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Activity: PerformPartyIDAndVerification (REQ-028, LR-01)"""
        verified_count = sum(1 for i in individuals if i.get("idvStatus") == "VERIFIED")
        total_required = len(individuals)
        return {
            "check_type": "ID_AND_V",
            "provider_status": "NOT_CONFIGURED",
            "case_record_reported_verified_count": verified_count,
            "total_required": total_required,
            "source": "CASE_RECORD_ONLY",
        }

    def evaluate_triage_gate(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """ChoiceGate: TriageAndDispositionGate (Decision Table DT-3)"""
        undispositioned = [f for f in findings if f.get("status") == "POTENTIAL_MATCH"]
        confirmed = [f for f in findings if f.get("status") == "CONFIRMED_MATCH"]

        if confirmed:
            return {
                "branch": "CASE_REPORTED_CONFIRMED_MATCH",
                "action": "REQUIRES_FCC_REVIEW",
                "reason": f"The case record contains {len(confirmed)} items marked CONFIRMED_MATCH; provider results were not verified.",
            }
        elif undispositioned:
            return {
                "branch": "DISPOSITION_REQUIRED",
                "action": "HALT_FOR_FCC_ANALYST_ADJUDICATION",
                "reason": f"Found {len(undispositioned)} undispositioned screening matches. Reasoned disposition required (REQ-032 / BR-P03)."
            }
        return {
            "branch": "PROVIDER_REQUIRED",
            "action": "HOLD_FOR_CONFIGURED_SCREENING",
            "reason": "No live sanctions, PEP, identity, or adverse-media screening provider is configured.",
        }

    def produce_customer_risk_assessment(
        self,
        sanctions_clear: bool,
        idv_all_passed: bool,
        jurisdiction: str = "GB",
        trading_years: int = 13
    ) -> Dict[str, Any]:
        """Activity: ProduceCustomerRiskAssessment (CRA) (REQ-029, BR-D03)"""
        return {
            "status": "NOT_PRODUCED",
            "reason": "A customer risk rating requires the organization's approved policy and verified provider evidence.",
        }

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        parties = context.get("directors_and_shareholders", [])
        sanctions = self.screen_sanctions(parties)
        idv = self.perform_idv(parties)
        findings = context.get("screening_findings", [])
        triage = self.evaluate_triage_gate(findings)

        cra = self.produce_customer_risk_assessment(
            sanctions_clear=False,
            idv_all_passed=False
        )

        result = {
            "status": "SCREENING_PROVIDER_NOT_CONFIGURED",
            "sanctions_outcome": sanctions,
            "idv_outcome": idv,
            "triage_gate": triage,
            "customer_risk_assessment": cra,
            "control_gate_IBVC_01_G2": {
                "gate_id": "IBVC-01-G2",
                "passed": False,
                "blocking_reasons": [triage["reason"]],
            },
        }

        self.log_activity(
            activity_name="ExecuteFinancialCrimeScreening",
            rules_enforced=[],
            inputs={"parties_count": len(parties)},
            outputs=result,
            details="Summarized case-record screening fields; no external provider checks or CRA rating were performed.",
        )

        return result
