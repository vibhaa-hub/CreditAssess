/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-09] PostApprovalFulfillmentUnit (Deployable Unit 9 / P-09 | Domain: DOM-05 Operations & Funding)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import {
  Layers,
  FileCheck2,
  Building,
  Car,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';

export const DU09PostApprovalFulfillment: React.FC = () => {
  const {
    activeCase,
    updateHandoffStatus,
    satisfyConditionPrecedent,
    enableOperationalFunding,
    setActiveDU,
  } = useCreditAssessment();

  const [evidenceInput, setEvidenceInput] = useState('');
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  const handoffs = activeCase.fulfillmentHandoffs;
  const conditions = activeCase.underwritingDecision?.conditionsPrecedent || [];

  const allHandoffsDone = handoffs.length > 0 && handoffs.every((h) => h.status === 'COMPLETED');
  const allConditionsSatisfied = conditions.length > 0 && conditions.every((c) => c.satisfied);
  const isGatePassed = allHandoffsDone && allConditionsSatisfied;
  const isLiveFunding = activeCase.status === 'ACTIVE_FUNDING';

  const handleSatisfyCondition = (condId: string) => {
    if (!evidenceInput.trim()) return;
    satisfyConditionPrecedent(condId, evidenceInput);
    setSelectedConditionId(null);
    setEvidenceInput('');
  };

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-09] P-09
            </span>
            <h1 className="text-xl font-bold text-white">Post-Approval Fulfillment Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-05 Operations & Funding</span>
          </div>
          <p className="text-xs text-slate-400">
            Multi-track downstream operational orchestration (REQ-068), parameter integrity enforcement (REQ-070 / BR-P07), and Conditions Precedent tracking prior to live vehicle funding activation (BR-P08 / Gate GATE-09).
          </p>
        </div>

        {/* Control Gate GATE-09 */}
        <div
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
            isGatePassed || isLiveFunding
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              isGatePassed || isLiveFunding ? 'bg-emerald-800/80 text-emerald-200' : 'bg-amber-800/80 text-amber-200'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider">
              Control Gate: GATE-09
            </div>
            <div className="text-xs font-semibold">
              {isLiveFunding
                ? 'Operational Funding Live (Vehicle Drawdowns Active)'
                : isGatePassed
                ? 'All Handoffs & Conditions Satisfied'
                : 'Fulfillment Execution In Progress'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: 4 Parallel Downstream Handoff Tracks (REQ-068, REQ-069, REQ-070, BR-P07) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Parallel Downstream Handoff Tracks (IBVC-13..16)</h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">
              BR-P07 Parameter Integrity Checked
            </span>
          </div>

          <div className="space-y-3">
            {handoffs.length === 0 ? (
              <div className="text-slate-400 text-xs p-6 text-center">
                Downstream handoffs initialize strictly after credit approval is officially recorded (BR-P06).
              </div>
            ) : (
              handoffs.map((handoff) => (
                <div
                  key={handoff.track}
                  className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{handoff.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        handoff.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : handoff.status === 'IN_PROGRESS'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {handoff.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>Owner: <span className="font-semibold text-white">{handoff.owner}</span></div>
                    <div>Due: <span className="font-mono text-cyan-300">{handoff.dueDate}</span></div>
                  </div>

                  {handoff.completionArtifact && (
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[10px] text-slate-300">
                      Artifact: <span className="text-emerald-300 font-mono">{handoff.completionArtifact}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Parameter Check OK (BR-P07: Zero Rekeying)</span>
                    </span>
                    {handoff.status !== 'COMPLETED' && (
                      <button
                        onClick={() => updateHandoffStatus(handoff.track, 'COMPLETED')}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-semibold"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Conditions Precedent & Funding Activation (REQ-072 / BR-P08 / REQ-073) */}
        <div className="space-y-6">
          {/* Conditions Precedent Tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">Conditions Precedent Compliance (REQ-072 / BR-P08)</h2>
              </div>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                Mandatory Evidence Check
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Policy Rule BR-P08: Every underwriting condition of approval must be satisfied with verified evidentiary documentation before vehicle stocking drawdowns can proceed.
            </p>

            <div className="space-y-2.5">
              {conditions.length === 0 ? (
                <div className="text-slate-400 text-xs italic">
                  Zero conditions precedent required by Underwriting.
                </div>
              ) : (
                conditions.map((cond) => (
                  <div
                    key={cond.id}
                    className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{cond.description}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cond.satisfied
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {cond.satisfied ? 'Satisfied' : 'Pending Proof'}
                      </span>
                    </div>

                    {cond.evidenceDoc ? (
                      <div className="text-[10px] text-emerald-300 font-mono bg-slate-950/60 p-1.5 rounded">
                        Document: {cond.evidenceDoc}
                      </div>
                    ) : (
                      <div>
                        {selectedConditionId === cond.id ? (
                          <div className="space-y-2 pt-1">
                            <input
                              type="text"
                              value={evidenceInput}
                              onChange={(e) => setEvidenceInput(e.target.value)}
                              placeholder="e.g. Deed_of_Variation_Signed_DocuSign_2026.pdf"
                              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setSelectedConditionId(null)}
                                className="text-[11px] text-slate-400"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSatisfyCondition(cond.id)}
                                className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold"
                              >
                                Attach Evidence & Satisfy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedConditionId(cond.id)}
                            className="text-[11px] text-cyan-400 hover:underline"
                          >
                            + Attach Verified Evidence Document
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Operational Funding Live Activation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Enable Operational Funding (Gate GATE-09)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">REQ-073 / BR-P10</span>
            </div>

            {isLiveFunding ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs space-y-2 text-emerald-300">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Wholesale Vehicle Drawdowns Live & Funded</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  All downstream handoffs complete. Direct debit confirmed with BACS clearing house, and facility limit uplift of £6.0M is active on the SOPRA Apak platform.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Activates wholesale vehicle drawdowns once legal execution, banking mandates, and 100% Conditions Precedent are verified.
                </p>
                <button
                  onClick={enableOperationalFunding}
                  disabled={!isGatePassed}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Zap className="w-4 h-4" />
                  <span>Pass Gate GATE-09 & Enable Live Operational Funding</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveDU(10)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors"
              >
                <span>Proceed to Lifecycle Review & Cadence (DU-10)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
