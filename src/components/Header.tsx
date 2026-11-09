/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useCreditAssessment } from '../context/CreditAssessmentContext';
import { UserRole } from '../types/ast';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  Clock,
  Layers,
  Activity,
  FileCheck2,
  TrendingDown,
} from 'lucide-react';

const roleLabels: Record<UserRole, { title: string; badgeColor: string }> = {
  ACCOUNT_MANAGER: { title: 'Account Manager (AM)', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  WHOLESALE_MANAGER: { title: 'Wholesale Manager (AM)', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  ONBOARDING_ANALYST: { title: 'Onboarding Analyst', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  FCC_ANALYST: { title: 'FCC Analyst / MLRO', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  COMMERCIAL_DIRECTOR: { title: 'Commercial Director (Approver)', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  CREDIT_UNDERWRITER: { title: 'Credit Underwriter (Independent)', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
  OPERATIONS_ANALYST: { title: 'Operations Analyst', badgeColor: 'bg-teal-100 text-teal-800 border-teal-200' },
  GOVERNANCE_AUDITOR: { title: 'Risk & Governance Auditor', badgeColor: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export const Header: React.FC<{ onOpenAstMap: () => void }> = ({ onOpenAstMap }) => {
  const {
    cases,
    activeCaseId,
    activeCase,
    selectCase,
    currentUserRole,
    setCurrentUserRole,
    telemetry,
    auditLedger,
  } = useCreditAssessment();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Banner: Brand, Active Case, Role Switcher, AST Map */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">ApexCredit</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-cyan-800">
                AST v2.4 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400">Credit Pack Assessment Gateway (DU-01 .. DU-12)</p>
          </div>
        </div>

        {/* Active Case Selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-400 font-medium">Active Case</span>
            <select
              value={activeCaseId}
              onChange={(e) => selectCase(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.caseId} value={c.caseId} className="bg-slate-800 text-white">
                  {c.caseId} - {c.dealerProfile.legalName} ({c.status})
                </option>
              ))}
            </select>
          </div>
          <span
            className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              activeCase.status === 'ACTIVE_FUNDING'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : activeCase.status === 'UNDERWRITING_REVIEW'
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-cyan-950 text-cyan-300 border-cyan-800'
            }`}
          >
            {activeCase.status}
          </span>
        </div>

        {/* Live Role Switcher (Segregation of Duties Demo) */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <UserCheck className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase text-slate-400 font-medium">Active User Role</span>
              <span className="text-[9px] text-slate-400">(4-Eyes Segregation)</span>
            </div>
            <select
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
              className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none cursor-pointer"
            >
              {Object.entries(roleLabels).map(([role, { title }]) => (
                <option key={role} value={role} className="bg-slate-800 text-white">
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls: AST Architecture Map + Telemetry badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAstMap}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-800/60 transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AST Process Map</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Telemetry Snapshot & WORM Blockchain Ledger Height */}
      <div className="bg-slate-950/70 border-t border-slate-800/60 px-4 py-1.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Effort Telemetry (CALC-013):</span>
              <span className="font-semibold text-emerald-300">{telemetry.totalEffortMinutes} min</span>
              <span className="text-slate-500">vs 90m baseline</span>
              <span className="inline-flex items-center gap-0.5 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-900/60">
                <TrendingDown className="w-3 h-3" />
                {telemetry.effortSavingsPct}% reduction
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-slate-300">
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Owner:</span>
              <span className="text-white font-medium">{activeCase.assignedOwner}</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-slate-300">
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Origination:</span>
              <span className="text-cyan-300 font-medium">{activeCase.originationSource}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />
              <span>WORM Audit Ledger:</span>
              <span className="text-purple-300 font-mono font-semibold">{auditLedger.length} blocks</span>
              <span className="text-slate-500">({auditLedger[auditLedger.length - 1]?.hash.slice(0, 14)}...)</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
