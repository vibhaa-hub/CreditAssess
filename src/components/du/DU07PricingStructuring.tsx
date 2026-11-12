/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-07] LendingRequestPricingUnit (Deployable Unit 7 / P-07 | Domain: DOM-03 Credit Analysis)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import {
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileCheck2,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

export const DU07PricingStructuring: React.FC = () => {
  const {
    activeCase,
    updateFacilityRequest,
    authorizePricing,
    currentUserRole,
    setActiveDU,
  } = useCreditAssessment();

  const [requestedLimit, setRequestedLimit] = useState(
    activeCase.facilityRequest.requestedLimitGBP
  );
  const [marginOverSONIA, setMarginOverSONIA] = useState(
    activeCase.facilityRequest.proposedMarginOverSONIA
  );
  const [stockingFee, setStockingFee] = useState(
    activeCase.facilityRequest.stockingFeePerUnitGBP
  );
  const [purpose, setPurpose] = useState(activeCase.facilityRequest.purpose);
  const [conditionsInput, setConditionsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const delta = requestedLimit - activeCase.facilityRequest.existingLimitGBP;

  const handleUpdate = () => {
    updateFacilityRequest({
      requestedLimitGBP: Number(requestedLimit),
      deltaGBP: delta,
      proposedMarginOverSONIA: Number(marginOverSONIA),
      stockingFeePerUnitGBP: Number(stockingFee),
      purpose,
    });
  };

  const handleAuthorize = () => {
    setErrorMsg(null);
    const res = authorizePricing(
      `Commercial Director (${currentUserRole})`,
      conditionsInput || undefined
    );
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  const isGatePassed = activeCase.pricingSignoff.isAuthorized;

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-07] P-07
            </span>
            <h1 className="text-xl font-bold text-white">Lending Request & Pricing Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-03 Credit Analysis</span>
          </div>
          <p className="text-xs text-slate-400">
            Formulate facility lines (REQ-055), structure curtailment covenants (REQ-056), compute SONIA margins (REQ-057), and enforce Four-Eyes Segregation of Duties (REQ-058 / REQ-088 / BR-E02).
          </p>
        </div>

        {/* Control Gate GATE-07 */}
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
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider">
              Control Gate: GATE-07
            </div>
            <div className="text-xs font-semibold">
              {isGatePassed ? 'Four-Eyes Dual Signoff Authorized' : 'Commercial Authorization Required (BR-E02)'}
            </div>
          </div>
        </div>
      </div>

      {/* Segregation of Duties Violation Alert if triggered */}
      {errorMsg && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl flex items-center gap-3 text-red-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <span className="font-bold block text-sm text-red-100">Segregation of Duties Enforcement</span>
            <p className="text-red-300 text-[11px] mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Facility Request & Terms Form (REQ-055, REQ-056, REQ-059) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">FormulateFacilityRequest & Terms (REQ-055)</h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">
              Prepared by: {activeCase.pricingSignoff.preparerId}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Existing Limit (£)</label>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono font-bold text-white">
                  £{(activeCase.facilityRequest.existingLimitGBP / 1000000).toFixed(2)}M
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Requested New Limit (£)</label>
                <input
                  type="number"
                  step="250000"
                  value={requestedLimit}
                  onChange={(e) => setRequestedLimit(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Net Facility Delta (Change Requested):</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                +£{(delta / 1000000).toFixed(2)}M Uplift
              </span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Lending Purpose & Commercial Rationale (REQ-059)</label>
              <textarea
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white leading-relaxed focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Curtailment Schedule (REQ-056) */}
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <span className="font-semibold text-white block">Repayment Schedule & Covenants</span>
              <p className="text-[11px] text-slate-300 bg-slate-800/50 p-2.5 rounded border border-slate-700/60 leading-relaxed">
                {activeCase.facilityRequest.curtailmentSchedule || 'No repayment schedule or covenant terms have been entered.'}
              </p>
            </div>

            <button
              onClick={handleUpdate}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Recalculate Terms & Reset Authorization State
            </button>
          </div>
        </div>

        {/* Right: Pricing Schedule & 4-Eyes Sign-Off (REQ-057, REQ-058, REQ-088, BR-E02) */}
        <div className="space-y-6">
          {/* Pricing Schedule Calculator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">FacilityPricingSchedule (REQ-057)</h2>
              </div>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                Risk Tiered Pricing
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Base Rate Benchmark</label>
                <div className="bg-slate-800/60 p-2 rounded-lg font-mono text-white">
                  Bank of England SONIA
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Proposed Margin over SONIA (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={marginOverSONIA}
                  onChange={(e) => setMarginOverSONIA(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono font-bold text-cyan-300"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Stocking Fee per Unit (£)</label>
                <input
                  type="number"
                  value={stockingFee}
                  onChange={(e) => setStockingFee(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Facility Commitment Fee</label>
                <div className="bg-slate-800/60 p-2 rounded-lg font-mono text-slate-300">
                  {activeCase.facilityRequest.commitmentFeePct}% per annum
                </div>
              </div>
            </div>
          </div>

          {/* Four-Eyes Governance Sign-off (REQ-058 / REQ-088 / BR-E02) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">
                  AuthorisePricingAndTermsDualSignoff (BR-E02)
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                Segregation of Duties
              </span>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-800/60 rounded-lg text-xs space-y-1">
              <span className="font-bold text-amber-300 block">
                Policy Rule BR-E02 & REQ-088 Governance
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                The preparer of pricing and terms ({activeCase.pricingSignoff.preparerId} - {activeCase.pricingSignoff.preparerRole}) is strictly prohibited from being the sole authorizer. Requires independent sign-off by a Commercial Director.
              </p>
              <div className="text-[10px] text-cyan-300 pt-1 font-mono">
                Current Active User Role: <span className="font-bold">{currentUserRole}</span>
              </div>
            </div>

            {isGatePassed ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs space-y-2 text-emerald-300">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Commercial Terms & Pricing Officially Authorized</span>
                </div>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <div>Authorizer: <span className="font-semibold text-white">{activeCase.pricingSignoff.authorizerId}</span> ({activeCase.pricingSignoff.authorizerRole})</div>
                  <div>Timestamp: <span className="font-mono text-cyan-300">{activeCase.pricingSignoff.authorizedAt}</span></div>
                  <div>Approval Notes: <span className="italic text-slate-200">{activeCase.pricingSignoff.conditionsOrNotes}</span></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Authorizer Conditions / Commercial Stipulations</label>
                  <input
                    type="text"
                    value={conditionsInput}
                    onChange={(e) => setConditionsInput(e.target.value)}
                    placeholder="Enter proposed conditions or commercial stipulations"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>

                <button
                  onClick={handleAuthorize}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Lock className="w-4 h-4" />
                  <span>Execute Four-Eyes Pricing Authorization (GATE-07)</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveDU(8)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors"
              >
                <span>Proceed to Gateway & Completeness Gate (DU-08)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
