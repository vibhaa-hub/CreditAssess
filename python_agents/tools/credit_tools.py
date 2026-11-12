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
                description="Classifies a business credit request using supplied bank policy and case details.",
                parameters_schema={"type": "object", "properties": {"business_type": {"type": "string"}}},
                handler="classify_case"
            ),
            ToolDefinition(
                name="derive_dt1_checklist",
                description="Identifies evidence requirements from bank policy supplied with the request.",
                parameters_schema={"type": "object", "properties": {"category": {"type": "string"}}},
                handler="derive_checklist"
            ),
            ToolDefinition(
                name="compute_calcs_deterministic",
                description="Calculates supported financial metrics from supplied periods using configured rules.",
                parameters_schema={"type": "object", "properties": {"periods": {"type": "array"}}},
                handler="compute_ratios"
            ),
            ToolDefinition(
                name="validate_cashflow_invariant",
                description="Reconciles supplied cash-flow figures using the applicable configured rule.",
                parameters_schema={"type": "object", "properties": {"cashflows": {"type": "object"}}},
                handler="validate_cashflow"
            ),
            ToolDefinition(
                name="screen_watchlists_parallel",
                description="Prepares supplied parties for screening; no external screening provider is configured.",
                parameters_schema={"type": "object", "properties": {"target_parties": {"type": "array"}}},
                handler="screen_aml"
            ),
            ToolDefinition(
                name="evaluate_dt3_disposition",
                description="Summarizes a screening finding for human review using supplied policy and evidence.",
                parameters_schema={"type": "object", "properties": {"hit_id": {"type": "string"}}},
                handler="adjudicate_hit"
            ),
            ToolDefinition(
                name="evaluate_dt2_gate",
                description="Checks case evidence against requirements and validity rules explicitly supplied by the bank.",
                parameters_schema={"type": "object", "properties": {"checklist": {"type": "array"}}},
                handler="evaluate_completeness"
            ),
            ToolDefinition(
                name="seal_worm_snapshot",
                description="Hashes supplied pack data; this does not provide immutable storage or retention controls.",
                parameters_schema={"type": "object", "properties": {"pack_data": {"type": "object"}}},
                handler="seal_snapshot"
            )
        ]
