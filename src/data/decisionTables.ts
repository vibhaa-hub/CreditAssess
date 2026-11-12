/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ApexCredit Decision Tables DT-1 through DT-5
 * Strict implementation of statutory and credit policy decision tables from AST
 */

import { RequestCategory, RequirementItem, CRARating } from '../types/ast';

/**
 * DT-1: Case-type to activity applicability decision table
 * Determines dynamic requirement set for each of the 7 statutory request categories
 */
export function getRequirementsForCaseType(category: RequestCategory): RequirementItem[] {
  const baseRequirements: RequirementItem[] = [
    {
      id: 'req-01',
      code: 'REQ_LEGAL_ENTITY',
      name: 'Companies House Certificate of Incorporation & Articles',
      category: 'LEGAL',
      mandatory: true,
      satisfied: false,
    },
    {
      id: 'req-02',
      code: 'REQ_SEARCH_CONSENT',
      name: 'Authorized Credit Bureau Search Mandate & GDPR Notice',
      category: 'GOVERNANCE',
      mandatory: true,
      satisfied: false,
    },
    {
      id: 'req-03',
      code: 'REQ_DIRECTORS_UBO',
      name: 'Director Register, PSC Declaration & 100% UBO Identification',
      category: 'LEGAL',
      mandatory: true,
      satisfied: false,
    },
    {
      id: 'req-04',
      code: 'REQ_FINANCIAL_STATEMENTS',
      name: '3 Years Audited Accounts & Recent Management Information (MI)',
      category: 'FINANCIAL',
      mandatory: true,
      satisfied: false,
    },
    {
      id: 'req-05',
      code: 'REQ_SANCTIONS_AML',
      name: 'OFSI / International Sanctions, PEP & ID&V Verification',
      category: 'DUE_DILIGENCE',
      mandatory: true,
      satisfied: false,
    },
    {
      id: 'req-06',
      code: 'REQ_FCA_REGISTER',
      name: 'FCA Regulated Permissions Verification (Credit Broking)',
      category: 'DUE_DILIGENCE',
      mandatory: true,
      satisfied: false,
    },
    {
      id: 'req-07',
      code: 'REQ_SECURITY_DEBENTURE',
      name: 'All-Monies Debenture, Stock Floating Charge & PG Schedule',
      category: 'SECURITY',
      mandatory: true,
      satisfied: false,
    },
  ];

  // Additional category-specific requirements per DT-1
  if (category === 'NEW_FRANCHISE') {
    baseRequirements.push({
      id: 'req-08',
      code: 'REQ_OEM_FRANCHISE_LETTER',
      name: 'Manufacturer Franchise Agreement & OEM Territory Authorization',
      category: 'LEGAL',
      mandatory: true,
      satisfied: false,
    });
  } else if (category === 'ACQUISITION') {
    baseRequirements.push({
      id: 'req-09',
      code: 'REQ_ACQUISITION_SPA',
      name: 'Share Purchase Agreement (SPA) & Acquisition Debt Service Model',
      category: 'FINANCIAL',
      mandatory: true,
      satisfied: false,
    });
  } else if (category === 'INCREASED_BORROWING') {
    baseRequirements.push({
      id: 'req-10',
      code: 'REQ_FACILITY_UTILIZATION_AUDIT',
      name: 'Facility Utilization and Business Performance Review',
      category: 'FINANCIAL',
      mandatory: true,
      satisfied: false,
    });
  }

  return baseRequirements;
}

/**
 * DT-2: Pack completeness gate decision table
 * Evaluates mandatory criteria before pack submission to Credit Underwriting
 */
export interface CompletenessEvaluation {
  isBlocked: boolean;
  completenessPct: number;
  blockingReasons: { code: string; reason: string; correctiveAction: string }[];
  advisoryNotes: string[];
}

export function evaluateCompletenessGate(params: {
  checklist: RequirementItem[];
  hasUndispositionedHits: boolean;
  hasCRA: boolean;
  verificationAttested: boolean;
  isPricingAuthorized: boolean;
  areNarrativesReviewed: boolean;
}): CompletenessEvaluation {
  const blockingReasons: { code: string; reason: string; correctiveAction: string }[] = [];
  const advisoryNotes: string[] = [];

  // Check 1: Mandatory checklist items
  const mandatoryItems = params.checklist.filter((i) => i.mandatory);
  const unsatisfiedItems = mandatoryItems.filter((i) => !i.satisfied);
  if (unsatisfiedItems.length > 0) {
    blockingReasons.push({
      code: 'GATE-01-CHECKLIST',
      reason: `${unsatisfiedItems.length} mandatory requirement items are unsatisfied (${unsatisfiedItems.map((u) => u.name).join(', ')}).`,
      correctiveAction: 'Gather and verify outstanding required documents in DU-02.',
    });
  }

  // Check 2: Undispositioned Screening Hits
  if (params.hasUndispositionedHits) {
    blockingReasons.push({
      code: 'GATE-02-SCREENING',
      reason: 'Undispositioned potential matches or confirmed hits exist in Financial Crime screening.',
      correctiveAction: 'FCC Analyst must formally adjudicate each hit in DU-04 Triage Gate.',
    });
  }

  // Check 3: Customer Risk Assessment (CRA)
  if (!params.hasCRA) {
    blockingReasons.push({
      code: 'GATE-03-CRA',
      reason: 'Customer Risk Assessment (CRA) outcome has not been recorded.',
      correctiveAction: 'Produce and record formal CRA rating in DU-04 before submission.',
    });
  }

  // Check 4: Entity Verification Attestation
  if (!params.verificationAttested) {
    blockingReasons.push({
      code: 'GATE-04-ATTESTATION',
      reason: 'Onboarding Analyst entity verification and UBO reconciliation attestation is missing.',
      correctiveAction: 'Complete entity reconciliation sign-off in DU-03.',
    });
  }

  // Check 5: Four-Eyes Pricing Authorization (BR-E02)
  if (!params.isPricingAuthorized) {
    blockingReasons.push({
      code: 'GATE-05-PRICING',
      reason: 'Proposed lending facility pricing and covenants lack independent 4-eyes authorization.',
      correctiveAction: 'Commercial Director must review and sign off in DU-07.',
    });
  }

  // Check 6: Narrative Human Review (BR-U01, BR-G06)
  if (!params.areNarrativesReviewed) {
    blockingReasons.push({
      code: 'GATE-06-NARRATIVE',
      reason: 'AI-drafted credit commentary sections have not been attested by the Account Manager.',
      correctiveAction: 'AM must accept, amend, or reject each draft narrative statement in DU-06.',
    });
  }

  const completedMandatoryCount = mandatoryItems.filter((i) => i.satisfied).length;
  const checklistPct = mandatoryItems.length > 0 ? (completedMandatoryCount / mandatoryItems.length) * 100 : 100;
  const isBlocked = blockingReasons.length > 0;

  if (!isBlocked) {
    advisoryNotes.push('All deterministic completeness criteria (DT-2) satisfied with 100% compliance.');
  }

  return {
    isBlocked,
    completenessPct: isBlocked ? Math.min(85, Math.floor(checklistPct * 0.85)) : 100.0,
    blockingReasons,
    advisoryNotes,
  };
}

/**
 * DT-3: Check outcome to required action decision table (Screening)
 */
export function evaluateScreeningTriage(findingSeverity: 'INFO' | 'WARNING' | 'CRITICAL') {
  switch (findingSeverity) {
    case 'CRITICAL':
      return {
        action: 'ESCALATE_TO_MLRO',
        description: 'Confirmed sanctions or serious financial-crime hit. Suspend progression and follow the bank-approved escalation and anti-tipping-off procedures.',
        requiresHold: true,
      };
    case 'WARNING':
      return {
        action: 'ADJUDICATE_DISPOSITION',
        description: 'Potential watchlist or PEP match. Requires reasoned adjudication log by authorized FCC Analyst.',
        requiresHold: false,
      };
    default:
      return {
        action: 'CLEAR',
        description: 'Zero adverse hits found; auto-pass to Customer Risk Assessment.',
        requiresHold: false,
      };
  }
}

/**
 * DT-4: Review cadence decision table
 * Maps risk profile and lifecycle stage to mandatory credit review frequency
 */
export function getReviewCadenceForRisk(craRating: CRARating, category: RequestCategory): {
  cadence: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  description: string;
} {
  if (craRating === 'HIGH') {
    return {
      cadence: 'MONTHLY',
      description: 'High CRA risk rating mandates monthly operational & credit surveillance.',
    };
  }
  if (craRating === 'MEDIUM' || category === 'INCREASED_BORROWING' || category === 'ACQUISITION') {
    return {
      cadence: 'QUARTERLY',
      description: 'Quarterly review cadence: Medium CRA risk rating or high borrowing growth.',
    };
  }
  return {
    cadence: 'ANNUAL',
    description: 'Standard Annual review cadence: Low CRA risk rating and established relationship.',
  };
}

/**
 * DT-5: Information validity periods decision table (Policy Validity)
 */
export const POLICY_VALIDITY_DAYS = {
  BUREAU_SEARCH: 90,
  COMPANIES_HOUSE_SNAPSHOT: 30,
  AUDITED_ACCOUNTS: 365,
  MANAGEMENT_INFORMATION: 60,
  ID_AND_V_CHECK: 180,
  SANCTIONS_SCREENING: 30,
  SEARCH_CONSENT_MANDATE: 365,
  SECURITY_VALUATION: 180,
};
