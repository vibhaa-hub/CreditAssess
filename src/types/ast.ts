/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ApexCredit AST Domain Types and Specifications
 * Implements CreditPackAssessmentProcess (Root) across Deployable Units DU-01 to DU-12
 */

export type UserRole =
  | 'ACCOUNT_MANAGER'
  | 'WHOLESALE_MANAGER'
  | 'ONBOARDING_ANALYST'
  | 'FCC_ANALYST' // Financial Crime Compliance / MLRO
  | 'COMMERCIAL_DIRECTOR' // Pricing Authorizer
  | 'CREDIT_UNDERWRITER' // Independent Credit Underwriting
  | 'OPERATIONS_ANALYST'
  | 'GOVERNANCE_AUDITOR';

export type RequestCategory =
  | 'NEW_RELATIONSHIP'
  | 'NEW_FRANCHISE'
  | 'INCREASED_BORROWING'
  | 'ACQUISITION'
  | 'DISPOSAL'
  | 'DIRECTOR_SHAREHOLDER_CHANGE'
  | 'PERIODIC_REVIEW';

export type OriginationSource =
  | 'OEM_PARTNER'
  | 'FIELD_TEAM'
  | 'DEALER_DIRECT'
  | 'BANK_REFERRAL'
  | 'EXISTING_RELATIONSHIP';

export type LendingLine = 'FRANCHISE' | 'WHOLESALE' | 'FLEET' | 'RETAIL';

export type CRARating = 'LOW' | 'MEDIUM' | 'HIGH';

export type UnderwritingOutcome =
  | 'PENDING'
  | 'QUERY_RAISED'
  | 'APPROVED'
  | 'APPROVED_WITH_CONDITIONS'
  | 'DECLINED';

export interface AuditRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole?: UserRole;
  action: string;
  deployableUnit?: string;
  details: string;
  hash: string;
  previousHash: string;
}

export interface CaseClassification {
  primaryCategory: RequestCategory;
  secondaryCategories: RequestCategory[];
  affectedLendingLines: LendingLine[];
  rationale: string;
}

export interface DuplicateAlert {
  hasConflict: boolean;
  linkedCaseIds: string[];
  conflictEntityName?: string;
  registrationNumber?: string;
  status?: string;
  assignedOwner?: string;
}

export interface RequirementItem {
  id: string;
  code: string;
  name: string;
  category: 'LEGAL' | 'FINANCIAL' | 'DUE_DILIGENCE' | 'SECURITY' | 'GOVERNANCE';
  mandatory: boolean;
  satisfied: boolean;
  provenanceSource?: string;
  provider?: string;
  receivedDate?: string;
  effectiveDate?: string;
  expiryDate?: string;
  isStale?: boolean;
}

export interface InformationRequest {
  id: string;
  itemCode: string;
  description: string;
  owner: string;
  recipient: string;
  dueDate: string;
  status: 'PENDING' | 'DISPATCHED' | 'RECEIVED' | 'CLOSED_WITH_RATIONALE';
  closureRationale?: string;
}

export interface QualitativeNote {
  id: string;
  authorId: string;
  authorRole: string;
  timestamp: string;
  visitType: 'PHYSICAL_DEALERSHIP_VISIT' | 'MANAGEMENT_INTERVIEW' | 'TELEPHONE_CALL';
  content: string;
  keyTakeaways: string[];
}

export interface DirectorShareholder {
  id: string;
  name: string;
  role: string;
  appointmentDate: string;
  equityPercentage: number;
  isUBO: boolean;
  idvStatus: 'VERIFIED' | 'FAILED' | 'PENDING';
  idvScore: number;
  idvReference?: string;
  pepScreening: 'CLEAR' | 'PEP_CONFIRMED' | 'POTENTIAL_MATCH';
  sanctionsHit: 'ZERO_HIT' | 'POTENTIAL_HIT' | 'CONFIRMED_HIT';
}

export interface EntityRegistrySnapshot {
  registeredName: string;
  companyNumber: string;
  registeredAddress: string;
  legalForm: string;
  incorporationDate: string;
  sicCodes: string[];
  filingStatus: string;
  lastAccountsDate: string;
  pscs: { name: string; natureOfControl: string; percentage: string }[];
  officers: { name: string; role: string; appointedOn: string }[];
}

export interface DiscrepancyItem {
  field: string;
  dealerSuppliedValue: string;
  registryValue: string;
  status: 'MATCH' | 'DISCREPANCY' | 'RESOLVED';
  resolutionNote?: string;
}

export interface ConnectedDealerLink {
  dealerId: string;
  dealerName: string;
  sharedPerson: string;
  sharedRole: string;
  existingExposureGBP: number;
}

export interface ScreeningFinding {
  id: string;
  checkType: 'SANCTIONS' | 'ID_AND_V' | 'KYC_AML' | 'FCA_REGISTER' | 'ADVERSE_MEDIA';
  targetParty: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'CLEAR' | 'POTENTIAL_MATCH' | 'CONFIRMED_MATCH' | 'DISPOSITIONED_FALSE_POSITIVE';
  details: string;
  source: string;
  timestamp: string;
  dispositionRationale?: string;
  dispositionedBy?: string;
  dispositionedAt?: string;
}

export interface PeriodFinancials {
  periodLabel: string;
  periodEndDate: string;
  isAudited: boolean;
  currency: string;
  enteredFields?: string[];
  // P&L
  turnover: number;
  costOfSales: number;
  grossProfit: number;
  operatingExpenses: number;
  ebit: number;
  interestCharge: number;
  profitBeforeTax: number;
  tax: number;
  netProfit: number;
  // Balance Sheet
  currentAssets: number;
  inventory: number;
  tradeDebtors: number;
  cashAndEquivalents: number;
  totalAssets: number;
  currentLiabilities: number;
  tradeCreditors: number;
  shortTermBorrowings: number;
  longTermBorrowings: number;
  totalBorrowings: number;
  totalLiabilities: number;
  netAssets: number;
  shareholdersEquity: number;
  tangibleEquity: number;
  // Cashflow
  openingCash: number;
  operatingCashflow: number;
  investingCashflow: number;
  financingCashflow: number;
  closingCash: number;
  cashflowDifference: number; // CALC-007 check
}

export interface CalculatedRatios {
  gearing: number | 'not meaningful'; // CALC-001
  gearingFlag?: string;
  currentRatio: number | 'not calculable'; // CALC-002
  interestCover: number; // CALC-003
  interestCoverFlag?: string;
  netProfitMargin: number; // CALC-004
  revenueYoY: number; // CALC-005
  ebitdaYoY: number;
  stockDays: number; // CALC-009
  rote?: number; // CALC-010
}

export interface CrossLineExposure {
  line: LendingLine;
  facilityType: string;
  limitGBP: number;
  drawnGBP: number;
  headroomGBP: number; // CALC-006
  utilizationPct: number; // CALC-006
  platformSource: string; // e.g., 'SOPRA Apak Live'
  status: 'ACTIVE' | 'REQUESTED';
}

export interface NarrativeSection {
  id: string;
  title: string;
  category: 'BUSINESS_BACKGROUND' | 'MANAGEMENT_CAPABILITY' | 'CONDUCT_PERFORMANCE' | 'SECURITY_REVIEW' | 'ESG_COMMENTARY';
  draftText: string;
  aiGenerated: boolean;
  aiProvenance: string;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'AMENDED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  amendedText?: string;
  citations: { assertion: string; evidenceRef: string }[];
}

export interface SecurityCollateral {
  id: string;
  type: 'DEBENTURE' | 'PERSONAL_GUARANTEE' | 'STOCK_FLOATING_CHARGE' | 'FREEHOLD_MORTGAGE';
  description: string;
  nominalValueGBP: number;
  haircutPct: number;
  netValuationGBP: number;
  valuationDate: string;
  securityCoverRatio?: number; // CALC-008
}

export interface FacilityRequest {
  facilityType: 'WHOLESALE_STOCKING' | 'DEMONSTRATOR' | 'PARTS_FACILITY' | 'TERM_LOAN';
  requestedLimitGBP: number;
  existingLimitGBP: number;
  deltaGBP: number;
  purpose: string;
  revolving: boolean;
  proposedTenorMonths: number;
  curtailmentSchedule: string;
  proposedMarginOverSONIA: number; // in % (e.g. 2.75%)
  stockingFeePerUnitGBP: number;
  commitmentFeePct: number;
}

export interface PricingSignoff {
  preparerId: string;
  preparerRole: UserRole;
  preparedAt: string;
  authorizerId?: string;
  authorizerRole?: UserRole;
  authorizedAt?: string;
  isAuthorized: boolean;
  conditionsOrNotes?: string;
}

export interface CompletenessReport {
  completenessPct: number; // CALC-011
  isReadyForSubmission: boolean;
  blockingGaps: { code: string; reason: string; correctiveAction: string }[];
  advisoryNotes: string[];
}

export interface SubmissionSnapshot {
  snapshotId: string;
  packVersion: string; // e.g., 'v1.0', 'v1.1'
  submittedAt: string;
  submittedBy: string;
  sha256Seal: string;
  creditQueueTxId: string;
  status: 'QUEUED_IN_CREDIT' | 'QUERY_PENDING' | 'DECIDED';
}

export interface CreditQuery {
  id: string;
  raisedAt: string;
  underwriterName: string;
  queryText: string;
  assignedOwner: string;
  status: 'OPEN' | 'RESOLVED';
  resolutionResponse?: string;
  resolvedAt?: string;
}

export interface UnderwritingDecision {
  outcome: UnderwritingOutcome;
  creditReference: string;
  decisionDate: string;
  underwriterId: string;
  rationale: string;
  conditionsPrecedent: { id: string; description: string; satisfied: boolean; evidenceDoc?: string }[];
}

export interface FulfillmentHandoff {
  track: 'TRACK_A_LEGAL' | 'TRACK_B_DIRECT_DEBIT' | 'TRACK_C_SOPRA_APAK' | 'TRACK_D_AUXIGA_SMART3';
  title: string;
  owner: string;
  dueDate: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  completionArtifact?: string;
  parameterCheckOk: boolean;
  completedAt?: string;
}

export interface PeriodicReviewSchedule {
  cadence: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  lastReviewDate: string;
  nextReviewDate: string; // CALC-012
  isOverdue: boolean;
  overdueDays: number;
  triggerEventsHistory: { date: string; eventType: string; resolved: boolean }[];
}

export interface MasterEntityPassport {
  canonicalDealerId: string;
  legalName: string;
  registeredNumber: string;
  tradingNames: string[];
  reusablePassportItems: {
    itemType: string;
    verifiedDate: string;
    validityDays: number;
    ageDays: number; // CALC-014
    isStale: boolean;
    sourceLendingLine: LendingLine;
  }[];
}

export interface ExceptionOverrideRecord {
  id: string;
  timestamp: string;
  exceptionType: string;
  reason: string;
  approverId: string;
  approverRole: UserRole;
  caseId: string;
}

export interface TelemetryMetrics {
  isMeasured: boolean;
  totalEffortMinutes: number; // CALC-013 sum of stage minutes
  baselineBenchmarkMinutes: number; // 90.0
  effortVarianceMinutes: number; // total - baseline
  effortSavingsPct: number;
  stageEffort: { stage: string; minutes: number }[];
  totalCaseCount: number;
  overdueReviewCount: number;
  caseVolumeByLine: Record<LendingLine, number>;
  caseVolumeBySource: Record<OriginationSource, number>;
  reworkCount: number;
  queryCount: number;
  exceptionCount: number;
  manualInterventionsCount: number;
}

export interface CreditCase {
  caseId: string;
  receiptDate: string;
  originationSource: OriginationSource;
  assignedOwner: string;
  ownerRole: UserRole;
  status:
    | 'INTAKE'
    | 'INFORMATION_GATHERING'
    | 'ENTITY_VERIFICATION'
    | 'DUE_DILIGENCE_SCREENING'
    | 'FINANCIAL_SPREADING'
    | 'CREDIT_AUTHORING'
    | 'PRICING_AND_TERMS'
    | 'CREDIT_GATEWAY'
    | 'UNDERWRITING_REVIEW'
    | 'POST_APPROVAL_FULFILLMENT'
    | 'ACTIVE_FUNDING'
    | 'CLOSED';
  currentStageNumber: number; // 1 to 12
  dealerProfile: {
    legalName: string;
    tradingName: string;
    registeredNumber: string;
    registeredAddress: string;
    legalForm: string;
    contactEmail: string;
    phone: string;
    fcaNumber: string;
    locations: string[];
    bankAccount: { sortCode: string; accountNumber: string; bankName: string };
  };
  classification: CaseClassification;
  duplicateAlert: DuplicateAlert;
  requirementChecklist: RequirementItem[];
  informationRequests: InformationRequest[];
  qualitativeNotes: QualitativeNote[];
  directorsAndShareholders: DirectorShareholder[];
  registrySnapshot: EntityRegistrySnapshot;
  registryDiscrepancies: DiscrepancyItem[];
  connectedDealers: ConnectedDealerLink[];
  verificationAttested: boolean;
  verificationAttestedBy?: string;
  verificationAttestedAt?: string;
  screeningFindings: ScreeningFinding[];
  customerRiskAssessment?: {
    craRating: CRARating;
    rationale: string;
    recommendedReviewCadence: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
    assessedAt: string;
    assessedBy: string;
  };
  financialPeriods: PeriodFinancials[];
  crossLineExposures: CrossLineExposure[];
  narrativeSections: NarrativeSection[];
  securities: SecurityCollateral[];
  facilityRequest: FacilityRequest;
  pricingSignoff: PricingSignoff;
  submissionSnapshots: SubmissionSnapshot[];
  underwriterQueries: CreditQuery[];
  underwritingDecision?: UnderwritingDecision;
  fulfillmentHandoffs: FulfillmentHandoff[];
  periodicReview: PeriodicReviewSchedule;
  masterPassport: MasterEntityPassport;
}
