/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-08] CreditSubmissionGatewayUnit (Deployable Unit 8 / P-08 | Domain: DOM-03 Credit Assessment)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import { UnderwritingOutcome } from '../../types/ast';
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight,
  FileCheck2,
  RotateCcw,
  Sparkles,
  Check,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import { FCABoundaryDrawer } from '../FCABoundaryDrawer';

export const DU08CreditGateway: React.FC = () => {
  const {
    activeCase,
    checkCompleteness,
    recordUnderwritingDecision,
    raiseUnderwriterQuery,
    resolveUnderwriterQuery,
    currentUserRole,
    setActiveDU,
  } = useCreditAssessment();

  const [queryInput, setQueryInput] = useState('');
  const [resolutionInput, setResolutionInput] = useState('');
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);

  // Underwriter decision state
  const [decisionOutcome, setDecisionOutcome] = useState<UnderwritingOutcome | ''>('');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [conditionsText, setConditionsText] = useState('');

  // Gemini Underwriting Copilot State
  const [copilotQuestion, setCopilotQuestion] = useState('');
  const [copilotResponse, setCopilotResponse] = useState('');
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  const handleAskCopilot = async (questionText?: string) => {
    const q = questionText || copilotQuestion;
    if (!q.trim()) return;
    setIsCopilotThinking(true);
    setCopilotError(null);
    try {
      const res = await fetch('/api/gemini/underwriter-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'UNDERWRITING_ADVICE',
          underwriterQuestion: q,
          contextData: {
            dealer: activeCase.dealerProfile,
            facilityRequest: activeCase.facilityRequest,
            pricing: activeCase.pricingSignoff,
            periods: activeCase.financialPeriods,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `AI request failed (${res.status}).`);
      if (data.response) {
        setCopilotResponse(data.response);
      } else {
        throw new Error('The AI provider returned no response.');
      }
    } catch (err) {
      setCopilotError(err instanceof Error ? err.message : 'AI request failed.');
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const completeness = checkCompleteness();
  const isSubmissionBlocked = completeness.isBlocked;

  const handleRaiseQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    raiseUnderwriterQuery(queryInput);
    setQueryInput('');
  };

  const handleResolveQuery = (queryId: string) => {
    if (!resolutionInput.trim()) return;
    resolveUnderwriterQuery(queryId, resolutionInput);
    setSelectedQueryId(null);
    setResolutionInput('');
  };

  const handleRecordDecision = () => {
    if (!decisionOutcome || !decisionRationale.trim()) return;
    const condList = conditionsText
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);
    recordUnderwritingDecision(decisionOutcome, decisionRationale, condList);
  };

  const hasFormalDecision = !!activeCase.underwritingDecision;
  const isGatePassed =
    hasFormalDecision &&
    (activeCase.underwritingDecision?.outcome === 'APPROVED' ||
      activeCase.underwritingDecision?.outcome === 'APPROVED_WITH_CONDITIONS');

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-08] P-08
            </span>
            <h1 className="text-xl font-bold text-white">Credit Submission Gateway Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-03 Credit Assessment</span>
          </div>
          <p className="text-xs text-slate-400">
            Application completeness checks and role-gated workflow screens. Credit submission is unavailable until a credit-gateway integration is implemented.
          </p>
        </div>

        {/* Control Gate IBVC-01-G4 */}
        <div
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
            isGatePassed
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              isGatePassed ? 'bg-emerald-800/80 text-emerald-200' : 'bg-amber-800/80 text-amber-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider">
              Control Gate: IBVC-01-G4
            </div>
            <div className="text-xs font-semibold">
              {isGatePassed
                ? 'Independent Underwriting Approval Recorded'
                : 'Underwriting Assessment Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Regulatory Determinism & LLM Boundary Drawer */}
      <FCABoundaryDrawer
        currentDU="DU-08 Credit Gateway"
        deterministicRules={[
          {
            code: 'DT-2 / CALC-011',
            name: 'Completeness Gate Decision Table',
            status: isSubmissionBlocked ? 'PENDING' : 'PASS',
            fcaCitation: 'FCA PR-01 / REQ-061',
            description: '100% of statutory checklist items and validity checks (<90 days) must pass deterministically before authorization is enabled.',
          },
          {
            code: 'BR-E02',
            name: '4-Eyes Segregation of Duties',
            status: 'ENFORCED',
            fcaCitation: 'SYSC 4.3.1 R / Senior Managers Regime',
            description: 'Account Manager initiates submission; only certified Credit Underwriter may record final credit decision.',
          },
          {
            code: 'BR-G01',
            name: 'Prohibition of Automated Approvals',
            status: 'ENFORCED',
            fcaCitation: 'FCA REQ-067 / BR-G01',
            description: 'GenAI operates strictly as drafting copilot. Final credit approvals and covenants require human underwriter execution.',
          },
        ]}
      />

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Deterministic Completeness Gate & Authorization (REQ-061, CALC-011, DT-2, BR-P04, REQ-062, BR-E01) */}
        <div className="space-y-6">
          {/* Card: Completeness Gate Report */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">ExecuteDeterministicCompletenessGate (DT-2)</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">CALC-011:</span>
                <span
                  className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded ${
                    !isSubmissionBlocked
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {completeness.completenessPct}% Complete
                </span>
              </div>
            </div>

            {isSubmissionBlocked ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-950/20 border border-amber-900/60 rounded-lg text-xs space-y-2">
                  <span className="font-bold text-amber-300 block flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Blocking Gap Items (Policy Rule BR-P04 / BR-U04)</span>
                  </span>
                  <div className="space-y-2">
                    {completeness.blockingReasons.map((gap, i) => (
                      <div key={i} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                        <span className="font-mono text-cyan-400 font-bold block">{gap.code}</span>
                        <p className="text-slate-200 mt-0.5">{gap.reason}</p>
                        <p className="text-amber-300 text-[10px] mt-1 font-medium">Action: {gap.correctiveAction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-lg text-xs space-y-1 text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Application completeness checks passed</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  All mandatory checklist items, verified UBO ownership tree, cleared screening adjudications, attested narrative commentary, and four-eyes pricing signoffs confirmed.
                </p>
              </div>
            )}

            {/* Authorise Submission Action (REQ-062 / BR-E01) */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="text-xs text-slate-300 space-y-1">
                <span className="font-bold text-white block">Case Owner Submission Authorization (BR-E01)</span>
                <p className="text-slate-400 text-[11px]">
                  Only accountable Case Owner ({activeCase.assignedOwner} - {activeCase.ownerRole}) can authorize transmission to Credit.
                </p>
                <p className="text-amber-300 text-[11px]">
                  No credit-gateway integration is configured; this application cannot transmit a submission.
                </p>
                <div className="text-[10px] font-mono text-cyan-300">
                  Current User Role: {currentUserRole}
                </div>
              </div>

              <button
                disabled
                className="w-full py-2.5 bg-slate-800 text-slate-500 font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Credit submission integration unavailable</span>
              </button>
            </div>
          </div>

          {/* Immutable Snapshots History (REQ-063, REQ-064, BR-P05) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Persisted Submission Snapshots ({activeCase.submissionSnapshots.length})
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Not WORM storage</span>
            </div>

            {activeCase.submissionSnapshots.map((snap) => (
              <div
                key={snap.snapshotId}
                className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{snap.packVersion}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-cyan-300 text-[10px] font-mono font-semibold">
                    {snap.creditQueueTxId}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <div>SHA-256 Seal: <span className="text-purple-300">{snap.sha256Seal}</span></div>
                  <div>Submitted: <span className="text-slate-400">{snap.submittedAt}</span> by {snap.submittedBy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Independent Credit Underwriting Assessment Interface (REQ-066, REQ-067, AS-01, BR-G01) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-bold text-white">Credit Underwriting Console (Independent AS-01)</h2>
              </div>
              <span className="text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded">
                Role: CREDIT_UNDERWRITER
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-white block">Policy Rule BR-G01 & REQ-067</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Only an independent Credit Underwriter decides credit. Commercial pack contains zero decision advice. To record decisions or raise queries, switch to role <span className="text-rose-300 font-bold">Credit Underwriter</span> in the header.
              </p>
            </div>

            {/* Gemini 3.8 Flash Underwriting Copilot Card */}
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-200">AI Underwriting Assistant (advisory)</span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/50">
                  Advisory Mode (BR-G01)
                </span>
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Evaluate Debenture Deed CP wording',
                  'Suggest stock audit covenants',
                  'Clarify 90-day intake document validity',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCopilotQuestion(chip);
                      handleAskCopilot(chip);
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              {/* Question Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={copilotQuestion}
                  onChange={(e) => setCopilotQuestion(e.target.value)}
                  placeholder="Ask Gemini copilot (e.g. assess floorplan headroom stress)..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleAskCopilot()}
                  disabled={isCopilotThinking || !copilotQuestion.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  {isCopilotThinking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Ask</span>
                </button>
              </div>

              {/* Copilot Response output */}
              {copilotResponse && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-[10px] text-indigo-400 font-bold uppercase">
                    <span>AI response — verify independently</span>
                    <button
                      onClick={() => setCopilotResponse('')}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-300">
                    {copilotResponse}
                  </p>
                </div>
              )}
              {copilotError && (
                <p className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-xs text-red-200">
                  {copilotError}
                </p>
              )}
            </div>

            {/* Rework Queries Loop (Branch A: REQ-065 / BR-P13 / REQ-095) */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Underwriting Queries & Rework Loop ({activeCase.underwriterQueries.length})</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">REQ-065</span>
              </div>

              {activeCase.underwriterQueries.map((qry) => (
                <div
                  key={qry.id}
                  className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300">{qry.underwriterName}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        qry.status === 'RESOLVED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                      }`}
                    >
                      {qry.status}
                    </span>
                  </div>
                  <p className="text-slate-200 text-[11px]">{qry.queryText}</p>
                  {qry.resolutionResponse ? (
                    <div className="text-[10px] text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-900/60">
                      AM Resolution: {qry.resolutionResponse}
                      <div className="text-slate-400 text-[9px] mt-0.5">Resolved on {qry.resolvedAt}</div>
                    </div>
                  ) : (
                    <div>
                      {selectedQueryId === qry.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={2}
                            value={resolutionInput}
                            onChange={(e) => setResolutionInput(e.target.value)}
                            placeholder="Provide clarification to Underwriting..."
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedQueryId(null)}
                              className="text-[11px] text-slate-400"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleResolveQuery(qry.id)}
                              className="px-2.5 py-1 text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold"
                            >
                              Commit Clarification (Close Query)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedQueryId(qry.id)}
                          className="text-[11px] text-cyan-400 hover:underline"
                        >
                          + Resolve Underwriting Query
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Form to Raise Query */}
              <form onSubmit={handleRaiseQuery} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Raise Underwriting Query (e.g. Request breakdown of used car margins...)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  Raise Query
                </button>
              </form>
            </div>

            {/* Formal Decision Recording (Branch B: REQ-066 / BR-G01) */}
            <div className="pt-3 border-t border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-white block">Record Binding Credit Decision (REQ-066)</span>

              {hasFormalDecision ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-2 text-emerald-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-200">
                      Outcome: {activeCase.underwritingDecision?.outcome}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-300 bg-slate-900 px-2 py-0.5 rounded">
                      Ref: {activeCase.underwritingDecision?.creditReference}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{activeCase.underwritingDecision?.rationale}</p>
                  <div className="text-[10px] text-slate-400">
                    Decided by {activeCase.underwritingDecision?.underwriterId} on {activeCase.underwritingDecision?.decisionDate}
                  </div>
                  <div className="pt-2 border-t border-emerald-900/60 flex justify-end">
                    <button
                      onClick={() => setActiveDU(9)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                    >
                      <span>Proceed to Fulfillment Board (DU-09)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Underwriting Decision Outcome</label>
                    <select
                      value={decisionOutcome}
                      onChange={(e) => setDecisionOutcome(e.target.value as UnderwritingOutcome | '')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                    >
                      <option value="">Select an outcome</option>
                      <option value="APPROVED_WITH_CONDITIONS">Approved with Conditions</option>
                      <option value="APPROVED">Approved (Unconditional)</option>
                      <option value="DECLINED">Declined</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Decision Rationale & Assessment Summary</label>
                    <textarea
                      rows={2}
                      value={decisionRationale}
                      onChange={(e) => setDecisionRationale(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Conditions Precedent (one per line)</label>
                    <textarea
                      rows={2}
                      value={conditionsText}
                      onChange={(e) => setConditionsText(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-[11px]"
                    />
                  </div>

                  <button
                    onClick={handleRecordDecision}
                    disabled={
                      !decisionOutcome ||
                      !decisionRationale.trim() ||
                      (decisionOutcome === 'APPROVED_WITH_CONDITIONS' && !conditionsText.trim())
                    }
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Record Binding Decision & Pass Gate IBVC-01-G4</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
