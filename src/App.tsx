/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ApexCredit - Commercial Credit Assessment Application
 * Fully implementing CreditPackAssessmentProcess (DU-01 .. DU-12) with Python Multi-Agent System
 */

import React, { useState } from 'react';
import { CreditAssessmentProvider, useCreditAssessment } from './context/CreditAssessmentContext';
import { Header } from './components/Header';
import { ASTVisualMapModal } from './components/ASTVisualMapModal';
import { PythonAgentConsole } from './components/PythonAgentConsole';

import { DU01IntakeTriage } from './components/du/DU01IntakeTriage';
import { DU02InformationGathering } from './components/du/DU02InformationGathering';
import { DU03EntityVerification } from './components/du/DU03EntityVerification';
import { DU04DueDiligenceScreening } from './components/du/DU04DueDiligenceScreening';
import { DU05FinancialSpreading } from './components/du/DU05FinancialSpreading';
import { DU06CreditAuthoring } from './components/du/DU06CreditAuthoring';
import { DU07PricingStructuring } from './components/du/DU07PricingStructuring';
import { DU08CreditGateway } from './components/du/DU08CreditGateway';
import { DU09PostApprovalFulfillment } from './components/du/DU09PostApprovalFulfillment';
import { DU10LifecycleReview } from './components/du/DU10LifecycleReview';
import { DU11MasterDataReuse } from './components/du/DU11MasterDataReuse';
import { DU12GovernanceTelemetry } from './components/du/DU12GovernanceTelemetry';

import {
  Inbox,
  FileText,
  Building2,
  ShieldAlert,
  FileSpreadsheet,
  Edit,
  DollarSign,
  Send,
  Zap,
  RotateCw,
  Database,
  BarChart3,
  Cpu,
} from 'lucide-react';

const duNavItems = [
  { num: 1, label: 'DU-01 Intake', icon: Inbox, badge: 'P-01' },
  { num: 2, label: 'DU-02 Evidence', icon: FileText, badge: 'P-02' },
  { num: 3, label: 'DU-03 Verification', icon: Building2, badge: 'P-03' },
  { num: 4, label: 'DU-04 Screening', icon: ShieldAlert, badge: 'P-04' },
  { num: 5, label: 'DU-05 Spreading', icon: FileSpreadsheet, badge: 'P-05' },
  { num: 6, label: 'DU-06 Authoring', icon: Edit, badge: 'P-06' },
  { num: 7, label: 'DU-07 Pricing', icon: DollarSign, badge: 'P-07' },
  { num: 8, label: 'DU-08 Gateway', icon: Send, badge: 'P-08' },
  { num: 9, label: 'DU-09 Fulfillment', icon: Zap, badge: 'P-09' },
  { num: 10, label: 'DU-10 Reviews', icon: RotateCw, badge: 'P-10' },
  { num: 11, label: 'DU-11 Master Data', icon: Database, badge: 'P-11' },
  { num: 12, label: 'DU-12 Governance', icon: BarChart3, badge: 'P-12' },
];

const MainContent: React.FC = () => {
  const { activeDU, setActiveDU } = useCreditAssessment();
  const [isAstMapOpen, setIsAstMapOpen] = useState(false);
  const [showPythonConsole, setShowPythonConsole] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header onOpenAstMap={() => setIsAstMapOpen(true)} />

      {/* Deployable Units Navigation Bar */}
      <nav className="bg-slate-900/90 border-b border-slate-800 sticky top-[73px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-nowrap">
            {duNavItems.map(({ num, label, icon: Icon, badge }) => {
              const isActive = activeDU === num;
              return (
                <button
                  key={num}
                  onClick={() => setActiveDU(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                      isActive ? 'bg-black/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle Python Console Button */}
          <button
            onClick={() => setShowPythonConsole(!showPythonConsole)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 border ${
              showPythonConsole
                ? 'bg-purple-950 text-purple-300 border-purple-800 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Python Multi-Agent Console</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 space-y-6">
        {/* Python Multi-Agent Control Center */}
        {showPythonConsole && <PythonAgentConsole />}

        {/* Active Deployable Unit Component */}
        <section className="transition-all">
          {activeDU === 1 && <DU01IntakeTriage />}
          {activeDU === 2 && <DU02InformationGathering />}
          {activeDU === 3 && <DU03EntityVerification />}
          {activeDU === 4 && <DU04DueDiligenceScreening />}
          {activeDU === 5 && <DU05FinancialSpreading />}
          {activeDU === 6 && <DU06CreditAuthoring />}
          {activeDU === 7 && <DU07PricingStructuring />}
          {activeDU === 8 && <DU08CreditGateway />}
          {activeDU === 9 && <DU09PostApprovalFulfillment />}
          {activeDU === 10 && <DU10LifecycleReview />}
          {activeDU === 11 && <DU11MasterDataReuse />}
          {activeDU === 12 && <DU12GovernanceTelemetry />}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-xs text-slate-400 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">ApexCredit Assessment Platform</span>
            <span>•</span>
            <span>Autonomous Python Multi-Agent Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Control Gates: IBVC-01..16</span>
            <span>Policy Rules: REQ-001..097</span>
            <span>Calculations: CALC-001..014</span>
          </div>
        </div>
      </footer>

      {/* AST Process Map Modal */}
      <ASTVisualMapModal isOpen={isAstMapOpen} onClose={() => setIsAstMapOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <CreditAssessmentProvider>
      <MainContent />
    </CreditAssessmentProvider>
  );
}
