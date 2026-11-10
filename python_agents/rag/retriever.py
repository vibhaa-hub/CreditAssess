"""
ApexCredit RAG Retriever
"""

from typing import Dict, List, Any, Optional
import re
from .knowledge_store import KnowledgeStore, KnowledgeChunk

class ApexRAGEngine:
    def __init__(self):
        self.store = KnowledgeStore()

    def retrieve(self, query: str, top_k: int = 3, corpus_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query_tokens = set(re.findall(r"\w+", query.lower()))
        scored_results = []

        for chunk in self.store.chunks:
            if corpus_filter and chunk.source_corpus != corpus_filter:
                continue

            text_tokens = re.findall(r"\w+", (chunk.title + " " + chunk.text + " " + " ".join(chunk.tags)).lower())
            overlap = sum(1 for t in query_tokens if t in text_tokens)
            tag_overlap = sum(2 for t in query_tokens if t in chunk.tags)
            raw_score = overlap + tag_overlap
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

        scored_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_results[:top_k]
