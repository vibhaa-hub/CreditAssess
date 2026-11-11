"""Validate user-supplied intake without inventing identities or policy rules."""

import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.base_agent import BaseCreditAgent
from models import AutonomyLevel, RequestCategory, LendingLine, OriginationSource, ControlGateResult
from typing import Dict, Any, List

class IntakeTriageAgent(BaseCreditAgent):
    def __init__(self):
        super().__init__(
            name="IntakeTriageAgent",
            role="Intake Data Validation",
            deployable_unit="DU-01 RequestIntakeAndTriageUnit",
            autonomy=AutonomyLevel.HUMAN_IN_THE_LOOP
        )

    def register_credit_request(self, raw_message: Dict[str, Any]) -> Dict[str, Any]:
        """Activity: RegisterCreditRequest (REQ-001, REQ-003, BR-G02)"""
        case_id = raw_message.get("case_id")
        origination_source = raw_message.get("source")
        if not isinstance(case_id, str) or not case_id.strip():
            raise ValueError("A persisted case ID is required for intake analysis.")
        if origination_source not in {source.value for source in OriginationSource}:
            raise ValueError("A valid origination source must be supplied.")
        receipt_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

        header = {
            "case_id": case_id.strip(),
            "origination_source": origination_source,
            "receipt_timestamp": receipt_time,
            "channel_sender": raw_message.get("sender"),
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
        requested_type = payload.get("requested_category")
        valid_categories = {category.value for category in RequestCategory}
        if requested_type not in valid_categories:
            raise ValueError("A valid request category must be supplied.")
        lending_lines = payload.get("affected_lending_lines")
        valid_lines = {line.value for line in LendingLine}
        if (
            not isinstance(lending_lines, list)
            or not lending_lines
            or any(line not in valid_lines for line in lending_lines)
        ):
            raise ValueError("At least one valid affected lending line must be supplied.")

        classification = {
            "primary_category": requested_type,
            "affected_lending_lines": lending_lines,
            "classification_source": "USER_SUPPLIED",
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
            owner_id = roster.get("wholesale_manager")
            owner_role = "WHOLESALE_MANAGER"
        else:
            owner_id = roster.get("account_manager")
            owner_role = "ACCOUNT_MANAGER"
        if not isinstance(owner_id, str) or not owner_id.strip():
            return {
                "status": "NOT_ASSIGNED",
                "reason": "No organization-managed owner roster is configured.",
            }

        assignment = {
            "designated_owner": owner_id.strip(),
            "owner_role": owner_role,
            "assignment_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "sole_accountability_enforced": False,
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
        """No organization-approved checklist policy is configured in this service."""
        self.log_activity(
            activity_name="ResolveRequirementSetChecklist",
            rules_enforced=[],
            inputs={"category": category},
            outputs={"status": "NOT_CONFIGURED"},
            details="No organization-approved document checklist was generated.",
            status="BLOCKED",
        )
        return []

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
            condition_description="Intake fields, owner assignment, and approved checklist policy are required.",
            blocking_reasons=blocking,
            advisory_notes=[],
        )

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        raw_msg = context.get("raw_incoming_message", {})
        header = self.register_credit_request(raw_msg)
        classification = self.classify_case_type(raw_msg)
        assignment = self.assign_accountable_owner(classification, context.get("roster", {}))
        checklist = self.resolve_requirement_set_checklist(classification["primary_category"])

        state = {
            "status": "READY_FOR_REVIEW" if assignment.get("designated_owner") and checklist else "INCOMPLETE",
            "header": header,
            "classification": classification,
            "assignment": assignment,
            "requirement_checklist": checklist,
        }
        gate = self.evaluate_control_gate(state)
        state["control_gate_IBVC_01_G1"] = gate.__dict__
        return state
