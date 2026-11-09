"""
ApexCredit Multi-Agent System Orchestrator
Coordinates multi-agent workflows, inter-agent messaging, gate evaluations, and telemetry.
"""

import sys
import os
import json
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.intake_triage_agent import IntakeTriageAgent
from agents.financial_analyst_agent import FinancialAnalystAgent
from agents.due_diligence_agent import DueDiligenceScreeningAgent
from agents.gateway_submission_agent import CreditSubmissionGatewayAgent
from models import AgentMessage, ControlGateResult

class CreditMultiAgentOrchestrator:
    def __init__(self):
        self.intake_agent = IntakeTriageAgent()
        self.financial_agent = FinancialAnalystAgent()
        self.screening_agent = DueDiligenceScreeningAgent()
        self.gateway_agent = CreditSubmissionGatewayAgent()

        self.agents = {
            "IntakeTriageAgent": self.intake_agent,
            "FinancialAnalystAgent": self.financial_agent,
            "DueDiligenceScreeningAgent": self.screening_agent,
            "CreditSubmissionGatewayAgent": self.gateway_agent,
        }
        self.message_bus = []
        self.global_audit_trail = []

    def dispatch_message(self, sender: str, recipient: str, action: str, payload: dict):
        msg = AgentMessage(
            message_id=f"MSG-{int(time.time()*1000)%1000000}",
            sender_agent=sender,
            recipient_agent=recipient,
            action_type=action,
            payload=payload
        )
        self.message_bus.append(msg)
        if recipient in self.agents:
            self.agents[recipient].receive_message(msg)
        return msg

    def run_intake_pipeline(self, raw_request: dict) -> dict:
        """Runs DU-01 Autonomous Intake & Triage Pipeline"""
        result = self.intake_agent.run({"raw_incoming_message": raw_request})
        self.dispatch_message(
            sender="IntakeTriageAgent",
            recipient="DueDiligenceScreeningAgent",
            action="case.registered",
            payload={"case_id": result["header"]["case_id"]}
        )
        return result

    def run_financial_pipeline(self, periods: list, exposures: list) -> dict:
        """Runs DU-05 Autonomous Financial Spreading & Ratio Analytics"""
        result = self.financial_agent.run({
            "financial_periods": periods,
            "cross_line_exposures": exposures
        })
        self.dispatch_message(
            sender="FinancialAnalystAgent",
            recipient="CreditSubmissionGatewayAgent",
            action="financials.normalised",
            payload={"gearing": result.get("gearing")}
        )
        return result

    def run_screening_pipeline(self, parties: list, findings: list) -> dict:
        """Runs DU-04 Autonomous Financial Crime & Due Diligence Screening"""
        result = self.screening_agent.run({
            "directors_and_shareholders": parties,
            "screening_findings": findings
        })
        self.dispatch_message(
            sender="DueDiligenceScreeningAgent",
            recipient="CreditSubmissionGatewayAgent",
            action="entity.screened",
            payload={"cra_rating": result.get("customer_risk_assessment", {}).get("cra_rating")}
        )
        return result

    def run_gateway_completeness_check(self, case_context: dict) -> dict:
        """Runs DU-08 Deterministic Completeness Gate & Pack Assembler"""
        return self.gateway_agent.run(case_context)

    def run_full_autonomous_evaluation(self, case_data: dict) -> dict:
        """Executes full orchestrated multi-agent assessment loop"""
        t0 = time.time()
        logs = []

        # Step 1: Intake
        intake_res = self.intake_agent.run({
            "raw_incoming_message": {
                "case_id": case_data.get("caseId"),
                "source": case_data.get("originationSource"),
                "requested_category": case_data.get("classification", {}).get("primaryCategory"),
                "affected_lending_lines": case_data.get("classification", {}).get("affectedLendingLines", [])
            }
        })
        logs.extend(self.intake_agent.execution_history[-4:])

        # Step 2: Financial Spreading
        fin_res = self.financial_agent.run({
            "financial_periods": case_data.get("financialPeriods", []),
            "cross_line_exposures": case_data.get("crossLineExposures", [])
        })
        logs.extend(self.financial_agent.execution_history[-1:])

        # Step 3: Screening
        screen_res = self.screening_agent.run({
            "directors_and_shareholders": case_data.get("directorsAndShareholders", []),
            "screening_findings": case_data.get("screeningFindings", [])
        })
        logs.extend(self.screening_agent.execution_history[-1:])

        # Step 4: Submission Gateway Completeness Gate
        gateway_context = {
            "case_id": case_data.get("caseId"),
            "requirement_checklist": case_data.get("requirementChecklist", []),
            "verification_attested": case_data.get("verificationAttested", False),
            "pricing_signoff": case_data.get("pricingSignoff", {}),
            "narrative_sections": case_data.get("narrativeSections", [])
        }
        gate_res = self.gateway_agent.run(gateway_context)
        logs.extend(self.gateway_agent.execution_history[-2:])

        elapsed_ms = round((time.time() - t0) * 1000, 2)

        return {
            "orchestrator_status": "COMPLETED",
            "execution_time_ms": elapsed_ms,
            "intake_results": intake_res,
            "financial_analytics": fin_res,
            "screening_due_diligence": screen_res,
            "gateway_completeness": gate_res,
            "agent_execution_logs": [log.__dict__ for log in logs],
            "messages_passed_count": len(self.message_bus)
        }

if __name__ == "__main__":
    orchestrator = CreditMultiAgentOrchestrator()
    print("ApexCredit Python Multi-Agent Orchestrator Ready.")
