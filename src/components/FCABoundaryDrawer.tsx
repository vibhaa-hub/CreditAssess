/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Governance and AI control information shown alongside workflow screens.
 */

import React, { useState } from 'react';
import { ShieldCheck, Cpu, Scale, Lock, ChevronDown, ChevronUp, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface FCABoundaryDrawerProps {
  currentDU: string;
  deterministicRules: Array<{
    code: string;
    name: string;
    status: 'ENFORCED' | 'PENDING' | 'PASS';
    fcaCitation: string;
    description: string;
  }>;
  aiAssistanceScope?: {
    allowedTasks: string[];
    prohibitedTasks: string[];
    currentModel: string;
    humanSignoffRequired: boolean;
  };
}

export const FCABoundaryDrawer: React.FC<FCABoundaryDrawerProps> = ({
  currentDU,
  deterministicRules,
  aiAssistanceScope = {
    allowedTasks: [
      'Drafting commentary from verified cell data',
      'Synthesizing adverse media and PEP alert context',
      'Extracting and formatting statutory accounts',
      'Suggesting underwriting clarification questions',
    ],
    prohibitedTasks: [
      'Automated credit limit approvals (BR-G01)',
      'Automated sanction/PEP hit clearing (BR-G02)',
      'Overriding DT-2 completeness gate rules',
      'Modifying CALC-001..014 formula results',
    ],
    currentModel: 'gemini-3.8-flash',
    humanSignoffRequired: true,
  },
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl overflow-hidden backdrop-blur-sm transition-all shadow-lg mb-6">
      {/* Header bar - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white tracking-wide">
                Governance & AI Control Information
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-medium">
                Implementation varies
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                {currentDU}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Informational design notes only — not evidence of regulatory compliance or production control effectiveness.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-indigo-300 font-mono font-medium">
            {isOpen ? 'Collapse Control Notes' : 'Inspect Control Notes'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded progressive disclosure content */}
      {isOpen && (
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/60 space-y-5 text-sm">
          {/* Dual columns: Deterministic vs Generative */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Deterministic Engine */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-3">
                <Lock className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Configured Rule Checks</span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Rule checks use application code and supplied case data. They are not independently validated or certified by this screen.
              </p>
              <div className="space-y-2">
                {deterministicRules.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-white">{r.code}</span>
                        <span className="text-[11px] font-mono text-emerald-400">[{r.fcaCitation}]</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">{r.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{r.description}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono whitespace-nowrap">
                      Declared: {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: AI assistance */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30">
              <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-3">
                <Cpu className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">
                  Configured AI Assistance ({aiAssistanceScope.currentModel})
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                These are intended-use descriptions, not technical enforcement. Verify source data and AI output independently.
              </p>

              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wide mb-1 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Intended AI Tasks</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
                    {aiAssistanceScope.allowedTasks.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wide mb-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <span>Actions Not Intended For AI</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc pl-5">
                    {aiAssistanceScope.prohibitedTasks.map((t, i) => (
                      <li key={i} className="text-rose-300/80">{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance and readiness disclaimer */}
          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                <strong>Not a compliance guarantee:</strong> This application is not certified for regulated decisions. Audit events are hash-chained in PostgreSQL, not WORM storage; funding and external provider workflows are not connected.
              </span>
            </div>
            <span className="font-mono text-[11px] text-indigo-300 bg-slate-900 px-2.5 py-1 rounded border border-indigo-500/30 whitespace-nowrap">
              Production readiness: incomplete
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
