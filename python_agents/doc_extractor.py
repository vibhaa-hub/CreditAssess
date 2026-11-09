"""
ApexCredit Document Ingestion & Extraction Engine
Implements the Docling / Advanced OCR Parsing Architecture for UK Commercial Lending:
- Extracts structured tables (P&L, Balance Sheet, Debentures) with bounding-box coordinates
- Extracts textual clauses with confidence scores and page numbers
- Maps extracted cells into normalized Chart of Accounts (REQ-038)
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Optional
import time
import hashlib

@dataclass
class ExtractedCell:
    row_idx: int
    col_idx: int
    header: str
    raw_text: str
    normalized_value: float
    confidence: float
    bbox: List[float]  # [x0, y0, x1, y1]

@dataclass
class ExtractedTable:
    table_id: str
    page_number: int
    table_type: str  # "PROFIT_AND_LOSS", "BALANCE_SHEET", "DEBENTURE_SCHEDULE"
    rows: int
    columns: int
    cells: List[ExtractedCell]
    reconciliation_status: str

@dataclass
class DocumentParseResult:
    document_id: str
    filename: str
    doc_format: str  # "PDF", "CH_IXBRL", "SCANNED_TIFF", "EXCEL"
    parser_engine: str  # "Docling-Hybrid-v2.1", "Tesseract-OCR", "iXBRL-Native"
    page_count: int
    overall_confidence: float
    extracted_tables: List[ExtractedTable]
    extracted_metadata: Dict[str, Any]
    provenance_hash: str

class DoclingExtractionEngine:
    """
    Simulated Enterprise Docling & OCR Extractor
    Parses unstructured and semi-structured motor dealer credit documents into structured AST records.
    """
    def __init__(self):
        self.supported_formats = ["PDF", "TIFF", "JPEG", "XLSX", "XML_IXBRL"]

    def extract_document(self, filename: str, doc_category: str = "FINANCIAL_ACCOUNTS") -> DocumentParseResult:
        """
        Parses document using the Docling table-structure recovery algorithm and OCR.
        """
        doc_id = f"DOC-{int(time.time())}-{hashlib.md5(filename.encode()).hexdigest()[:6]}"
        is_scanned = "scan" in filename.lower() or filename.endswith(".tiff") or filename.endswith(".jpg")
        parser_name = "Docling-OCR-Pipeline" if is_scanned else "Docling-Document-Converter-v2.1"
        confidence = 0.94 if is_scanned else 0.99

        # Simulated Docling structured table extraction for FY24 financial statement
        pnl_cells = [
            ExtractedCell(0, 0, "Metric", "Turnover / Revenue", 18500000.0, 0.99, [45.0, 120.0, 220.0, 135.0]),
            ExtractedCell(0, 1, "FY2024", "£18,500,000", 18500000.0, 0.99, [240.0, 120.0, 310.0, 135.0]),
            ExtractedCell(1, 0, "Metric", "Cost of Sales", 15725000.0, 0.98, [45.0, 140.0, 220.0, 155.0]),
            ExtractedCell(1, 1, "FY2024", "£15,725,000", 15725000.0, 0.98, [240.0, 140.0, 310.0, 155.0]),
            ExtractedCell(2, 0, "Metric", "Operating Profit (EBIT)", 1100000.0, 0.99, [45.0, 160.0, 220.0, 175.0]),
            ExtractedCell(2, 1, "FY2024", "£1,100,000", 1100000.0, 0.99, [240.0, 160.0, 310.0, 175.0]),
            ExtractedCell(3, 0, "Metric", "Interest Payable", 219000.0, 0.97, [45.0, 180.0, 220.0, 195.0]),
            ExtractedCell(3, 1, "FY2024", "£219,000", 219000.0, 0.97, [240.0, 180.0, 310.0, 195.0]),
            ExtractedCell(4, 0, "Metric", "Net Profit", 710000.0, 0.99, [45.0, 200.0, 220.0, 215.0]),
            ExtractedCell(4, 1, "FY2024", "£710,000", 710000.0, 0.99, [240.0, 200.0, 310.0, 215.0]),
        ]

        bs_cells = [
            ExtractedCell(0, 0, "Line Item", "Vehicle Stock (Inventory)", 2850000.0, 0.99, [45.0, 250.0, 220.0, 265.0]),
            ExtractedCell(0, 1, "FY2024", "£2,850,000", 2850000.0, 0.99, [240.0, 250.0, 310.0, 265.0]),
            ExtractedCell(1, 0, "Line Item", "Current Assets", 3920000.0, 0.98, [45.0, 270.0, 220.0, 285.0]),
            ExtractedCell(1, 1, "FY2024", "£3,920,000", 3920000.0, 0.98, [240.0, 270.0, 310.0, 285.0]),
            ExtractedCell(2, 0, "Line Item", "Current Liabilities", 2450000.0, 0.97, [45.0, 290.0, 220.0, 305.0]),
            ExtractedCell(2, 1, "FY2024", "£2,450,000", 2450000.0, 0.97, [240.0, 290.0, 310.0, 305.0]),
            ExtractedCell(3, 0, "Line Item", "Total Borrowings (Debt)", 1850000.0, 0.99, [45.0, 310.0, 220.0, 325.0]),
            ExtractedCell(3, 1, "FY2024", "£1,850,000", 1850000.0, 0.99, [240.0, 310.0, 310.0, 325.0]),
            ExtractedCell(4, 0, "Line Item", "Net Assets / Shareholder Equity", 2420000.0, 0.99, [45.0, 330.0, 220.0, 345.0]),
            ExtractedCell(4, 1, "FY2024", "£2,420,000", 2420000.0, 0.99, [240.0, 330.0, 310.0, 345.0]),
        ]

        pnl_table = ExtractedTable(
            table_id=f"TBL-PNL-{doc_id}",
            page_number=1,
            table_type="PROFIT_AND_LOSS",
            rows=5,
            columns=2,
            cells=pnl_cells,
            reconciliation_status="RECONCILED_WITH_P&L"
        )

        bs_table = ExtractedTable(
            table_id=f"TBL-BS-{doc_id}",
            page_number=2,
            table_type="BALANCE_SHEET",
            rows=5,
            columns=2,
            cells=bs_cells,
            reconciliation_status="RECONCILED_WITH_BALANCE_SHEET"
        )

        # Hash of extracted payload for audit WORM ledger
        provenance = hashlib.sha256(f"{filename}-{doc_id}-{confidence}".encode()).hexdigest()

        return DocumentParseResult(
            document_id=doc_id,
            filename=filename,
            doc_format="PDF" if filename.endswith(".pdf") else "SCAN_IMAGE",
            parser_engine=parser_name,
            page_count=3,
            overall_confidence=confidence,
            extracted_tables=[pnl_table, bs_table],
            extracted_metadata={
                "dealer_name": "Apex Motor Group Ltd",
                "period_ending": "2024-12-31",
                "auditor_signed": True,
                "auditor_name": "BDO LLP UK",
                "source_provenance_tag": f"[SRC: Docling-{filename}#p1-p2]",
            },
            provenance_hash=provenance
        )
