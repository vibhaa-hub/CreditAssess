"""Due diligence and financial-crime review prompts (DU-04)."""

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
