"""
ApexCredit - Google Agent Development Kit (ADK) Multi-Agent Framework
Implements Google ADK enterprise patterns:
1. Declarative Agent Definition (Instruction, Declarative Tool Registry, Model Config)
2. State Management & Session Context (Shared Session State, Checkpoints, Memory Buffers)
3. Supervisor & Pipeline Orchestrations (Router Agent, Worker Agents)
4. Human-in-the-Loop (HITL) Pause & Resume Checkpoints
5. Strict FCA Compliance Boundaries (BR-G01: AI assists, Human decides)
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Optional, Callable
from enum import Enum
import json
import time
import hashlib

from tools.credit_tools import ToolDefinition, CreditToolRegistry
from prompts import get_prompt_contract

class HITLStatus(str, Enum):
    NOT_REACHED = "NOT_REACHED"
    WAITING_FOR_HUMAN = "WAITING_FOR_HUMAN"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    AMENDED = "AMENDED"

class AgentExecutionState(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    PAUSED_HITL = "PAUSED_HITL"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

@dataclass
class HITLCheckpoint:
    checkpoint_id: str
    name: str
    stage_du: str
    fca_rule: str
    status: HITLStatus = HITLStatus.NOT_REACHED
    required_role: str = "ACCOUNT_MANAGER"
    attestation_prompt: str = ""
    human_signoff_by: Optional[str] = None
    human_signoff_at: Optional[str] = None
    amendments: Optional[str] = None

@dataclass
class SessionState:
    session_id: str
    case_id: str
    dealer_name: str
    global_variables: Dict[str, Any] = field(default_factory=dict)
    agent_memory: Dict[str, List[Dict[str, str]]] = field(default_factory=dict)
    active_checkpoints: Dict[str, HITLCheckpoint] = field(default_factory=dict)
    audit_trail: List[Dict[str, Any]] = field(default_factory=list)

class GoogleADKAgent:
    """
    Google ADK Agent Unit
    Encapsulates instruction, declarative tool schema, state access, and HITL triggers.
    """
    def __init__(
        self,
        name: str,
        role_description: str,
        instruction: str,
        model: str = "gemini-3.8-flash",
        tools: Optional[List[ToolDefinition]] = None,
        hitl_checkpoints: Optional[List[str]] = None,
    ):
        self.name = name
        self.role_description = role_description
        self.instruction = instruction
        self.model = model
        self.tools = tools or []
        self.hitl_checkpoints = hitl_checkpoints or []
        self.execution_state = AgentExecutionState.IDLE

    def to_adk_manifest(self) -> Dict[str, Any]:
        """Exports Google ADK declarative manifest."""
        return {
            "name": self.name,
            "role": self.role_description,
            "model": self.model,
            "instruction": self.instruction,
            "tools": [
                {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.parameters_schema,
                }
                for t in self.tools
            ],
            "hitl_checkpoints": self.hitl_checkpoints,
            "execution_state": self.execution_state.value,
        }

    def execute_turn(
        self,
        user_input: str,
        session: SessionState,
        invoked_tools: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes a single reasoning step or turn for the agent.
        """
        self.execution_state = AgentExecutionState.RUNNING
        start_time = time.time()

        for cp_id in self.hitl_checkpoints:
            cp = session.active_checkpoints.get(cp_id)
            if cp and cp.status == HITLStatus.WAITING_FOR_HUMAN:
                self.execution_state = AgentExecutionState.PAUSED_HITL
                return {
                    "agent": self.name,
                    "status": "PAUSED_HITL",
                    "checkpoint": asdict(cp),
                    "message": f"Execution paused for mandatory human attestation at checkpoint {cp.name} ({cp.fca_rule}).",
                }

        tool_results = []
        for t in self.tools:
            if invoked_tools and t.name in invoked_tools:
                tool_results.append({
                    "tool": t.name,
                    "status": "SUCCESS",
                    "output": f"Deterministic execution of tool {t.name} completed under session {session.session_id}."
                })

        duration_ms = int((time.time() - start_time) * 1000)
        self.execution_state = AgentExecutionState.COMPLETED

        record = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "agent": self.name,
            "model": self.model,
            "duration_ms": duration_ms,
            "turn_summary": f"{self.name} completed turn with {len(tool_results)} tool calls.",
        }
        session.audit_trail.append(record)

        return {
            "agent": self.name,
            "status": "COMPLETED",
            "model": self.model,
            "tool_calls": tool_results,
            "duration_ms": duration_ms,
            "session_id": session.session_id,
        }


class GoogleADKOrchestrator:
    """
    Google ADK Multi-Agent Orchestrator
    Manages session state, Supervisor Router, Worker Agents, and HITL Lifecycle.
    """
    def __init__(self):
        self.agents: Dict[str, GoogleADKAgent] = {}
        self.sessions: Dict[str, SessionState] = {}
        self._initialize_core_adk_agents()

    def _initialize_core_adk_agents(self):
        all_tools = CreditToolRegistry.get_all_tools()
        tool_map = {t.name: t for t in all_tools}

        intake_contract = get_prompt_contract("intake_triage")
        fin_contract = get_prompt_contract("financial_analyst")
        fcc_contract = get_prompt_contract("due_diligence")
        authoring_contract = get_prompt_contract("credit_authoring")
        gateway_contract = get_prompt_contract("underwriter_copilot")

        # 1. Intake Agent
        self.agents["intake"] = GoogleADKAgent(
            name="ADK_IntakeTriageAgent",
            role_description="Origination Intake & Statutory 7 Category Classification",
            instruction=intake_contract["system"] if intake_contract else "Classify intake.",
            tools=[tool_map["classify_case_category"], tool_map["derive_dt1_checklist"]],
            hitl_checkpoints=["HITL_INTAKE_APPROVAL"]
        )

        # 2. Financial Analyst Agent
        self.agents["financials"] = GoogleADKAgent(
            name="ADK_FinancialAnalystAgent",
            role_description="Financial Normalization, Ratio Computation & Headroom Analysis",
            instruction=fin_contract["system"] if fin_contract else "Analyze financials.",
            tools=[tool_map["compute_calcs_deterministic"], tool_map["validate_cashflow_invariant"]],
            hitl_checkpoints=[]
        )

        # 3. Due Diligence Agent
        self.agents["screening"] = GoogleADKAgent(
            name="ADK_DueDiligenceAgent",
            role_description="Financial Crime Compliance, Sanctions Screening & CRA Rating",
            instruction=fcc_contract["system"] if fcc_contract else "Screen AML.",
            tools=[tool_map["screen_watchlists_parallel"], tool_map["evaluate_dt3_disposition"]],
            hitl_checkpoints=["HITL_FCC_DISPOSITION"]
        )

        # 4. Credit Authoring Agent
        self.agents["authoring"] = GoogleADKAgent(
            name="ADK_CreditAuthoringAgent",
            role_description="Commentary Drafting with Cell Lineage & Non-Human Content Watermarking",
            instruction=authoring_contract["system"] if authoring_contract else "Draft commentary.",
            tools=[],
            hitl_checkpoints=["HITL_AM_NARRATIVE_ATTESTATION"]
        )

        # 5. Gateway Submission Agent
        self.agents["gateway"] = GoogleADKAgent(
            name="ADK_GatewaySubmissionAgent",
            role_description="Deterministic Completeness Gate & Underwriting Handoff",
            instruction=gateway_contract["system"] if gateway_contract else "Gateway check.",
            tools=[tool_map["evaluate_dt2_gate"], tool_map["seal_worm_snapshot"]],
            hitl_checkpoints=["HITL_CREDIT_UNDERWRITER_DECISION"]
        )

    def create_session(self, case_id: str, dealer_name: str) -> SessionState:
        session_id = f"adk-sess-{int(time.time())}-{hashlib.md5(case_id.encode()).hexdigest()[:6]}"
        session = SessionState(
            session_id=session_id,
            case_id=case_id,
            dealer_name=dealer_name,
            active_checkpoints={
                "HITL_INTAKE_APPROVAL": HITLCheckpoint(
                    checkpoint_id="HITL_INTAKE_APPROVAL",
                    name="Intake Requirement Set Confirmation",
                    stage_du="DU-01",
                    fca_rule="Control Gate IBVC-01-G1",
                    status=HITLStatus.APPROVED,
                    required_role="ACCOUNT_MANAGER",
                    attestation_prompt="Confirm statutory request category and assigned case owner."
                ),
                "HITL_FCC_DISPOSITION": HITLCheckpoint(
                    checkpoint_id="HITL_FCC_DISPOSITION",
                    name="FCC Reasoned Alert Disposition",
                    stage_du="DU-04",
                    fca_rule="FCA SYSC 6.3 / Rule BR-P03",
                    status=HITLStatus.WAITING_FOR_HUMAN,
                    required_role="FCC_ANALYST",
                    attestation_prompt="Provide reasoned rationale for clearing or escalating screening hits."
                ),
                "HITL_AM_NARRATIVE_ATTESTATION": HITLCheckpoint(
                    checkpoint_id="HITL_AM_NARRATIVE_ATTESTATION",
                    name="Account Manager Narrative Attestation",
                    stage_du="DU-06",
                    fca_rule="FCA PR-02 / Rule BR-U01",
                    status=HITLStatus.WAITING_FOR_HUMAN,
                    required_role="ACCOUNT_MANAGER",
                    attestation_prompt="Attest that AI-assisted commentary is verified against primary financial records."
                ),
                "HITL_FOUR_EYES_PRICING": HITLCheckpoint(
                    checkpoint_id="HITL_FOUR_EYES_PRICING",
                    name="Four-Eyes Pricing Authorization",
                    stage_du="DU-07",
                    fca_rule="FCA SYSC 4.3.1R / Rule BR-E02",
                    status=HITLStatus.APPROVED,
                    required_role="COMMERCIAL_MANAGER",
                    attestation_prompt="Counter-sign facility margin and collateral valuation haircuts."
                ),
                "HITL_CREDIT_UNDERWRITER_DECISION": HITLCheckpoint(
                    checkpoint_id="HITL_CREDIT_UNDERWRITER_DECISION",
                    name="Independent Underwriting Decision",
                    stage_du="DU-08",
                    fca_rule="Rule BR-G01 / REQ-067",
                    status=HITLStatus.WAITING_FOR_HUMAN,
                    required_role="CREDIT_UNDERWRITER",
                    attestation_prompt="Record independent binding credit decision and execute Conditions Precedent."
                )
            }
        )
        self.sessions[session_id] = session
        return session

    def list_all_agents(self) -> List[Dict[str, Any]]:
        return [a.to_adk_manifest() for a in self.agents.values()]

    def run_full_pipeline(self, session_id: str) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session:
            session = self.create_session("CASE-APX-2026-0891", "Apex Motor Group Limited")
            session_id = session.session_id

        pipeline_results = []
        for agent_key, agent in self.agents.items():
            res = agent.execute_turn(
                user_input=f"Execute {agent.name} evaluation for {session.dealer_name}",
                session=session,
                invoked_tools=[t.name for t in agent.tools]
            )
            pipeline_results.append(res)
            if res.get("status") == "PAUSED_HITL":
                break

        return {
            "session_id": session_id,
            "case_id": session.case_id,
            "dealer_name": session.dealer_name,
            "pipeline_status": "PAUSED_FOR_HITL" if any(r.get("status") == "PAUSED_HITL" for r in pipeline_results) else "COMPLETED",
            "agent_runs": pipeline_results,
            "active_checkpoints": {k: asdict(v) for k, v in session.active_checkpoints.items()},
            "audit_trail": session.audit_trail,
        }

    def record_hitl_signoff(
        self,
        session_id: str,
        checkpoint_id: str,
        decision: str,
        user_id: str,
        amendments: Optional[str] = None
    ) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session or checkpoint_id not in session.active_checkpoints:
            return {"error": "Invalid session or checkpoint ID"}

        cp = session.active_checkpoints[checkpoint_id]
        cp.status = HITLStatus.APPROVED if decision == "APPROVE" else HITLStatus.REJECTED
        cp.human_signoff_by = user_id
        cp.human_signoff_at = time.strftime("%Y-%m-%d %H:%M:%S")
        cp.amendments = amendments

        session.audit_trail.append({
            "timestamp": cp.human_signoff_at,
            "type": "HITL_SIGNOFF_RECORDED",
            "checkpoint_id": checkpoint_id,
            "decision": decision,
            "user_id": user_id,
            "amendments": amendments,
        })

        return {
            "status": "SUCCESS",
            "checkpoint_id": checkpoint_id,
            "updated_checkpoint": asdict(cp),
            "message": f"Human-in-the-loop attestation committed by {user_id}. Pipeline resumed.",
        }
