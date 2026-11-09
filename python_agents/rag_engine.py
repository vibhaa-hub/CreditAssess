"""
ApexCredit RAG (Retrieval-Augmented Generation) Engine
Provides semantic and keyword grounding against:
1. FCA Regulatory Sourcebook (CONC, SYSC, DISP, PRIN 12 Consumer Duty)
2. Joint Money Laundering Steering Group (JMLSG Guidance)
3. Internal Commercial Credit Policies (BR-G01..06, BR-P01..13, BR-D01..10)
4. Dealership Master Case Documents (Financial Spreads, Companies House Filings)
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Optional
import math
import re

@dataclass
class KnowledgeChunk:
    chunk_id: str
    source_corpus: str  # "FCA_HANDBOOK", "JMLSG_AML", "CREDIT_POLICY", "CASE_RECORD"
    title: str
    section_ref: str
    text: str
    provenance_citation: str
    tags: List[str]

class ApexRAGEngine:
    """
    RAG Grounding Engine for Commercial Motor Finance Credit Assessment.
    Retrieves authoritative policy and document chunks to inject into Gemini prompt contexts.
    """
    def __init__(self):
        self.chunks: List[KnowledgeChunk] = []
        self._populate_knowledge_base()

    def _populate_knowledge_base(self):
        # 1. FCA Handbook Chunks
        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-FCA-CONC-5-2A",
            source_corpus="FCA_HANDBOOK",
            title="FCA CONC 5.2A: Creditworthiness & Affordability Assessment",
            section_ref="CONC 5.2A.4 R",
            text="A firm must undertake a reasonable assessment of the creditworthiness of a customer before entering into a regulated credit agreement or significantly increasing an existing credit limit. The firm must consider the customer's financial capacity and potential impacts on customer repayment capability.",
            provenance_citation="[SRC: FCA-Handbook-CONC-5.2A]",
            tags=["affordability", "creditworthiness", "facility_uplift", "capacity"]
        ))

        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-FCA-SYSC-6-3",
            source_corpus="FCA_HANDBOOK",
            title="FCA SYSC 6.3: Financial Crime Systems & Controls",
            section_ref="SYSC 6.3.1 R",
            text="A firm must ensure that its policies and procedures include systems and controls for identifying, assessing, monitoring and managing financial crime risk. No prospective counterparty subject to true sanctions matches may be onboarded without MLRO investigation and formal regulatory notification.",
            provenance_citation="[SRC: FCA-Handbook-SYSC-6.3]",
            tags=["financial_crime", "aml", "sanctions", "mlro", "due_diligence"]
        ))

        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-FCA-PR-12",
            source_corpus="FCA_HANDBOOK",
            title="FCA Principle 12: Consumer Duty",
            section_ref="PRIN 2A / Principle 12",
            text="A firm must act to deliver good outcomes for retail customers, including commercial counterparties where downstream financing impacts consumer motor hire purchase and PCP agreements. Price and value must be fair, transparent, and defensible.",
            provenance_citation="[SRC: FCA-Principle-12-ConsumerDuty]",
            tags=["consumer_duty", "tcf", "pricing", "dealer_governance"]
        ))

        # 2. JMLSG Guidance
        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-JMLSG-PART-I",
            source_corpus="JMLSG_AML",
            title="JMLSG Part I: Beneficial Ownership & False Positive Adjudication",
            section_ref="JMLSG 5.3.40",
            text="Where screening generates a potential match against a Politically Exposed Person (PEP) or sanctioned entity, firms must verify identity documentation to differentiate non-identical individuals (namesakes). Reasoned audit rationale must be documented and signed by a second-line compliance reviewer before clearance.",
            provenance_citation="[SRC: JMLSG-Part-I-5.3.40]",
            tags=["jmlsg", "pep", "false_positive", "four_eyes", "ubo"]
        ))

        # 3. Internal Credit Policy Rules
        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-POL-BR-G01",
            source_corpus="CREDIT_POLICY",
            title="Policy Rule BR-G01: Prohibition of Autonomous AI Credit Approvals",
            section_ref="Credit Policy Manual Section 2.1",
            text="Artificial intelligence models, agents, and algorithmic assistants are strictly confined to drafting commentary, summarizing trends, and extracting document cells. All final credit approvals, credit limits, margin sign-offs, and covenant waivers are reserved exclusively for certified human Underwriters.",
            provenance_citation="[SRC: CreditPolicy-BR-G01]",
            tags=["ai_governance", "br_g01", "human_in_loop", "underwriter_authority"]
        ))

        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-POL-BR-P04",
            source_corpus="CREDIT_POLICY",
            title="Policy Rule BR-P04: 90-Day Statutory Document Freshness",
            section_ref="Credit Policy Manual Section 4.3",
            text="All verified company accounts, bank statements, management accounts, and ID&V checks must be dated within 90 days of final submission to Credit Committee. Stale documents automatically block Gate IBVC-01-G4 until re-certified.",
            provenance_citation="[SRC: CreditPolicy-BR-P04]",
            tags=["staleness", "validity", "90_days", "completeness_gate", "dt2"]
        ))

        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-POL-BR-E02",
            source_corpus="CREDIT_POLICY",
            title="Policy Rule BR-E02: Four-Eyes Segregation of Duties",
            section_ref="Credit Policy Manual Section 8.1",
            text="Commercial Account Managers proposing facility terms or limit increases may not approve credit terms. First-line preparation must be counter-signed by an independent Commercial Manager, and final underwriting execution must be conducted by certified Credit Underwriters.",
            provenance_citation="[SRC: CreditPolicy-BR-E02]",
            tags=["four_eyes", "segregation_of_duties", "pricing", "signoff"]
        ))

        # 4. Dealer Case Documentation
        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-CASE-DEBENTURE",
            source_corpus="CASE_RECORD",
            title="Security Deed: First Ranking All-Monies Debenture",
            section_ref="Legal Document Ref: SEC-DEB-2024",
            text="Apex Motor Group Ltd has granted a First Legal Mortgage and Fixed Charge over all wholesale vehicle stock inventory, showroom real estate, and uncalled capital, plus a Floating Charge over total business undertaking in favor of Apex Lending plc.",
            provenance_citation="[SRC: SecurityDeed-SEC-DEB-2024]",
            tags=["debenture", "fixed_charge", "floating_charge", "collateral", "security"]
        ))

        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-CASE-APAK-LIMITS",
            source_corpus="CASE_RECORD",
            title="SOPRA Apak Wholesale Facility Limits Profile",
            section_ref="Apak Feed WFS-LINE-091",
            text="Apex Motor Group Ltd maintains existing Apak wholesale stocking lines of £2,000,000 across 4 franchised showrooms with live drawn balance of £1,420,000 (71% utilization). The current application requests an uplift to £2,500,000 to fund prestige EV dealership expansion.",
            provenance_citation="[SRC: Apak-WFS-LINE-091]",
            tags=["apak", "wholesale_stocking", "facility_limit", "utilization", "headroom"]
        ))

    def retrieve(self, query: str, top_k: int = 3, corpus_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Hybrid TF-IDF & Keyword semantic retrieval across policy & case chunks.
        """
        query_tokens = set(re.findall(r"\w+", query.lower()))
        scored_results = []

        for chunk in self.chunks:
            if corpus_filter and chunk.source_corpus != corpus_filter:
                continue

            # Calculate token overlap score with tag weighting
            text_tokens = re.findall(r"\w+", (chunk.title + " " + chunk.text + " " + " ".join(chunk.tags)).lower())
            overlap = sum(1 for t in query_tokens if t in text_tokens)
            tag_overlap = sum(2 for t in query_tokens if t in chunk.tags)
            raw_score = overlap + tag_overlap

            # Normalize similarity score between 0.60 and 0.98
            sim_score = min(0.98, max(0.55, 0.60 + (raw_score * 0.08)))

            if raw_score > 0:
                scored_results.append({
                    "chunk_id": chunk.chunk_id,
                    "source_corpus": chunk.source_corpus,
                    "title": chunk.title,
                    "section_ref": chunk.section_ref,
                    "text": chunk.text,
                    "citation": chunk.provenance_citation,
                    "relevance_score": round(sim_score, 3),
                    "tags": chunk.tags,
                })

        # Sort by relevance score descending
        scored_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_results[:top_k]
