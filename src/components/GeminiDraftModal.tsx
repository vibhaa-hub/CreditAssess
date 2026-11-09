/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Interactive Gemini 3.8 Flash Drafting Modal
 * Provides progressive disclosure of prompt context, model responses, inline citation badges, diffing, and FCA human signoff.
 */

import React, { useState } from 'react';
import { Sparkles, Check, X, RefreshCw, Scale, ExternalLink, AlertCircle, Eye, Code, FileText } from 'lucide-react';

interface GeminiDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey: string;
  sectionTitle: string;
  dealerName: string;
  sector: string;
  currentDraft: string;
  contextData: any;
  onApplyDraft: (newText: string, metadata: { model: string; isLiveAi: boolean; timestamp: string }) => void;
}

export const GeminiDraftModal: React.FC<GeminiDraftModalProps> = ({
  isOpen,
  onClose,
  sectionKey,
  sectionTitle,
  dealerName,
  sector,
  currentDraft,
  contextData,
  onApplyDraft,
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [aiMetadata, setAiMetadata] = useState<{ model: string; isLiveAi: boolean; timestamp: string; fcaLabel?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'prompt' | 'diff'>('preview');
  const [editedText, setEditedText] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey,
          sectionTitle,
          dealerName,
          sector,
          contextData,
        }),
      });
      const data = await res.json();
      setGeneratedText(data.text);
      setEditedText(data.text);
      setAiMetadata({
        model: data.model,
        isLiveAi: data.isLiveAi,
        timestamp: data.timestamp,
        fcaLabel: data.fcaLabel,
      });
    } catch (err) {
      console.error('Failed to generate with Gemini:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderHighlightedText = (text: string) => {
    // Highlight [SRC: ...] citation badges with distinct styling
    const parts = text.split(/(\[SRC:[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[SRC:') && part.endsWith(']')) {
        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Gemini 3.8 Flash Drafting Copilot</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  {sectionTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grounding against active dealership record: <strong className="text-slate-200">{dealerName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FCA Regulatory Notice Bar */}
        <div className="px-6 py-2.5 bg-amber-950/30 border-b border-amber-800/30 flex items-center justify-between text-xs text-amber-200/90">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>FCA BR-G01 & BR-G06 Notice:</strong> Generated commentary is assistive. All statements require Account Manager attestation before Underwriting submission.
            </span>
          </div>
          <span className="font-mono text-[10px] bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/30 text-amber-300">
            FCA SYSC 15A
          </span>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'border-indigo-500 text-white bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Draft & Citation Review</span>
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === 'diff'
                  ? 'border-indigo-500 text-white bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Diff vs Current Pack</span>
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === 'prompt'
                  ? 'border-indigo-500 text-white bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Grounding Context & Prompt</span>
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mb-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{generatedText ? 'Re-generate with Gemini' : 'Generate with Gemini 3.8 Flash'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block p-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 animate-pulse text-indigo-400">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Synthesizing commercial credit commentary via Gemini 3.8 Flash...
              </p>
              <p className="text-xs text-slate-400">
                Grounding facts against audited financials, Companies House filings, and CRA commercial bureau reports.
              </p>
            </div>
          ) : !generatedText ? (
            <div className="py-12 text-center space-y-3 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 p-8">
              <Sparkles className="w-10 h-10 text-indigo-400 mx-auto opacity-70" />
              <h4 className="text-sm font-semibold text-white">No Gemini Draft Generated Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click <strong>"Generate with Gemini 3.8 Flash"</strong> above to construct an FCA-compliant commercial narrative with embedded document citations.
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  {/* Generated text with citations highlighted */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {renderHighlightedText(editedText)}
                  </div>

                  {/* Editable textarea if user wants to refine */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Edit commentary prior to applying:
                    </label>
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* AI Metadata Pill */}
                  {aiMetadata && (
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-indigo-300">Engine: {aiMetadata.model}</span>
                        <span className="text-slate-600">|</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${aiMetadata.isLiveAi ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                          {aiMetadata.isLiveAi ? 'Live Gemini 3.8 Flash' : 'Deterministic Fallback Synthesizer'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Generated: {new Date(aiMetadata.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'diff' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 font-semibold block mb-2">Current Draft in Credit Pack:</span>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {currentDraft || '(Section currently empty)'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
                    <span className="text-indigo-300 font-semibold block mb-2">Proposed Gemini 3.8 Flash Draft:</span>
                    <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {renderHighlightedText(editedText)}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'prompt' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                    <div className="text-indigo-400 font-bold">// Grounding Context Payload</div>
                    <pre className="overflow-x-auto text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-lg">
                      {JSON.stringify({ sectionKey, sectionTitle, dealerName, sector, contextData }, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          {generatedText && (
            <button
              onClick={() => {
                if (aiMetadata) {
                  onApplyDraft(editedText, aiMetadata);
                  onClose();
                }
              }}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Credit Pack & Request Attestation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
