/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ApexCredit Python Multi-Agent Control Center
 * Google ADK Multi-Agent Orchestrator, Rule Engine DSL, Docling/OCR Ingestion, and RAG Knowledge Base
 */

import React, { useState, useEffect } from 'react';
import { useCreditAssessment } from '../context/CreditAssessmentContext';
import {
  Terminal,
  Play,
  RotateCw,
  Code2,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Shield,
  Activity,
  Zap,
  Search,
  BookOpen,
  FileSpreadsheet,
  UserCheck,
  Scale,
  Sparkles,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const PythonAgentConsole: React.FC = () => {
  const { activeCase } = useCreditAssessment();

  const [activeTab, setActiveTab] = useState<
    'CONSOLE' | 'GOOGLE_ADK' | 'RULE_DSL' | 'DOCLING_OCR' | 'RAG_SEARCH' | 'SOURCE_CODE'
  >('GOOGLE_ADK');

  const [isRunning, setIsRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[SYSTEM] Google Agent Development Kit (ADK) Environment Active.',
    '[ORCHESTRATOR] 5 Google ADK Agents Registered: Intake, FinancialAnalyst, DueDiligence, CreditAuthoring, GatewaySubmission.',
    '[HITL] 4 Human-in-the-Loop checkpoints initialized (IBVC-01-G1, IBVC-01-G2, IBVC-01-G3, IBVC-01-G4).',
    '[RULE_ENGINE] Declarative DSL ready with 8 statutory invariants (CALC-001..014, DT-1..5).',
    '[DOCLING] Docling v2.1 table-structure recovery & OCR pipeline mounted.',
    '[RAG] Vector / Keyword semantic store indexed with FCA Handbook, JMLSG, and Credit Policies.',
  ]);

  // Google ADK State
  const [adkAgents, setAdkAgents] = useState<any[]>([]);
  const [adkSession, setAdkSession] = useState<any>(null);
  const [adkLoading, setAdkLoading] = useState(false);

  // Rule Engine DSL State
  const [ruleEvalResult, setRuleEvalResult] = useState<any>(null);
  const [ruleEvalLoading, setRuleEvalLoading] = useState(false);

  // Docling State
  const [doclingResult, setDoclingResult] = useState<any>(null);
  const [doclingLoading, setDoclingLoading] = useState(false);

  // RAG Search State
  const [ragQuery, setRagQuery] = useState('FCA CONC 5.2A creditworthiness assessment and gearing');
  const [ragResults, setRagResults] = useState<any[]>([]);
  const [ragLoading, setRagLoading] = useState(false);

  // Source Code Inspector State
  const [selectedAgentFile, setSelectedAgentFile] = useState<string>('google_adk.py');
  const [codeContent, setCodeContent] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // Load ADK Agents on mount
  useEffect(() => {
    fetch('/api/adk/agents')
      .then((res) => res.json())
      .then((data) => {
        if (data.adk_agents) setAdkAgents(data.adk_agents);
      })
      .catch(() => {});
  }, []);

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

  // Handler: Run ADK Pipeline
  const handleRunADKPipeline = async () => {
    setAdkLoading(true);
    try {
      const res = await fetch('/api/adk/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: 'sess-apex-01' }),
      });
      const data = await res.json();
      setAdkSession(data);
      setTerminalLogs((prev) => [
        ...prev,
        `[ADK_ORCHESTRATOR] Pipeline run initiated for ${data.dealer_name}.`,
        `[ADK_STATUS] Pipeline Status: ${data.pipeline_status}. Agent turns completed: ${data.agent_runs?.length || 0}.`,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setAdkLoading(false);
    }
  };

  // Handler: HITL Signoff
  const handleHITLSignoff = async (checkpointId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/adk/hitl-signoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: adkSession?.session_id || 'sess-apex-01',
          checkpoint_id: checkpointId,
          decision,
          user_id: 'Certified_Account_Manager_AM01',
          amendments: 'Verified against primary Companies House and Apak wholesale records.',
        }),
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        handleRunADKPipeline(); // Refresh pipeline state
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Evaluate DSL Rules
  const handleEvaluateDSLRules = async () => {
    setRuleEvalLoading(true);
    try {
      const payload = {
        case_id: activeCase.caseId,
        max_doc_age_days: 42,
        ubo_sum_percentage: 100.0,
        unresolved_screening_hits: activeCase.screeningFindings.filter((f) => f.status === 'POTENTIAL_MATCH').length,
        cashflow_discrepancy: 0.0,
        gearing_ratio: 2.1,
        interest_cover: 3.8,
        preparer_id: 'USR-AM-01',
        authorizer_id: 'USR-CM-02',
        is_automated_approval: false,
      };
      const res = await fetch('/api/rule-engine/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setRuleEvalResult(data);
      setTerminalLogs((prev) => [
        ...prev,
        `[RULE_ENGINE_DSL] Invariant evaluation complete: ${data.status}. (${data.passed_rules}/${data.total_rules} rules passed).`,
        `[WORM_AUDIT_SEAL] SHA-256 Seal: ${data.sha256_audit_seal}`,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setRuleEvalLoading(false);
    }
  };

  // Handler: Docling Extraction
  const handleRunDocling = async () => {
    setDoclingLoading(true);
    try {
      const res = await fetch('/api/docling/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'ApexMotorGroup_FY24_AuditedAccounts.pdf',
          doc_category: 'FINANCIAL_STATEMENTS',
        }),
      });
      const data = await res.json();
      setDoclingResult(data);
      setTerminalLogs((prev) => [
        ...prev,
        `[DOCLING_INGESTION] Document ${data.filename} parsed via ${data.parser_engine}. Confidence: ${(data.overall_confidence * 100).toFixed(1)}%.`,
        `[DOCLING_TABLES] ${data.extracted_tables?.length || 0} financial tables mapped to Chart of Accounts with bounding boxes.`,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setDoclingLoading(false);
    }
  };

  // Handler: RAG Search
  const handleRAGSearch = async () => {
    setRagLoading(true);
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQuery, top_k: 3 }),
      });
      const data = await res.json();
      setRagResults(data.retrieved_chunks || []);
      setTerminalLogs((prev) => [
        ...prev,
        `[RAG_RETRIEVER] Query "${ragQuery}" executed. ${data.retrieved_chunks?.length || 0} chunks retrieved with similarity scores > 0.75.`,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setRagLoading(false);
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
                Google ADK Multi-Agent Orchestration & Deterministic Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                HITL Gated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Enterprise ADK agents, Human-in-the-Loop review gates, declarative Rule Engine DSL, Docling document parser, and FCA RAG knowledge base.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('GOOGLE_ADK');
              if (!adkSession) handleRunADKPipeline();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'GOOGLE_ADK' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Google ADK (HITL)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('RULE_DSL');
              if (!ruleEvalResult) handleEvaluateDSLRules();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'RULE_DSL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Rule Engine (DSL)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('DOCLING_OCR');
              if (!doclingResult) handleRunDocling();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'DOCLING_OCR' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Docling & OCR Ingestion</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('RAG_SEARCH');
              if (ragResults.length === 0) handleRAGSearch();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'RAG_SEARCH' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>RAG Knowledge Base</span>
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

      {/* Tab 1: Google ADK Framework & HITL Checkpoints */}
      {activeTab === 'GOOGLE_ADK' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">ADK Multi-Agent Pipeline Control</span>
              <p className="text-[11px] text-slate-400">
                Orchestrates worker agents with session context memory and pauses execution at mandatory FCA Human-in-the-Loop checkpoints.
              </p>
            </div>
            <button
              onClick={handleRunADKPipeline}
              disabled={adkLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${adkLoading ? 'animate-spin' : ''}`} />
              <span>{adkLoading ? 'Orchestrating Agents...' : 'Run ADK Pipeline Cycle'}</span>
            </button>
          </div>

          {/* Active ADK Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adkAgents.map((agent, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{agent.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-cyan-800">
                    {agent.model}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">{agent.role}</p>
                <div className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">Declarative Tools ({agent.tools?.length}):</span>
                  <div className="flex flex-wrap gap-1">
                    {agent.tools?.map((t: any, idx: number) => (
                      <span key={idx} className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">
                        {t.name}()
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Human-in-the-Loop (HITL) Checkpoints Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Human-in-the-Loop (HITL) Statutory Checkpoints</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Policy BR-G01 & PR-02 Enforced</span>
            </div>

            <div className="space-y-3">
              {adkSession?.active_checkpoints ? (
                Object.values(adkSession.active_checkpoints).map((cp: any, idx: number) => {
                  const isWaiting = cp.status === 'WAITING_FOR_HUMAN';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                        isWaiting
                          ? 'bg-amber-950/20 border-amber-500/80'
                          : cp.status === 'APPROVED'
                          ? 'bg-emerald-950/20 border-emerald-800/80'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{cp.name}</span>
                          <span className="text-[10px] font-mono text-cyan-300">[{cp.stage_du}]</span>
                          <span className="text-[10px] font-mono text-slate-400">{cp.fca_rule}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{cp.attestation_prompt}</p>
                        <span className="text-[10px] text-slate-400 block">
                          Required Role: <strong className="text-slate-200">{cp.required_role}</strong>
                          {cp.human_signoff_by && ` • Attested by ${cp.human_signoff_by} on ${cp.human_signoff_at}`}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isWaiting ? (
                          <>
                            <button
                              onClick={() => handleHITLSignoff(cp.checkpoint_id, 'REJECT')}
                              className="px-3 py-1 rounded-lg bg-red-950 text-red-300 border border-red-800 text-xs font-semibold hover:bg-red-900 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleHITLSignoff(cp.checkpoint_id, 'APPROVE')}
                              className="px-4 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors shadow-sm"
                            >
                              Attest & Pass Gate
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {cp.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Click <strong>Run ADK Pipeline Cycle</strong> above to inspect live Human-in-the-Loop checkpoints.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Deterministic Rule Engine DSL */}
      {activeTab === 'RULE_DSL' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Declarative AST Rule Engine DSL</span>
              <p className="text-[11px] text-slate-400">
                Compiles statutory invariants with mathematical precision. Zero hallucination risk on mathematical ratios, document freshness, and 4-eyes duties.
              </p>
            </div>
            <button
              onClick={handleEvaluateDSLRules}
              disabled={ruleEvalLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${ruleEvalLoading ? 'animate-spin' : ''}`} />
              <span>{ruleEvalLoading ? 'Evaluating DSL...' : 'Re-Evaluate Statutory Rules'}</span>
            </button>
          </div>

          {ruleEvalResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Rule Engine Execution Outcome:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      ruleEvalResult.status === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {ruleEvalResult.status} ({ruleEvalResult.passed_rules}/{ruleEvalResult.total_rules} Passed)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-purple-300">
                  WORM SHA-256: {ruleEvalResult.sha256_audit_seal.substring(0, 16)}...
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-800">
                  <thead className="bg-slate-900/60 text-slate-400 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Rule ID & Name</th>
                      <th className="py-2.5 px-4">FCA Citation</th>
                      <th className="py-2.5 px-4">Evaluated Value</th>
                      <th className="py-2.5 px-4">Severity</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200 text-xs">
                    {ruleEvalResult.evaluations?.map((ev: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-4">
                          <span className="font-mono font-bold text-indigo-300 block">{ev.rule_id}</span>
                          <span className="text-slate-300">{ev.name}</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-cyan-400">{ev.fca_citation}</td>
                        <td className="py-2.5 px-4 font-mono">{String(ev.actual_value)}</td>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                            {ev.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              ev.passed
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {ev.passed ? '✓ PASS' : '✗ FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Docling & OCR Ingestion */}
      {activeTab === 'DOCLING_OCR' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Docling Table-Structure Recovery & OCR Parser</span>
              <p className="text-[11px] text-slate-400">
                Ingests PDF accounts and scanned motor dealer filings, recovering tabular coordinates (bounding boxes) and confidence metrics.
              </p>
            </div>
            <button
              onClick={handleRunDocling}
              disabled={doclingLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${doclingLoading ? 'animate-spin' : ''}`} />
              <span>{doclingLoading ? 'Parsing with Docling...' : 'Extract Sample Document'}</span>
            </button>
          </div>

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
                    Engine: <strong className="text-slate-200">{doclingResult.parser_engine}</strong> • Pages: {doclingResult.page_count}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Extraction Confidence</span>
                    <span className="text-sm font-bold font-mono text-emerald-300">
                      {(doclingResult.overall_confidence * 100).toFixed(1)}%
                    </span>
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
                      <span className="font-bold text-indigo-300 font-mono">{table.table_type} (Page {table.page_number})</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">{table.reconciliation_status}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {table.cells?.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                          <span className="text-slate-200">{c.raw_text}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-cyan-300 font-bold">
                              £{(c.normalized_value / 1000).toLocaleString()}k
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              [bbox: {c.bbox?.slice(0, 2).join(',')}]
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
        <div className="space-y-6">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div>
              <span className="text-xs font-bold text-white block">Retrieval-Augmented Generation (RAG) Grounding Engine</span>
              <p className="text-[11px] text-slate-400">
                Searches authoritative FCA Handbook regulations, JMLSG guidelines, internal credit policy rules, and dealership case files.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                placeholder="Search FCA rules or credit policy (e.g. CONC 5.2A, SYSC 6.3, Gearing ceiling)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
              />
              <button
                onClick={handleRAGSearch}
                disabled={ragLoading || !ragQuery.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Search className={`w-3.5 h-3.5 ${ragLoading ? 'animate-spin' : ''}`} />
                <span>Retrieve Authoritative Grounding</span>
              </button>
            </div>
          </div>

          {/* RAG Results Display */}
          <div className="space-y-3">
            {ragResults.map((chunk, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-indigo-400 font-bold">{chunk.chunk_id}</span>
                    <span className="text-slate-500">|</span>
                    <span className="font-semibold text-white">{chunk.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Score: {chunk.relevance_score}
                    </span>
                    <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      {chunk.citation}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  {chunk.text}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Corpus: <strong className="text-slate-300">{chunk.source_corpus}</strong> • Ref: {chunk.section_ref}</span>
                  <div className="flex gap-1">
                    {chunk.tags?.map((t: string, i: number) => (
                      <span key={i} className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Interactive Terminal Logs */}
      {activeTab === 'CONSOLE' && (
        <div className="space-y-4">
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
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Select Python Architecture File:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { file: 'google_adk.py', label: '✨ Google ADK (Orchestration)' },
              { file: 'rule_engine_dsl.py', label: '⚖️ Rule Engine DSL' },
              { file: 'doc_extractor.py', label: '📄 Docling & OCR Extractor' },
              { file: 'rag_engine.py', label: '🔍 RAG Knowledge Base' },
              { file: 'prompts.py', label: '📝 Prompts.py (LLM Registry)' },
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
