import hashlib
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent_cli import AVAILABLE_COMMANDS, _dispatch
from agents.due_diligence_agent import DueDiligenceScreeningAgent
from agents.financial_analyst_agent import FinancialAnalystAgent
from agents.gateway_submission_agent import CreditSubmissionGatewayAgent
from agents.intake_triage_agent import IntakeTriageAgent
from doc_extractor import DoclingExtractionEngine, DocumentExtractionError
from rag_engine import ApexRAGEngine, KnowledgeChunk


class CsvExtractionTests(unittest.TestCase):
    def setUp(self):
        self.engine = DoclingExtractionEngine()

    def test_extracts_uploaded_csv_with_provenance_and_no_semantic_claims(self):
        content = b'period,revenue,comment\n2025,"1,234.50",accounts supplied\n'
        result = self.engine.extract_document("accounts.csv", content)

        self.assertEqual(result.doc_format, "CSV")
        self.assertEqual(result.row_count, 1)
        self.assertEqual(result.provenance_hash, hashlib.sha256(content).hexdigest())
        self.assertEqual(result.extracted_metadata["semantic_mapping"], "NOT_PERFORMED")
        self.assertEqual(result.extracted_metadata["document_verification"], "NOT_PERFORMED")

    def test_rejects_unsupported_document_formats(self):
        with self.assertRaisesRegex(DocumentExtractionError, "Only CSV"):
            self.engine.extract_document("accounts.pdf", b"%PDF-")

    def test_rejects_documents_over_size_limit(self):
        content = b"x" * (2 * 1024 * 1024 + 1)
        with self.assertRaisesRegex(DocumentExtractionError, "2 MB"):
            self.engine.extract_document("large.csv", content)

    def test_rejects_csv_without_headers(self):
        with self.assertRaisesRegex(DocumentExtractionError, "header row"):
            self.engine.extract_document("empty.csv", b"\n")


class AgentBoundaryTests(unittest.TestCase):
    def test_retrieval_has_no_bundled_corpus_and_scores_supplied_sources(self):
        self.assertEqual(ApexRAGEngine().retrieve("credit policy"), [])
        chunk = KnowledgeChunk(
            chunk_id="approved-1",
            source_corpus="BANK_POLICY",
            title="Bank policy",
            section_ref="1",
            text="Approved conditions",
            provenance_citation="policy.pdf page 1",
            tags=[],
        )
        result = ApexRAGEngine([chunk]).retrieve("bank policy")
        self.assertEqual(result[0]["citation"], "policy.pdf page 1")
        self.assertEqual(result[0]["relevance_score"], 0.5)

    def test_intake_does_not_invent_owner_or_checklist(self):
        result = IntakeTriageAgent().run({
            "raw_incoming_message": {
                "case_id": "case-1",
                "source": "DEALER_DIRECT",
                "requested_category": "NEW_RELATIONSHIP",
                "affected_lending_lines": ["WHOLESALE"],
            },
            "roster": {},
        })

        self.assertEqual(result["status"], "INCOMPLETE")
        self.assertEqual(result["assignment"]["status"], "NOT_ASSIGNED")
        self.assertEqual(result["requirement_checklist"], [])
        self.assertFalse(result["control_gate_IBVC_01_G1"]["passed"])

    def test_screening_requires_provider_and_does_not_issue_risk_rating(self):
        result = DueDiligenceScreeningAgent().run({
            "directors_and_shareholders": [{"name": "Example", "sanctionsHit": "CLEAR"}],
            "screening_findings": [],
        })

        self.assertEqual(result["status"], "SCREENING_PROVIDER_NOT_CONFIGURED")
        self.assertEqual(result["sanctions_outcome"]["provider_status"], "NOT_CONFIGURED")
        self.assertEqual(result["customer_risk_assessment"]["status"], "NOT_PRODUCED")
        self.assertFalse(result["control_gate_IBVC_01_G2"]["passed"])

    def test_gateway_never_creates_submission_snapshot(self):
        result = CreditSubmissionGatewayAgent().run({
            "case_id": "case-1",
            "requirement_checklist": [{"name": "Accounts", "mandatory": True, "satisfied": True}],
        })

        self.assertEqual(result["status"], "GATEWAY_NOT_CONFIGURED")
        self.assertFalse(result["completeness_gate"]["checklist_complete"])
        self.assertIsNone(result["snapshot"])

    def test_financial_agent_reports_missing_data_instead_of_defaulting(self):
        result = FinancialAnalystAgent().run({"financial_periods": [{"turnover": 100}]})
        self.assertEqual(result["status"], "INCOMPLETE_INPUT")
        self.assertIsNone(result["analysis"])
        self.assertIn("interestCharge", result["missing_fields"])

    def test_invalid_denominators_are_not_reported_as_ratios(self):
        agent = FinancialAnalystAgent()
        self.assertEqual(agent.calculate_gearing(10, 0)["value"], "not meaningful")
        self.assertEqual(agent.calculate_current_ratio(10, 0)["value"], "not calculable")
        self.assertIsNone(agent.calculate_interest_cover(10, 0)["value"])

    def test_single_period_and_missing_exposure_are_not_reported_as_zero(self):
        period = {
            "turnover": 100,
            "costOfSales": 60,
            "ebit": 10,
            "interestCharge": 2,
            "netProfit": 8,
            "totalBorrowings": 20,
            "netAssets": 40,
            "currentAssets": 25,
            "currentLiabilities": 10,
            "inventory": 12,
            "openingCash": 1,
            "operatingCashflow": 2,
            "investingCashflow": -1,
            "financingCashflow": 0,
            "closingCash": 2,
        }
        result = FinancialAnalystAgent().run({
            "financial_periods": [period],
            "cross_line_exposures": [],
        })

        self.assertIsNone(result["revenue_yoy_pct"])
        self.assertIsNone(result["stock_days"])
        self.assertEqual(result["exposure_data_status"], "NOT_SUPPLIED")
        self.assertIsNone(result["total_facility_limit"])

    def test_facility_headroom_preserves_over_limit_exposure(self):
        result = FinancialAnalystAgent().calculate_facility_utilization(150, 100)
        self.assertEqual(result["headroom"], -50)
        self.assertEqual(result["utilization_pct"], 150)

    def test_cli_allowlist_excludes_unavailable_prototype_workflows(self):
        self.assertEqual(
            AVAILABLE_COMMANDS,
            {"list-agents", "evaluate-all", "docling-extract"},
        )
        with self.assertRaisesRegex(ValueError, "unavailable"):
            _dispatch("risk-model-eval", {})
        with self.assertRaisesRegex(ValueError, "unavailable"):
            _dispatch("rag-search", {})


if __name__ == "__main__":
    unittest.main()
