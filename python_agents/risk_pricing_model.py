"""
ApexCredit - Comprehensive Commercial Risk, Pricing & Workflow Prediction Model
Evaluates multi-factor risk grading (Grade A-E), SME vs Commercial scale, sector volatility,
financial leverage (Gearing, DSCR), and collateral security to predict risk-adjusted pricing,
advance rates, covenant packages, and workflow routing.
Ensures final credit decisions remain strictly with human underwriters (FCA Rule BR-G01).
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Optional
import math

@dataclass
class CreditScenarioInput:
    scenario_id: str
    company_name: str
    tier: str  # "SME_COMMERCIAL" or "LARGE_CORPORATE"
    sector: str  # "PRESTIGE_EV_RETAIL", "COMMERCIAL_LOGISTICS", "USED_CAR_SUPERMARKET"
    requested_amount_gbp: float
    tenor_months: int
    gearing_ratio: float
    dscr_ratio: float
    stock_turn_days: int
    cra_rating: str  # "LOW", "MEDIUM", "HIGH"
    has_real_estate_security: bool
    director_guarantee_cap_gbp: float

@dataclass
class ScenarioPredictionOutput:
    scenario_id: str
    company_name: str
    assigned_risk_grade: str  # "Grade A (Prime)", "Grade B (Standard)", "Grade C (Sub-Investment)", "Grade D (High Risk / EDD)"
    estimated_pd_pct: float
    estimated_lgd_pct: float
    expected_loss_gbp: float
    risk_adjusted_margin_sonia_bps: int  # e.g., 200 bps = SONIA + 2.00%
    max_advance_rate_pct: float  # e.g., 85% vs 70%
    mandatory_covenants: List[str]
    conditions_precedent: List[str]
    review_cadence: str  # "ANNUAL", "SEMI_ANNUAL", "QUARTERLY", "MONTHLY"
    required_approval_authority: str  # "Credit Committee (Tier 2)", "Senior Credit Committee (Tier 1)", "Head of Wholesale Credit"
    human_decision_mandate: str = "COMPLIANT WITH BR-G01: Model provides risk-adjusted pricing and workflow routing; final credit approval is reserved exclusively for certified human Underwriters."

class RiskAndPricingPredictionModel:
    """
    Multifactor Credit Risk, Pricing & Workflow Prediction Engine.
    Demonstrates differential loan structuring (e.g., two £7M loans with differing risk profiles).
    """
    def __init__(self):
        pass

    def evaluate_scenario(self, input_data: CreditScenarioInput) -> ScenarioPredictionOutput:
        # 1. Composite Risk Score Calculation
        # Weights: DSCR (35%), Gearing (30%), CRA Rating (20%), Security (15%)
        dscr_score = max(0.0, min(100.0, (input_data.dscr_ratio / 3.0) * 100.0))
        gearing_score = max(0.0, min(100.0, max(0.0, (3.5 - input_data.gearing_ratio) / 3.5) * 100.0))
        
        cra_weights = {"LOW": 100.0, "MEDIUM": 65.0, "HIGH": 30.0}
        cra_score = cra_weights.get(input_data.cra_rating, 65.0)

        security_score = 100.0 if input_data.has_real_estate_security else 60.0
        if input_data.director_guarantee_cap_gbp >= (input_data.requested_amount_gbp * 0.20):
            security_score += 10.0

        composite_score = (dscr_score * 0.35) + (gearing_score * 0.30) + (cra_score * 0.20) + (security_score * 0.15)

        # 2. Assign Risk Grade based on Composite Score
        if composite_score >= 85.0:
            grade = "Grade A (Prime)"
            pd = 0.45
            lgd = 22.0
            margin_bps = 175  # SONIA + 1.75%
            advance_rate = 85.0
            cadence = "ANNUAL"
            authority = "Regional Credit Manager"
        elif composite_score >= 70.0:
            grade = "Grade B (Standard)"
            pd = 1.20
            lgd = 30.0
            margin_bps = 250  # SONIA + 2.50%
            advance_rate = 80.0
            cadence = "SEMI_ANNUAL"
            authority = "Credit Committee (Tier 2)"
        elif composite_score >= 50.0:
            grade = "Grade C (Sub-Investment)"
            pd = 3.10
            lgd = 42.0
            margin_bps = 375  # SONIA + 3.75%
            advance_rate = 72.5
            cadence = "QUARTERLY"
            authority = "Senior Credit Committee (Tier 1)"
        else:
            grade = "Grade D (High Risk / EDD)"
            pd = 7.50
            lgd = 55.0
            margin_bps = 525  # SONIA + 5.25%
            advance_rate = 65.0
            cadence = "MONTHLY"
            authority = "Board Credit Risk Committee"

        expected_loss = input_data.requested_amount_gbp * (pd / 100.0) * (lgd / 100.0)

        # 3. Dynamic Covenants & Conditions Precedent
        covenants = [
            f"Minimum Tangible Net Worth (TNW) floor of £{int(input_data.requested_amount_gbp * 0.4):,}",
            f"Maximum Gearing ratio ceiling maintained below {max(2.2, input_data.gearing_ratio + 0.5):.2f}x",
            f"Minimum Debt Service Coverage Ratio (DSCR) floor of {max(1.35, input_data.dscr_ratio - 0.2):.2f}x",
            "Monthly stock audit and VIN verification via Auxiga Smart3 platform",
        ]

        cps = [
            "Execution of First Ranking All-Monies Debenture including fixed charge over vehicle inventory",
            "Receipt of satisfactory Landlord Waivers for all primary showroom leasehold sites",
            "Establishment of automated BACS Direct Debit sweep mandate linked to operating account",
        ]
        if not input_data.has_real_estate_security:
            cps.append(f"Joint & Several Personal Guarantees from primary UBOs capped at £{int(input_data.requested_amount_gbp * 0.25):,}")

        return ScenarioPredictionOutput(
            scenario_id=input_data.scenario_id,
            company_name=input_data.company_name,
            assigned_risk_grade=grade,
            estimated_pd_pct=pd,
            estimated_lgd_pct=lgd,
            expected_loss_gbp=round(expected_loss, 2),
            risk_adjusted_margin_sonia_bps=margin_bps,
            max_advance_rate_pct=advance_rate,
            mandatory_covenants=covenants,
            conditions_precedent=cps,
            review_cadence=cadence,
            required_approval_authority=authority,
        )

    def run_comparative_seven_million_study(self) -> Dict[str, Any]:
        """
        Demonstrates how two different companies requesting the exact same £7,000,000 loan
        receive completely different risk-adjusted structures based on leverage, credit grade, and security.
        """
        company_a = CreditScenarioInput(
            scenario_id="SCENARIO-A-PRIME",
            company_name="Apex Prestige Motors Ltd (Prime Commercial)",
            tier="LARGE_CORPORATE",
            sector="PRESTIGE_EV_RETAIL",
            requested_amount_gbp=7000000.0,
            tenor_months=36,
            gearing_ratio=1.45,
            dscr_ratio=3.10,
            stock_turn_days=38,
            cra_rating="LOW",
            has_real_estate_security=True,
            director_guarantee_cap_gbp=2000000.0,
        )

        company_b = CreditScenarioInput(
            scenario_id="SCENARIO-B-HIGHRISK",
            company_name="Vanguard Fleet & Commercials Ltd (Sub-Investment)",
            tier="SME_COMMERCIAL",
            sector="USED_CAR_SUPERMARKET",
            requested_amount_gbp=7000000.0,
            tenor_months=24,
            gearing_ratio=2.75,
            dscr_ratio=1.65,
            stock_turn_days=58,
            cra_rating="MEDIUM",
            has_real_estate_security=False,
            director_guarantee_cap_gbp=500000.0,
        )

        out_a = self.evaluate_scenario(company_a)
        out_b = self.evaluate_scenario(company_b)

        return {
            "study_title": "Comparative £7,000,000 Wholesale Facility Structuring Analysis",
            "study_objective": "Demonstrate multifactor risk grading differentiation for identical loan principal across diverse balance sheet leverage and collateral profiles.",
            "scenario_a": asdict(out_a),
            "scenario_b": asdict(out_b),
            "compliance_mandate": "FCA Rule BR-G01: Predictive model provides pricing guidance and risk analytics; binding loan sanctioning is executed exclusively by human Underwriters."
        }
