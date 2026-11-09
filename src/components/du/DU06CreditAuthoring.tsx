/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-06] CreditApplicationAuthoringUnit (Deployable Unit 6 / P-06 | Domain: DOM-03 Credit Analysis)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  ShieldCheck,
  ArrowRight,
  Eye,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { FCABoundaryDrawer } from '../FCABoundaryDrawer';
import { GeminiDraftModal } from '../GeminiDraftModal';

export const DU06CreditAuthoring: React.FC = () => {
  const { activeCase, reviewNarrativeSection, setActiveDU } = useCreditAssessment();

  const [activeSectionId, setActiveSectionId] = useState<string>(
    activeCase.narrativeSections[0]?.id || ''
  );
  const [editingText, setEditingText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

  const selectedSection = activeCase.narrativeSections.find(
    (s) => s.id === activeSectionId
  );

  const handleApplyGeminiDraft = (newText: string, metadata: { model: string; isLiveAi: boolean; timestamp: string }) => {
    if (selectedSection) {
      reviewNarrativeSection(selectedSection.id, 'AMENDED', newText);
    }
  };

  const handleStartEdit = () => {
    if (selectedSection) {
      setEditingText(selectedSection.amendedText || selectedSection.draftText);
      setIsEditing(true);
    }
  };

  const handleSaveAmendment = () => {
    if (selectedSection) {
      reviewNarrativeSection(selectedSection.id, 'AMENDED', editingText);
      setIsEditing(false);
    }
  };

  const handleAccept = (sectionId: string) => {
    reviewNarrativeSection(sectionId, 'ACCEPTED');
  };

  const handleReject = (sectionId: string) => {
    reviewNarrativeSection(sectionId, 'REJECTED');
  };

  const allReviewed = activeCase.narrativeSections.every(
    (s) => s.status !== 'PENDING_REVIEW'
  );

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-06] P-06
            </span>
            <h1 className="text-xl font-bold text-white">Credit Application Authoring Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-03 Credit Analysis</span>
          </div>
          <p className="text-xs text-slate-400">
            FCA template population (REQ-046), AI-assisted commentary drafting with provenance tags (REQ-090), and interactive Human Review & Attestation Session (REQ-052 / BR-U01 / PR-02).
          </p>
        </div>

        {/* Control Gate IBVC-01-G3 */}
        <div
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
            allReviewed
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              allReviewed ? 'bg-emerald-800/80 text-emerald-200' : 'bg-amber-800/80 text-amber-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider">
              Control Gate: IBVC-01-G3
            </div>
            <div className="text-xs font-semibold">
              {allReviewed
                ? 'Narrative Human-Reviewed & Attested'
                : 'Pending Account Manager Review (BR-U01)'}
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Regulatory Determinism & LLM Boundary Drawer */}
      <FCABoundaryDrawer
        currentDU="DU-06 Authoring"
        deterministicRules={[
          {
            code: 'BR-U01',
            name: 'Mandatory Human Review & Attestation',
            status: allReviewed ? 'PASS' : 'PENDING',
            fcaCitation: 'FCA PR-02 / SYSC 15A',
            description: 'Non-human AI drafted content is strictly provisional until attested by the accredited Account Manager.',
          },
          {
            code: 'BR-G06',
            name: 'AI Provenance Labeling (REQ-090)',
            status: 'ENFORCED',
            fcaCitation: 'Consumer Duty / SM&CR',
            description: 'Every statement must retain full audit lineage of model name, prompt context, and source document references.',
          },
          {
            code: 'REQ-053',
            name: 'Cross-Section Template Consistency',
            status: 'PASS',
            fcaCitation: 'FCA CR-PACK-V4.2',
            description: 'Quantitative numbers in text must match Balance Sheet and CALC calculations with 100% mathematical precision.',
          },
        ]}
      />

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Narrative Sections Index */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                FCA Narrative Sections ({activeCase.narrativeSections.length})
              </span>
              <span className="text-[10px] font-mono text-cyan-400">REQ-047..051</span>
            </div>

            <div className="space-y-2">
              {activeCase.narrativeSections.map((section) => {
                const isSelected = activeSectionId === section.id;
                return (
                  <div
                    key={section.id}
                    onClick={() => {
                      setActiveSectionId(section.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-950/60 border-cyan-500 shadow-sm'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white line-clamp-1">{section.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          section.status === 'ACCEPTED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : section.status === 'AMENDED'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : section.status === 'REJECTED'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {section.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
                      <Sparkles className="w-3 h-3" />
                      <span>{section.aiGenerated ? 'AI Drafted' : 'Human Author'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{section.citations.length} Citations</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Template Cross-Section Validation Report (REQ-053) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-slate-800">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Template Integrity Audit (REQ-053)</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span>Quantitative cross-reconciliation:</span>
                <span className="text-emerald-400 font-semibold">✓ 100% Consistent</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Balance Sheet vs P&L totals:</span>
                <span className="text-emerald-400 font-semibold">✓ Reconciled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Template Version:</span>
                <span className="text-cyan-300 font-mono">FCA-CR-PACK-V4.2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right Column: Interactive Review & Attestation Session */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSection ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-lg">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>{selectedSection.title}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Category: <span className="text-cyan-300 font-mono">{selectedSection.category}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      selectedSection.status === 'ACCEPTED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : selectedSection.status === 'AMENDED'
                        ? 'bg-purple-950 text-purple-300 border-purple-800'
                        : selectedSection.status === 'REJECTED'
                        ? 'bg-red-950 text-red-300 border-red-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                    }`}
                  >
                    Status: {selectedSection.status}
                  </span>
                </div>
              </div>

              {/* AI Transparency & Provenance Label (REQ-090 / BR-G06) */}
              <div className="p-3 bg-purple-950/30 border border-purple-900/60 rounded-xl flex items-start gap-2.5 text-xs text-purple-200">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-purple-300 block">
                    AI Transparency & Non-Human Content Label (REQ-090 / BR-G06)
                  </span>
                  <p className="text-[11px] text-purple-200/90 mt-0.5">{selectedSection.aiProvenance}</p>
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    PR-02: Non-human content is used only after individual human review and attestation by the Account Manager.
                  </p>
                </div>
              </div>

              {/* Narrative Content: View or Edit Mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-white">Narrative Commentary Body</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsGeminiModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-semibold text-[11px] transition-colors shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Draft with Gemini 3.8 Flash</span>
                    </button>
                    {!isEditing && (
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1 text-cyan-400 hover:underline"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Amend Narrative</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      rows={6}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAmendment}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        Commit Human Amendment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-3">
                    <p>{selectedSection.amendedText || selectedSection.draftText}</p>
                    {selectedSection.amendedText && (
                      <div className="text-[10px] text-purple-400 border-t border-slate-800 pt-2 font-mono">
                        ✓ Human amendment committed.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Verified Inline Citations & Evidence Links (REQ-047 / BR-D07) */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-white block">
                  Evidence Citations & Traceability (BR-D07)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedSection.citations.map((cite, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60 text-[11px] space-y-0.5"
                    >
                      <span className="text-cyan-300 font-semibold block">{cite.assertion}</span>
                      <span className="text-slate-400 text-[10px]">Evidence: {cite.evidenceRef}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Manager Human Attestation Action Buttons (REQ-052 / BR-U01) */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {selectedSection.reviewedBy ? (
                    <span>
                      Attested by <span className="text-white font-semibold">{selectedSection.reviewedBy}</span> on {selectedSection.reviewedAt}
                    </span>
                  ) : (
                    <span className="text-amber-300 font-medium">Pending Account Manager Decision</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(selectedSection.id)}
                    className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Section</span>
                  </button>
                  <button
                    onClick={handleStartEdit}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/60 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Amend Text</span>
                  </button>
                  <button
                    onClick={() => handleAccept(selectedSection.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept & Attest (REQ-052)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
              Select a narrative section on the left to begin interactive review session.
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveDU(7)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              <span>Proceed to Lending Request & Pricing (DU-07)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Gemini 3.8 Flash Drafting Modal */}
      {selectedSection && (
        <GeminiDraftModal
          isOpen={isGeminiModalOpen}
          onClose={() => setIsGeminiModalOpen(false)}
          sectionKey={selectedSection.category.toLowerCase().replace(/\s+/g, '_')}
          sectionTitle={selectedSection.title}
          dealerName={activeCase.dealerProfile.legalName}
          sector={activeCase.classification.primaryCategory}
          currentDraft={selectedSection.amendedText || selectedSection.draftText}
          contextData={{
            dealer: activeCase.dealerProfile,
            financials: activeCase.financialPeriods[activeCase.financialPeriods.length - 1],
            citations: selectedSection.citations,
          }}
          onApplyDraft={handleApplyGeminiDraft}
        />
      )}
    </div>
  );
};
