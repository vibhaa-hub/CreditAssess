"""Extract source-preserving rows from uploaded CSV documents.

This module intentionally does not infer financial meaning, verify documents, or
pretend to parse PDFs/images. Those capabilities require a separately validated
parser and evidence workflow.
"""

from __future__ import annotations

import csv
import hashlib
import io
import uuid
from dataclasses import asdict, dataclass
from decimal import Decimal, InvalidOperation
from pathlib import PurePath
from typing import Any


MAX_DOCUMENT_BYTES = 2 * 1024 * 1024
MAX_ROWS = 2_000
MAX_COLUMNS = 100
MAX_CELL_CHARS = 20_000


class DocumentExtractionError(ValueError):
    """Raised when a document is unsupported or exceeds safe parser limits."""


@dataclass(frozen=True)
class ExtractedCell:
    row_idx: int
    col_idx: int
    header: str
    raw_text: str
    normalized_value: str | None
    confidence: None = None
    bbox: None = None


@dataclass(frozen=True)
class ExtractedTable:
    table_id: str
    page_number: None
    table_type: str
    rows: int
    columns: int
    cells: list[ExtractedCell]
    reconciliation_status: str


@dataclass(frozen=True)
class DocumentParseResult:
    document_id: str
    filename: str
    doc_format: str
    parser_engine: str
    row_count: int
    extracted_tables: list[ExtractedTable]
    extracted_metadata: dict[str, Any]
    provenance_hash: str


def _numeric_value(raw_text: str) -> str | None:
    value = raw_text.strip().replace(",", "").replace("£", "").replace("$", "").replace("€", "")
    if value.startswith("(") and value.endswith(")"):
        value = f"-{value[1:-1].strip()}"
    if value.endswith("%"):
        value = value[:-1].strip()
    try:
        number = Decimal(value)
    except InvalidOperation:
        return None
    if not number.is_finite():
        return None
    return format(number, "f")


class DoclingExtractionEngine:
    """Bounded CSV text/table extraction with content-based provenance."""

    def extract_document(
        self,
        filename: str,
        document_bytes: bytes,
        doc_category: str = "FINANCIAL_ACCOUNTS",
    ) -> DocumentParseResult:
        safe_filename = PurePath(filename.replace("\\", "/")).name
        if not safe_filename or safe_filename in {".", ".."}:
            raise DocumentExtractionError("A valid document filename is required.")
        if len(document_bytes) == 0:
            raise DocumentExtractionError("The uploaded document is empty.")
        if len(document_bytes) > MAX_DOCUMENT_BYTES:
            raise DocumentExtractionError("CSV documents must be 2 MB or smaller.")
        if PurePath(safe_filename).suffix.lower() != ".csv":
            raise DocumentExtractionError(
                "Only CSV extraction is currently available. PDF, scanned-image, Excel, "
                "and iXBRL parsing are not configured."
            )
        if not isinstance(doc_category, str) or not doc_category.strip() or len(doc_category) > 80:
            raise DocumentExtractionError("A document category of at most 80 characters is required.")

        try:
            text = document_bytes.decode("utf-8-sig")
        except UnicodeDecodeError as error:
            raise DocumentExtractionError("CSV must be encoded as UTF-8.") from error

        try:
            dialect = csv.Sniffer().sniff(text[:8192], delimiters=",\t;|")
        except csv.Error:
            dialect = csv.excel

        try:
            rows = list(csv.reader(io.StringIO(text, newline=""), dialect))
        except csv.Error as error:
            raise DocumentExtractionError(f"CSV parsing failed: {error}") from error
        if not rows or not any(cell.strip() for cell in rows[0]):
            raise DocumentExtractionError("CSV must include a non-empty header row.")
        if len(rows) - 1 > MAX_ROWS:
            raise DocumentExtractionError(f"CSV exceeds the {MAX_ROWS}-row limit.")
        if any(len(row) > MAX_COLUMNS for row in rows):
            raise DocumentExtractionError(f"CSV exceeds the {MAX_COLUMNS}-column limit.")
        if any(len(cell) > MAX_CELL_CHARS for row in rows for cell in row):
            raise DocumentExtractionError(f"CSV contains a cell larger than {MAX_CELL_CHARS} characters.")

        headers = [header.strip() or f"column_{index + 1}" for index, header in enumerate(rows[0])]
        cells: list[ExtractedCell] = []
        for row_idx, row in enumerate(rows[1:]):
            for col_idx, header in enumerate(headers):
                raw_text = row[col_idx].strip() if col_idx < len(row) else ""
                cells.append(
                    ExtractedCell(
                        row_idx=row_idx,
                        col_idx=col_idx,
                        header=header,
                        raw_text=raw_text,
                        normalized_value=_numeric_value(raw_text),
                    )
                )

        document_hash = hashlib.sha256(document_bytes).hexdigest()
        document_id = f"DOC-{uuid.uuid4()}"
        table = ExtractedTable(
            table_id=f"TBL-{document_id}",
            page_number=None,
            table_type="UNCLASSIFIED_CSV",
            rows=len(rows) - 1,
            columns=len(headers),
            cells=cells,
            reconciliation_status="NOT_EVALUATED",
        )
        return DocumentParseResult(
            document_id=document_id,
            filename=safe_filename,
            doc_format="CSV",
            parser_engine="Python stdlib csv",
            row_count=len(rows) - 1,
            extracted_tables=[table],
            extracted_metadata={
                "category": doc_category.strip(),
                "semantic_mapping": "NOT_PERFORMED",
                "document_verification": "NOT_PERFORMED",
            },
            provenance_hash=document_hash,
        )


def result_as_dict(result: DocumentParseResult) -> dict[str, Any]:
    return asdict(result)
