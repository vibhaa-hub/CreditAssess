"""
ApexCredit Knowledge Store (RAG Corpus)
"""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class KnowledgeChunk:
    chunk_id: str
    source_corpus: str
    title: str
    section_ref: str
    text: str
    provenance_citation: str
    tags: List[str]

class KnowledgeStore:
    def __init__(self):
        self.chunks: List[KnowledgeChunk] = []
        self._load_corpus()

    def _load_corpus(self):
        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-FCA-CONC-5-2A",
            source_corpus="FCA_HANDBOOK",
            title="FCA CONC 5.2A: Creditworthiness & Affordability Assessment",
            section_ref="CONC 5.2A.4 R",
            text="A firm must undertake a reasonable assessment of the creditworthiness of a customer before entering into a regulated credit agreement or significantly increasing an existing credit limit.",
            provenance_citation="[SRC: FCA-Handbook-CONC-5.2A]",
            tags=["affordability", "creditworthiness", "facility_uplift", "capacity"]
        ))
        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-FCA-SYSC-6-3",
            source_corpus="FCA_HANDBOOK",
            title="FCA SYSC 6.3: Financial Crime Systems & Controls",
            section_ref="SYSC 6.3.1 R",
            text="A firm must ensure that its policies and procedures include systems and controls for identifying, assessing, monitoring and managing financial crime risk.",
            provenance_citation="[SRC: FCA-Handbook-SYSC-6.3]",
            tags=["financial_crime", "aml", "sanctions", "mlro", "due_diligence"]
        ))
        self.chunks.append(KnowledgeChunk(
            chunk_id="RAG-POL-BR-G01",
            source_corpus="CREDIT_POLICY",
            title="Policy Rule BR-G01: Prohibition of Autonomous AI Credit Approvals",
            section_ref="Credit Policy Manual Section 2.1",
            text="Artificial intelligence models, agents, and algorithmic assistants are strictly confined to drafting commentary and extracting data. All final credit approvals are reserved exclusively for certified human Underwriters.",
            provenance_citation="[SRC: CreditPolicy-BR-G01]",
            tags=["ai_governance", "br_g01", "human_in_loop", "underwriter_authority"]
        ))
