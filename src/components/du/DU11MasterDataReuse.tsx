/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-11] MasterDataReuseUnit (Deployable Unit 11 / P-11 | Domain: DOM-06 Shared Master Data Service)
 */

import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import { evaluateInformationAge } from '../../utils/calculations';
import {
  Database,
  FileCheck2,
  AlertTriangle,
  FileText,
  ArrowRight,
} from 'lucide-react';

export const DU11MasterDataReuse: React.FC = () => {
  const { activeCase, setActiveDU } = useCreditAssessment();

  const passport = activeCase.masterPassport;
  const today = new Date().toISOString().split('T')[0];

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
            Review business identity and previously supplied information. No external master-data service or automatic reuse integration is configured.
          </p>
        </div>

        {/* Case Identity Badge */}
        <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-2 text-xs">
          <Database className="w-4 h-4 text-purple-400" />
          <span className="text-slate-400">Case Business ID:</span>
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
            Review the source and validity of information in this case before reusing it. The system does not retrieve or automatically reuse information across products.
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
                    <span className="text-[10px] text-amber-300">External refresh not configured</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Document handling boundary */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Customer document handling</h2>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                Service not configured
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Secure document storage and OCR for PDF, Excel, scanned images, and iXBRL are not configured. CSV extraction in DU-02 is in-memory only and does not retain files or verify their contents.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveDU(2)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-cyan-300">
                Open evidence intake
              </button>
              <button onClick={() => setActiveDU(5)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-cyan-300">
                Enter financial figures
              </button>
            </div>
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
