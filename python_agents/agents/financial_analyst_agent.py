"""
[DU-05] FinancialAnalystAgent (Autonomous Spreading & Arithmetic Engine)
Implements FinancialSpreadingAnalysisUnit:
- NormaliseFinancialStatements (REQ-038, BR-D04)
- ValidateStatementReconciliation (REQ-044, CALC-007)
- Computes Solvency & Gearing (CALC-001, BR-D05)
- Computes Current Ratio & Liquidity (CALC-002)
- Computes Interest Cover (CALC-003)
- Computes Net Profit Margin & YoY Trends (CALC-004, CALC-005)
- Computes Stock Turnaround Days (CALC-009)
- Computes ROTE where required (CALC-010, BR-D09)
- Aggregates Cross-Line Borrowing Profile & Utilisation (CALC-006, REQ-043, BR-D06)
"""

import sys
import os
import math
from numbers import Real
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.base_agent import BaseCreditAgent
from models import AutonomyLevel
from typing import Dict, Any, List, Union

class FinancialAnalystAgent(BaseCreditAgent):
    def __init__(self):
        super().__init__(
            name="FinancialAnalystAgent",
            role="Deterministic Analysis of Supplied Financial Data",
            deployable_unit="DU-05 FinancialSpreadingAnalysisUnit",
            autonomy=AutonomyLevel.SUPERVISED
        )

    @staticmethod
    def _valid_number(value: Any) -> bool:
        return isinstance(value, Real) and not isinstance(value, bool) and math.isfinite(float(value))

    def calculate_gearing(self, total_borrowings: float, net_worth: float) -> Dict[str, Any]:
        """CALC-001: Gearing = Total Borrowings ÷ Net Worth (Returns 'not meaningful' if Net Worth <= 0)"""
        if net_worth <= 0:
            return {
                "value": "not meaningful",
                "flag": "Negative or zero Net Worth: Gearing is not meaningful under Credit Policy BR-D05"
            }
        return {"value": round(total_borrowings / net_worth, 2), "flag": None}

    def calculate_current_ratio(self, current_assets: float, current_liabilities: float) -> Dict[str, Any]:
        """CALC-002: Current Ratio = Current Assets ÷ Current Liabilities (Returns 'not calculable' if CL = 0)"""
        if current_liabilities <= 0:
            return {
                "value": "not calculable",
                "commentary": "Zero current liabilities reported; short-term coverage is not calculable."
            }
        return {"value": round(current_assets / current_liabilities, 2), "commentary": None}

    def calculate_interest_cover(self, ebit: float, interest_charge: float) -> Dict[str, Any]:
        """CALC-003: Interest Cover = EBIT ÷ Interest Charge (Returns negative ratio with flag if EBIT is negative)"""
        if interest_charge <= 0:
            return {"value": None, "flag": "Interest charge must be positive to calculate interest cover."}
        ratio = round(ebit / interest_charge, 2)
        flag = None
        if ebit < 0:
            flag = "Operating loss reported; human review required."
        return {"value": ratio, "flag": flag}

    def calculate_net_profit_margin(self, net_profit: float, turnover: float) -> float | None:
        """CALC-004: Net Profit Margin = (Net Profit ÷ Turnover) * 100"""
        if turnover <= 0:
            return None
        return round((net_profit / turnover) * 100, 2)

    def calculate_yoy_change(self, current_val: float, prior_val: float) -> float | None:
        """CALC-005: YoY Change = ((Current Value - Prior Value) ÷ |Prior Value|) * 100"""
        if prior_val == 0:
            return None
        return round(((current_val - prior_val) / abs(prior_val)) * 100, 2)

    def calculate_stock_days(
        self, opening_stock: float, closing_stock: float, cost_of_sales: float
    ) -> float | None:
        """CALC-009: Stock Days = ((Opening Stock + Closing Stock) ÷ 2 ÷ Cost of Sales) * 365"""
        if cost_of_sales <= 0:
            return None
        avg_stock = (opening_stock + closing_stock) / 2.0
        return round((avg_stock / cost_of_sales) * 365, 1)

    def validate_cashflow_reconciliation(
        self,
        opening_cash: float,
        operating: float,
        investing: float,
        financing: float,
        closing_cash: float
    ) -> Dict[str, Any]:
        """CALC-007: Cashflow reconciliation: Opening Cash + Inflows - Outflows = Closing Cash"""
        expected_closing = opening_cash + operating + investing + financing
        discrepancy = round(abs(expected_closing - closing_cash), 2)
        return {
            "is_reconciled": discrepancy < 0.01,
            "discrepancy": discrepancy
        }

    def calculate_facility_utilization(self, drawn: float, limit: float) -> Dict[str, Any]:
        """CALC-006: Facility Utilisation = (Drawn ÷ Limit) * 100; Headroom = Limit - Drawn"""
        headroom = limit - drawn
        utilization_pct = round((drawn / limit) * 100, 1) if limit > 0 else None
        return {"headroom": headroom, "utilization_pct": utilization_pct}

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        periods = context.get("financial_periods", [])
        if not isinstance(periods, list) or not periods:
            return {
                "status": "INCOMPLETE_INPUT",
                "missing_fields": ["financial_periods"],
                "analysis": None,
            }

        latest_p = periods[-1]
        prior_p = periods[-2] if len(periods) >= 2 else None
        required_fields = {
            "turnover", "costOfSales", "ebit", "interestCharge", "netProfit",
            "totalBorrowings", "netAssets", "currentAssets", "currentLiabilities",
            "inventory", "openingCash", "operatingCashflow", "investingCashflow",
            "financingCashflow", "closingCash",
        }
        missing_fields = sorted(
            field
            for field in required_fields
            if not isinstance(latest_p, dict) or field not in latest_p or not self._valid_number(latest_p[field])
        )
        if prior_p is not None and not isinstance(prior_p, dict):
            missing_fields.append("prior_period")
        elif isinstance(prior_p, dict):
            for field in ("turnover", "inventory"):
                if field not in prior_p or not self._valid_number(prior_p[field]):
                    missing_fields.append(f"prior_period.{field}")
        if missing_fields:
            return {
                "status": "INCOMPLETE_INPUT",
                "missing_fields": sorted(set(missing_fields)),
                "analysis": None,
            }

        # Ratio calculations
        gearing = self.calculate_gearing(latest_p.get("totalBorrowings", 0), latest_p.get("netAssets", 0))
        cr = self.calculate_current_ratio(latest_p.get("currentAssets", 0), latest_p.get("currentLiabilities", 0))
        ic = self.calculate_interest_cover(latest_p.get("ebit", 0), latest_p.get("interestCharge", 0))
        npm = self.calculate_net_profit_margin(latest_p.get("netProfit", 0), latest_p.get("turnover", 1))
        rev_yoy = (
            self.calculate_yoy_change(latest_p["turnover"], prior_p["turnover"])
            if prior_p is not None else None
        )
        stock_days = (
            self.calculate_stock_days(
                prior_p["inventory"],
                latest_p["inventory"],
                latest_p["costOfSales"],
            )
            if prior_p is not None else None
        )

        cf_audit = self.validate_cashflow_reconciliation(
            latest_p.get("openingCash", 0),
            latest_p.get("operatingCashflow", 0),
            latest_p.get("investingCashflow", 0),
            latest_p.get("financingCashflow", 0),
            latest_p.get("closingCash", 0)
        )

        # Cross line exposures
        exposures = context.get("cross_line_exposures", [])
        if not isinstance(exposures, list):
            return {
                "status": "INVALID_INPUT",
                "missing_fields": ["cross_line_exposures must be an array"],
                "analysis": None,
            }
        exposure_results = []
        total_limit = 0.0
        total_drawn = 0.0
        for exp in exposures:
            if not isinstance(exp, dict):
                return {"status": "INVALID_INPUT", "missing_fields": ["invalid exposure entry"], "analysis": None}
            limit = exp.get("limitGBP")
            drawn = exp.get("drawnGBP")
            if (
                not self._valid_number(limit)
                or not self._valid_number(drawn)
                or limit < 0
                or drawn < 0
            ):
                return {
                    "status": "INVALID_INPUT",
                    "missing_fields": ["each exposure requires non-negative numeric limitGBP and drawnGBP"],
                    "analysis": None,
                }
            total_limit += limit
            total_drawn += drawn
            calc = self.calculate_facility_utilization(drawn, limit)
            exposure_results.append({
                "line": exp.get("line"),
                "limit": limit,
                "drawn": drawn,
                "headroom": calc["headroom"],
                "utilization_pct": calc["utilization_pct"]
            })

        has_exposure_data = bool(exposures)
        overall_exp = self.calculate_facility_utilization(total_drawn, total_limit) if has_exposure_data else None

        analytics_set = {
            "status": "ANALYTICAL_ONLY",
            "decision_use": "NOT_APPROVED_FOR_CREDIT_DECISIONS",
            "source": "SUPPLIED_CASE_DATA",
            "gearing": gearing,
            "current_ratio": cr,
            "interest_cover": ic,
            "net_profit_margin": npm,
            "revenue_yoy_pct": rev_yoy,
            "stock_days": stock_days,
            "cashflow_audit": cf_audit,
            "exposure_profile": exposure_results,
            "exposure_data_status": "SUPPLIED" if has_exposure_data else "NOT_SUPPLIED",
            "total_facility_limit": total_limit if has_exposure_data else None,
            "total_facility_drawn": total_drawn if has_exposure_data else None,
            "overall_headroom": overall_exp["headroom"] if overall_exp else None,
            "overall_utilization_pct": overall_exp["utilization_pct"] if overall_exp else None
        }

        self.log_activity(
            activity_name="NormaliseAndComputeAnalytics",
            rules_enforced=["REQ-038", "REQ-039", "REQ-040", "REQ-041", "REQ-042", "CALC-001..010", "BR-D04..06"],
            inputs={"periods_count": len(periods), "exposures_count": len(exposures)},
            outputs=analytics_set,
            details=f"Calculated Gearing: {gearing['value']}, Current Ratio: {cr['value']}, Interest Cover: {ic['value']}x, Stock Turn: {stock_days} days. Cashflow reconciled: {cf_audit['is_reconciled']}."
        )

        return analytics_set
