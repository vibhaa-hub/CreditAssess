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
      satisfied: true,
      provenanceSource: 'Companies House Direct API / OCR Ingest',
      provider: 'Companies House UK',
      receivedDate: '2026-10-15',
      effectiveDate: '2026-10-15',
      expiryDate: '2027-10-15',
      isStale: false,
    },
    {
      id: 'req-02',
      code: 'REQ_SEARCH_CONSENT',
      name: 'Authorized Credit Bureau Search Mandate & GDPR Notice',
      category: 'GOVERNANCE',
      mandatory: true,
      satisfied: true,
      provenanceSource: 'Dealer Portal Signed DocuSign',
      provider: 'Apex Portal',
      receivedDate: '2026-10-16',
      effectiveDate: '2026-10-16',
      expiryDate: '2027-10-16',
      isStale: false,
    },
    {
      id: 'req-03',
      code: 'REQ_DIRECTORS_UBO',
      name: 'Director Register, PSC Declaration & 100% UBO Identification',
      category: 'LEGAL',
      mandatory: true,
      satisfied: true,
      provenanceSource: 'Onboarding Pack & Companies House PSC Register',
      provider: 'Dealer Direct / Companies House',
      receivedDate: '2026-10-16',
      effectiveDate: '2026-10-16',
      expiryDate: '2027-04-16',
      isStale: false,
    },
    {
      id: 'req-04',
      code: 'REQ_FINANCIAL_STATEMENTS',
      name: '3 Years Audited Accounts & Recent Management Information (MI)',
      category: 'FINANCIAL',
      mandatory: true,
      satisfied: true,
      provenanceSource: 'KPMG Audited Annual Accounts PDF + Oct MI Excel',
      provider: 'Finance Director / Dealer Direct',
      receivedDate: '2026-10-18',
      effectiveDate: '2026-10-18',
      expiryDate: '2027-10-18',
      isStale: false,
    },
    {
      id: 'req-05',
      code: 'REQ_SANCTIONS_AML',
      name: 'OFSI / International Sanctions, PEP & ID&V Verification',
      category: 'DUE_DILIGENCE',
      mandatory: true,
      satisfied: true,
      provenanceSource: 'Equifax / LexisNexis Automated Financial Crime Suite',
      provider: 'Automated Screening Engine',
      receivedDate: '2026-10-20',
      effectiveDate: '2026-10-20',
      expiryDate: '2027-04-20',
      isStale: false,
    },
    {
      id: 'req-06',
      code: 'REQ_FCA_REGISTER',
      name: 'FCA Regulated Permissions Verification (Credit Broking)',
      category: 'DUE_DILIGENCE',
      mandatory: true,
      satisfied: true,
      provenanceSource: 'FCA Financial Services Register API',
      provider: 'FCA Official Register',
      receivedDate: '2026-10-20',
      effectiveDate: '2026-10-20',
      expiryDate: '2027-10-20',
      isStale: false,
    },
    {
      id: 'req-07',
      code: 'REQ_SECURITY_DEBENTURE',
      name: 'All-Monies Debenture, Stock Floating Charge & PG Schedule',
      category: 'SECURITY',
      mandatory: true,
      satisfied: true,
      provenanceSource: 'Legal Department / Companies House Charge Registry',
      provider: 'Legal Counsel',
      receivedDate: '2026-10-22',
      effectiveDate: '2026-10-22',
      expiryDate: '2028-10-22',
      isStale: false,
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
      satisfied: true,
      provenanceSource: 'OEM Partner Commercial Division',
      provider: 'Stellantis / BMW Group',
      receivedDate: '2026-10-24',
      effectiveDate: '2026-10-24',
      expiryDate: '2028-10-24',
      isStale: false,
    });
  } else if (category === 'ACQUISITION') {
    baseRequirements.push({
      id: 'req-09',
      code: 'REQ_ACQUISITION_SPA',
      name: 'Share Purchase Agreement (SPA) & Acquisition Debt Service Model',
      category: 'FINANCIAL',
      mandatory: true,
      satisfied: true,
      provenanceSource: 'Corporate M&A Legal Advisors',
      provider: 'Deloitte Corporate Finance',
      receivedDate: '2026-10-25',
      effectiveDate: '2026-10-25',
      expiryDate: '2027-10-25',
      isStale: false,
    });
  } else if (category === 'INCREASED_BORROWING') {
    baseRequirements.push({
      id: 'req-10',
      code: 'REQ_FACILITY_UTILIZATION_AUDIT',
      name: '12-Month Peak Stock Turn & Vehicle Facility Utilization Audit',
      category: 'FINANCIAL',
      mandatory: true,
      satisfied: true,
      provenanceSource: 'SOPRA Apak Wholesale Platform Analytics',
      provider: 'Wholesale Operations',
      receivedDate: '2026-10-26',
      effectiveDate: '2026-10-26',
      expiryDate: '2027-04-26',
      isStale: false,
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
        description: 'Confirmed OFSI Sanctions / Serious Financial Crime hit. Suspend case progression and freeze dealer communications (LR-02 anti-tipping-off).',
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
