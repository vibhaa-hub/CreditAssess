/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-04] DueDiligenceScreeningUnit (Deployable Unit 4 / P-04 | Domain: DOM-02 Financial Crime Compliance)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import { CRARating } from '../../types/ast';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  FileCheck2,
  Newspaper,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Ban,
  Activity,
  Loader2,
} from 'lucide-react';
import { FCABoundaryDrawer } from '../FCABoundaryDrawer';

export const DU04DueDiligenceScreening: React.FC = () => {
  const {
    activeCase,
    adjudicateScreeningHit,
    escalateToMLRO,
    recordCRA,
    currentUserRole,
    setActiveDU,
  } = useCreditAssessment();

  const [selectedHitId, setSelectedHitId] = useState<string | null>(null);
  const [adjudicationType, setAdjudicationType] = useState<'DISPOSITIONED_FALSE_POSITIVE' | 'CONFIRMED_MATCH'>('DISPOSITIONED_FALSE_POSITIVE');
  const [rationaleInput, setRationaleInput] = useState('');

  // CRA form state
  const [craRatingInput, setCraRatingInput] = useState<CRARating | ''>(
    activeCase.customerRiskAssessment?.craRating || ''
  );
  const [craRationaleInput, setCraRationaleInput] = useState(
    activeCase.customerRiskAssessment?.rationale || ''
  );

  const undispositionedHits = activeCase.screeningFindings.filter(
    (f) => f.status === 'POTENTIAL_MATCH'
  );
  const confirmedHits = activeCase.screeningFindings.filter(
    (f) => f.status === 'CONFIRMED_MATCH'
  );

  const hasValidCRA = !!activeCase.customerRiskAssessment;
  const isGatePassed = undispositionedHits.length === 0 && hasValidCRA;

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  const handleAiAnalyzeHit = async (hitId: string) => {
    const hit = activeCase.screeningFindings.find((f) => f.id === hitId);
    if (!hit) return;
    setIsAiAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/adjudicate-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkType: hit.checkType,
          entityName: hit.targetParty,
          hitDetails: hit,
        }),
      });
      const data = await res.json();
      if (data.reasoning) {
        setRationaleInput(data.reasoning);
      }
    } catch (err) {
      console.error('Hit analysis failed:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleAdjudicate = (hitId: string) => {
    if (!rationaleInput.trim()) return;
    adjudicateScreeningHit(hitId, adjudicationType, rationaleInput);
    setSelectedHitId(null);
    setRationaleInput('');
  };

  const handleSaveCRA = () => {
    if (!craRatingInput || !craRationaleInput.trim()) return;
    recordCRA(craRatingInput, craRationaleInput);
  };

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-04] P-04
            </span>
            <h1 className="text-xl font-bold text-white">Due Diligence Screening Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-02 Financial Crime Compliance</span>
          </div>
          <p className="text-xs text-slate-400">
            Displays case screening data and supports human review. No external AML, sanctions, identity, or media screening provider is connected.
          </p>
        </div>

        {/* Control Gate IBVC-01-G2 / DT-3 */}
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
              Control Gate: IBVC-01-G2
            </div>
            <div className="text-xs font-semibold">
              {isGatePassed ? 'Zero Undispositioned Hits & Valid CRA' : 'FCC Adjudication Required (DT-3)'}
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Regulatory Determinism & LLM Boundary Drawer */}
      <FCABoundaryDrawer
        currentDU="DU-04 Screening"
        deterministicRules={[
          {
            code: 'DT-3',
            name: 'Decision Table DT-3 Screening Disposition',
            status: isGatePassed ? 'PASS' : 'PENDING',
            fcaCitation: 'FCA SYSC 6.3 / JMLSG',
            description: 'Zero potential hits may remain open. Every alert must be confirmed or dispositioned with documented rationale.',
          },
          {
            code: 'BR-P03',
            name: 'FCC Human Reasoned Disposition',
            status: 'ENFORCED',
            fcaCitation: 'MLR 2017 Reg 28',
            description: 'AI may propose identity differentiators, but formal clearance requires certified FCC human signoff.',
          },
          {
            code: 'REQ-029',
            name: 'Mandatory CRA Rating Generation',
            status: hasValidCRA ? 'PASS' : 'PENDING',
            fcaCitation: 'MLR 2017 Reg 18',
            description: 'Every dealer must have an immutable Customer Risk Assessment (Low/Medium/High) determining lifecycle review cadence.',
          },
        ]}
      />

      {/* Confirmed Sanctions / MLRO Alert Banner if any */}
      {confirmedHits.length > 0 && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl flex items-center justify-between text-red-200 text-xs">
          <div className="flex items-center gap-3">
            <Ban className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <span className="font-bold block text-sm text-red-100">
                CRITICAL: MLRO Escalation Active (LR-02 / Proceeds of Crime Act 2002)
              </span>
              <p className="text-red-300 text-[11px] mt-0.5">
                Case progression is suspended. Anti-tipping-off protocols strictly in effect. Contact Head of Compliance before communicating with dealer.
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] bg-red-900 px-2.5 py-1 rounded border border-red-700 text-white font-bold">
            CASE ON HOLD
          </span>
        </div>
      )}

      {/* 5 Parallel Screening Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: 'Sanctions Screening (REQ-027)',
            rule: 'LR-03 OFSI / UN / EU / US',
            icon: ShieldAlert,
            finding: activeCase.screeningFindings.find((f) => f.checkType === 'SANCTIONS'),
            description: 'Screens legal entities, all directors, shareholders & UBOs against global watchlists.',
          },
          {
            title: 'Party ID & Verification (REQ-028)',
            rule: 'LR-01 MLR 2017 (2+2)',
            icon: UserCheck,
            finding: activeCase.screeningFindings.find((f) => f.checkType === 'ID_AND_V'),
            description: 'Electronic ID&V verification via credit bureaus, electoral roll and passport databases.',
          },
          {
            title: 'Corporate KYC & AML (REQ-025/26)',
            rule: 'PEP & Jurisdictional Risk',
            icon: Activity,
            finding: activeCase.screeningFindings.find((f) => f.checkType === 'KYC_AML'),
            description: 'Politically Exposed Persons (PEP) review and enhanced customer due diligence.',
          },
          {
            title: 'FCA Regulatory Register (REQ-030)',
            rule: 'LR-09 Credit Broking Status',
            icon: FileCheck2,
            finding: activeCase.screeningFindings.find((f) => f.checkType === 'FCA_REGISTER'),
            description: 'Verifies dealer permissions on the FCA Financial Services Register and disciplinary history.',
          },
          {
            title: 'Adverse Media Review (REQ-031)',
            rule: 'LR-01 Reputational Risk',
            icon: Newspaper,
            finding: activeCase.screeningFindings.find((f) => f.checkType === 'ADVERSE_MEDIA'),
            description: 'Targeted news, regulatory sanctions, insolvency and criminal litigation searches.',
          },
        ].map((check, idx) => {
          const finding = check.finding;
          const status = finding ? finding.status : 'CLEAR';
          const isPendingDisposition = status === 'POTENTIAL_MATCH';

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isPendingDisposition
                  ? 'bg-amber-950/30 border-amber-500 shadow-md ring-1 ring-amber-500/20'
                  : status === 'CONFIRMED_MATCH'
                  ? 'bg-red-950/30 border-red-600'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <check.icon className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">{check.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      status === 'CLEAR'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : status === 'DISPOSITIONED_FALSE_POSITIVE'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : status === 'CONFIRMED_MATCH'
                        ? 'bg-red-950 text-red-200 border border-red-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-slate-400 block mb-2">{check.rule}</span>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  {finding ? finding.details : check.description}
                </p>

                {finding?.dispositionRationale && (
                  <div className="p-2 rounded bg-purple-950/30 border border-purple-900/60 text-[10px] text-purple-200 mb-2">
                    <span className="font-bold text-purple-300 block">FCC Adjudication:</span>
                    {finding.dispositionRationale}
                    <div className="text-[9px] text-purple-400 mt-1">
                      By {finding.dispositionedBy} on {finding.dispositionedAt}
                    </div>
                  </div>
                )}
              </div>

              {finding && isPendingDisposition && (
                <div className="pt-2 border-t border-amber-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-amber-300 font-semibold">Action Required (DT-3)</span>
                  <button
                    onClick={() => setSelectedHitId(finding.id)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-[10px] transition-colors"
                  >
                    Adjudicate Disposition
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Adjudication Modal / Flyout if selected */}
      {selectedHitId && (
        <div className="bg-slate-900 border-2 border-amber-500/80 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white">
                AdjudicateHitDisposition (Decision Table DT-3 / REQ-032 / BR-P03)
              </h2>
            </div>
            <button
              onClick={() => setSelectedHitId(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Policy Rule BR-P03: No potential match or adverse finding may be cleared without a formally recorded reasoned disposition by an authorized FCC person.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Adjudication Determination</label>
              <div className="flex gap-4 bg-slate-800 p-2 rounded-lg">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="radio"
                    name="disposition"
                    checked={adjudicationType === 'DISPOSITIONED_FALSE_POSITIVE'}
                    onChange={() => setAdjudicationType('DISPOSITIONED_FALSE_POSITIVE')}
                    className="accent-cyan-500"
                  />
                  <span>False Positive (Namesake / Distinguishable)</span>
                </label>
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="radio"
                    name="disposition"
                    checked={adjudicationType === 'CONFIRMED_MATCH'}
                    onChange={() => setAdjudicationType('CONFIRMED_MATCH')}
                    className="accent-red-500"
                  />
                  <span>Confirmed Match (Escalate to MLRO)</span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 block">Reasoned Rationale & Evidence Link (Mandatory)</label>
                <button
                  type="button"
                  onClick={() => handleAiAnalyzeHit(selectedHitId)}
                  disabled={isAiAnalyzing}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-[10px] font-semibold transition-colors disabled:opacity-50"
                >
                  {isAiAnalyzing ? (
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                  )}
                  <span>{isAiAnalyzing ? 'Analyzing via Gemini...' : 'Analyze Hit with Gemini 3.8 Flash'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={rationaleInput}
                onChange={(e) => setRationaleInput(e.target.value)}
                placeholder="Detail verification of date of birth, residential address, or documentation confirming differentiation..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setSelectedHitId(null)}
              className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
            <button
              onClick={() => handleAdjudicate(selectedHitId)}
              disabled={!rationaleInput.trim()}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Commit Reasoned Disposition (REQ-032)
            </button>
          </div>
        </div>
      )}

      {/* Customer Risk Assessment (CRA) Producer (REQ-029 / BR-D03) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">
              ProduceCustomerRiskAssessment (CRA Rating) (REQ-029 / BR-D03)
            </h2>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
            MLR 2017 Requirement
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <div className="space-y-3">
            <label className="text-slate-400 block">Overall Customer Risk Rating</label>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as CRARating[]).map((rating) => {
                const isSelected = craRatingInput === rating;
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setCraRatingInput(rating)}
                    className={`py-2 rounded-lg border font-bold text-center transition-all ${
                      isSelected
                        ? rating === 'LOW'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : rating === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-300 border-amber-500'
                          : 'bg-red-950 text-red-200 border-red-500'
                        : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {rating}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Low = Standard CDD (Annual review cadence DT-4)
              <br />
              Medium = Quarterly review cadence
              <br />
              High = Enhanced Due Diligence (Monthly cadence)
            </p>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <label className="text-slate-400 block">Customer Risk Rationale & Evaluation Summary</label>
            <textarea
              rows={3}
              value={craRationaleInput}
              onChange={(e) => setCraRationaleInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-slate-400">
                Recording role: <span className="text-white font-medium">{currentUserRole}</span>
              </span>
              <button
                onClick={handleSaveCRA}
                disabled={!craRatingInput || !craRationaleInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                Save Human-Entered Risk Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
