/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-01] RequestIntakeAndTriageUnit (Deployable Unit 1 / P-01 | Domain: DOM-01 Origination)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import { RequestCategory, LendingLine, UserRole } from '../../types/ast';
import {
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  UserCheck,
  Building,
  FileCheck,
  Check,
} from 'lucide-react';
import { FCABoundaryDrawer } from '../FCABoundaryDrawer';

const statutoryCategories: { type: RequestCategory; label: string; desc: string }[] = [
  { type: 'NEW_RELATIONSHIP', label: '1. New Relationship', desc: 'Onboarding a new business customer to the lending platform.' },
  { type: 'NEW_FRANCHISE', label: '2. New Franchise', desc: 'An existing or new customer requests an additional franchise or business line.' },
  { type: 'INCREASED_BORROWING', label: '3. Increased Borrowing', desc: 'Facility limit uplift across wholesale stocking or term lines.' },
  { type: 'ACQUISITION', label: '4. Acquisition', desc: 'Funding a business acquisition or commercial property purchase.' },
  { type: 'DISPOSAL', label: '5. Disposal', desc: 'Re-evaluating covenants upon sale or hive-off of trading sites.' },
  { type: 'DIRECTOR_SHAREHOLDER_CHANGE', label: '6. Director / Shareholder Change', desc: 'Material change in equity ownership, PSCs, or executive officers.' },
  { type: 'PERIODIC_REVIEW', label: '7. Periodic Review', desc: 'Scheduled annual or risk-cadence comprehensive credit reaffirmation.' },
];

const lendingLinesList: { line: LendingLine; label: string }[] = [
  { line: 'WHOLESALE', label: 'Wholesale Stocking' },
  { line: 'FRANCHISE', label: 'Franchise Funding' },
  { line: 'FLEET', label: 'Commercial Fleet' },
  { line: 'RETAIL', label: 'Retail Point-of-Sale' },
];

export const DU01IntakeTriage: React.FC = () => {
  const { activeCase, updateCaseClassification, assignCaseOwner, setActiveDU } = useCreditAssessment();

  const [selectedCategory, setSelectedCategory] = useState<RequestCategory>(
    activeCase.classification.primaryCategory
  );
  const [selectedLines, setSelectedLines] = useState<LendingLine[]>(
    activeCase.classification.affectedLendingLines
  );
  const [ownerInput, setOwnerInput] = useState(activeCase.assignedOwner);
  const [ownerRole, setOwnerRole] = useState<UserRole>(activeCase.ownerRole);

  const toggleLine = (line: LendingLine) => {
    setSelectedLines((prev) =>
      prev.includes(line) ? prev.filter((l) => l !== line) : [...prev, line]
    );
  };

  const handleSaveClassification = () => {
    updateCaseClassification(selectedCategory, selectedLines);
    assignCaseOwner(ownerInput, ownerRole);
  };

  const isGateConfirmed =
    activeCase.classification.primaryCategory &&
    activeCase.assignedOwner &&
    activeCase.requirementChecklist.length > 0;

  return (
    <div className="space-y-6">
      {/* Unit Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-01] P-01
            </span>
            <h1 className="text-xl font-bold text-white">Request Intake & Triage Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-01 Origination</span>
          </div>
          <p className="text-xs text-slate-400">
            Captures inbound credit requests, executes statutory classification across 7 categories (REQ-002), assigns accountable owner (REQ-005), and derives dynamic checklist DT-1.
          </p>
        </div>

        {/* Control Gate IBVC-01-G1 */}
        <div
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
            isGateConfirmed
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              isGateConfirmed ? 'bg-emerald-800/80 text-emerald-200' : 'bg-amber-800/80 text-amber-200'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider">
              Control Gate: IBVC-01-G1
            </div>
            <div className="text-xs font-semibold">
              {isGateConfirmed ? 'Intake Requirement Set Confirmed' : 'Intake Triage Incomplete'}
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Regulatory Determinism & LLM Boundary Drawer */}
      <FCABoundaryDrawer
        currentDU="DU-01 Intake & Triage"
        deterministicRules={[
          {
            code: 'REQ-002',
            name: 'Statutory 7 Request Classification',
            status: activeCase.classification.primaryCategory ? 'PASS' : 'PENDING',
            fcaCitation: 'FCA PR-01 / DISP 1.3',
            description: 'Inbound requests must be assigned to one of exactly 7 statutory categories, driving downstream policy paths.',
          },
          {
            code: 'DT-1',
            name: 'Decision Table DT-1 Dynamic Checklist Generation',
            status: activeCase.requirementChecklist.length > 0 ? 'PASS' : 'PENDING',
            fcaCitation: 'CONC 5.2A / SYSC 15A',
            description: 'Checklist requirements are populated via deterministic matrix based on category, lending line, and group ownership.',
          },
          {
            code: 'REQ-005',
            name: 'Accountable Case Owner Allocation',
            status: activeCase.assignedOwner ? 'PASS' : 'PENDING',
            fcaCitation: 'SM&CR Individual Accountability',
            description: 'Every file must name a certified individual as accountable case owner before intake gate IBVC-01-G1 is satisfied.',
          },
        ]}
      />

      {/* Grid: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register Credit Request & Origination Source */}
        <div className="space-y-6">
          {/* Card: Activity RegisterCreditRequest */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">RegisterCreditRequest</h2>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                Autonomous Agent
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Master Case Identifier (REQ-001)</span>
                <span className="font-mono text-cyan-300 font-semibold text-sm bg-slate-800 px-2 py-1 rounded block">
                  {activeCase.caseId}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Receipt Timestamp (BR-G02)</span>
                <div className="flex items-center gap-1.5 text-slate-200 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeCase.receiptDate}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Origination Source (REQ-003)</span>
                <span className="font-semibold text-white bg-slate-800/80 px-2.5 py-1 rounded inline-block border border-slate-700">
                  {activeCase.originationSource}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Inbound Channel Payload</span>
                <p className="text-slate-300 bg-slate-800/40 p-2.5 rounded border border-slate-800 text-[11px] leading-relaxed">
                  Customer-provided referral details and documents are recorded in the evidence workflow. No referral document has been attached to this case record.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Duplicate or Recent Case Detector (REQ-006, BR-G05) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>DetectDuplicateOrRecentCases</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Duplicate-check service status is not configured. Confirm the registration number against the bank&apos;s approved master-data source.
            </p>

            {activeCase.duplicateAlert.hasConflict ? (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Historical Relationship Detected (REQ-006)</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Found previous approved submission for legal entity:
                </p>
                <div className="font-mono text-cyan-300 text-[11px] bg-slate-900 p-1.5 rounded">
                  {activeCase.duplicateAlert.linkedCaseIds.join(', ')}
                </div>
                <p className="text-[10px] text-emerald-400 font-medium">
                  ✓ Reusable Passport data eligible for reuse under policy BR-E06.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-lg text-xs flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero duplicate open cases found in active queue.</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Statutory Request Category & Ownership Assignment */}
        <div className="space-y-6">
          {/* Card: ClassifyCaseType */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">ClassifyCaseType (REQ-002)</h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">7 Statutory Types</span>
            </div>

            <div className="space-y-2">
              {statutoryCategories.map((cat) => {
                const isSelected = selectedCategory === cat.type;
                return (
                  <div
                    key={cat.type}
                    onClick={() => setSelectedCategory(cat.type)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-950/60 border-cyan-500 text-white shadow-sm'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">{cat.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{cat.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Affected Lending Lines */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-white block mb-2">
                Affected Lending Lines (REQ-004)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {lendingLinesList.map(({ line, label }) => {
                  const checked = selectedLines.includes(line);
                  return (
                    <button
                      key={line}
                      type="button"
                      onClick={() => toggleLine(line)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left flex items-center justify-between transition-colors ${
                        checked
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <span>{label}</span>
                      {checked && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accountable Owner Assignment */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>AssignAccountableOwner (REQ-005, BR-E01)</span>
              </div>
              <input
                type="text"
                value={ownerInput}
                onChange={(e) => setOwnerInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                placeholder="Account Manager Name"
              />
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="ownerRole"
                    checked={ownerRole === 'WHOLESALE_MANAGER'}
                    onChange={() => setOwnerRole('WHOLESALE_MANAGER')}
                    className="accent-cyan-500"
                  />
                  <span>Wholesale Manager</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="ownerRole"
                    checked={ownerRole === 'ACCOUNT_MANAGER'}
                    onChange={() => setOwnerRole('ACCOUNT_MANAGER')}
                    className="accent-cyan-500"
                  />
                  <span>Account Manager</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveClassification}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-lg transition-all shadow-md"
            >
              Update Classification & Resolve DT-1 Checklist
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Applicable Requirement Set (DT-1) */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">ResolveRequirementSetChecklist (DT-1)</h2>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                Active Checklist
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Decision Table DT-1 generates mandatory evidence and screening requirements determined strictly by case type ({activeCase.classification.primaryCategory}).
            </p>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {activeCase.requirementChecklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                    item.satisfied
                      ? 'bg-emerald-950/20 border-emerald-900/60 text-slate-200'
                      : 'bg-amber-950/20 border-amber-900/60 text-amber-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-cyan-400 font-bold">{item.code}</span>
                      {item.mandatory && (
                        <span className="text-[9px] bg-red-950 text-red-300 px-1 py-0.2 rounded font-bold">
                          MANDATORY
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-white text-xs">{item.name}</p>
                    {item.provenanceSource && (
                      <p className="text-[10px] text-slate-400 italic">Source: {item.provenanceSource}</p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      item.satisfied
                        ? 'bg-emerald-900/60 text-emerald-300'
                        : 'bg-amber-900/60 text-amber-300'
                    }`}
                  >
                    {item.satisfied ? 'Satisfied' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Proceed to Gathering Unit:</span>
              <button
                onClick={() => setActiveDU(2)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                <span>DU-02 Evidence Ingestion</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
