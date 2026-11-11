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
} from 'lucide-react';

export const DU12GovernanceTelemetry: React.FC = () => {
  const {
    auditLedger,
    exceptionsRegister,
    telemetry,
  } = useCreditAssessment();

  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'WORM_LEDGER' | 'EXCEPTIONS' | 'GDPR_DSAR'>('TELEMETRY');

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
            Persisted case audit events are hash-chained. Effort measurement, durable exception handling, and GDPR DSAR servicing are not yet integrated.
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
            <span>Hash-Chained Audit Events ({auditLedger.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('EXCEPTIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'EXCEPTIONS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Exceptions (not persisted)</span>
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
                <span className="text-2xl font-bold font-mono text-amber-300">
                  {telemetry.isMeasured ? `${telemetry.totalEffortMinutes} min` : 'Not measured'}
                </span>
                <span className="text-xs text-slate-400">
                  {telemetry.isMeasured ? `vs ${telemetry.baselineBenchmarkMinutes}m baseline` : 'Time tracking is not instrumented'}
                </span>
              </div>
              {telemetry.isMeasured && (
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                  <TrendingDown className="w-4 h-4" />
                  <span>{telemetry.effortSavingsPct}% Active Effort Saved</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-slate-400 text-xs block font-medium">Total Work Volume (REQ-094)</span>
              <div className="text-2xl font-bold font-mono text-cyan-300">{telemetry.totalCaseCount} Cases</div>
              <p className="text-[11px] text-slate-400">
                Wholesale: {telemetry.caseVolumeByLine.WHOLESALE} | Franchise: {telemetry.caseVolumeByLine.FRANCHISE} | Fleet: {telemetry.caseVolumeByLine.FLEET}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-slate-400 text-xs block font-medium">First-Time Complete Quality (OBJ-03)</span>
              <div className="text-2xl font-bold font-mono text-purple-300">Not measured</div>
              <p className="text-[11px] text-slate-400">
                Active case queries: {telemetry.queryCount} | Resolved query count: {telemetry.reworkCount}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-slate-400 text-xs block font-medium">Overdue Periodic Reviews (OBJ-05)</span>
              <div className="text-2xl font-bold font-mono text-emerald-300">{telemetry.overdueReviewCount}</div>
              <p className="text-[11px] text-slate-400">Based on persisted case review schedules</p>
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
              {telemetry.stageEffort.length === 0 && (
                <p className="text-xs text-amber-300">No measured stage-effort data is available yet.</p>
              )}
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

      {/* Tab 2: Persisted hash-chained audit events */}
      {activeTab === 'WORM_LEDGER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Append-Only Hash-Chained Audit Events</h2>
            </div>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              PostgreSQL audit events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-800">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Event ID</th>
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
                      <span className="text-[10px] text-slate-400 font-mono">{record.actorRole ?? 'Verified identity'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-300">{record.deployableUnit?.split(' ')[0] ?? '—'}</td>
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Policy Exceptions</h2>
          </div>
          <p className="text-xs text-amber-200">
            Exception recording and independent approval are not implemented. Do not treat this screen as an exception register.
          </p>
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
      )}

      {/* Tab 4: GDPR Data Subject Access Request (REQ-087 / LR-04) */}
      {activeTab === 'GDPR_DSAR' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">GDPR Data Subject Access Requests</h2>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-slate-800 px-2 py-0.5 rounded">
              Not Implemented
            </span>
          </div>

          <p className="text-xs text-slate-400">
            DSAR lookup, identity verification, redaction, and response tracking are not connected. Do not enter personal data here.
          </p>

          <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-200">
            DSAR service unavailable — use the organization’s approved privacy-operations process.
          </div>
        </div>
      )}
    </div>
  );
};
