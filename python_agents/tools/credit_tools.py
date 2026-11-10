"""
Declarative Tool Definitions & Deterministic Functions for Google ADK Agents
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional

@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters_schema: Dict[str, Any]
    handler: Optional[str] = None

class CreditToolRegistry:
    """Registry of declarative tools available to ADK worker agents."""
    @staticmethod
    def get_all_tools() -> List[ToolDefinition]:
        return [
            ToolDefinition(
                name="classify_case_category",
                description="Maps inbound application payload to 1 of 7 statutory categories under REQ-002.",
                parameters_schema={"type": "object", "properties": {"dealer_type": {"type": "string"}}},
                handler="classify_case"
            ),
            ToolDefinition(
                name="derive_dt1_checklist",
                description="Generates mandatory documentation checklist under Decision Table DT-1.",
                parameters_schema={"type": "object", "properties": {"category": {"type": "string"}}},
                handler="derive_checklist"
            ),
            ToolDefinition(
                name="compute_calcs_deterministic",
                description="Calculates Gearing, Current Ratio, DSCR, and Stock Turn deterministically.",
                parameters_schema={"type": "object", "properties": {"periods": {"type": "array"}}},
                handler="compute_ratios"
            ),
            ToolDefinition(
                name="validate_cashflow_invariant",
                description="Enforces CALC-007 Cashflow Discrepancy == 0.",
                parameters_schema={"type": "object", "properties": {"cashflows": {"type": "object"}}},
                handler="validate_cashflow"
            ),
            ToolDefinition(
                name="screen_watchlists_parallel",
                description="Executes 5 parallel AML screening checks under SYSC 6.3.",
                parameters_schema={"type": "object", "properties": {"target_parties": {"type": "array"}}},
                handler="screen_aml"
            ),
            ToolDefinition(
                name="evaluate_dt3_disposition",
                description="Evaluates false positive differentiation criteria under Decision Table DT-3.",
                parameters_schema={"type": "object", "properties": {"hit_id": {"type": "string"}}},
                handler="adjudicate_hit"
            ),
            ToolDefinition(
                name="evaluate_dt2_gate",
                description="Verifies 100% item satisfaction and 90-day validity invariant under DT-2.",
                parameters_schema={"type": "object", "properties": {"checklist": {"type": "array"}}},
                handler="evaluate_completeness"
            ),
            ToolDefinition(
                name="seal_worm_snapshot",
                description="Generates immutable SHA-256 cryptographically sealed pack hash under REQ-064.",
                parameters_schema={"type": "object", "properties": {"pack_data": {"type": "object"}}},
                handler="seal_snapshot"
            )
        ]
