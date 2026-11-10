"""
ApexCredit Rule Engine DSL Compiler
"""

from typing import Dict, List, Any, Optional
import hashlib
import time
from dataclasses import asdict
from .statutory_rules import DSLRule

@dataclass
class RuleEvaluationResult:
    rule_id: str
    name: str
    fca_citation: str
    passed: bool
    actual_value: Any
    severity: str
    message: str
    corrective_action: Optional[str] = None

class ApexRuleEngineDSL:
    def __init__(self):
        self.rules: List[DSLRule] = []
        self._bootstrap_statutory_rules()

    def _bootstrap_statutory_rules(self):
        self.rules.append(DSLRule(
            rule_id="RULE-DOC-001",
            name="90-Day Document Staleness Guard",
            fca_citation="FCA PR-01 / Policy BR-P04",
            domain="DOM-01 Origination",
            condition_expr="max_doc_age_days <= 90",
            severity="BLOCKING_GATE",
            error_message="Statutory verification documents must not exceed 90 days validity.",
            corrective_action="Issue delta information request to dealer for fresh management accounts."
        ))
        self.rules.append(DSLRule(
            rule_id="RULE-UBO-002",
            name="100% Equity Reconciliation Invariant",
            fca_citation="MLR 2017 Reg 5 / Rule BR-D10",
            domain="DOM-02 Due Diligence",
            condition_expr="ubo_sum_percentage == 100.0",
            severity="BLOCKING_GATE",
            error_message="Total allocated shareholding must equal exactly 100.0%.",
            corrective_action="Reconcile cap table against Companies House Confirmation Statement CS01."
        ))
        self.rules.append(DSLRule(
            rule_id="RULE-SANC-003",
            name="Zero Open Screening Hits (DT-3)",
            fca_citation="FCA SYSC 6.3 / Rule BR-P03",
            domain="DOM-02 FCC",
            condition_expr="unresolved_screening_hits == 0",
            severity="BLOCKING_GATE",
            error_message="All potential AML, Sanctions, and PEP hits must have recorded reasoned dispositions.",
            corrective_action="Complete FCC reasoned false positive disposition or escalate to MLRO."
        ))
        self.rules.append(DSLRule(
            rule_id="RULE-CASH-004",
            name="Zero Cashflow Discrepancy Invariant (CALC-007)",
            fca_citation="UK GAAP / FRS 102",
            domain="DOM-03 Credit Analysis",
            condition_expr="cashflow_discrepancy == 0.0",
            severity="BLOCKING_GATE",
            error_message="Opening Cash + Operating/Investing/Financing Cashflows must equal Closing Cash with zero error.",
            corrective_action="Rebalance cashflow spreading statement against audited balance sheet."
        ))
        self.rules.append(DSLRule(
            rule_id="RULE-GEAR-005",
            name="Gearing Policy Ceiling (CALC-001)",
            fca_citation="PRA SS1/23 / Policy BR-P09",
            domain="DOM-03 Credit Analysis",
            condition_expr="gearing_ratio <= 2.5",
            severity="COVENANT_WARNING",
            error_message="Gearing ratio exceeds 2.5x policy benchmark.",
            corrective_action="Require secondary personal guarantee or subordinated shareholder loans."
        ))
        self.rules.append(DSLRule(
            rule_id="RULE-DSCR-006",
            name="Debt Service Coverage Floor (CALC-003)",
            fca_citation="CONC 5.2A / Policy BR-P10",
            domain="DOM-03 Credit Analysis",
            condition_expr="interest_cover >= 2.0",
            severity="COVENANT_WARNING",
            error_message="Operating profit is insufficient to maintain 2.0x interest coverage.",
            corrective_action="Reduce proposed facility limit or increase stocking fee amortization."
        ))
        self.rules.append(DSLRule(
            rule_id="RULE-4EYES-007",
            name="Pricing Segregation of Duties (BR-E02)",
            fca_citation="FCA SYSC 4.3.1R / SM&CR",
            domain="DOM-03 Origination",
            condition_expr="preparer_id != authorizer_id",
            severity="BLOCKING_GATE",
            error_message="Individual who prepares facility terms cannot authorize them.",
            corrective_action="Route facility term sheet to Commercial Manager for independent counter-sign."
        ))
        self.rules.append(DSLRule(
            rule_id="RULE-NO-AUTO-008",
            name="Prohibition of Automated Credit Decisions",
            fca_citation="FCA Rule BR-G01 / REQ-067",
            domain="DOM-03 Credit Gateway",
            condition_expr="is_automated_approval == False",
            severity="STATUTORY_VIOLATION",
            error_message="Credit approval cannot be determined by an autonomous AI agent.",
            corrective_action="Ensure decision is submitted to certified human Credit Underwriter console."
        ))

    def evaluate_case_facts(self, facts: Dict[str, Any]) -> Dict[str, Any]:
        results: List[RuleEvaluationResult] = []
        blocking_failures = 0
        warning_failures = 0

        for r in self.rules:
            passed = False
            actual_val = None
            try:
                passed = bool(eval(r.condition_expr, {"__builtins__": None}, facts))
                var_name = r.condition_expr.split()[0]
                actual_val = facts.get(var_name, "N/A")
            except Exception as e:
                passed = False
                actual_val = f"EvalError: {str(e)}"

            if not passed:
                if r.severity == "BLOCKING_GATE" or r.severity == "STATUTORY_VIOLATION":
                    blocking_failures += 1
                elif r.severity == "COVENANT_WARNING":
                    warning_failures += 1

            results.append(RuleEvaluationResult(
                rule_id=r.rule_id,
                name=r.name,
                fca_citation=r.fca_citation,
                passed=passed,
                actual_value=actual_val,
                severity=r.severity,
                message="Rule satisfied." if passed else r.error_message,
                corrective_action=None if passed else r.corrective_action
            ))

        overall_status = "PASS" if blocking_failures == 0 else "FAIL"
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        summary_payload = f"{facts.get('case_id', 'CASE')}-{overall_status}-{blocking_failures}-{timestamp}"
        rule_hash = hashlib.sha256(summary_payload.encode()).hexdigest()

        return {
            "status": overall_status,
            "timestamp": timestamp,
            "total_rules": len(self.rules),
            "passed_rules": len([r for r in results if r.passed]),
            "blocking_failures": blocking_failures,
            "warning_failures": warning_failures,
            "sha256_audit_seal": rule_hash,
            "evaluations": [asdict(r) for r in results]
        }
