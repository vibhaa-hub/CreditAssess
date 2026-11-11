"""Evaluate supplied completeness data without fabricating a submission."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.base_agent import BaseCreditAgent
from models import AutonomyLevel, ControlGateResult
from typing import Dict, Any, List

class CreditSubmissionGatewayAgent(BaseCreditAgent):
    def __init__(self):
        super().__init__(
            name="CreditSubmissionGatewayAgent",
            role="Completeness Analysis (No Gateway Connector)",
            deployable_unit="DU-08 CreditSubmissionGatewayUnit",
            autonomy=AutonomyLevel.SUPERVISED
        )

    def calculate_pack_completeness(self, checklist: List[Dict[str, Any]]) -> Dict[str, Any]:
        """CALC-011: Pack Completeness = (Completed Mandatory Items ÷ Applicable Mandatory Items) * 100"""
        applicable_mandatory = [i for i in checklist if i.get("mandatory", True)]
        if not applicable_mandatory:
            return {
                "completeness_pct": None,
                "completed_count": 0,
                "total_mandatory_count": 0,
                "is_100_pct": False,
            }
        completed = [i for i in applicable_mandatory if i.get("satisfied", False)]
        pct = round((len(completed) / len(applicable_mandatory)) * 100, 1)
        return {
            "completeness_pct": pct,
            "completed_count": len(completed),
            "total_mandatory_count": len(applicable_mandatory),
            "is_100_pct": pct >= 100.0
        }

    def evaluate_completeness_gate(self, case_state: Dict[str, Any]) -> Dict[str, Any]:
        """Activity: ExecuteDeterministicCompletenessGate (Decision Table DT-2 / BR-P04 / BR-U04)"""
        checklist = case_state.get("requirement_checklist", [])
        calc = self.calculate_pack_completeness(checklist)

        blocking_gaps = []
        if not calc["is_100_pct"]:
            missing = [i.get("name", i.get("code")) for i in checklist if i.get("mandatory") and not i.get("satisfied")]
            blocking_gaps.append({
                "code": "DT2_CHECKLIST_GAP",
                "reason": f"{len(missing)} mandatory evidence items missing: {', '.join(missing)}.",
                "corrective_action": "Gather missing documents in DU-02."
            })

        if not case_state.get("customer_risk_assessment"):
            blocking_gaps.append({
                "code": "SCREENING_REVIEW_REQUIRED",
                "reason": "No organization-approved screening and customer-risk workflow is configured.",
                "corrective_action": "Complete the approved external screening and human review process.",
            })

        unresolved = [
            finding for finding in case_state.get("screening_findings", [])
            if finding.get("status") in {"POTENTIAL_MATCH", "CONFIRMED_MATCH"}
        ]
        if unresolved:
            blocking_gaps.append({
                "code": "SCREENING_FINDINGS_OPEN",
                "reason": f"{len(unresolved)} case-record screening findings require human review.",
                "corrective_action": "Use the organization's approved financial-crime workflow.",
            })

        if not case_state.get("verification_attested", False):
            blocking_gaps.append({
                "code": "DT2_ATTESTATION_GAP",
                "reason": "Onboarding Analyst entity and UBO verification has not been formally attested.",
                "corrective_action": "Sign off entity reconciliation in DU-03."
            })

        if not case_state.get("pricing_signoff", {}).get("isAuthorized", False):
            blocking_gaps.append({
                "code": "DT2_PRICING_SIGNOFF_GAP",
                "reason": "Four-eyes segregation of duties pricing approval missing (BR-E02).",
                "corrective_action": "Commercial Director must independently authorize facility pricing in DU-07."
            })

        # Narrative reviews
        narratives = case_state.get("narrative_sections", [])
        unreviewed_nar = [n for n in narratives if n.get("status") == "PENDING_REVIEW"]
        if unreviewed_nar:
            blocking_gaps.append({
                "code": "DT2_NARRATIVE_REVIEW_GAP",
                "reason": f"{len(unreviewed_nar)} AI commentary sections pending AM human review (REQ-052 / BR-U01).",
                "corrective_action": "Account Manager must accept, amend, or reject each draft section in DU-06."
            })

        is_ready = len(blocking_gaps) == 0

        self.log_activity(
            activity_name="ExecuteDeterministicCompletenessGate",
            rules_enforced=["REQ-061", "CALC-011", "DT-2", "BR-P04", "BR-U04"],
            inputs={"checklist_count": len(checklist)},
            outputs={"is_ready": is_ready, "completeness_pct": calc["completeness_pct"], "blocking_gaps": blocking_gaps},
            details=f"Application checklist analysis: {calc['completeness_pct']}% complete. External submission is not configured."
        )

        return {
            "checklist_complete": is_ready,
            "submission_available": False,
            "submission_status": "GATEWAY_NOT_CONFIGURED",
            "completeness_pct": calc["completeness_pct"],
            "blocking_gaps": blocking_gaps
        }

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        case_id = context.get("case_id")
        gate_eval = self.evaluate_completeness_gate(context)
        if not isinstance(case_id, str) or not case_id.strip():
            return {
                "status": "INVALID_INPUT",
                "error": "A persisted case ID is required.",
                "completeness_gate": gate_eval,
                "snapshot": None,
            }

        gate_res = ControlGateResult(
            gate_id="IBVC-01-G4",
            passed=False,
            condition_description="Submission requires an approved gateway integration and validated controls.",
            blocking_reasons=[g["reason"] for g in gate_eval["blocking_gaps"]]
        )

        return {
            "status": "GATEWAY_NOT_CONFIGURED",
            "completeness_gate": gate_eval,
            "snapshot": None,
            "control_gate_IBVC_01_G4": gate_res.__dict__
        }
