import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface RiskPricingModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskPricingModelModal: React.FC<RiskPricingModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl space-y-5 rounded-2xl border border-amber-700/50 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Risk and Pricing Model</h2>
              <p className="text-xs text-slate-400">Unavailable for live cases</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close risk model notice"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-100">
          The previous sample scoring model was not calibrated or independently validated. Its risk grades, PD/LGD estimates,
          pricing, covenants, and approval authorities must not be used for credit decisions.
        </div>
        <p className="text-xs leading-relaxed text-slate-300">
          This capability stays disabled until the organization supplies an approved model specification, validated data,
          independent model-risk review, governance ownership, monitoring thresholds, and a controlled deployment process.
        </p>
      </div>
    </div>
  );
};
