"""
Base Agent Abstract Class for ApexCredit Multi-Agent System
Provides communication, audit record generation, and rule assertion capabilities.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import time
import hashlib
from models import AutonomyLevel, AgentMessage, AgentExecutionLog

class BaseCreditAgent(ABC):
    def __init__(
        self,
        name: str,
        role: str,
        deployable_unit: str,
        autonomy: AutonomyLevel = AutonomyLevel.AUTONOMOUS
    ):
        self.name = name
        self.role = role
        self.deployable_unit = deployable_unit
        self.autonomy = autonomy
        self.execution_history: List[AgentExecutionLog] = []
        self.inbox: List[AgentMessage] = []

    def receive_message(self, message: AgentMessage):
        self.inbox.append(message)

    def log_activity(
        self,
        activity_name: str,
        rules_enforced: List[str],
        inputs: Dict[str, Any],
        outputs: Dict[str, Any],
        details: str,
        status: str = "SUCCESS"
    ) -> AgentExecutionLog:
        timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
        log = AgentExecutionLog(
            agent_name=self.name,
            deployable_unit=self.deployable_unit,
            activity_name=activity_name,
            autonomy=self.autonomy,
            rules_enforced=rules_enforced,
            inputs=inputs,
            outputs=outputs,
            status=status,
            details=details,
            timestamp=timestamp_str
        )
        self.execution_history.append(log)
        return log

    @abstractmethod
    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent main workflow against shared case context."""
        pass
