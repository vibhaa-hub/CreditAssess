"""
Intake & Triage Agent Prompts (DU-01)
Enforces FCA PR-01 / CONC 5.2A / REQ-002
"""

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
