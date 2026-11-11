/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Illustrative risk and pricing simulator. Outputs are not validated for live credit decisions.
 */

import React, { useState, useEffect } from 'react';
import { Scale, Sparkles, ShieldCheck, ArrowRight, X, Calculator, Sliders, TrendingUp, AlertTriangle } from 'lucide-react';

interface RiskPricingModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskPricingModelModal: React.FC<RiskPricingModelModalProps> = ({ isOpen, onClose }) => {
  const [studyData, setStudyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'STUDY' | 'CUSTOM'>('STUDY');

  // Custom scenario form state
  const [companyName, setCompanyName] = useState('Meridian Motor Holdings Ltd');
  const [requestedAmount, setRequestedAmount] = useState(7000000);
  const [gearing, setGearing] = useState(2.1);
  const [dscr, setDscr] = useState(1.9);
  const [craRating, setCraRating] = useState('MEDIUM');
  const [hasRealEstate, setHasRealEstate] = useState(true);
  const [customResult, setCustomResult] = useState<any>(null);
  const [evaluatingCustom, setEvaluatingCustom] = useState(false);

  useEffect(() => {
    if (isOpen && !studyData) {
      setLoading(true);
      fetch('/api/risk-model/study')
        .then((res) => res.json())
        .then((data) => setStudyData(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, studyData]);

  const handleEvaluateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluatingCustom(true);
    try {
      const res = await fetch('/api/risk-model/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          requested_amount_gbp: requestedAmount,
          gearing_ratio: gearing,
          dscr_ratio: dscr,
          cra_rating: craRating,
          has_real_estate_security: hasRealEstate,
        }),
      });
      const data = await res.json();
      setCustomResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingCustom(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Illustrative Risk & Pricing Simulator</h3>
              <p className="text-xs text-slate-400">
                Prototype estimates only; this model is not validated or approved for real credit decisions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model validity disclaimer */}
        <div className="px-6 py-2.5 bg-indigo-950/40 border-b border-indigo-800/40 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Illustrative only:</strong> Sample scenarios and simulator outputs are not calibrated to a validated portfolio model and must not be used to approve, price, or decline credit.
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex space-x-2">
          <button
            onClick={() => setActiveTab('STUDY')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
              activeTab === 'STUDY'
                ? 'border-indigo-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Comparative £7M Loan Structuring Study
          </button>
          <button
            onClick={() => {
              setActiveTab('CUSTOM');
              if (!customResult) handleEvaluateCustom({ preventDefault: () => {} } as any);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
              activeTab === 'CUSTOM'
                ? 'border-indigo-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Interactive Scenario Simulator
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'STUDY' && (
            <div className="space-y-6">
              {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Loading comparative study across risk profiles...
                </div>
              ) : studyData ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <h4 className="font-bold text-white text-sm">{studyData.study_title}</h4>
                    <p className="text-slate-400">{studyData.study_objective}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scenario A: Prime */}
                    <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/60 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-emerald-900/50">
                        <div>
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Company A (Prime)</span>
                          <h5 className="font-bold text-white text-sm">{studyData.scenario_a.company_name}</h5>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {studyData.scenario_a.assigned_risk_grade}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Risk-Adjusted Margin</span>
                          <span className="font-mono text-cyan-300 font-bold text-sm">
                            SONIA + {(studyData.scenario_a.risk_adjusted_margin_sonia_bps / 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Max Advance Rate</span>
                          <span className="font-mono text-emerald-300 font-bold text-sm">
                            {studyData.scenario_a.max_advance_rate_pct}% of Stock
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Estimated PD / LGD</span>
                          <span className="font-mono text-slate-200">
                            {studyData.scenario_a.estimated_pd_pct}% / {studyData.scenario_a.estimated_lgd_pct}%
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Approval Authority</span>
                          <span className="font-mono text-slate-200 font-semibold">{studyData.scenario_a.required_approval_authority}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <span className="font-bold text-white block">Mandatory Covenants:</span>
                        <ul className="list-disc pl-4 text-slate-300 space-y-1">
                          {studyData.scenario_a.mandatory_covenants.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Scenario B: High Risk */}
                    <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/60 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-amber-900/50">
                        <div>
                          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Company B (Sub-Investment)</span>
                          <h5 className="font-bold text-white text-sm">{studyData.scenario_b.company_name}</h5>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          {studyData.scenario_b.assigned_risk_grade}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Risk-Adjusted Margin</span>
                          <span className="font-mono text-cyan-300 font-bold text-sm">
                            SONIA + {(studyData.scenario_b.risk_adjusted_margin_sonia_bps / 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Max Advance Rate</span>
                          <span className="font-mono text-amber-300 font-bold text-sm">
                            {studyData.scenario_b.max_advance_rate_pct}% of Stock
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Estimated PD / LGD</span>
                          <span className="font-mono text-slate-200">
                            {studyData.scenario_b.estimated_pd_pct}% / {studyData.scenario_b.estimated_lgd_pct}%
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">Approval Authority</span>
                          <span className="font-mono text-slate-200 font-semibold">{studyData.scenario_b.required_approval_authority}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <span className="font-bold text-white block">Mandatory Covenants:</span>
                        <ul className="list-disc pl-4 text-slate-300 space-y-1">
                          {studyData.scenario_b.mandatory_covenants.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'CUSTOM' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <form onSubmit={handleEvaluateCustom} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-sm">Configure Loan Scenario Parameters</h4>

                <div>
                  <label className="text-slate-400 block mb-1">Company / Dealer Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Facility Amount (£)</label>
                    <input
                      type="number"
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">CRA Risk Rating</label>
                    <select
                      value={craRating}
                      onChange={(e) => setCraRating(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                    >
                      <option value="LOW">Low Risk</option>
                      <option value="MEDIUM">Medium Risk</option>
                      <option value="HIGH">High Risk</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Gearing Ratio (Debt/Equity)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gearing}
                      onChange={(e) => setGearing(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Interest Cover (DSCR)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={dscr}
                      onChange={(e) => setDscr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="realty"
                    checked={hasRealEstate}
                    onChange={(e) => setHasRealEstate(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <label htmlFor="realty" className="text-slate-300 cursor-pointer">
                    Includes Freehold Real Estate Collateral Charge
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={evaluatingCustom}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center space-x-2"
                >
                  {evaluatingCustom && <Sparkles className="w-4 h-4 animate-spin" />}
                  <span>Run Risk & Pricing Model Prediction</span>
                </button>
              </form>

              {/* Custom Result Output */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-sm">Model Predicted Scenario Output</h4>
                {customResult ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-white">{customResult.company_name}</span>
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {customResult.assigned_risk_grade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Pricing Margin</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          SONIA + {(customResult.risk_adjusted_margin_sonia_bps / 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Max Advance Rate</span>
                        <span className="font-mono text-emerald-300 font-bold">
                          {customResult.max_advance_rate_pct}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-white block">Conditions Precedent:</span>
                      <ul className="list-disc pl-4 text-slate-300 space-y-0.5">
                        {customResult.conditions_precedent?.map((cp: string, i: number) => (
                          <li key={i}>{cp}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-indigo-950/30 border border-indigo-800/50 rounded-lg text-[11px] text-indigo-200">
                      {customResult.human_decision_mandate}
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-500">
                    Configure parameters and click run to predict loan flow.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Close Model Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
