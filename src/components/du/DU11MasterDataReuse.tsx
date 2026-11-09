/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-11] MasterDataReuseUnit (Deployable Unit 11 / P-11 | Domain: DOM-06 Shared Master Data Service)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import { evaluateInformationAge } from '../../utils/calculations';
import {
  Database,
  RefreshCw,
  FileCheck2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Upload,
} from 'lucide-react';

export const DU11MasterDataReuse: React.FC = () => {
  const { activeCase, refreshPassportItem, setActiveDU } = useCreditAssessment();

  const [manualText, setManualText] = useState('');
  const [manualDocName, setManualDocName] = useState('Corrupted_Scanned_Accounts_FY2023.pdf');
  const [transcriptionDone, setTranscriptionDone] = useState(false);

  const passport = activeCase.masterPassport;
  const today = new Date().toISOString().split('T')[0];

  const handleManualTranscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setTranscriptionDone(true);
  };

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-11] P-11
            </span>
            <h1 className="text-xl font-bold text-white">Shared Master Data Reuse Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-06 Master Data Service</span>
          </div>
          <p className="text-xs text-slate-400">
            Canonical Master Dealer Identity (REQ-080 / PR-01), Cross-Line Reusable Entity Passport (REQ-079 / BR-E06), DT-5 Staleness & Expiry Evaluator (CALC-014), and Manual Transcription Fallback (REQ-083 / BR-U05).
          </p>
        </div>

        {/* Master Dealer ID Badge */}
        <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-2 text-xs">
          <Database className="w-4 h-4 text-purple-400" />
          <span className="text-slate-400">Canonical Dealer ID:</span>
          <span className="font-bold text-purple-300 font-mono">{passport.canonicalDealerId}</span>
        </div>
      </div>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Reusable Entity Passport & DT-5 Staleness Evaluation (REQ-079, REQ-081, REQ-082, CALC-014, DT-5, BR-P11) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">CrossLineReusableEntityPassport (REQ-079 / BR-E06)</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              PR-01: Gather Once, Reuse Many
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Policy Rule BR-E06: Information already held and within policy validity is automatically reused across Franchise, Wholesale, and Fleet channels without re-requesting from the dealer.
          </p>

          <div className="space-y-3">
            {passport.reusablePassportItems.map((item, idx) => {
              const ageEval = evaluateInformationAge(item.verifiedDate, today, item.validityDays);
              return (
                <div
                  key={idx}
                  className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{item.itemType}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        !ageEval.isStale
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {ageEval.isStale ? 'Expired (Stale)' : 'Active Valid'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <div>Line: <span className="text-cyan-300 font-mono">{item.sourceLendingLine}</span></div>
                    <div>Age (CALC-014): <span className="font-mono text-white">{ageEval.ageDays} Days</span></div>
                    <div>Policy Max (DT-5): <span className="font-mono text-slate-400">{item.validityDays} Days</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono text-[10px]">Verified: {item.verifiedDate}</span>
                    <button
                      onClick={() => refreshPassportItem(item.itemType)}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh External Data</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Unreadable Documents & Manual Transcription Fallback (REQ-083 / BR-U05) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">ProcessUnreadableDocumentsManualTranscription</h2>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                REQ-083 / BR-U05
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              When an automated OCR ingestion fails or an external feed is corrupted, user can record a manual transcription with mandatory attached source scan.
            </p>

            <form onSubmit={handleManualTranscribe} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Corrupted / Illegible Document File</label>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono text-slate-300 flex items-center justify-between">
                  <span>{manualDocName}</span>
                  <span className="text-red-400 text-[10px] font-bold">OCR Low Confidence (32%)</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Secure Manual Transcription (Key Values & Lineage)</label>
                <textarea
                  rows={4}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Enter manual transcribed balance sheet or P&L line items with auditor certification notes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Commit Manual Transcription & Attach Evidence (BR-U05)</span>
              </button>
            </form>

            {transcriptionDone && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Manual transcription verified and anchored to original scan artifact reference.</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-end">
            <button
              onClick={() => setActiveDU(12)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors"
            >
              <span>Proceed to Governance, Audit & BI Telemetry (DU-12)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
