"""
ApexCredit Python Multi-Agent Domain Models & Data Structures
AST-aligned definitions for CreditPackAssessmentProcess
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any
from enum import Enum
import json
import time
import hashlib

class AutonomyLevel(str, Enum):
    AUTONOMOUS = "Autonomous"
    HUMAN_IN_THE_LOOP = "Human-in-the-Loop"
    SUPERVISED = "Supervised"

class RequestCategory(str, Enum):
    NEW_RELATIONSHIP = "NEW_RELATIONSHIP"
    NEW_FRANCHISE = "NEW_FRANCHISE"
    INCREASED_BORROWING = "INCREASED_BORROWING"
    ACQUISITION = "ACQUISITION"
    DISPOSAL = "DISPOSAL"
    DIRECTOR_SHAREHOLDER_CHANGE = "DIRECTOR_SHAREHOLDER_CHANGE"
    PERIODIC_REVIEW = "PERIODIC_REVIEW"

class LendingLine(str, Enum):
    WHOLESALE = "WHOLESALE"
    FRANCHISE = "FRANCHISE"
    FLEET = "FLEET"
    RETAIL = "RETAIL"

class CRARating(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class UnderwritingOutcome(str, Enum):
    PENDING = "PENDING"
    QUERY_RAISED = "QUERY_RAISED"
    APPROVED = "APPROVED"
    APPROVED_WITH_CONDITIONS = "APPROVED_WITH_CONDITIONS"
    DECLINED = "DECLINED"

@dataclass
class AgentMessage:
    message_id: str
    sender_agent: str
    recipient_agent: str
    action_type: str
    payload: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)

@dataclass
class AgentExecutionLog:
    agent_name: str
    deployable_unit: str
    activity_name: str
    autonomy: AutonomyLevel
    rules_enforced: List[str]
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    status: str
    details: str
    timestamp: str

@dataclass
class ControlGateResult:
    gate_id: str
    passed: bool = False
    condition_description: str = ""
    blocking_reasons: List[str] = field(default_factory=list)
    advisory_notes: List[str] = field(default_factory=list)
