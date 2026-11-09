/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useCreditAssessment } from '../context/CreditAssessmentContext';
import {
  X,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  CheckCircle,
  GitBranch,
  Lock,
  RotateCw,
  Database,
  BarChart3,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface ASTUnitDefinition {
  num: number;
  code: string;
  name: string;
  domain: string;
  controlGate?: string;
  gateCondition?: string;
  activities: string[];
  rules: string[];
}

const astUnits: ASTUnitDefinition[] = [
  {
    num: 1,
    code: 'DU-01',
    name: 'Request Intake & Triage',
    domain: 'DOM-01 Origination',
    controlGate: 'IBVC-01-G1',
    gateCondition: 'Intake Requirement Set Confirmed (DT-1)',
    activities: ['RegisterCreditRequest', 'ClassifyCaseType', 'AssignAccountableOwner', 'DetectDuplicateOrRecentCases', 'ResolveRequirementSetChecklist'],
    rules: ['REQ-001..007', 'BR-G02', 'BR-E01', 'BR-G05', 'DT-1'],
  },
  {
    num: 2,
    code: 'DU-02',
    name: 'Dealer Information Gathering',
    domain: 'DOM-06 Evidence Management',
    activities: ['ParallelFanOut MultiFormatIngestion', 'CaptureQualitativeDealerNotes', 'EvaluateProvenanceAndGapAnalysis', 'ExecuteDeltaInformationChase'],
    rules: ['REQ-008..019', 'LR-01', 'LR-04', 'BR-P12', 'BR-G03'],
  },
  {
    num: 3,
    code: 'DU-03',
    name: 'Entity & Ownership Verification',
    domain: 'DOM-02 Due Diligence',
    controlGate: 'IBVC-04-G1',
    gateCondition: 'Ownership Reconciled & UBOs Confirmed (100% Tree)',
    activities: ['FetchExternalRegistryData (Companies House)', 'ReconcileEntityAndOfficers', 'TraverseConnectedPartyAffiliations', 'AttestVerificationEvidence'],
    rules: ['REQ-020..024', 'LR-05', 'BR-D01', 'BR-D10', 'BR-D11'],
  },
  {
    num: 4,
    code: 'DU-04',
    name: 'Due Diligence Screening',
    domain: 'DOM-02 Financial Crime',
    controlGate: 'IBVC-01-G2 / DT-3',
    gateCondition: 'Zero Undispositioned Hits & Formal CRA Rating',
    activities: ['Parallel Screening (Sanctions, ID&V, KYC/AML, FCA, Media)', 'ChoiceGate TriageAndDispositionGate', 'ProduceCustomerRiskAssessment (CRA)'],
    rules: ['REQ-025..037', 'LR-01..03', 'BR-D02', 'BR-P03', 'DT-3'],
  },
  {
    num: 5,
    code: 'DU-05',
    name: 'Financial Spreading Analysis',
    domain: 'DOM-03 Credit Analysis',
    activities: ['NormaliseFinancialStatements (Lineage)', 'ValidateStatementReconciliation (CALC-007)', 'Parallel Ratios (CALC-001..005, 009, 010)', 'AggregateCrossLineBorrowingProfile'],
    rules: ['REQ-038..045', 'CALC-001..010', 'BR-D04..06', 'BR-D09'],
  },
  {
    num: 6,
    code: 'DU-06',
    name: 'Credit Application Authoring',
    domain: 'DOM-03 Credit Analysis',
    controlGate: 'IBVC-01-G3',
    gateCondition: 'Narrative Human-Reviewed & Numbers Cross-Reconciled',
    activities: ['PopulateFCACreditTemplate', 'AI Drafter Narrative Commentary', 'Human Review & Attestation Session', 'TemplateIntegrityAndValidation'],
    rules: ['REQ-046..054', 'REQ-090', 'BR-D07', 'BR-U01', 'PR-02'],
  },
  {
    num: 7,
    code: 'DU-07',
    name: 'Lending Request & Pricing',
    domain: 'DOM-03 Credit Analysis',
    controlGate: 'GATE-07',
    gateCondition: 'Four-Eyes Segregation of Duties Pricing Signoff',
    activities: ['FormulateFacilityRequest', 'StructureCovenantsAndTerms', 'ComputePricingSchedule (SONIA + Margin)', 'AuthorisePricingAndTermsDualSignoff'],
    rules: ['REQ-055..059', 'REQ-088', 'BR-E02'],
  },
  {
    num: 8,
    code: 'DU-08',
    name: 'Credit Submission Gateway',
    domain: 'DOM-03 Credit Assessment',
    controlGate: 'IBVC-01-G4',
    gateCondition: 'Independent Underwriting Approval Recorded',
    activities: ['AssembleDecisionReadyPack', 'DeterministicCompletenessGate (DT-2 / CALC-011)', 'AuthoriseSubmissionToCredit (AM)', 'GenerateImmutableSnapshot (SHA-256)', 'CreditUnderwriter Assessment & Rework Loop'],
    rules: ['REQ-060..067', 'CALC-011', 'DT-2', 'BR-P04', 'BR-P05', 'BR-G01'],
  },
  {
    num: 9,
    code: 'DU-09',
    name: 'Post-Approval Fulfillment',
    domain: 'DOM-05 Operations & Funding',
    controlGate: 'GATE-09',
    gateCondition: 'All Conditions Precedent Satisfied -> Funding Live',
    activities: ['Downstream Parallel Tracks (Legal, Direct Debit, SOPRA Apak, Auxiga)', 'TrackApprovalConditionsPrecedent', 'FinaliseCaseClosureAndFundingEnabled'],
    rules: ['REQ-068..073', 'BR-P06', 'BR-P07', 'BR-P08', 'BR-P10'],
  },
  {
    num: 10,
    code: 'DU-10',
    name: 'Periodic Lifecycle Review',
    domain: 'DOM-01 Origination',
    activities: ['ComputeNextPeriodicReviewDate (CALC-012 / DT-4)', 'TriggerEventMonitor (Filings, Resignations)', 'CompileReviewPackWithDeltaView', 'OverdueAlerts & ReviewHistoryArchive'],
    rules: ['REQ-074..078', 'CALC-012', 'DT-4', 'BR-P09', 'BR-E06'],
  },
  {
    num: 11,
    code: 'DU-11',
    name: 'Shared Master Data Reuse',
    domain: 'DOM-06 Master Data Service',
    activities: ['ResolveCanonicalDealerIdentity', 'CurateCrossLendingLineDataReuse (Entity Passport)', 'EvaluateInformationStaleness (CALC-014 / DT-5)', 'ProcessUnreadableManualTranscription'],
    rules: ['REQ-079..083', 'CALC-014', 'DT-5', 'PR-01', 'BR-E06'],
  },
  {
    num: 12,
    code: 'DU-12',
    name: 'Governance, Audit & Telemetry',
    domain: 'DOM-08 Risk, Governance & BI',
    activities: ['EnforceRBAC & DataMinimisation', 'AppendImmutableWORMRecord (Cryptographic Hash)', 'PolicyOverrides & ExceptionRegister (REQ-091)', 'Effort Telemetry (CALC-013 vs 90m Benchmark) & BI'],
    rules: ['REQ-084..097', 'CALC-013', 'LR-04', 'LR-06', 'LR-11', 'BR-E04'],
  },
];

export const ASTVisualMapModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { activeDU, setActiveDU, activeCase } = useCreditAssessment();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">
                CreditPackAssessmentProcess Architecture
              </h2>
              <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-mono">
                12 Deployable Units (DU-01 .. DU-12)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive process tree showing all Deployable Units, Control Gates, Policy Rules, and Autonomous Agents.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {astUnits.map((u) => {
              const isSelected = activeDU === u.num;
              const isCurrentCaseStage = activeCase.currentStageNumber === u.num;

              return (
                <div
                  key={u.code}
                  onClick={() => {
                    setActiveDU(u.num);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/95 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg'
                      : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-700 text-cyan-300">
                        {u.code}
                      </span>
                      {isCurrentCaseStage && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                          Active Case Stage
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm text-white mb-1">{u.name}</h3>
                    <p className="text-[11px] text-cyan-400/90 font-mono mb-2">{u.domain}</p>

                    {u.controlGate && (
                      <div className="mb-2 p-2 rounded bg-slate-900/90 border border-amber-800/40">
                        <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-bold">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Control Gate: {u.controlGate}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{u.gateCondition}</p>
                      </div>
                    )}

                    <div className="space-y-1 mb-3">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Activities:
                      </p>
                      {u.activities.slice(0, 3).map((act, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1">
                          <span className="text-cyan-500">•</span>
                          <span className="line-clamp-1">{act}</span>
                        </div>
                      ))}
                      {u.activities.length > 3 && (
                        <span className="text-[10px] text-slate-500 italic">
                          +{u.activities.length - 3} more activities...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">{u.rules.join(' | ')}</span>
                    <span className="text-cyan-400 font-semibold flex items-center gap-1">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Click any Deployable Unit card to inspect or perform actions.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
          >
            Close Process Map
          </button>
        </div>
      </div>
    </div>
  );
};
