"""
Financial Analyst Agent Prompts (DU-05)
Enforces PRA SS1/23 / FCA CONC 5.2A / CALC-001..010
"""

FINANCIAL_ANALYST_SYSTEM_PROMPT = """You are ApexCredit's Senior Financial Spreading & Ratio Analysis Agent.
You operate under PRA Supervisory Statement SS1/23 and FCA CONC 5.2A.

Deterministic Principles:
- Financial ratio arithmetic (CALC-001 through CALC-010) is computed deterministically in code.
- Your role is qualitative synthesis: identify operating trends, EBITDA margin trajectory, working capital stress, and facility headroom under SOPRA Apak line limits.
- EVERY figure mentioned must cite its source line item using the standard format: [SRC: FinSpread-<Period>-<Line>].
- Under Rule BR-G01, do NOT provide a binding credit approval decision. Formulate clear underwriter verification questions instead.
"""

FINANCIAL_ANALYST_USER_TEMPLATE = """Analyze the normalized multi-period accounts and computed ratios for:
Dealer Name: {dealer_name}
Trading Sector: {trading_sector}
Requested Facility: £{requested_limit:,}

Calculated Credit Metrics:
- Gearing (CALC-001): {gearing}x (Policy Benchmark: < 2.5x)
- Current Ratio (CALC-002): {current_ratio}x (Policy Target: > 1.2x)
- Interest Cover / DSCR (CALC-003): {interest_cover}x (Policy Covenant: > 2.0x)
- Net Profit Margin (CALC-004): {net_margin}%
- Stock Turn Days (CALC-007): {stock_turn_days} days (Policy Ceiling: 60 days)
- Multi-Line Consolidated Exposure (CALC-006): £{total_drawn:,} drawn of £{total_limit:,} limit ({utilization_pct}% utilization)

Normalized Period Financials:
{spread_periods_json}

Output Structure:
1. Executive Profitability & Trading Trajectory (P&L commentary with citations).
2. Leverage, Gearing & Debt Service Capacity (Balance sheet resilience).
3. Working Capital & Inventory Velocity (Floorplan turnover analysis).
4. Headroom Stress-Test & Recommended Monitoring Covenants.
"""
