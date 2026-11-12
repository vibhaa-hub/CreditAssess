/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ApexCredit - Commercial Credit Assessment Application
 * Fully implementing CreditPackAssessmentProcess (DU-01 .. DU-12) with Python Multi-Agent System
 */

import React, { useEffect, useState } from 'react';
import { CreditAssessmentProvider, useCreditAssessment } from './context/CreditAssessmentContext';
import { Header } from './components/Header';
import { ASTVisualMapModal } from './components/ASTVisualMapModal';
import { PythonAgentConsole } from './components/PythonAgentConsole';
import { emptyCase } from './data/emptyCase';
import { getRequirementsForCaseType } from './data/decisionTables';

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
  const {
    activeDU,
    setActiveDU,
    cases,
    casesLoading,
    casesError,
    caseSaveError,
    refreshCases,
    importCase,
  } = useCreditAssessment();
  const [isAstMapOpen, setIsAstMapOpen] = useState(false);
  const [showPythonConsole, setShowPythonConsole] = useState(true);
  const [caseFile, setCaseFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [integrations, setIntegrations] = useState<{ id: string; purpose: string; status: string }[]>([]);

  useEffect(() => {
    fetch('/api/integrations')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load integration status.');
        setIntegrations(data.integrations);
      })
      .catch((error) => console.error('Integration status request failed:', error));
  }, []);

  const handleCaseImport = async () => {
    if (!caseFile) return;
    setImportError(null);
    try {
      const importedCase: unknown = JSON.parse(await caseFile.text());
      await importCase(importedCase);
      setCaseFile(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not import this case file.');
    }
  };

  const handleCreateCase = async (event: React.FormEvent) => {
    event.preventDefault();
    setImportError(null);
    const newCase = structuredClone(emptyCase);
    newCase.caseId = `SME-${Date.now()}`;
    newCase.receiptDate = new Date().toISOString();
    newCase.originationSource = 'BANK_REFERRAL';
    newCase.dealerProfile.legalName = businessName.trim();
    newCase.dealerProfile.registeredNumber = registrationNumber.trim();
    newCase.dealerProfile.tradingName = tradingName.trim();
    newCase.dealerProfile.contactEmail = businessEmail.trim();
    newCase.requirementChecklist = getRequirementsForCaseType('NEW_RELATIONSHIP');

    try {
      await importCase(newCase);
      setActiveDU(1);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not create the business case.');
    }
  };

  if (casesLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-300">Loading persisted credit cases…</p>
      </div>
    );
  }

  if (casesError || cases.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-12">
        <section className="max-w-3xl mx-auto space-y-6">
          <div>
            <p className="text-cyan-400 text-xs font-semibold uppercase tracking-widest">ApexCredit workspace</p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              {casesError ? 'Case service unavailable' : 'No cases in the database'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Start a case from business details supplied by an SME customer, then collect evidence and complete the assessment.
            </p>
          </div>

          {casesError ? (
            <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-200">
              <p>{casesError}</p>
              <button onClick={() => refreshCases().catch(() => {})} className="mt-3 underline">
                Retry connection
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-5">
              <div>
                <h2 className="font-semibold text-white">Open a business credit case</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Enter customer-supplied identity details. Verification, consent, documents, and financial data remain outstanding until supplied and reviewed.
                </p>
              </div>
              <form onSubmit={handleCreateCase} className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-slate-300">
                  Registered business name *
                  <input required maxLength={300} value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
                </label>
                <label className="text-xs text-slate-300">
                  Company / business registration number *
                  <input required maxLength={100} value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
                </label>
                <label className="text-xs text-slate-300">
                  Trading name
                  <input maxLength={300} value={tradingName} onChange={(event) => setTradingName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
                </label>
                <label className="text-xs text-slate-300">
                  Business contact email
                  <input type="email" maxLength={300} value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
                </label>
                <button type="submit" className="w-fit rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">
                  Create case
                </button>
              </form>
              <details className="border-t border-slate-800 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-300">Import an existing case record</summary>
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-slate-400">Import a complete CreditCase JSON record from an approved source system.</p>
                  <input type="file" accept="application/json,.json" onChange={(event) => setCaseFile(event.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white" />
                  <button disabled={!caseFile} onClick={handleCaseImport} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                    Import case JSON
                  </button>
                </div>
              </details>
              {importError && <p role="alert" className="text-sm text-rose-300">{importError}</p>}
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold text-white">External integrations</h2>
            <p className="mt-1 text-xs text-slate-400">
              Configured means credentials are present; connectivity and provider approval still require verification.
            </p>
            <ul className="mt-4 divide-y divide-slate-800">
              {integrations.map((integration) => (
                <li key={integration.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-slate-300">{integration.purpose}</span>
                  <span className={integration.status === 'NOT_CONFIGURED' ? 'text-amber-300' : 'text-cyan-300'}>
                    {integration.status.replaceAll('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">
            Do not upload personal, financial, or confidential customer data until your identity provider, database,
            access roles, retention rules, and data-processing arrangements have been approved.
          </p>
        </section>
      </div>
    );
  }

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
        {caseSaveError && (
          <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">
            {caseSaveError}
          </div>
        )}
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
