/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * [DU-10] PeriodicLifecycleReviewUnit (Deployable Unit 10 / P-10 | Domain: DOM-01 Origination)
 */

import React, { useState } from 'react';
import { useCreditAssessment } from '../../context/CreditAssessmentContext';
import { computeNextPeriodicReviewDate } from '../../utils/calculations';
import {
  Calendar,
  AlertTriangle,
  RotateCw,
  Bell,
  Archive,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
} from 'lucide-react';

export const DU10LifecycleReview: React.FC = () => {
  const { activeCase, triggerLifecycleEvent, setActiveDU } = useCreditAssessment();

  const [triggerDescription, setTriggerDescription] = useState('');

  const review = activeCase.periodicReview;
  const nextDate = review.lastReviewDate
    ? computeNextPeriodicReviewDate(review.lastReviewDate, review.cadence)
    : '';

  const handleRecordTrigger = () => {
    if (!triggerDescription.trim()) return;
    triggerLifecycleEvent(triggerDescription.trim());
    setTriggerDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Unit Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-800">
              [DU-10] P-10
            </span>
            <h1 className="text-xl font-bold text-white">Periodic Lifecycle Review Unit</h1>
            <span className="text-xs text-slate-400 font-mono">Domain: DOM-01 Origination</span>
          </div>
          <p className="text-xs text-slate-400">
            Cadence policy schedule calculation (CALC-012 / DT-4), trigger event monitoring (REQ-075), delta review pack compilation (REQ-076), and overdue alerts (REQ-077).
          </p>
        </div>

        {/* Status Pill */}
        <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">Current Cadence:</span>
          <span className="font-bold text-cyan-300 font-mono">{review.cadence}</span>
        </div>
      </div>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Review Cadence Engine (REQ-074, CALC-012, DT-4, BR-P09) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">ComputeNextPeriodicReviewDate (CALC-012 / DT-4)</h2>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded">
              Month-End Clipping Engine
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Last Review Completed</span>
              <span className="font-mono font-bold text-white text-sm">{review.lastReviewDate}</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[11px]">Next Review Target (CALC-012)</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">{nextDate || 'Not scheduled'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs space-y-1">
            <span className="font-bold text-white block">Cadence Decision Table DT-4 Mapping</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              CRA Rating: <span className="text-emerald-400 font-semibold">{activeCase.customerRiskAssessment?.craRating || 'Not assessed'}</span>. Recorded cadence: <span className="text-white font-semibold">{review.cadence}</span>.
            </p>
          </div>

          {/* Overdue Review Escalation Notification (REQ-077) */}
          <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${review.isOverdue ? 'bg-rose-950/30 border-rose-900/60 text-rose-300' : 'bg-slate-950/50 border-slate-800 text-slate-300'}`}>
            <div className="flex items-center gap-2">
              {review.isOverdue
                ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                : <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />}
              <span>{review.lastReviewDate ? (review.isOverdue ? `Review overdue by ${review.overdueDays} days.` : 'No overdue review recorded.') : 'Review date has not been supplied.'}</span>
            </div>
            <span className="text-[10px] font-mono font-bold">{review.lastReviewDate ? 'Recorded schedule' : 'Data required'}</span>
          </div>
        </div>

        {/* Right: Trigger Event Monitor & Delta Review Pack (REQ-075, REQ-076, BR-G05, BR-E06) */}
        <div className="space-y-6">
          {/* Trigger Event Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">TriggerEventMonitor (REQ-075 / BR-G05)</h2>
              </div>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                Event-Driven Spawner
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              No external event feeds are configured. Record a customer or staff-reported event here; this does not create an external review case.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 block">Event description</label>
              <input
                value={triggerDescription}
                onChange={(e) => setTriggerDescription(e.target.value)}
                maxLength={500}
                placeholder="Enter the reported event"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
              />

              <button
                onClick={handleRecordTrigger}
                disabled={!triggerDescription.trim()}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-4 h-4" />
                <span>Trigger Event & Spawn Review Case (REQ-075)</span>
              </button>
            </div>

            {/* Trigger Events History */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Event Log History ({review.triggerEventsHistory.length})
              </span>
              {review.triggerEventsHistory.map((ev, i) => (
                <div
                  key={i}
                  className="p-2 bg-slate-800/60 rounded border border-slate-700/60 text-[11px] flex items-center justify-between"
                >
                  <span className="text-white">{ev.eventType}</span>
                  <span className="font-mono text-cyan-300 text-[10px]">{ev.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delta Highlighted Review Pack (REQ-076, BR-E06) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">Delta Review Pack Compiler (REQ-076)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">              Customer case data</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Review the case information currently recorded in the system. No prior submission or external data source is assumed.
            </p>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setActiveDU(11)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 font-semibold"
              >
                <span>Inspect Shared Master Data Passport (DU-11)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
