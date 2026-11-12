"""
Credit Pack Authoring Agent Prompts (DU-06)
Enforces FCA PR-02 / REQ-046 / REQ-090 / BR-G06
"""

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
