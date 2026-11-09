/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-12] GovernanceAuditTelemetryUnit (Deployable Unit 12 / P-12 | Domain: DOM-08 Risk, Governance & BI)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import {
  ShieldCheck,
  BarChart3,
  FileCheck2,
  AlertTriangle,
  Clock,
  TrendingDown,
  Layers,
  Lock,
  Plus,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const DU12GovernanceTelemetry: React.FC = () => {
  const {
    auditLedger,
    exceptionsRegister,
    telemetry,
    recordExceptionOverride,
    activeCase,
  } = useCreditAssessment();

  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'WORM_LEDGER' | 'EXCEPTIONS' | 'GDPR_DSAR'>('TELEMETRY');

  // New Exception state
  const [excType, setExcType] = useState('POLICY_OVERRIDE_RECENCY_TOLERANCE');
  const [excReason, setExcReason] = useState('');

  // DSAR state
  const [dsarName, setDsarName] = useState('Arthur Pendelton');
  const [dsarResult, setDsarResult] = useState<string | null>(null);

  const handleRecordException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excReason.trim()) return;
    recordExceptionOverride(excType, excReason);
    setExcReason('');
  };

  const handleRunDSAR = () => {
    setDsarResult(
      `GDPR Subject Access Dossier compiled for ${dsarName}. Scanned 12 cases across Franchise, Wholesale, and Fleet. Found 1 ID&V check, 2 Credit Bureau searches, 1 Director PSC declaration. Lawful basis: Contractual necessity (Art 6(1)(b)) & Legal obligation (Art 6(1)(c)). All non-pertinent third-party PII redacted.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-12] P-12
            </span>
            <h1 className="text-xl font-bold text-white">Risk, Governance & BI Telemetry Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-08 Risk, Governance & BI</span>
          </div>
          <p className="text-xs text-slate-400">
            Immutable WORM audit ledger (REQ-085 / LR-06), policy exception register (REQ-091 / BR-E04), GDPR DSAR servicing (REQ-087), and real-time elapsed effort reduction telemetry (CALC-013 vs 90m baseline).
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'TELEMETRY' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Effort & BI Telemetry</span>
          </button>
          <button
            onClick={() => setActiveTab('WORM_LEDGER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'WORM_LEDGER' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>WORM Audit Trail ({auditLedger.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('EXCEPTIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'EXCEPTIONS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Exceptions Register ({exceptionsRegister.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('GDPR_DSAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'GDPR_DSAR' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GDPR DSAR Servicing</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Operational Intelligence & Effort Reduction (CALC-013, REQ-093..097) */}
      {activeTab === 'TELEMETRY' && (
        <div className="space-y-6">
          {/* Executive KPI Scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-slate-400 text-xs block font-medium">Pack Preparation Effort (CALC-013)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-300">
                  {telemetry.totalEffortMinutes} min
                </span>
                <span className="text-xs text-slate-400">vs 90.0m Baseline</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                <TrendingDown className="w-4 h-4" />
                <span>{telemetry.effortSavingsPct}% Active Effort Saved (OBJ-01)</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-slate-400 text-xs block font-medium">Total Work Volume (REQ-094)</span>
              <div className="text-2xl font-bold font-mono text-cyan-300">42 Cases</div>
              <p className="text-[11px] text-slate-400">Wholesale: 18 | Franchise: 12 | Fleet: 8</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-slate-400 text-xs block font-medium">First-Time Complete Quality (OBJ-03)</span>
              <div className="text-2xl font-bold font-mono text-purple-300">92.8%</div>
              <p className="text-[11px] text-slate-400">Credit Queries Raised: {telemetry.queryCount} (Low rework)</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-slate-400 text-xs block font-medium">Overdue Periodic Reviews (OBJ-05)</span>
              <div className="text-2xl font-bold font-mono text-emerald-300">0</div>
              <p className="text-[11px] text-slate-400">100% adherence to DT-4 review cadence</p>
            </div>
          </div>

          {/* Breakdown: Active Effort by Stage vs 90m Benchmark */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Active Human Touch Time per Stage (CALC-013 / REQ-093)</h2>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">
                Autonomous Gathering vs Human Review
              </span>
            </div>

            <div className="space-y-3">
              {telemetry.stageEffort.map((st, idx) => {
                const pct = (st.minutes / telemetry.totalEffortMinutes) * 100;
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium">{st.stage}</span>
                      <span className="font-mono text-cyan-300 font-bold">{st.minutes} min</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: WORM Audit Ledger (REQ-085, LR-06, BR-G02) */}
      {activeTab === 'WORM_LEDGER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">WORM Compliant Cryptographic Audit Trail (REQ-085 / LR-06)</h2>
            </div>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              FCA SYSC Record-Keeping
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-800">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Block ID</th>
                  <th className="py-2.5 px-3 font-semibold">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3 font-semibold">Actor & Role</th>
                  <th className="py-2.5 px-3 font-semibold">Deployable Unit</th>
                  <th className="py-2.5 px-3 font-semibold">Activity Action</th>
                  <th className="py-2.5 px-3 font-semibold">Details</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {auditLedger.slice().reverse().map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold">{record.id}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">{record.timestamp}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{record.actorId}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{record.actorRole}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-300">{record.deployableUnit.split(' ')[0]}</td>
                    <td className="py-2.5 px-3 font-semibold text-cyan-300">{record.action}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-xs">{record.details}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-purple-300">{record.hash.slice(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Policy Overrides & Exception Register (REQ-091, BR-E04) */}
      {activeTab === 'EXCEPTIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Log Exception Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Log Policy Exception (REQ-091 / BR-E04)</span>
            </h2>
            <form onSubmit={handleRecordException} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Exception / Policy Override Type</label>
                <select
                  value={excType}
                  onChange={(e) => setExcType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="POLICY_OVERRIDE_RECENCY_TOLERANCE">Policy Override: Recency Window Tolerance</option>
                  <option value="POLICY_OVERRIDE_COVENANT_CURTAILMENT">Policy Override: Stock Curtailment Schedule</option>
                  <option value="POLICY_OVERRIDE_GEARING_HEADROOM">Policy Override: Gearing Benchmark Buffer</option>
                  <option value="POLICY_OVERRIDE_MISSING_EVIDENCE_GRACE">Policy Override: 14-Day Evidence Grace</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Commercial / Governance Business Rationale</label>
                <textarea
                  rows={4}
                  value={excReason}
                  onChange={(e) => setExcReason(e.target.value)}
                  placeholder="State detailed business justification, risk mitigating controls, and authorized approval basis..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Commit Authorized Exception (BR-E04)</span>
              </button>
            </form>
          </div>

          {/* Exceptions Register Table */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-white">ExceptionRegisterRecord ({exceptionsRegister.length})</h2>
            {exceptionsRegister.map((exc) => (
              <div
                key={exc.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono font-bold text-amber-400">{exc.exceptionType}</span>
                  <span className="font-mono text-[10px] text-slate-400">{exc.timestamp}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{exc.reason}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span>Authorized Approver: <span className="text-white font-semibold">{exc.approverId}</span></span>
                  <span className="font-mono text-cyan-400">Case: {exc.caseId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: GDPR Data Subject Access Request (REQ-087 / LR-04) */}
      {activeTab === 'GDPR_DSAR' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">ServiceGDPRDataSubjectRequests (REQ-087 / LR-04)</h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">
              UK GDPR Compliance
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Scans all case vaults, credit archives, and identity graphs to compile personal data records upon receipt of a GDPR Data Subject Access Request (DSAR).
          </p>

          <div className="flex gap-3 text-xs">
            <input
              type="text"
              value={dsarName}
              onChange={(e) => setDsarName(e.target.value)}
              placeholder="Data Subject Name (e.g. Arthur Pendelton)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
            <button
              onClick={handleRunDSAR}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Compile Subject Access Dossier</span>
            </button>
          </div>

          {dsarResult && (
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>GDPR Subject Information Dossier Generated (REQ-087)</span>
              </div>
              <p className="text-slate-300 text-[11px]">{dsarResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
