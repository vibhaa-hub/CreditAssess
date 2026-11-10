"""
Credit Pack Authoring Agent Prompts (DU-06)
Enforces FCA PR-02 / REQ-046 / REQ-090 / BR-G06
"""

CREDIT_AUTHORING_SYSTEM_PROMPT = """You are ApexCredit's Commercial Credit Pack Authoring Agent.
You generate standardized commentary sections for UK Motor Finance Credit Committees under FCA PR-02 and REQ-046.

Strict Traceability Rules:
1. Every factual assertion MUST include an inline provenance citation: [SRC: <document/cell>].
   Examples: [SRC: CompHouse-CH01], [SRC: FinSpread-FY24-P1], [SRC: CRA-Experian-p3].
2. Tone must be professional, objective, and analytical UK commercial banking standard.
3. Every drafted section must conclude with an Underwriter Verification Prompt.
4. Watermark all generated drafts with AI Provenance Label (REQ-090 / BR-G06).
"""

CREDIT_AUTHORING_SECTION_TEMPLATES = {
    "business_background": """Draft the "Business Background & Strategy" section for dealer "{dealer_name}".
Primary Sector / Request Category: {category}
Dealership Context:
{context_data_json}

Include:
- Paragraph 1: History, operational scale, rooftops, and franchise OEM relationships with citations.
- Paragraph 2: Sales volume split (prestige/hybrid/used/light commercial) and asset turnover.
- Paragraph 3: Strategic direction, resilience through industry cycles, and mitigants.
- Concluding Underwriter Verification Prompt.""",

    "management_capability": """Draft the "Management Capability & Governance" section for dealer "{dealer_name}".
Executive Leadership:
{context_data_json}

Include:
- Combined automotive management tenure of key directors.
- Governance record at Companies House (annual filings, clean statutory history).
- Succession planning and absence of disqualifications/adverse records.
- Concluding Underwriter Verification Prompt.""",

    "conduct_reputation": """Draft the "Conduct, CRA & Market Reputation" section for dealer "{dealer_name}".
Screening & CRA Profile:
{context_data_json}

Include:
- Commercial CRA score, delinquency probability, and CCJ search status.
- Consumer Duty (FCA Principle 12) compliance framework and customer satisfaction scores.
- Concluding Underwriter Verification Prompt.""",

    "security_structure": """Draft the "Security Structure & Facility Terms" section for dealer "{dealer_name}".
Facility Request & Collateral:
{context_data_json}

Include:
- Facility structure (£ amount, revolving nature, margin over SONIA).
- Primary security: First Ranking Debenture (fixed vehicle charge + floating charge).
- Supporting guarantees (Personal Guarantees, subordination deeds, asset backing).
- Apak wholesale title retention and stock audit cadence.
- Concluding Underwriter Verification Prompt.""",

    "esg_sustainability": """Draft the "ESG & Green Transition Assessment" section for dealer "{dealer_name}".
Sustainability Metrics:
{context_data_json}

Include:
- EV / PHEV fleet sales transition trajectory.
- Showroom energy efficiency (Solar PV, smart charging infrastructure).
- Compliance with UK battery disposal and automotive environmental directives.
- Concluding Underwriter Verification Prompt."""
}
