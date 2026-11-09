"""
ApexCredit Multi-Agent CLI Gateway
Callable from Python or Node.js backend to execute multi-agent pipelines.
"""

import sys
import os
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from orchestrator import CreditMultiAgentOrchestrator

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified. Usage: python agent_cli.py <command> [json_payload]"}))
        sys.exit(1)

    command = sys.argv[1]
    raw_payload = sys.argv[2] if len(sys.argv) > 2 else "{}"

    try:
        payload = json.loads(raw_payload) if raw_payload.strip() else {}
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON payload: {str(e)}"}))
        sys.exit(1)

    orchestrator = CreditMultiAgentOrchestrator()

    if command == "list-agents":
        agents_info = [
            {
                "name": "IntakeTriageAgent",
                "deployable_unit": "DU-01 RequestIntakeAndTriageUnit",
                "autonomy": "Autonomous",
                "activities": ["RegisterCreditRequest", "ClassifyCaseType", "AssignAccountableOwner", "ResolveRequirementSetChecklist"],
                "rules": ["REQ-001..007", "DT-1", "BR-G02", "BR-E01"]
            },
            {
                "name": "DueDiligenceScreeningAgent",
                "deployable_unit": "DU-04 DueDiligenceScreeningUnit",
                "autonomy": "Autonomous",
                "activities": ["ExecuteSanctionsScreening", "PerformPartyIDAndVerification", "ExecuteKYCAndAMLChecks", "ProduceCustomerRiskAssessment"],
                "rules": ["REQ-025..037", "DT-3", "LR-01..03", "BR-D02", "BR-P03"]
            },
            {
                "name": "FinancialAnalystAgent",
                "deployable_unit": "DU-05 FinancialSpreadingAnalysisUnit",
                "autonomy": "Autonomous",
                "activities": ["NormaliseFinancialStatements", "ValidateStatementReconciliation", "CalculateCreditRatios", "AggregateCrossLineBorrowingProfile"],
                "rules": ["REQ-038..045", "CALC-001..010", "BR-D04..06"]
            },
            {
                "name": "CreditSubmissionGatewayAgent",
                "deployable_unit": "DU-08 CreditSubmissionGatewayUnit",
                "autonomy": "Autonomous",
                "activities": ["AssembleDecisionReadyCreditPack", "ExecuteDeterministicCompletenessGate", "GenerateImmutableSnapshotAndTransmit"],
                "rules": ["REQ-060..067", "CALC-011", "DT-2", "BR-P04", "BR-P05"]
            }
        ]
        print(json.dumps({"status": "SUCCESS", "agents": agents_info}))
        return

    elif command == "evaluate-all":
        result = orchestrator.run_full_autonomous_evaluation(payload)
        print(json.dumps(result))
        return

    elif command == "run-intake":
        result = orchestrator.run_intake_pipeline(payload)
        print(json.dumps(result))
        return

    elif command == "run-financials":
        periods = payload.get("financial_periods", [])
        exposures = payload.get("cross_line_exposures", [])
        result = orchestrator.run_financial_pipeline(periods, exposures)
        print(json.dumps(result))
        return

    elif command == "run-screening":
        parties = payload.get("directors_and_shareholders", [])
        findings = payload.get("screening_findings", [])
        result = orchestrator.run_screening_pipeline(parties, findings)
        print(json.dumps(result))
        return

    elif command == "run-gateway":
        result = orchestrator.run_gateway_completeness_check(payload)
        print(json.dumps(result))
        return

    elif command == "list-prompts":
        import prompts
        keys = list(prompts.PROMPT_REGISTRY.keys())
        print(json.dumps({"status": "SUCCESS", "prompts": keys}))
        return

    elif command == "get-prompt":
        import prompts
        agent_key = payload.get("agent_key", "financial_analyst")
        contract = prompts.get_prompt_contract(agent_key)
        print(json.dumps({"status": "SUCCESS", "agent_key": agent_key, "contract": contract}))
        return

    # Google ADK Framework Commands
    elif command == "adk-list":
        from google_adk import GoogleADKOrchestrator
        adk_orch = GoogleADKOrchestrator()
        print(json.dumps({"status": "SUCCESS", "adk_agents": adk_orch.list_all_agents()}))
        return

    elif command == "adk-run":
        from google_adk import GoogleADKOrchestrator
        adk_orch = GoogleADKOrchestrator()
        session_id = payload.get("session_id", "default_sess")
        res = adk_orch.run_full_pipeline(session_id)
        print(json.dumps(res))
        return

    elif command == "adk-hitl-signoff":
        from google_adk import GoogleADKOrchestrator
        adk_orch = GoogleADKOrchestrator()
        session_id = payload.get("session_id", "default_sess")
        cp_id = payload.get("checkpoint_id", "HITL_AM_NARRATIVE_ATTESTATION")
        decision = payload.get("decision", "APPROVE")
        user_id = payload.get("user_id", "Certified_Account_Manager")
        amendments = payload.get("amendments")
        res = adk_orch.record_hitl_signoff(session_id, cp_id, decision, user_id, amendments)
        print(json.dumps(res))
        return

    # Deterministic Rule Engine DSL Command
    elif command == "rule-engine-eval":
        from rule_engine_dsl import ApexRuleEngineDSL
        dsl = ApexRuleEngineDSL()
        res = dsl.evaluate_case_facts(payload)
        print(json.dumps(res))
        return

    # Docling & OCR Ingestion Command
    elif command == "docling-extract":
        from doc_extractor import DoclingExtractionEngine
        doc_engine = DoclingExtractionEngine()
        filename = payload.get("filename", "ApexMotorGroup_FY24_Accounts.pdf")
        category = payload.get("doc_category", "FINANCIAL_ACCOUNTS")
        res = doc_engine.extract_document(filename, category)
        from dataclasses import asdict
        print(json.dumps(asdict(res)))
        return

    # RAG (Retrieval-Augmented Generation) Search Command
    elif command == "rag-search":
        from rag_engine import ApexRAGEngine
        rag = ApexRAGEngine()
        query = payload.get("query", "creditworthiness and gearing")
        top_k = payload.get("top_k", 3)
        corpus = payload.get("corpus_filter")
        results = rag.retrieve(query, top_k, corpus)
        print(json.dumps({"status": "SUCCESS", "query": query, "retrieved_chunks": results}))
        return

    else:
        print(json.dumps({"error": f"Unknown command '{command}'"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
