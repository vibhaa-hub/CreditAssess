/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Read-only case analysis and bounded CSV extraction.
 */

import React, { useState, useEffect } from 'react';
import { useCreditAssessment } from '../context/CreditAssessmentContext';
import {
  Terminal,
  RotateCw,
  Code2,
  Cpu,
  BookOpen,
  FileSpreadsheet,
  Scale,
  ChevronRight,
} from 'lucide-react';

export const PythonAgentConsole: React.FC = () => {
  const { activeCase } = useCreditAssessment();

  const [activeTab, setActiveTab] = useState<
    'CONSOLE' | 'GOOGLE_ADK' | 'RULE_DSL' | 'DOCLING_OCR' | 'RAG_SEARCH' | 'SOURCE_CODE'
  >('CONSOLE');

  const [isRunning, setIsRunning] = useState(false);
  const [caseAnalysis, setCaseAnalysis] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[READY] Read-only analysis is available for a saved case.',
    '[READY] CSV extraction reads uploaded file bytes in memory.',
    '[WARNING] No external screening, approval, storage, or submission was performed.',
  ]);

  // Docling State
  const [doclingResult, setDoclingResult] = useState<any>(null);
  const [doclingLoading, setDoclingLoading] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [doclingError, setDoclingError] = useState<string | null>(null);

  // Source Code Inspector State
  const [selectedAgentFile, setSelectedAgentFile] = useState<string>('google_adk.py');
  const [codeContent, setCodeContent] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  const handleRunCaseAnalysis = async () => {
    setIsRunning(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/python/agents/evaluate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: activeCase.caseId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Analysis failed (${response.status}).`);
      setCaseAnalysis(result);
      setTerminalLogs((logs) => [
        ...logs,
        `[CASE_ANALYSIS] Read-only analysis completed for ${activeCase.caseId}.`,
        '[CASE_ANALYSIS] No external screening, approval, or submission was performed.',
      ]);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Case analysis failed.');
    } finally {
      setIsRunning(false);
    }
  };

  // Load Source Code when file changes
  useEffect(() => {
    setIsLoadingCode(true);
    fetch(`/api/python/agents/code/${selectedAgentFile}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code) {
          setCodeContent(data.code);
        } else {
          setCodeContent('# Source code loaded from python_agents/' + selectedAgentFile);
        }
      })
      .catch(() => {
        setCodeContent('# Python source file: python_agents/' + selectedAgentFile);
      })
      .finally(() => setIsLoadingCode(false));
  }, [selectedAgentFile]);

  // Handler: bounded CSV extraction; the service does not persist uploaded files.
  const handleRunDocling = async () => {
    if (!documentFile) {
      setDoclingError('Choose a CSV file first.');
      return;
    }
    if (documentFile.size === 0 || documentFile.size > 2 * 1024 * 1024) {
      setDoclingError('CSV files must be between 1 byte and 2 MB.');
      return;
    }
    setDoclingLoading(true);
    setDoclingError(null);
    try {
      const bytes = new Uint8Array(await documentFile.arrayBuffer());
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      }
      const res = await fetch('/api/docling/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: documentFile.name,
          content_base64: btoa(binary),
          doc_category: 'UNCLASSIFIED',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Extraction failed (${res.status}).`);
      setDoclingResult(data);
      setTerminalLogs((prev) => [
        ...prev,
        `[CSV_EXTRACTION] ${data.filename} read with ${data.parser_engine}; ${data.row_count} data rows extracted.`,
        '[CSV_EXTRACTION] No financial mapping, reconciliation, document verification, or persistence was performed.',
      ]);
    } catch (error) {
      setDoclingError(error instanceof Error ? error.message : 'Document extraction failed.');
    } finally {
      setDoclingLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/30 to-blue-600/30 text-indigo-400 border border-indigo-500/40">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Read-only Case Analysis & CSV Extraction
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                Not a credit decision
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Analysis uses saved case data; CSV extraction is transient and source-preserving.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-200">
          Only read-only case analysis and bounded CSV extraction are active. No external screening, approval, document storage, or regulatory validation is provided.
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('GOOGLE_ADK');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'GOOGLE_ADK' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent sessions (unavailable)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('RULE_DSL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'RULE_DSL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Rule Engine (disabled)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('DOCLING_OCR');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'DOCLING_OCR' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Extraction</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('RAG_SEARCH');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'RAG_SEARCH' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge retrieval (disabled)</span>
          </button>

          <button
            onClick={() => setActiveTab('CONSOLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'CONSOLE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('SOURCE_CODE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'SOURCE_CODE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Source Code</span>
          </button>
        </div>
      </div>

      {/* Persistent agent sessions and authenticated attestations are not configured. */}
      {activeTab === 'GOOGLE_ADK' && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-5 text-sm text-amber-100">
          Persistent agent sessions and authenticated human attestations are not configured. No approval or gate-passing
          action is available here. Case analysis is read-only and can be run from the console.
        </div>
      )}

      {/* Tab 2: Deterministic Rule Engine DSL */}
      {activeTab === 'RULE_DSL' && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-5 text-sm text-amber-100">
          Rule evaluation is disabled. The bundled rules have not been approved or validated against your organization’s
          credit policy and must not be used to gate a case or make a lending decision.
        </div>
      )}

      {/* Tab 3: Docling & OCR Ingestion */}
      {activeTab === 'DOCLING_OCR' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">CSV Text & Table Extraction</span>
              <p className="text-[11px] text-slate-400">
                Supports UTF-8 CSV files up to 2 MB. PDF, scanned images, Excel, iXBRL, financial mapping, and OCR are not configured.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setDocumentFile(event.target.files?.[0] ?? null);
                  setDoclingError(null);
                  setDoclingResult(null);
                }}
                className="max-w-56 text-xs text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-slate-200"
              />
              <button
                onClick={handleRunDocling}
                disabled={doclingLoading || !documentFile}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-lg flex items-center space-x-2"
              >
                <RotateCw className={`w-3.5 h-3.5 ${doclingLoading ? 'animate-spin' : ''}`} />
                <span>{doclingLoading ? 'Extracting...' : 'Extract CSV'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-200">
            Uploaded bytes are parsed in memory and not stored by this endpoint. Use only data approved for this environment; this is not a document vault or a verified financial-statement parser.
          </div>
          {doclingError && (
            <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-xs text-red-200">{doclingError}</div>
          )}

          {doclingResult && (
            <div className="space-y-4">
              {/* Document Overview Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{doclingResult.filename}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-cyan-800">
                      {doclingResult.doc_format}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] mt-0.5 block">
                    Engine: <strong className="text-slate-200">{doclingResult.parser_engine}</strong> • Rows: {doclingResult.row_count}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Meaning mapped</span>
                    <span className="text-sm font-bold font-mono text-amber-300">No</span>
                  </div>
                  <span className="font-mono text-[10px] text-purple-300 bg-slate-900 p-2 rounded border border-slate-800">
                    Provenance: {doclingResult.provenance_hash?.substring(0, 16)}...
                  </span>
                </div>
              </div>

              {/* Extracted Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doclingResult.extracted_tables?.map((table: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs">
                    <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-indigo-300 font-mono">{table.table_type} (not classified)</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">{table.reconciliation_status}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {table.cells?.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                          <span className="text-slate-200">{c.header}: {c.raw_text}</span>
                          <div className="flex items-center space-x-2">
                            {c.normalized_value !== null && (
                              <span className="font-mono text-cyan-300 font-bold">{c.normalized_value}</span>
                            )}
                            <span className="text-[9px] font-mono text-slate-500">
                              row {c.row_idx + 1}, column {c.col_idx + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: RAG Knowledge Base */}
      {activeTab === 'RAG_SEARCH' && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-5 text-sm text-amber-100">
          Retrieval is disabled because the bundled corpus is sample content, not an authoritative, maintained policy
          source. Configure and govern an approved corpus before enabling policy search or grounding.
        </div>
      )}

      {/* Tab 5: Interactive Terminal Logs */}
      {activeTab === 'CONSOLE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div>
              <span className="block text-xs font-bold text-white">Analyze saved case</span>
              <p className="text-[11px] text-slate-400">
                Runs read-only calculations on persisted case data. It cannot make a credit decision or contact providers.
              </p>
            </div>
            <button
              onClick={handleRunCaseAnalysis}
              disabled={isRunning || !activeCase.caseId}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {isRunning ? 'Analyzing...' : 'Run case analysis'}
            </button>
          </div>
          {analysisError && (
            <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-xs text-red-200">{analysisError}</div>
          )}
          {caseAnalysis && (
            <pre className="max-h-96 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] text-slate-200">
              {JSON.stringify(caseAnalysis, null, 2)}
            </pre>
          )}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 h-80 overflow-y-auto space-y-1 shadow-inner">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-600 select-none">$</span>
                <span
                  className={
                    log.includes('[ADK_')
                      ? 'text-indigo-400'
                      : log.includes('[RULE_ENGINE')
                      ? 'text-emerald-400'
                      : log.includes('[DOCLING')
                      ? 'text-cyan-300'
                      : log.includes('[RAG')
                      ? 'text-amber-300'
                      : 'text-slate-400'
                  }
                >
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Source Code Inspector */}
      {activeTab === 'SOURCE_CODE' && (
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-white">Python source files (inspection only)</span>
            <p className="mt-1 text-[11px] text-slate-400">
              Files marked inactive are not exposed through the worker API and are not production capabilities.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { file: 'google_adk.py', label: 'Agent sessions (inactive)' },
              { file: 'rule_engine_dsl.py', label: 'Rule engine (inactive)' },
              { file: 'doc_extractor.py', label: 'CSV extractor (active)' },
              { file: 'rag_engine.py', label: 'Retrieval (inactive)' },
              { file: 'prompts.py', label: 'Prompt definitions' },
              { file: 'orchestrator.py', label: 'Orchestrator.py' },
              { file: 'models.py', label: 'Models.py' },
            ].map(({ file, label }) => (
              <button
                key={file}
                onClick={() => setSelectedAgentFile(file)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  selectedAgentFile === file
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 h-96 overflow-y-auto shadow-inner leading-relaxed">
            {isLoadingCode ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <RotateCw className="w-5 h-5 animate-spin mr-2" />
                <span>Loading Python source code...</span>
              </div>
            ) : (
              <pre>{codeContent}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
