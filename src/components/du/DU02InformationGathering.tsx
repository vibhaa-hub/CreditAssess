/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-02] BusinessInformationGatheringUnit (Deployable Unit 2 / P-02 | Domain: DOM-06 Evidence Management)
 */

import React, { useEffect, useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import { isFinancialFieldEntered } from '../../utils/calculations';
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
  FileSearch,
  ArrowRight,
} from 'lucide-react';

interface ExtractedDocument {
  filename: string;
  doc_format: string;
  parser_engine: string;
  row_count: number;
  extracted_tables: {
    table_id: string;
    table_type: string;
    rows: number;
    columns: number;
    cells: { row_idx: number; col_idx: number; header: string; raw_text: string; normalized_value: string | null }[];
  }[];
  extracted_metadata: { category: string; semantic_mapping: string; document_verification: string };
  provenance_hash: string;
}

export const DU02InformationGathering: React.FC = () => {
  const {
    activeCase,
    updateDealerProfile,
    recordRequirementEvidence,
    addInformationRequest,
    closeInformationRequest,
    addQualitativeNote,
    setActiveDU,
  } = useCreditAssessment();

  const [activeTab, setActiveTab] = useState<'INGESTION' | 'NOTES' | 'GAP_ANALYSIS' | 'DELTA_CHASE'>('INGESTION');
  const [ingestionStream, setIngestionStream] = useState<'LEGAL' | 'DIRECTORS' | 'FINANCIAL' | 'CONSENT'>('LEGAL');
  const [profileDraft, setProfileDraft] = useState(activeCase.dealerProfile);

  const [doclingData, setDoclingData] = useState<ExtractedDocument | null>(null);
  const [isDoclingLoading, setIsDoclingLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, { reference: string; provider: string }>>({});
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const handleDocumentUpload = async (file?: File) => {
    if (!file) return;
    setDocumentError(null);
    setDoclingData(null);
    if (file.size > 2 * 1024 * 1024) {
      setDocumentError('CSV documents must be 2 MB or smaller.');
      return;
    }
    setIsDoclingLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      }
      const response = await fetch('/api/docling/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          content_base64: btoa(binary),
          doc_category: ingestionStream,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Document extraction failed (${response.status}).`);
      setDoclingData(result as ExtractedDocument);
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'Document extraction failed.');
    } finally {
      setIsDoclingLoading(false);
    }
  };

  // New Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTakeaways, setNewNoteTakeaways] = useState('');
  const [newNoteType, setNewNoteType] = useState<'PHYSICAL_DEALERSHIP_VISIT' | 'MANAGEMENT_INTERVIEW' | 'TELEPHONE_CALL'>('PHYSICAL_DEALERSHIP_VISIT');

  // New Chase Request state
  const [chaseCode, setChaseCode] = useState('');
  const [chaseDesc, setChaseDesc] = useState('');
  const [chaseRecipient, setChaseRecipient] = useState('');
  const [chaseDueDate, setChaseDueDate] = useState('');
  const [closureRationales, setClosureRationales] = useState<Record<string, string>>({});

  useEffect(() => {
    setProfileDraft(activeCase.dealerProfile);
  }, [activeCase.caseId]);

  const handleSaveBusinessDetails = (event: React.FormEvent) => {
    event.preventDefault();
    updateDealerProfile(profileDraft);
  };

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
      keyTakeaways: takeaways,
    });
    setNewNoteContent('');
    setNewNoteTakeaways('');
  };

  const handleCreateChase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chaseCode.trim() || !chaseDesc.trim() || !chaseRecipient.trim() || !chaseDueDate) return;
    addInformationRequest(chaseCode, chaseDesc, chaseRecipient, chaseDueDate);
    setChaseDesc('');
  };

  const handleCloseInformationRequest = (requestId: string) => {
    const rationale = closureRationales[requestId]?.trim();
    if (!rationale) return;
    closeInformationRequest(requestId, rationale);
    setClosureRationales((current) => ({ ...current, [requestId]: '' }));
  };

  const handleRecordEvidence = (event: React.FormEvent, itemId: string) => {
    event.preventDefault();
    const entry = evidenceInputs[itemId];
    if (!entry?.reference.trim() || !entry.provider.trim()) {
      setEvidenceError('Enter both a bank document reference and the source/provider.');
      return;
    }
    try {
      recordRequirementEvidence(itemId, entry.reference, entry.provider);
      setEvidenceError(null);
    } catch (error) {
      setEvidenceError(error instanceof Error ? error.message : 'Could not record evidence.');
    }
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
            <h1 className="text-xl font-bold text-white">Business Information Gathering Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-06 Evidence Management</span>
          </div>
          <p className="text-xs text-slate-400">
            Customer-supplied case information, CSV extraction, evidence-gap tracking, and staff-recorded qualitative notes.
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
            <span>Evidence & CSV Upload</span>
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

      {/* Tab 1: Evidence and CSV Upload */}
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
                  <span className="text-[10px] text-slate-400 font-medium">Customer evidence and staff entry</span>
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
                    <p className="text-xs text-slate-400">Customer-supplied entity information; confirm it against approved evidence and registry sources.</p>
                  </div>
                  <span className="text-xs font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                  Customer-supplied · verification required
                  </span>
                </div>

                <form onSubmit={handleSaveBusinessDetails} className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {([
                    ['legalName', 'Registered legal name', 'text', true],
                    ['registeredNumber', 'Company / business registration number', 'text', true],
                    ['legalForm', 'Legal form', 'text', false],
                    ['registeredAddress', 'Registered address', 'text', false],
                    ['tradingName', 'Trading name', 'text', false],
                    ['contactEmail', 'Business contact email', 'email', false],
                    ['phone', 'Business contact phone', 'tel', false],
                    ['fcaNumber', 'Regulatory reference (if applicable)', 'text', false],
                  ] as const).map(([field, label, type, required]) => (
                    <label key={field} className="text-[11px] text-slate-400">
                      {label}
                      <input
                        type={type}
                        required={required}
                        maxLength={300}
                        value={profileDraft[field]}
                        onChange={(event) => setProfileDraft((current) => ({ ...current, [field]: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-white"
                      />
                    </label>
                  ))}
                  <label className="text-[11px] text-slate-400 md:col-span-2 lg:col-span-3">
                    Business locations (one per line)
                    <textarea
                      rows={2}
                      value={profileDraft.locations.join('\n')}
                      onChange={(event) => setProfileDraft((current) => ({
                        ...current,
                        locations: event.target.value.split('\n').map((location) => location.trim()).filter(Boolean),
                      }))}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-white"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3 md:col-span-2 lg:col-span-3">
                    <button type="submit" className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white">
                      Save business details
                    </button>
                    <span className="text-[10px] text-amber-300">Customer-supplied values; external registry verification is not configured.</span>
                  </div>
                </form>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Business Locations:</span>
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
                    <p className="text-xs text-slate-400">Enter directors, shareholders, and ownership details from customer-supplied evidence.</p>
                  </div>
                  <span className="text-xs font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                    Review required
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
                    <p className="text-xs text-slate-400">Upload a UTF-8 CSV for source-preserving extraction, or enter figures in DU-05. Parsed rows are not verified or mapped automatically.</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                  <label className="block text-xs font-semibold text-slate-200">
                    Upload a customer CSV document
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(event) => handleDocumentUpload(event.target.files?.[0])}
                      disabled={isDoclingLoading}
                      className="mt-2 block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white"
                    />
                  </label>
                  <p className="text-[11px] text-amber-300">
                    CSV extraction only (2 MB maximum). The original file is processed in memory and is not retained.
                    PDF, Excel, scanned images, and iXBRL require an approved document-storage/parser integration.
                  </p>
                  {isDoclingLoading && <p role="status" className="text-xs text-cyan-300">Extracting rows from the uploaded CSV…</p>}
                  {documentError && <p role="alert" className="text-xs text-rose-300">{documentError}</p>}
                  {doclingData && (
                    <div className="space-y-3 text-xs">
                      <div className="flex flex-wrap justify-between gap-2 text-slate-300">
                        <span>{doclingData.filename} · {doclingData.row_count} rows · {doclingData.parser_engine}</span>
                        <span className="font-mono text-slate-400">SHA-256 {doclingData.provenance_hash}</span>
                      </div>
                      <p className="text-amber-300">
                        Extraction only — meaning, accounting period, and document authenticity are not verified.
                        Review the source and enter confirmed values in DU-05.
                      </p>
                      {doclingData.extracted_tables.map((table) => (
                        <div key={table.table_id} className="overflow-x-auto rounded-lg border border-slate-700">
                          <table className="w-full text-left">
                            <thead className="bg-slate-800 text-slate-300">
                              <tr>{Array.from({ length: table.columns }, (_, column) => (
                                <th key={column} className="px-3 py-2">{table.cells.find((cell) => cell.col_idx === column)?.header ?? `Column ${column + 1}`}</th>
                              ))}</tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: table.rows }, (_, row) => (
                                <tr key={row} className="border-t border-slate-800">
                                  {Array.from({ length: table.columns }, (_, column) => (
                                    <td key={column} className="px-3 py-2 text-slate-200">
                                      {table.cells.find((cell) => cell.row_idx === row && cell.col_idx === column)?.raw_text ?? ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeCase.financialPeriods.map((period, idx) => (
                    <div key={idx} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{period.periodLabel || `Period ${idx + 1}`}</span>
                        <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800">
                          {period.isAudited ? 'Customer marked audited' : 'Customer marked MI'}
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Turnover:</span>
                          <span className="font-semibold text-white">{isFinancialFieldEntered(period, 'turnover') ? `£${(period.turnover / 1000000).toFixed(2)}M` : 'Not entered'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Operating Profit (EBIT):</span>
                          <span className="font-semibold text-emerald-300">{isFinancialFieldEntered(period, 'ebit') ? `£${(period.ebit / 1000).toFixed(0)}k` : 'Not calculated'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Net Assets (Equity):</span>
                          <span className="font-semibold text-cyan-300">{isFinancialFieldEntered(period, 'netAssets') ? `£${(period.netAssets / 1000000).toFixed(2)}M` : 'Not calculated'}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 italic">
                        Source: {period.enteredFields?.length ? 'Values entered in this case' : 'No source figures recorded'}
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
                  <span className="text-xs font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                    Consent evidence not recorded
                  </span>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Electronic Search Authority & Consent Mandate</span>
                    <span className="text-amber-300 font-bold">Awaiting customer evidence</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Record the customer&apos;s consent, purpose, scope, and evidence reference before any external search.
                    No consent provider or external search integration is configured.
                  </p>
                  <div className="flex gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>Signatory: Not supplied</span>
                    <span>Evidence reference: Not recorded</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Qualitative Business Notes (REQ-017) */}
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
                  <option value="PHYSICAL_DEALERSHIP_VISIT">Business Site Visit</option>
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
                  placeholder="Enter observations supported by the customer discussion or site visit"
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
                      <form onSubmit={(event) => handleRecordEvidence(event, item.id)} className="min-w-52 space-y-1.5">
                        <input
                          required
                          maxLength={500}
                          value={evidenceInputs[item.id]?.reference ?? item.provenanceSource ?? ''}
                          onChange={(event) => setEvidenceInputs((current) => ({
                            ...current,
                            [item.id]: { ...current[item.id], reference: event.target.value, provider: current[item.id]?.provider ?? item.provider ?? '' },
                          }))}
                          placeholder="Bank document reference"
                          aria-label={`Evidence reference for ${item.name}`}
                          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-white"
                        />
                        <input
                          required
                          maxLength={300}
                          value={evidenceInputs[item.id]?.provider ?? item.provider ?? ''}
                          onChange={(event) => setEvidenceInputs((current) => ({
                            ...current,
                            [item.id]: { ...current[item.id], provider: event.target.value, reference: current[item.id]?.reference ?? item.provenanceSource ?? '' },
                          }))}
                          placeholder="Source / provider"
                          aria-label={`Source/provider for ${item.name}`}
                          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-white"
                        />
                        <button type="submit" className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-cyan-300">
                          Record evidence reference
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-amber-300">
            Recording a reference does not upload, retain, or verify the source document. Use the bank&apos;s approved document repository.
          </p>
          {evidenceError && <p role="alert" className="text-xs text-rose-300">{evidenceError}</p>}
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
                  required
                  value={chaseCode}
                  onChange={(e) => setChaseCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Recipient (Business Contact)</label>
                <input
                  type="text"
                  required
                  value={chaseRecipient}
                  onChange={(e) => setChaseRecipient(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Due Date (BR-P12)</label>
                <input
                  type="date"
                  required
                  value={chaseDueDate}
                  onChange={(e) => setChaseDueDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Chase Communication Description</label>
                <textarea
                  required
                  rows={3}
                  value={chaseDesc}
                  onChange={(e) => setChaseDesc(e.target.value)}
                  placeholder="Describe the information or document requested from the business"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Business Information Request</span>
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
                      <div className="flex items-center gap-2">
                        <input
                          required
                          maxLength={1000}
                          value={closureRationales[req.id] ?? ''}
                          onChange={(event) => setClosureRationales((current) => ({
                            ...current,
                            [req.id]: event.target.value,
                          }))}
                          placeholder="Enter closure rationale"
                          aria-label={`Closure rationale for ${req.itemCode}`}
                          className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-white"
                        />
                        <button
                          onClick={() => handleCloseInformationRequest(req.id)}
                          disabled={!closureRationales[req.id]?.trim()}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 text-[10px] font-semibold disabled:opacity-40"
                        >
                          Close with rationale
                        </button>
                      </div>
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

    </div>
  );
};
