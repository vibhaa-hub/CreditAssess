/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-02] DealerInformationGatheringUnit (Deployable Unit 2 / P-02 | Domain: DOM-06 Evidence Management)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import {
  FileText,
  Users,
  FileSpreadsheet,
  Lock,
  MessageSquare,
  Clock,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileSearch,
  ExternalLink,
  ArrowRight,
  Sparkles,
  X,
  RotateCw,
} from 'lucide-react';

export const DU02InformationGathering: React.FC = () => {
  const {
    activeCase,
    toggleChecklistItem,
    addInformationRequest,
    closeInformationRequest,
    addQualitativeNote,
    setActiveDU,
  } = useCreditAssessment();

  const [activeTab, setActiveTab] = useState<'INGESTION' | 'NOTES' | 'GAP_ANALYSIS' | 'DELTA_CHASE'>('INGESTION');
  const [ingestionStream, setIngestionStream] = useState<'LEGAL' | 'DIRECTORS' | 'FINANCIAL' | 'CONSENT'>('LEGAL');

  // Docling & OCR Extraction modal state
  const [isDoclingOpen, setIsDoclingOpen] = useState(false);
  const [doclingData, setDoclingData] = useState<any>(null);
  const [isDoclingLoading, setIsDoclingLoading] = useState(false);

  const handleOpenDocling = async () => {
    setIsDoclingOpen(true);
    if (!doclingData) {
      setIsDoclingLoading(true);
      try {
        const res = await fetch('/api/docling/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: 'ApexMotorGroup_AuditedAccounts_FY24.pdf',
            doc_category: 'FINANCIAL_STATEMENTS',
          }),
        });
        const data = await res.json();
        setDoclingData(data);
      } catch (err) {
        console.error('Docling extract error:', err);
      } finally {
        setIsDoclingLoading(false);
      }
    }
  };

  // New Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTakeaways, setNewNoteTakeaways] = useState('');
  const [newNoteType, setNewNoteType] = useState<'PHYSICAL_DEALERSHIP_VISIT' | 'MANAGEMENT_INTERVIEW' | 'TELEPHONE_CALL'>('PHYSICAL_DEALERSHIP_VISIT');

  // New Chase Request state
  const [chaseCode, setChaseCode] = useState('REQ_TAX_CLEARANCE');
  const [chaseDesc, setChaseDesc] = useState('');
  const [chaseRecipient, setChaseRecipient] = useState('David Stirling (Finance Director)');
  const [chaseDueDate, setChaseDueDate] = useState('2026-11-15');

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    const takeaways = newNoteTakeaways
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
    addQualitativeNote({
      visitType: newNoteType,
      content: newNoteContent,
      keyTakeaways: takeaways.length > 0 ? takeaways : ['Operational discussion recorded with management.'],
    });
    setNewNoteContent('');
    setNewNoteTakeaways('');
  };

  const handleCreateChase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chaseDesc.trim()) return;
    addInformationRequest(chaseCode, chaseDesc, chaseRecipient, chaseDueDate);
    setChaseDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-02] P-02
            </span>
            <h1 className="text-xl font-bold text-white">Dealer Information Gathering Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-06 Evidence Management</span>
          </div>
          <p className="text-xs text-slate-400">
            Multi-format OCR/tabular ingestion, provenance auditing (REQ-015), qualitative dealer interview logging (REQ-017), and delta chase orchestration (REQ-018).
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('INGESTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'INGESTION' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Multi-Format Ingestion</span>
          </button>
          <button
            onClick={() => setActiveTab('NOTES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'NOTES' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Qualitative Notes ({activeCase.qualitativeNotes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('GAP_ANALYSIS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'GAP_ANALYSIS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Provenance & Gap Audit</span>
          </button>
          <button
            onClick={() => setActiveTab('DELTA_CHASE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'DELTA_CHASE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Delta Chase ({activeCase.informationRequests.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Multi-Format Ingestion */}
      {activeTab === 'INGESTION' && (
        <div className="space-y-6">
          {/* Fan-Out Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'LEGAL', label: '1. Legal Entity Profile', icon: FileText, rule: 'REQ-008' },
              { id: 'DIRECTORS', label: '2. Directors & UBO Graph', icon: Users, rule: 'REQ-009 / REQ-010' },
              { id: 'FINANCIAL', label: '3. Financial Statements', icon: FileSpreadsheet, rule: 'REQ-011 / REQ-083' },
              { id: 'CONSENT', label: '4. Search Consent & GDPR', icon: Lock, rule: 'REQ-012 / LR-04' },
            ].map(({ id, label, icon: Icon, rule }) => {
              const isSelected = ingestionStream === id;
              return (
                <button
                  key={id}
                  onClick={() => setIngestionStream(id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-950/60 border-cyan-500 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-mono text-cyan-400">{rule}</span>
                  </div>
                  <div className="text-xs font-bold text-white">{label}</div>
                  <span className="text-[10px] text-emerald-400 font-medium">✓ Autonomous Ingest Active</span>
                </button>
              );
            })}
          </div>

          {/* Ingestion Stream Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            {ingestionStream === 'LEGAL' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">IngestLegalEntityData (REQ-008 / REQ-014)</h2>
                    <p className="text-xs text-slate-400">Extracted and normalized attributes from uploaded certificate and portal feed.</p>
                  </div>
                  <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                    Format: Multi-page PDF OCR
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">Registered Legal Name</span>
                    <span className="font-semibold text-white text-sm">{activeCase.dealerProfile.legalName}</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">Registered Company Number</span>
                    <span className="font-mono font-semibold text-cyan-300 text-sm">{activeCase.dealerProfile.registeredNumber}</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">Legal Entity Form</span>
                    <span className="font-semibold text-white text-sm">{activeCase.dealerProfile.legalForm}</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 md:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Registered Office Address</span>
                    <span className="font-semibold text-white">{activeCase.dealerProfile.registeredAddress}</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                    <span className="text-slate-400 block text-[11px]">Trading Name(s)</span>
                    <span className="font-semibold text-white">{activeCase.dealerProfile.tradingName}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Operating Dealership Premises:</span>
                  <div className="flex gap-2">
                    {activeCase.dealerProfile.locations.map((loc, i) => (
                      <span key={i} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                        {loc.split(',')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {ingestionStream === 'DIRECTORS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">IngestDirectorAndShareholderData (REQ-009, REQ-010, LR-01)</h2>
                    <p className="text-xs text-slate-400">Parsed natural and corporate persons with equity percentage and UBO status.</p>
                  </div>
                  <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                    MLR 2017 Compliant
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 px-3 font-semibold">Named Individual / Entity</th>
                        <th className="py-2 px-3 font-semibold">Role</th>
                        <th className="py-2 px-3 font-semibold">Appointed</th>
                        <th className="py-2 px-3 font-semibold">Equity %</th>
                        <th className="py-2 px-3 font-semibold">UBO Declaration</th>
                        <th className="py-2 px-3 font-semibold">Electronic ID&V</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {activeCase.directorsAndShareholders.map((person) => (
                        <tr key={person.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-white">{person.name}</td>
                          <td className="py-2.5 px-3 text-slate-400">{person.role}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{person.appointmentDate}</td>
                          <td className="py-2.5 px-3 font-bold text-cyan-300">{person.equityPercentage.toFixed(1)}%</td>
                          <td className="py-2.5 px-3">
                            {person.isUBO ? (
                              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                                UBO (&gt;=25%)
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Minority</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                person.idvStatus === 'VERIFIED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {person.idvStatus} {person.idvScore > 0 ? `(${person.idvScore}/100)` : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {ingestionStream === 'FINANCIAL' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">IngestFinancialStatements (REQ-011 / REQ-083)</h2>
                    <p className="text-xs text-slate-400">Tabular parser ingested multi-period audited accounts and monthly management information.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleOpenDocling}
                      className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Inspect Docling / OCR Table Extraction</span>
                    </button>
                    <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                      3 Periods Ingested
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeCase.financialPeriods.map((period, idx) => (
                    <div key={idx} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{period.periodLabel}</span>
                        <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800">
                          {period.isAudited ? 'Audited' : 'Management Info'}
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Turnover:</span>
                          <span className="font-semibold text-white">£{(period.turnover / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Operating Profit (EBIT):</span>
                          <span className="font-semibold text-emerald-300">£{(period.ebit / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Net Assets (Equity):</span>
                          <span className="font-semibold text-cyan-300">£{(period.netAssets / 1000000).toFixed(2)}M</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 italic">
                        Cell lineage: Audited Accounts PDF Page 18-24
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setActiveDU(5)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    <span>Open Detailed Spreading Analysis (DU-05)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {ingestionStream === 'CONSENT' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">IngestConsentAndDataProtectionDocs (REQ-012, REQ-013, LR-04)</h2>
                    <p className="text-xs text-slate-400">Lawful basis documentation under UK GDPR and Credit Bureau search mandates.</p>
                  </div>
                  <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                    GDPR Mandate Executed
                  </span>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Electronic Search Authority & Consent Mandate</span>
                    <span className="text-emerald-400 font-bold">✓ Executed via DocuSign</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Signed by Managing Director Arthur Pendelton authorizing external credit bureau inquiries with Equifax and Experian on legal entity and associated directors. Recorded timestamp: 2026-10-16 11:22:10 UTC.
                  </p>
                  <div className="flex gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>Signatory: Arthur Pendelton</span>
                    <span>Lawful Basis: Contractual Necessity & Statutory Compliance (LR-04)</span>
                    <span>Validity: 365 Days</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Qualitative Dealer Notes (REQ-017) */}
      {activeTab === 'NOTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Note Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Log Qualitative Note (REQ-017)</span>
            </h2>
            <form onSubmit={handleCreateNote} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Interaction Type</label>
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="PHYSICAL_DEALERSHIP_VISIT">Physical Dealership Site Visit</option>
                  <option value="MANAGEMENT_INTERVIEW">Management Interview / Review</option>
                  <option value="TELEPHONE_CALL">Telephone / Video Call</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Observation Summary & Operational Details</label>
                <textarea
                  rows={4}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Record showroom condition, footfall, management impressions, EV transition readiness..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Key Takeaways (one per line)</label>
                <textarea
                  rows={2}
                  value={newNoteTakeaways}
                  onChange={(e) => setNewNoteTakeaways(e.target.value)}
                  placeholder="Strong showroom footfall&#10;Stock turnaround within 45 days"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Append Qualitative Case Note</span>
              </button>
            </form>
          </div>

          {/* Existing Notes Feed */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-white">Chronological Qualitative Audit Trail</h2>
            {activeCase.qualitativeNotes.map((note) => (
              <div key={note.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{note.authorId}</span>
                    <span className="text-slate-400">({note.authorRole})</span>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-cyan-300 font-mono text-[10px]">
                      {note.visitType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{note.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{note.content}</p>

                {note.keyTakeaways.length > 0 && (
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Key Takeaways:
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {note.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400">•</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Provenance & Gap Analysis (REQ-015, REQ-016) */}
      {activeTab === 'GAP_ANALYSIS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">EvaluateProvenanceAndGapAnalysis (REQ-015, REQ-016, BR-G03)</h2>
              <p className="text-xs text-slate-400">
                Itemized provenance register tracking provider, received date, effective period, and verification state.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3 font-semibold">Requirement Item</th>
                  <th className="py-2 px-3 font-semibold">Provider / Channel</th>
                  <th className="py-2 px-3 font-semibold">Provenance Source</th>
                  <th className="py-2 px-3 font-semibold">Received</th>
                  <th className="py-2 px-3 font-semibold">Expiry Date</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {activeCase.requirementChecklist.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{item.name}</div>
                      <span className="text-[10px] font-mono text-cyan-400">{item.code}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{item.provider || 'Awaiting ingest'}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.provenanceSource || 'Unverified (BR-G03)'}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{item.receivedDate || '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{item.expiryDate || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.satisfied
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {item.satisfied ? 'Satisfied' : 'Missing Gap'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => toggleChecklistItem(item.id)}
                        className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Delta Chase Communications (REQ-018, BR-P12, BR-E06) */}
      {activeTab === 'DELTA_CHASE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Chase Request */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Dispatch Delta Chase (REQ-018)</span>
            </h2>
            <form onSubmit={handleCreateChase} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Requirement Code</label>
                <input
                  type="text"
                  value={chaseCode}
                  onChange={(e) => setChaseCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Recipient (Dealer Contact)</label>
                <input
                  type="text"
                  value={chaseRecipient}
                  onChange={(e) => setChaseRecipient(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Due Date (BR-P12)</label>
                <input
                  type="date"
                  value={chaseDueDate}
                  onChange={(e) => setChaseDueDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Chase Communication Description</label>
                <textarea
                  rows={3}
                  value={chaseDesc}
                  onChange={(e) => setChaseDesc(e.target.value)}
                  placeholder="Please supply copy of latest VAT quarterly return or landlord lease..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Dealer Request</span>
              </button>
            </form>
          </div>

          {/* Active Docket */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-white">InformationRequestDocket (Active Chase Queue)</h2>
            {activeCase.informationRequests.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                Zero outstanding information chase requests.
              </div>
            ) : (
              activeCase.informationRequests.map((req) => (
                <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold">{req.itemCode}</span>
                      <span className="text-slate-400">To: {req.recipient}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'RECEIVED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : req.status === 'CLOSED_WITH_RATIONALE'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{req.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span>Owner: {req.owner}</span>
                      <span>Due: {req.dueDate}</span>
                    </div>
                    {req.status !== 'RECEIVED' && req.status !== 'CLOSED_WITH_RATIONALE' && (
                      <button
                        onClick={() =>
                          closeInformationRequest(req.id, 'Information satisfied via existing held vault data (BR-E06)')
                        }
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 text-[10px] font-semibold"
                      >
                        Close with Rationale (BR-P12)
                      </button>
                    )}
                  </div>
                  {req.closureRationale && (
                    <div className="text-[10px] text-purple-300 italic">
                      Rationale: {req.closureRationale}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Docling Table & OCR Extraction Modal */}
      {isDoclingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Docling Table-Structure Recovery & OCR Parser</h3>
                  <p className="text-xs text-slate-400">
                    Source: <span className="font-mono text-slate-200">ApexMotorGroup_AuditedAccounts_FY24.pdf</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDoclingOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isDoclingLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RotateCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm text-slate-200">Reconstructing table bounding boxes and OCR confidence...</p>
                </div>
              ) : doclingData ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span>Engine: <strong className="text-indigo-300 font-mono">{doclingData.parser_engine}</strong></span>
                    <span>Confidence: <strong className="text-emerald-300 font-mono">{(doclingData.overall_confidence * 100).toFixed(1)}%</strong></span>
                    <span className="font-mono text-purple-300 text-[10px]">SHA-256: {doclingData.provenance_hash?.substring(0, 16)}...</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doclingData.extracted_tables?.map((tbl: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-white font-mono flex justify-between">
                          <span>{tbl.table_type}</span>
                          <span className="text-[10px] text-emerald-400">Page {tbl.page_number}</span>
                        </div>
                        <div className="p-3 space-y-2">
                          {tbl.cells?.map((c: any, i: number) => (
                            <div key={i} className="flex justify-between p-2 rounded bg-slate-900/60 text-[11px] border border-slate-800">
                              <span className="text-slate-300">{c.raw_text}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-cyan-300 font-bold">
                                  £{(c.normalized_value / 1000).toLocaleString()}k
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">
                                  bbox: [{c.bbox?.slice(0, 2).join(',')}]
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDoclingOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
