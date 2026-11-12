/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-05] FinancialSpreadingAnalysisUnit (Deployable Unit 5 / P-05 | Domain: DOM-03 Credit Analysis)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import type { PeriodFinancials } from '../../types/ast';
import {
  calculateGearing,
  calculateCurrentRatio,
  calculateInterestCover,
  calculateNetProfitMargin,
  calculateYoYChange,
  calculateStockDays,
  validateCashflowReconciliation,
  calculateFacilityExposure,
  isFinancialFieldEntered,
  financialSourceFields,
} from '../../utils/calculations';
import {
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info,
  DollarSign,
  Calculator,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { FCABoundaryDrawer } from '../FCABoundaryDrawer';

const financialInputGroups = [
  {
    title: 'Profit & loss',
    fields: [
      ['turnover', 'Turnover / revenue'],
      ['costOfSales', 'Cost of sales'],
      ['operatingExpenses', 'Operating expenses'],
      ['interestCharge', 'Interest charge'],
      ['tax', 'Tax'],
    ],
  },
  {
    title: 'Balance sheet',
    fields: [
      ['currentAssets', 'Current assets'],
      ['inventory', 'Inventory'],
      ['tradeDebtors', 'Trade debtors'],
      ['cashAndEquivalents', 'Cash and equivalents'],
      ['totalAssets', 'Total assets'],
      ['currentLiabilities', 'Current liabilities'],
      ['tradeCreditors', 'Trade creditors'],
      ['shortTermBorrowings', 'Short-term borrowings'],
      ['longTermBorrowings', 'Long-term borrowings'],
      ['totalLiabilities', 'Total liabilities'],
      ['shareholdersEquity', 'Shareholders’ equity'],
      ['tangibleEquity', 'Tangible equity'],
    ],
  },
  {
    title: 'Cash flow',
    fields: [
      ['openingCash', 'Opening cash'],
      ['operatingCashflow', 'Operating cash flow'],
      ['investingCashflow', 'Investing cash flow'],
      ['financingCashflow', 'Financing cash flow'],
      ['closingCash', 'Closing cash'],
    ],
  },
] as const;

function formatFinancialAmount(
  period: PeriodFinancials,
  field: keyof PeriodFinancials,
  divisor: number,
  decimals: number,
  suffix: string
): string {
  const value = period[field];
  if (!isFinancialFieldEntered(period, field) || typeof value !== 'number') return '—';
  return `${(value / divisor).toFixed(decimals)}${suffix}`;
}

export const DU05FinancialSpreading: React.FC = () => {
  const {
    activeCase,
    updateFinancialCell,
    updateFinancialPeriodMetadata,
    addFinancialPeriod,
    setActiveDU,
  } = useCreditAssessment();
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number>(
    Math.max(0, activeCase.financialPeriods.length - 1)
  );
  const [activeTab, setActiveTab] = useState<'SPREADSHEET' | 'RATIOS' | 'CROSS_LINE' | 'AI_COMMENTARY'>('SPREADSHEET');
  const [aiCommentaryText, setAiCommentaryText] = useState<string>('');
  const [isGeneratingCommentary, setIsGeneratingCommentary] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const periods = activeCase.financialPeriods;
  const currentP = periods[selectedPeriodIdx] || periods[0];
  if (!currentP) {
    return (
      <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <p className="text-xs font-mono font-bold text-cyan-300">[DU-05] Financial spreading</p>
          <h1 className="mt-2 text-xl font-bold text-white">Enter financial data supplied by the business</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            No financial periods are recorded. Upload a supported CSV in DU-02, then enter and verify source figures here.
            Calculations remain unavailable until the relevant inputs are supplied.
          </p>
        </div>
        <button
          onClick={() => {
            addFinancialPeriod();
            setSelectedPeriodIdx(0);
          }}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Enter financial period
        </button>
      </div>
    );
  }
  const priorP = selectedPeriodIdx > 0 ? periods[selectedPeriodIdx - 1] : currentP;

  const fieldEntered = (field: keyof typeof currentP) => isFinancialFieldEntered(currentP, field);
  const gearingReady = fieldEntered('totalBorrowings') && fieldEntered('netAssets');
  const currentRatioReady = fieldEntered('currentAssets') && fieldEntered('currentLiabilities');
  const interestCoverReady = fieldEntered('ebit') && fieldEntered('interestCharge');
  const marginReady = fieldEntered('netProfit') && fieldEntered('turnover');
  const yoyReady = selectedPeriodIdx > 0
    && fieldEntered('turnover')
    && isFinancialFieldEntered(priorP, 'turnover');
  const stockDaysReady = fieldEntered('inventory')
    && fieldEntered('costOfSales')
    && (selectedPeriodIdx === 0 || isFinancialFieldEntered(priorP, 'inventory'));
  const cashflowReady = (['openingCash', 'operatingCashflow', 'investingCashflow', 'financingCashflow', 'closingCash'] as const)
    .every(fieldEntered);
  const financialInputsComplete = financialSourceFields.every(fieldEntered);
  const gearingCalc = gearingReady
    ? calculateGearing(currentP.totalBorrowings, currentP.netAssets)
    : { value: 'awaiting data' as const, flag: undefined };
  const currentRatioCalc = currentRatioReady
    ? calculateCurrentRatio(currentP.currentAssets, currentP.currentLiabilities)
    : { value: 'awaiting data' as const, commentary: 'Enter current assets and current liabilities to calculate.' };
  const interestCoverCalc = interestCoverReady
    ? calculateInterestCover(currentP.ebit, currentP.interestCharge)
    : { value: 'awaiting data' as const, flag: undefined };
  const netProfitMarginCalc = marginReady
    ? calculateNetProfitMargin(currentP.netProfit, currentP.turnover)
    : 'awaiting data';
  const yoyRevCalc = yoyReady ? calculateYoYChange(currentP.turnover, priorP.turnover) : 'awaiting data';
  const stockDaysCalc = stockDaysReady
    ? calculateStockDays(priorP.inventory, currentP.inventory, currentP.costOfSales)
    : 'awaiting data';
  const cashflowAudit = validateCashflowReconciliation(
    currentP.openingCash,
    currentP.operatingCashflow,
    currentP.investingCashflow,
    currentP.financingCashflow,
    currentP.closingCash
  );

  const addPeriod = () => {
    addFinancialPeriod();
    setSelectedPeriodIdx(periods.length);
  };

  const handleGenerateFinancialCommentary = async () => {
    setIsGeneratingCommentary(true);
    try {
      const res = await fetch('/api/gemini/financial-commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: activeCase.dealerProfile.legalName,
          ratios: {
            gearing: gearingCalc.value,
            currentRatio: currentRatioCalc.value,
            interestCover: interestCoverCalc.value,
            netMargin: netProfitMarginCalc,
            stockDays: stockDaysCalc,
          },
          spreadPeriods: periods,
          requestedLimit: activeCase.facilityRequest.requestedLimitGBP,
        }),
      });
      const data = await res.json();
      if (data.commentary) {
        setAiCommentaryText(data.commentary);
      }
    } catch (err) {
      console.error('Failed to generate financial commentary:', err);
    } finally {
      setIsGeneratingCommentary(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiCommentaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-05] P-05
            </span>
            <h1 className="text-xl font-bold text-white">Financial Spreading Analysis Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-03 Credit Analysis</span>
          </div>
          <p className="text-xs text-slate-400">
            Multi-year financial normalization with source cell lineage, mathematical integrity validation (CALC-007), commercial credit ratios (CALC-001..010), and cross-line borrowing aggregation (REQ-043).
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('SPREADSHEET')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'SPREADSHEET' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Multi-Period Accounts</span>
          </button>
          <button
            onClick={() => setActiveTab('RATIOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'RATIOS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Credit Ratios & Benchmarks</span>
          </button>
          <button
            onClick={() => setActiveTab('CROSS_LINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'CROSS_LINE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cross-Line Borrowing Profile</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('AI_COMMENTARY');
              if (!aiCommentaryText) handleGenerateFinancialCommentary();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'AI_COMMENTARY'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-indigo-400 hover:text-indigo-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini Credit Commentary</span>
          </button>
        </div>
      </div>

      {/* Progressive Disclosure: Regulatory Determinism & LLM Boundary Drawer */}
      <FCABoundaryDrawer
        currentDU="DU-05 Financial Spreading"
        deterministicRules={[
          {
            code: 'CALC-001..014',
            name: 'Mathematical Spreading Formulas',
            status: financialInputsComplete ? 'PASS' : 'PENDING',
            fcaCitation: 'FCA CONC 5.2A / PRA SS1/23',
            description: 'Ratios and derived statement totals recalculate from the supplied source figures; missing inputs remain unavailable.',
          },
          {
            code: 'CALC-007',
            name: 'Cashflow Reconciliation Invariant',
            status: cashflowReady && cashflowAudit.isReconciled ? 'PASS' : 'PENDING',
            fcaCitation: 'Statutory Accounts Standards',
            description: 'Opening Cash + Cash Flows - Closing Cash must mathematically equal £0 discrepancy before submission.',
          },
          {
            code: 'REQ-043',
            name: 'Multi-Line Borrowing Consolidation',
            status: activeCase.crossLineExposures.length ? 'PASS' : 'PENDING',
            fcaCitation: 'External exposure source',
            description: 'No connected servicing platform is configured; exposure data must be supplied and reviewed.',
          },
        ]}
      />

      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Source figures · GBP</h2>
            <p className="mt-1 text-xs text-slate-400">
              Values are saved to this case. Gross profit, EBIT, profit before tax, net profit, total borrowings,
              net assets, and cash-flow difference are recalculated from their component inputs.
            </p>
          </div>
          <button onClick={addPeriod} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-cyan-300">
            Add financial period
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map((period, index) => (
            <button
              key={`${period.periodEndDate}-${index}`}
              onClick={() => setSelectedPeriodIdx(index)}
              className={`rounded-lg px-3 py-1.5 text-xs ${selectedPeriodIdx === index ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              {period.periodLabel || `Period ${index + 1}`}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs text-slate-300">
            Period label
            <input
              value={currentP.periodLabel}
              onChange={(event) => updateFinancialPeriodMetadata(selectedPeriodIdx, { periodLabel: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              placeholder="e.g. Financial year ended"
            />
          </label>
          <label className="text-xs text-slate-300">
            Period end date
            <input
              type="date"
              value={currentP.periodEndDate}
              onChange={(event) => updateFinancialPeriodMetadata(selectedPeriodIdx, { periodEndDate: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
            />
          </label>
          <label className="flex items-center gap-2 pt-5 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={currentP.isAudited}
              onChange={(event) => updateFinancialPeriodMetadata(selectedPeriodIdx, { isAudited: event.target.checked })}
            />
            Customer identifies period as audited (not independently verified)
          </label>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {financialInputGroups.map((group) => (
            <fieldset key={group.title} className="space-y-2 rounded-lg border border-slate-800 p-3">
              <legend className="px-1 text-xs font-semibold text-cyan-300">{group.title}</legend>
              {group.fields.map(([field, label]) => (
                <label key={field} className="block text-[11px] text-slate-400">
                  {label}
                  <input
                    type="number"
                    step="any"
                    value={isFinancialFieldEntered(currentP, field) ? currentP[field] : ''}
                    onChange={(event) => updateFinancialCell(
                      selectedPeriodIdx,
                      field,
                      event.target.value === '' ? undefined : Number(event.target.value)
                    )}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-right font-mono text-white"
                  />
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <p className="text-[11px] text-amber-300">
          Confirm each amount against the customer&apos;s source document. Uploading a CSV in DU-02 does not automatically map or verify its contents.
        </p>
      </div>

      {/* Tab 1: Multi-Period Normalized Accounts */}
      {activeTab === 'SPREADSHEET' && (
        <div className="space-y-6">
          {/* Cashflow Mathematical Audit Banner (CALC-007) */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              cashflowReady && cashflowAudit.isReconciled
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : cashflowReady
                  ? 'bg-red-950/40 border-red-800 text-red-300'
                  : 'bg-amber-950/40 border-amber-800 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {cashflowReady && cashflowAudit.isReconciled
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <div>
                <span className="font-bold">
                  Mathematical Integrity Audit: Cashflow Reconciliation (CALC-007)
                </span>
                <p className="text-[11px] text-slate-300">
                  {cashflowReady
                    ? `Calculated cash-flow difference: £${cashflowAudit.discrepancy.toLocaleString()}`
                    : 'Enter all cash-flow inputs to run reconciliation.'}
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] px-2 py-1 rounded font-bold border border-slate-700">
              {cashflowReady ? `Difference: £${cashflowAudit.discrepancy}` : 'Pending source data'}
            </span>
          </div>

          {/* Interactive Normalized Financial Spreading Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">NormalisedFinancialChartOfAccounts (REQ-038, BR-D04)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Currency: GBP (£) | Cell Lineage Tracked</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-800">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400">
                    <th className="py-2.5 px-4 font-semibold w-1/3">Financial Metric / Spreading Line</th>
                    {periods.map((p, idx) => (
                      <th key={idx} className="py-2.5 px-4 font-semibold text-right">
                        <div>{p.periodLabel || `Period ${idx + 1}`}</div>
                        <span className="text-[10px] font-mono text-cyan-400 font-normal">
                          {p.isAudited ? 'Customer marked audited' : 'Customer marked MI'}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {/* P&L Section */}
                  <tr className="bg-slate-950/40 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    <td colSpan={periods.length + 1} className="py-2 px-4">
                      Profit & Loss (P&L) Statement
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-medium text-white flex items-center justify-between">
                      <span>Turnover / Revenue</span>
                      <span className="text-[9px] text-slate-400 font-mono italic">Ref: P&L Line 1</span>
                    </td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2 px-4 text-right font-mono font-semibold text-white">
                        £{formatFinancialAmount(p, 'turnover', 1000000, 2, 'M')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-400">Cost of Sales (CoS)</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2 px-4 text-right font-mono text-slate-300">
                        £{formatFinancialAmount(p, 'costOfSales', 1000000, 2, 'M')}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-800/30 font-semibold">
                    <td className="py-2 px-4 text-white">Gross Profit</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2 px-4 text-right font-mono text-emerald-300">
                        £{formatFinancialAmount(p, 'grossProfit', 1000000, 2, 'M')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-400">Operating Expenses</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2 px-4 text-right font-mono text-slate-300">
                        £{formatFinancialAmount(p, 'operatingExpenses', 1000000, 2, 'M')}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-800/50 font-bold text-white">
                    <td className="py-2.5 px-4 flex items-center justify-between">
                      <span>Operating Profit (EBIT)</span>
                      <span className="text-[9px] text-cyan-400 font-mono">CALC-003 Driver</span>
                    </td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2.5 px-4 text-right font-mono text-cyan-300 font-bold">
                        £{formatFinancialAmount(p, 'ebit', 1000, 0, 'k')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-400">Interest Charge</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2 px-4 text-right font-mono text-amber-300">
                        £{formatFinancialAmount(p, 'interestCharge', 1000, 0, 'k')}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-800/60 font-bold">
                    <td className="py-2.5 px-4 text-emerald-300">Net Profit Attributable</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2.5 px-4 text-right font-mono text-emerald-400 text-sm">
                        £{formatFinancialAmount(p, 'netProfit', 1000, 0, 'k')}
                      </td>
                    ))}
                  </tr>

                  {/* Balance Sheet Section */}
                  <tr className="bg-slate-950/40 text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                    <td colSpan={periods.length + 1} className="py-2 px-4">
                      Balance Sheet & Capital Structure
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-300">Inventory (Stock)</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2 px-4 text-right font-mono text-slate-200">
                        £{formatFinancialAmount(p, 'inventory', 1000000, 2, 'M')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-300">Current Assets</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2 px-4 text-right font-mono text-slate-200">
                        £{formatFinancialAmount(p, 'currentAssets', 1000000, 2, 'M')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-300">Current Liabilities</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2 px-4 text-right font-mono text-slate-200">
                        £{formatFinancialAmount(p, 'currentLiabilities', 1000000, 2, 'M')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-300">Total Borrowings (Debt)</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2 px-4 text-right font-mono text-amber-300">
                        £{formatFinancialAmount(p, 'totalBorrowings', 1000000, 2, 'M')}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-800/70 font-bold">
                    <td className="py-2.5 px-4 text-cyan-300">Net Assets / Shareholders Equity (Net Worth)</td>
                    {periods.map((p, idx) => (
                      <td key={idx} className="py-2.5 px-4 text-right font-mono text-cyan-300 text-sm">
                        £{formatFinancialAmount(p, 'netAssets', 1000000, 2, 'M')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financial Ratios (CALC-001 through CALC-010) */}
      {activeTab === 'RATIOS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card: CALC-001 Gearing */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Gearing Ratio (CALC-001)</span>
              <span className="text-[10px] font-mono text-cyan-400">Total Debt ÷ Net Worth</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {typeof gearingCalc.value === 'number' ? `${gearingCalc.value}x` : gearingCalc.value}
              </span>
              <span className="text-xs text-slate-400">Policy benchmark: not configured</span>
            </div>
            {gearingCalc.flag ? (
              <p className="text-[11px] text-amber-300">{gearingCalc.flag}</p>
            ) : (
              <p className="text-[11px] text-slate-400">Policy interpretation is not configured.</p>
            )}
          </div>

          {/* Card: CALC-002 Current Ratio */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Current Ratio (CALC-002)</span>
              <span className="text-[10px] font-mono text-cyan-400">Current Assets ÷ Current Liab</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-300">
                {typeof currentRatioCalc.value === 'number' ? `${currentRatioCalc.value}x` : currentRatioCalc.value}
              </span>
              <span className="text-xs text-slate-400">Policy target: not configured</span>
            </div>
            <p className="text-[11px] text-slate-300">{currentRatioCalc.commentary}</p>
          </div>

          {/* Card: CALC-003 Interest Cover */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Interest Cover (CALC-003)</span>
              <span className="text-[10px] font-mono text-cyan-400">EBIT ÷ Interest Charge</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-purple-300">
                {typeof interestCoverCalc.value === 'number' ? `${interestCoverCalc.value}x` : interestCoverCalc.value}
              </span>
              <span className="text-xs text-slate-400">Policy threshold: not configured</span>
            </div>
            {interestCoverCalc.flag ? (
              <p className="text-[11px] text-amber-300">{interestCoverCalc.flag}</p>
            ) : (
              <p className="text-[11px] text-slate-400">Policy interpretation is not configured.</p>
            )}
          </div>

          {/* Card: CALC-004 Net Profit Margin */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Net Profit Margin (CALC-004)</span>
              <span className="text-[10px] font-mono text-cyan-400">(NP ÷ Turnover) * 100</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-300">
                {typeof netProfitMarginCalc === 'number' ? `${netProfitMarginCalc}%` : netProfitMarginCalc}
              </span>
              <span className="text-xs text-slate-400">Industry benchmark: not configured</span>
            </div>
            <p className="text-[11px] text-slate-300">Calculated from the supplied net profit and turnover.</p>
          </div>

          {/* Card: CALC-005 YoY Growth */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">YoY Turnover Growth (CALC-005)</span>
              <span className="text-[10px] font-mono text-cyan-400">YoY % Delta</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {typeof yoyRevCalc === 'number' && yoyRevCalc > 0 ? '+' : ''}{typeof yoyRevCalc === 'number' ? `${yoyRevCalc}%` : yoyRevCalc}
              </span>
              <span className="text-xs text-slate-400">Prior Period: £{formatFinancialAmount(priorP, 'turnover', 1000000, 1, 'M')}</span>
            </div>
            <p className="text-[11px] text-slate-300">Calculated against the prior entered period.</p>
          </div>

          {/* Card: CALC-009 Stock Turnaround Days */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Inventory Turn (CALC-009)</span>
              <span className="text-[10px] font-mono text-cyan-400">(Avg Stock ÷ CoS) * 365</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-300">
                {typeof stockDaysCalc === 'number' ? `${stockDaysCalc} days` : stockDaysCalc}
              </span>
              <span className="text-xs text-slate-400">Policy benchmark: not configured</span>
            </div>
            <p className="text-[11px] text-slate-300">Calculated from average inventory and cost of sales.</p>
          </div>
        </div>
      )}

      {/* Tab 3: Cross-Line Borrowing Profile (REQ-043, CALC-006, BR-D06) */}
      {activeTab === 'CROSS_LINE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">ConsolidatedBorrowingProfile (REQ-043 / BR-D06)</h2>
              <p className="text-xs text-slate-400">
                Consolidated limits, drawn balances, headroom, and utilization for facilities recorded in this case.
              </p>
            </div>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded">
              External exposure data not configured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeCase.crossLineExposures.map((exp, idx) => {
              const calc = calculateFacilityExposure(exp.drawnGBP, exp.limitGBP);
              const isUpliftRequest = exp.status === 'REQUESTED';
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isUpliftRequest
                      ? 'bg-blue-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-cyan-300 font-bold">
                        {exp.line}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isUpliftRequest
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-white mb-2">{exp.facilityType}</h3>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Facility Limit:</span>
                        <span className="font-mono font-bold text-white">£{(exp.limitGBP / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Drawn Balance:</span>
                        <span className="font-mono text-slate-200">£{(exp.drawnGBP / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Headroom (CALC-006):</span>
                        <span className="font-mono text-emerald-300 font-semibold">£{(calc.headroom / 1000).toFixed(0)}k</span>
                      </div>
                    </div>

                    {/* Utilization Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Utilization:</span>
                        <span className="font-mono font-bold text-cyan-300">{calc.utilizationPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, calc.utilizationPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 mt-3 border-t border-slate-700/60 text-[10px] text-slate-400 font-mono">
                    Source: {exp.platformSource}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setActiveDU(6)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              <span>Proceed to Credit Pack Authoring (DU-06)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: AI Financial Commentary Synthesis (Gemini 3.8 Flash) */}
      {activeTab === 'AI_COMMENTARY' && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Gemini 3.8 Flash Financial Metric Commentary</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Based on supplied case data
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Summarizes supplied financial periods and calculated metrics; verify source evidence before relying on commentary.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleGenerateFinancialCommentary}
                disabled={isGeneratingCommentary}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCommentary ? 'animate-spin' : ''}`} />
                <span>{isGeneratingCommentary ? 'Synthesizing...' : 'Re-synthesize Commentary'}</span>
              </button>
              {aiCommentaryText && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              )}
            </div>
          </div>

          {isGeneratingCommentary ? (
            <div className="py-12 text-center space-y-3">
              <div className="inline-block p-3 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 animate-spin">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300">
                Preparing commentary from supplied financial data...
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {aiCommentaryText || 'Click Re-synthesize Commentary to run Gemini 3.8 Flash evaluation.'}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>FCA Compliance: All generated commentary must be attested in DU-06 Authoring before final underwriting submission.</span>
            <button
              onClick={() => setActiveDU(6)}
              className="text-cyan-400 hover:underline font-semibold flex items-center space-x-1"
            >
              <span>Go to DU-06 Authoring</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
