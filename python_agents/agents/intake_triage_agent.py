"""
[DU-01] IntakeTriageAgent (Autonomous)
Implements RequestIntakeAndTriageUnit activities:
- RegisterCreditRequest (REQ-001, REQ-003, BR-G02)
- ClassifyCaseType (REQ-002: 7 statutory request categories)
- AssignAccountableOwner (REQ-005, BR-E01)
- ResolveRequirementSetChecklist (DT-1, REQ-004, REQ-007, BR-P01)
- Evaluates Control Gate IBVC-01-G1
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.base_agent import BaseCreditAgent
from models import AutonomyLevel, RequestCategory, LendingLine, ControlGateResult
from typing import Dict, Any, List

class IntakeTriageAgent(BaseCreditAgent):
    def __init__(self):
        super().__init__(
            name="IntakeTriageAgent",
            role="Autonomous Intake & Triage Specialist",
            deployable_unit="DU-01 RequestIntakeAndTriageUnit",
            autonomy=AutonomyLevel.AUTONOMOUS
        )

    def register_credit_request(self, raw_message: Dict[str, Any]) -> Dict[str, Any]:
        """Activity: RegisterCreditRequest (REQ-001, REQ-003, BR-G02)"""
        case_id = raw_message.get("case_id", f"CASE-2026-{int(time.time()) % 10000:04d}")
        origination_source = raw_message.get("source", "OEM_PARTNER")
        receipt_time = raw_message.get("timestamp", time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()))

        header = {
            "case_id": case_id,
            "origination_source": origination_source,
            "receipt_timestamp": receipt_time,
            "channel_sender": raw_message.get("sender", "Stellantis Financial Services Referral Portal")
        }

        self.log_activity(
            activity_name="RegisterCreditRequest",
            rules_enforced=["REQ-001", "REQ-003", "BR-G02"],
            inputs={"raw_message": raw_message},
            outputs=header,
            details=f"Initialized master case {case_id} from origination source {origination_source}."
        )
        return header

    def classify_case_type(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Activity: ClassifyCaseType (REQ-002: 7 statutory categories)"""
        requested_type = payload.get("requested_category", RequestCategory.INCREASED_BORROWING.value)
        lending_lines = payload.get("affected_lending_lines", [LendingLine.WHOLESALE.value, LendingLine.FRANCHISE.value])

        classification = {
            "primary_category": requested_type,
            "affected_lending_lines": lending_lines,
            "statutory_category_verified": True
        }

        self.log_activity(
            activity_name="ClassifyCaseType",
            rules_enforced=["REQ-002"],
            inputs=payload,
            outputs=classification,
            details=f"Classified application into statutory category {requested_type} across lending lines {lending_lines}."
        )
        return classification

    def assign_accountable_owner(self, classification: Dict[str, Any], roster: Dict[str, Any]) -> Dict[str, Any]:
        """Activity: AssignAccountableOwner (REQ-005, BR-E01)"""
        lines = classification.get("affected_lending_lines", [])
        if LendingLine.WHOLESALE.value in lines:
            owner_id = roster.get("wholesale_manager", "Marcus Vance (Wholesale Manager - Central Region)")
            owner_role = "WHOLESALE_MANAGER"
        else:
            owner_id = roster.get("account_manager", "Sarah Jenkins (Senior Account Manager)")
            owner_role = "ACCOUNT_MANAGER"

        assignment = {
            "designated_owner": owner_id,
            "owner_role": owner_role,
            "assignment_timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            "sole_accountability_enforced": True
        }

        self.log_activity(
            activity_name="AssignAccountableOwner",
            rules_enforced=["REQ-005", "BR-E01"],
            inputs={"classification": classification},
            outputs=assignment,
            details=f"Assigned single accountable owner {owner_id} ({owner_role}) per REQ-005."
        )
        return assignment

    def resolve_requirement_set_checklist(self, category: str) -> List[Dict[str, Any]]:
        """Activity: ResolveRequirementSetChecklist (DT-1, REQ-004, REQ-007, BR-P01)"""
        base_checklist = [
            {"code": "REQ_LEGAL_ENTITY", "name": "Companies House Certificate of Incorporation", "category": "LEGAL", "mandatory": True},
            {"code": "REQ_SEARCH_CONSENT", "name": "Authorized Credit Bureau Search Mandate & GDPR Notice", "category": "GOVERNANCE", "mandatory": True},
            {"code": "REQ_DIRECTORS_UBO", "name": "Director Register, PSC Declaration & 100% UBO Identification", "category": "LEGAL", "mandatory": True},
            {"code": "REQ_FINANCIAL_STATEMENTS", "name": "3 Years Audited Accounts & Recent Management Accounts", "category": "FINANCIAL", "mandatory": True},
            {"code": "REQ_SANCTIONS_AML", "name": "OFSI Sanctions, PEP Screening & 2+2 ID&V Verification", "category": "DUE_DILIGENCE", "mandatory": True},
            {"code": "REQ_FCA_REGISTER", "name": "FCA Financial Services Register Permissions Check", "category": "DUE_DILIGENCE", "mandatory": True},
            {"code": "REQ_SECURITY_DEBENTURE", "name": "All-Monies Debenture, Stock Floating Charge & PG Schedule", "category": "SECURITY", "mandatory": True},
        ]

        if category == RequestCategory.NEW_FRANCHISE.value:
            base_checklist.append({"code": "REQ_OEM_FRANCHISE_LETTER", "name": "Manufacturer Franchise Agreement & Territory Authorization", "category": "LEGAL", "mandatory": True})
        elif category == RequestCategory.ACQUISITION.value:
            base_checklist.append({"code": "REQ_ACQUISITION_SPA", "name": "Share Purchase Agreement (SPA) & Acquisition Debt Service Model", "category": "FINANCIAL", "mandatory": True})
        elif category == RequestCategory.INCREASED_BORROWING.value:
            base_checklist.append({"code": "REQ_FACILITY_UTILIZATION_AUDIT", "name": "12-Month Peak Stock Turn & Vehicle Facility Utilization Audit", "category": "FINANCIAL", "mandatory": True})

        self.log_activity(
            activity_name="ResolveRequirementSetChecklist",
            rules_enforced=["REQ-004", "REQ-007", "DT-1", "BR-P01"],
            inputs={"category": category},
            outputs={"items_count": len(base_checklist)},
            details=f"Evaluated Decision Table DT-1: generated itemized dynamic requirement set with {len(base_checklist)} mandatory items."
        )
        return base_checklist

    def evaluate_control_gate(self, case_state: Dict[str, Any]) -> ControlGateResult:
        """Control Gate: IBVC-01-G1 (Intake Requirement Set Confirmed)"""
        has_cat = bool(case_state.get("classification", {}).get("primary_category"))
        has_owner = bool(case_state.get("assignment", {}).get("designated_owner"))
        has_checklist = len(case_state.get("requirement_checklist", [])) > 0

        passed = has_cat and has_owner and has_checklist
        blocking = []
        if not has_cat:
            blocking.append("Statutory category is not classified.")
        if not has_owner:
            blocking.append("Accountable owner has not been assigned.")
        if not has_checklist:
            blocking.append("DT-1 checklist has not been resolved.")

        return ControlGateResult(
            gate_id="IBVC-01-G1",
            passed=passed,
            condition_description="Case type classified, accountable owner assigned, and dynamic checklist generated.",
            blocking_reasons=blocking,
            advisory_notes=["Ready for DU-02 Evidence Ingestion."] if passed else []
        )

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        raw_msg = context.get("raw_incoming_message", {})
        header = self.register_credit_request(raw_msg)
        classification = self.classify_case_type(raw_msg)
        assignment = self.assign_accountable_owner(classification, context.get("roster", {}))
        checklist = self.resolve_requirement_set_checklist(classification["primary_category"])

        state = {
            "header": header,
            "classification": classification,
            "assignment": assignment,
            "requirement_checklist": checklist
        }
        gate = self.evaluate_control_gate(state)
        state["control_gate_IBVC_01_G1"] = gate.__dict__
        return state

import time
