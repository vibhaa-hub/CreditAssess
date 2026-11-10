"""
Statutory DSL Rules for ApexCredit Rule Engine
"""

from dataclasses import dataclass

@dataclass
class DSLRule:
    rule_id: str
    name: str
    fca_citation: str
    domain: str
    condition_expr: str
    severity: str
    error_message: str
    corrective_action: str
