"""Retrieval over bank-approved source chunks supplied by the caller."""

from dataclasses import dataclass
from typing import Dict, List, Any, Optional
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
    """Search only explicitly supplied source chunks; no demo policy corpus is bundled."""
    def __init__(self, chunks: Optional[List[KnowledgeChunk]] = None):
        self.chunks = list(chunks) if chunks is not None else []

    def retrieve(self, query: str, top_k: int = 3, corpus_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return supplied chunks ranked by token-set Jaccard similarity."""
        if top_k <= 0:
            return []

        query_tokens = set(re.findall(r"\w+", query.lower()))
        scored_results = []

        for chunk in self.chunks:
            if corpus_filter and chunk.source_corpus != corpus_filter:
                continue

            # Calculate token overlap score with tag weighting
            text = chunk.title + " " + chunk.text + " " + " ".join(chunk.tags)
            chunk_tokens = set(re.findall(r"\w+", text.lower()))
            union = query_tokens | chunk_tokens
            similarity = len(query_tokens & chunk_tokens) / len(union) if union else 0.0

            if similarity > 0:
                scored_results.append({
                    "chunk_id": chunk.chunk_id,
                    "source_corpus": chunk.source_corpus,
                    "title": chunk.title,
                    "section_ref": chunk.section_ref,
                    "text": chunk.text,
                    "citation": chunk.provenance_citation,
                    "relevance_score": round(similarity, 3),
                    "tags": chunk.tags,
                })

        # Sort by relevance score descending
        scored_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_results[:top_k]
