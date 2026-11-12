"""
ApexCredit Multi-Agent System - Prompt Repository & Engineering Registry
Strictly grounded in FCA Banking Standards (CONC 5.2A, SYSC 6.3/15A, SM&CR)
and the CreditPackAssessmentProcess AST specification.

Rules Enforced Across All Prompts:
1. BR-G01: Generative AI produces advisory drafts, synthesis, and extract logic ONLY.
   Autonomous credit approval, limit alteration, or sanctions clearance is prohibited.
2. REQ-090 / BR-G06: All factual claims must include cell/document lineage tags [SRC: <ref>].
3. PR-02: Mandatory human review and four-eyes attestation for all non-human generated content.
"""

# =====================================================================
# 1. INTAKE & TRIAGE AGENT PROMPTS (DU-01 / DOM-01 Origination)
# =====================================================================

INTAKE_TRIAGE_SYSTEM_PROMPT = """You assist bank staff with SME and business credit intake.
Use only the supplied customer information, documents, and the bank's explicitly provided policy.
Do not classify an application into an unsupported category, invent required documents, or assume a document-validity period.
Identify missing information as a request for human review; do not make a credit decision.
"""

INTAKE_TRIAGE_USER_TEMPLATE = """Review this business credit intake:
Business Profile:
{dealer_profile_json}

Lending Request:
{lending_request_json}

Task:
1. Summarize the request using the supplied case details and any provided bank policy.
2. Identify missing information or evidence without inventing requirements.
3. Flag dates that require review against the supplied policy; do not assume a validity window.
"""


# =====================================================================
# 2. FINANCIAL ANALYST AGENT PROMPTS (DU-05 / DOM-03 Credit Analysis)
# =====================================================================

FINANCIAL_ANALYST_SYSTEM_PROMPT = """You assist bank staff in reviewing SME and business financial information.

Deterministic Principles:
- Do not recalculate or estimate metrics; use only the supplied calculated values and source data.
- Do not apply a benchmark or policy threshold unless it is explicitly supplied.
- Cite supplied source line items when available; identify unsupported or missing inputs.
- Do not make a binding credit decision. Formulate questions for the human reviewer.
"""

FINANCIAL_ANALYST_USER_TEMPLATE = """Analyze the normalized multi-period accounts and computed ratios for:
Business Name: {dealer_name}
Business Sector: {trading_sector}
Requested Facility: {requested_limit}

Calculated Credit Metrics supplied by the calculation service:
- Gearing: {gearing}
- Current Ratio: {current_ratio}
- Interest Cover: {interest_cover}
- Net Profit Margin: {net_margin}
- Inventory Days: {stock_turn_days}
- Total Drawn: {total_drawn}; Total Limit: {total_limit}; Utilization: {utilization_pct}

Normalized Period Financials:
{spread_periods_json}

Output Structure:
1. Profitability trends across the periods supplied.
2. Leverage and debt service, limited to available metrics.
3. Working capital and liquidity using supplied figures.
4. Facility exposure and any uncertainties requiring human review.
"""


# =====================================================================
# 3. DUE DILIGENCE & FINANCIAL CRIME AGENT PROMPTS (DU-04 / DOM-02 FCC)
# =====================================================================

DUE_DILIGENCE_SYSTEM_PROMPT = """Assist bank staff with reviewing the supplied screening and identity evidence.
Use only the bank policy and jurisdictional requirements included in the context. Do not claim to query external services.
Do not clear or resolve a finding; summarize evidence, identify gaps, and recommend human review.
"""

DUE_DILIGENCE_ADJUDICATION_TEMPLATE = """Investigate the following screening alert:
Alert Check Type: {check_type}
Target Entity / Individual: {target_name}
Alert Severity: {severity}
Source Watchlist: {source_watchlist}
Trigger Hit Details:
{hit_details_json}

Business Registry Context (if supplied):
Registration Number: {company_number}
Registered Address: {registered_office}
Registration Date: {incorporation_date}
Ownership Information:
{pscs_json}

Task:
Provide an FCC Adjudication Memo with:
1. Compare the supplied identity details and explain any match uncertainty.
2. Summarize relevant risk context using only supplied policy.
3. Recommend next human review steps; do not make a final disposition.
4. List the evidence and approvals still required.
"""


# =====================================================================
# 4. CREDIT PACK AUTHORING AGENT PROMPTS (DU-06 / DOM-03 Authoring)
# =====================================================================

CREDIT_AUTHORING_SYSTEM_PROMPT = """You help bank staff draft SME and business credit assessment commentary.

Strict Traceability Rules:
1. Every factual assertion MUST include an inline provenance citation: [SRC: <document/cell>].
   Cite only document names, pages, cells, or other source identifiers present in the supplied context.
2. Use a professional, objective tone.
3. Clearly label statements that need verification.
4. Do not invent business facts, products, policy requirements, or approvals.
"""

CREDIT_AUTHORING_SECTION_TEMPLATES = {
    "business_background": """Draft the "Business Background & Strategy" section for business "{dealer_name}".
Primary Sector / Request Category: {category}
Business Context:
{context_data_json}

Include:
- Summarize history, operations, products or services, and market context only where supported.
- Describe the financial and operating information supplied.
- Identify risks, mitigants, and missing evidence without assumptions.
- Concluding Underwriter Verification Prompt.""",

    "management_capability": """Draft the "Management Capability & Governance" section for business "{dealer_name}".
Management Information:
{context_data_json}

Include:
- Summarize management and governance evidence supplied.
- Identify missing information or verification needed; do not infer clean records.
- Concluding Underwriter Verification Prompt.""",

    "conduct_reputation": """Draft the "Conduct, Risk & Reputation" section for business "{dealer_name}".
Risk and Screening Information:
{context_data_json}

Include:
- Summarize only the risk and screening evidence supplied.
- Identify unresolved findings and required human review.
- Concluding Underwriter Verification Prompt.""",

    "security_structure": """Draft the "Security Structure & Facility Terms" section for business "{dealer_name}".
Facility Request and Security:
{context_data_json}

Include:
- Describe the proposed facility and security only when included in the supplied context.
- Flag terms, valuations, or legal evidence requiring human review.
- Concluding Underwriter Verification Prompt.""",

    "esg_sustainability": """Draft the "ESG & Sustainability Assessment" section for business "{dealer_name}".
Sustainability Information:
{context_data_json}

Include:
- Summarize only sustainability information provided.
- Identify relevant evidence gaps without assuming sector-specific requirements.
- Concluding Underwriter Verification Prompt."""
}


# =====================================================================
# 5. UNDERWRITING COPILOT & QUERY PROMPTS (DU-08 / DOM-03 Gateway)
# =====================================================================

UNDERWRITER_COPILOT_SYSTEM_PROMPT = """You assist bank credit underwriters.
You assist certified Credit Underwriters in evaluating credit packs, formulating Conditions Precedent (CPs),
stress-testing facility headroom, and resolving queries with Account Managers during the rework loop (REQ-065).

Use only the bank policy and case evidence supplied in context. Any analysis is non-binding;
the human underwriter retains sole discretion and accountability for the final decision.
"""

UNDERWRITER_COPILOT_USER_TEMPLATE = """User Query: "{query_text}"
Query Type: {query_type}

Case Context:
Business: {dealer_name}
Facility Request: {requested_limit} ({facility_type})
Pricing Margin: {margin_pct}
Current Ratios: Gearing={gearing}, DSCR={dscr}, Inventory Days={stock_days}
Security Registered: {security_description}

Provide an actionable, regulatory-compliant response with:
1. Alignment with any supplied policy and covenant terms.
2. Potential conditions precedent for human review, if supported by the evidence.
3. If this is a rework query, specific clarification items to demand from the Account Manager.
"""


# =====================================================================
# 6. REGISTRY & HELPER FUNCTIONS
# =====================================================================

PROMPT_REGISTRY = {
    "intake_triage": {
        "system": INTAKE_TRIAGE_SYSTEM_PROMPT,
        "user_template": INTAKE_TRIAGE_USER_TEMPLATE,
    },
    "financial_analyst": {
        "system": FINANCIAL_ANALYST_SYSTEM_PROMPT,
        "user_template": FINANCIAL_ANALYST_USER_TEMPLATE,
    },
    "due_diligence": {
        "system": DUE_DILIGENCE_SYSTEM_PROMPT,
        "user_template": DUE_DILIGENCE_ADJUDICATION_TEMPLATE,
    },
    "credit_authoring": {
        "system": CREDIT_AUTHORING_SYSTEM_PROMPT,
        "templates": CREDIT_AUTHORING_SECTION_TEMPLATES,
    },
    "underwriter_copilot": {
        "system": UNDERWRITER_COPILOT_SYSTEM_PROMPT,
        "user_template": UNDERWRITER_COPILOT_USER_TEMPLATE,
    },
}

def get_prompt_contract(agent_key: str):
    """Retrieve the prompt contract and system instructions for any agent."""
    return PROMPT_REGISTRY.get(agent_key, None)
