"""
Prompt Registry & Engineering Contracts
Aggregates all agent prompts and system instructions.
"""

from .intake_prompt import INTAKE_TRIAGE_SYSTEM_PROMPT, INTAKE_TRIAGE_USER_TEMPLATE
from .financial_prompt import FINANCIAL_ANALYST_SYSTEM_PROMPT, FINANCIAL_ANALYST_USER_TEMPLATE
from .screening_prompt import DUE_DILIGENCE_SYSTEM_PROMPT, DUE_DILIGENCE_ADJUDICATION_TEMPLATE
from .authoring_prompt import CREDIT_AUTHORING_SYSTEM_PROMPT, CREDIT_AUTHORING_SECTION_TEMPLATES
from .gateway_prompt import UNDERWRITER_COPILOT_SYSTEM_PROMPT, UNDERWRITER_COPILOT_USER_TEMPLATE

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
