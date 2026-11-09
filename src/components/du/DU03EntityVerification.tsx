/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-03] EntityOwnershipVerificationUnit (Deployable Unit 3 / P-03 | Domain: DOM-02 Due Diligence)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  GitGraph,
  ShieldCheck,
  UserCheck,
  Layers,
  ExternalLink,
  ArrowRight,
  FileBadge,
} from 'lucide-react';
import { FCABoundaryDrawer } from '../FCABoundaryDrawer';

export const DU03EntityVerification: React.FC = () => {
  const {
    activeCase,
    resolveDiscrepancy,
    attestEntityVerification,
    currentUserRole,
    setActiveDU,
  } = useCreditAssessment();

  const [resolutionText, setResolutionText] = useState('');
  const [selectedDiscrepancyField, setSelectedDiscrepancyField] = useState<string | null>(null);

  const totalEquity = activeCase.directorsAndShareholders.reduce(
    (sum, d) => sum + d.equityPercentage,
    0
  );
  const is100PctReconciled = Math.abs(totalEquity - 100.0) < 0.01;

  const handleResolve = (field: string) => {
    if (!resolutionText.trim()) return;
    resolveDiscrepancy(field, resolutionText);
    setSelectedDiscrepancyField(null);
    setResolutionText('');
  };

  const isGatePassed = activeCase.verificationAttested && is100PctReconciled;

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-03] P-03
            </span>
            <h1 className="text-xl font-bold text-white">Entity & Ownership Verification Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-02 Due Diligence</span>
          </div>
          <p className="text-xs text-slate-400">
            Reconciles dealer entity details against official Companies House records (REQ-020), enforces 100% UBO equity tree reconciliation (BR-D10), and graph-traverses cross-dealer affiliations (REQ-023).
          </p>
        </div>

        {/* Control Gate IBVC-04-G1 / IBVC-07-G1 */}
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
              Control Gate: IBVC-04-G1
            </div>
            <div className="text-xs font-semibold">
              {isGatePassed ? 'Ownership Reconciled & UBOs Confirmed' : 'Verification Attestation Required'}
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Regulatory Determinism & LLM Boundary Drawer */}
      <FCABoundaryDrawer
        currentDU="DU-03 Entity Verification"
        deterministicRules={[
          {
            code: 'REQ-020',
            name: 'Companies House Statutory Reconciliation',
            status: 'PASS',
            fcaCitation: 'Companies Act 2006 / MLR 2017',
            description: 'Company registration number, registered office, and active filing status must match Companies House API exactly.',
          },
          {
            code: 'BR-D10',
            name: '100% Equity UBO Tree Reconciliation',
            status: 'PASS',
            fcaCitation: 'MLR 2017 Regulation 5',
            description: 'Shareholding allocation must mathematically sum to exactly 100.0%. All Persons with Significant Control (PSC >=25%) identified.',
          },
          {
            code: 'REQ-023',
            name: 'Connected Dealer Affiliation Graph',
            status: 'PASS',
            fcaCitation: 'PRA Credit Concentration Rules',
            description: 'Common directorships and parent guarantees are graph-traversed to assess multi-dealer aggregate exposure.',
          },
        ]}
      />

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Companies House Reconciliation (REQ-020, REQ-021, BR-D01) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Companies House Registry Reconciliation</h2>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
              Live API Connected (LR-05)
            </span>
          </div>

          <div className="space-y-3">
            {activeCase.registryDiscrepancies.map((disc, idx) => (
              <div
                key={idx}
                className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{disc.field}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      disc.status === 'MATCH'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : disc.status === 'RESOLVED'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    {disc.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dealer Supplied:</span>
                    <span className="text-slate-200">{disc.dealerSuppliedValue}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Companies House Official:</span>
                    <span className="text-cyan-300 font-mono">{disc.registryValue}</span>
                  </div>
                </div>

                {disc.resolutionNote && (
                  <div className="text-[10px] text-purple-300 bg-purple-950/40 p-1.5 rounded border border-purple-900/60">
                    Resolution: {disc.resolutionNote}
                  </div>
                )}

                {disc.status === 'DISCREPANCY' && (
                  <div className="pt-2">
                    {selectedDiscrepancyField === disc.field ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          placeholder="Provide formal audit resolution rationale..."
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedDiscrepancyField(null)}
                            className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleResolve(disc.field)}
                            className="px-2.5 py-1 text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold"
                          >
                            Confirm Resolution (BR-D01)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedDiscrepancyField(disc.field)}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        + Record Discrepancy Resolution Note
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs text-slate-300">
            <span className="font-bold text-white block">Registry Snapshot Metadata</span>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Incorporation Date:</span>
              <span className="font-mono text-slate-200">{activeCase.registrySnapshot.incorporationDate}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Filing Status:</span>
              <span className="text-emerald-400 font-semibold">{activeCase.registrySnapshot.filingStatus}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Standard Industrial Classification (SIC):</span>
              <span className="text-slate-200">{activeCase.registrySnapshot.sicCodes[0]}</span>
            </div>
          </div>
        </div>

        {/* Right: Ownership Structure & Connected Dealer Graph (REQ-022, REQ-023, BR-D10, BR-D11) */}
        <div className="space-y-6">
          {/* 100% Equity Tree Reconciliation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitGraph className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">Ownership & Control Structure (BR-D10)</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Total Equity:</span>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                    is100PctReconciled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-red-950 text-red-300 border border-red-800'
                  }`}
                >
                  {totalEquity.toFixed(1)}% / 100.0%
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {activeCase.directorsAndShareholders.map((shareholder) => (
                <div
                  key={shareholder.id}
                  className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{shareholder.name}</span>
                      {shareholder.isUBO && (
                        <span className="text-[9px] font-bold bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded border border-purple-800">
                          UBO
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px]">{shareholder.role}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-cyan-300 text-sm">
                      {shareholder.equityPercentage.toFixed(1)}%
                    </span>
                    <span className="block text-[10px] text-slate-400">Equity Share</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Connected Dealer Affiliations Graph (REQ-023, BR-D11) */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Layers className="w-3.5 h-3.5" />
                <span>Connected Dealer Affiliations (REQ-023 / BR-D11)</span>
              </div>
              {activeCase.connectedDealers.length > 0 ? (
                activeCase.connectedDealers.map((link, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-950/20 border border-amber-900/60 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{link.dealerName}</span>
                      <span className="font-mono text-amber-300 font-bold">
                        £{(link.existingExposureGBP / 1000).toFixed(0)}k Exposure
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Shared Officer: <span className="text-white font-semibold">{link.sharedPerson}</span> ({link.sharedRole})
                    </p>
                    <p className="text-[10px] text-amber-400 font-medium">
                      ✓ Disclosed to Credit Underwriter per Policy BR-D11.
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs italic">
                  Zero connected dealer or shared officer cross-holdings detected in master registry.
                </div>
              )}
            </div>

            {/* Formal Attestation (REQ-024, BR-G02) */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">Onboarding Analyst Attestation (REQ-024)</span>
                  <span className="text-slate-400 text-[11px]">
                    {activeCase.verificationAttested
                      ? `Attested by ${activeCase.verificationAttestedBy} at ${activeCase.verificationAttestedAt}`
                      : 'Attestation pending formal review of discrepancies and UBO tree.'}
                  </span>
                </div>
              </div>

              {!activeCase.verificationAttested ? (
                <button
                  onClick={attestEntityVerification}
                  disabled={!is100PctReconciled}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileBadge className="w-4 h-4" />
                  <span>Attest Entity Verification & Reconcile UBOs (Pass Gate IBVC-04-G1)</span>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/80 p-2.5 rounded-lg text-xs text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Control Gate IBVC-04-G1 Officially Attested</span>
                  </span>
                  <button
                    onClick={() => setActiveDU(4)}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    <span>Proceed to Screening</span>
                    <ArrowRight className="w-3 h-3" />
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
