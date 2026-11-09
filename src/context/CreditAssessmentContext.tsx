/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ApexCredit Assessment Context Engine
 * Central state orchestration across all 12 AST Deployable Units
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  CreditCase,
  UserRole,
  AuditRecord,
  ExceptionOverrideRecord,
  TelemetryMetrics,
  RequestCategory,
  LendingLine,
  CRARating,
  UnderwritingOutcome,
  InformationRequest,
  QualitativeNote,
  NarrativeSection,
  FacilityRequest,
} from '../types/ast';
import { initialMockCases } from '../data/mockDealers';
import { generateSHA256Hash, calculateEffortTelemetry } from '../utils/calculations';
import { evaluateCompletenessGate, getRequirementsForCaseType } from '../data/decisionTables';

interface CreditAssessmentContextType {
  cases: CreditCase[];
  activeCaseId: string;
  activeCase: CreditCase;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  activeDU: number; // 1 to 12
  setActiveDU: (du: number) => void;
  auditLedger: AuditRecord[];
  exceptionsRegister: ExceptionOverrideRecord[];
  telemetry: TelemetryMetrics;
  selectCase: (caseId: string) => void;
  // DU-01 Actions
  updateCaseClassification: (primary: RequestCategory, affectedLines: LendingLine[]) => void;
  assignCaseOwner: (ownerName: string, role: UserRole) => void;
  // DU-02 Actions
  toggleChecklistItem: (itemId: string) => void;
  addInformationRequest: (itemCode: string, description: string, recipient: string, dueDate: string) => void;
  closeInformationRequest: (requestId: string, rationale: string) => void;
  addQualitativeNote: (note: Omit<QualitativeNote, 'id' | 'timestamp' | 'authorId' | 'authorRole'>) => void;
  // DU-03 Actions
  resolveDiscrepancy: (field: string, resolutionNote: string) => void;
  attestEntityVerification: () => void;
  // DU-04 Actions
  adjudicateScreeningHit: (hitId: string, disposition: 'DISPOSITIONED_FALSE_POSITIVE' | 'CONFIRMED_MATCH', rationale: string) => void;
  escalateToMLRO: (hitId: string, notes: string) => void;
  recordCRA: (craRating: CRARating, rationale: string) => void;
  // DU-05 Actions
  updateFinancialCell: (periodIndex: number, field: string, value: number) => void;
  // DU-06 Actions
  reviewNarrativeSection: (sectionId: string, decision: 'ACCEPTED' | 'AMENDED' | 'REJECTED', amendedText?: string) => void;
  // DU-07 Actions
  updateFacilityRequest: (request: Partial<FacilityRequest>) => void;
  authorizePricing: (authorizerId: string, conditions?: string) => { success: boolean; error?: string };
  // DU-08 Actions
  checkCompleteness: () => ReturnType<typeof evaluateCompletenessGate>;
  authorizeSubmissionToCredit: () => { success: boolean; error?: string };
  recordUnderwritingDecision: (outcome: UnderwritingOutcome, rationale: string, conditions?: string[]) => void;
  raiseUnderwriterQuery: (queryText: string) => void;
  resolveUnderwriterQuery: (queryId: string, resolutionText: string) => void;
  // DU-09 Actions
  updateHandoffStatus: (track: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED') => void;
  satisfyConditionPrecedent: (conditionId: string, docName: string) => void;
  enableOperationalFunding: () => void;
  // DU-10 Actions
  triggerLifecycleEvent: (eventType: string) => void;
  // DU-11 Actions
  refreshPassportItem: (itemType: string) => void;
  // DU-12 Actions
  recordExceptionOverride: (exceptionType: string, reason: string) => void;
}

const CreditAssessmentContext = createContext<CreditAssessmentContextType | undefined>(undefined);

export const CreditAssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<CreditCase[]>(initialMockCases);
  const [activeCaseId, setActiveCaseId] = useState<string>('CASE-2026-0891');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('WHOLESALE_MANAGER');
  const [activeDU, setActiveDU] = useState<number>(8); // Default to Gateway / authoring overview

  const [exceptionsRegister, setExceptionsRegister] = useState<ExceptionOverrideRecord[]>([
    {
      id: 'EXC-001',
      timestamp: '2026-10-21 15:00:00',
      caseId: 'CASE-2026-0891',
      exceptionType: 'POLICY_OVERRIDE_RECENCY_TOLERANCE',
      reason: 'Approved 14-day grace extension for receipt of updated landlord insurance certificate.',
      approverId: 'Julian Montgomery (Commercial Director)',
      approverRole: 'COMMERCIAL_DIRECTOR',
    },
  ]);

  const [auditLedger, setAuditLedger] = useState<AuditRecord[]>([
    {
      id: 'AUD-001',
      timestamp: '2026-10-14 09:30:14',
      actorId: 'SYSTEM_INTAKE_AGENT',
      actorRole: 'ACCOUNT_MANAGER',
      deployableUnit: 'DU-01 RequestIntakeAndTriageUnit',
      action: 'RegisterCreditRequest',
      details: 'Registered case CASE-2026-0891 from OEM Partner Stellantis referral.',
      hash: 'sha256_01a4e892c90df1b',
      previousHash: '00000000000000000000000000000000',
    },
    {
      id: 'AUD-002',
      timestamp: '2026-10-21 16:40:00',
      actorId: 'Hannah Croft',
      actorRole: 'ONBOARDING_ANALYST',
      deployableUnit: 'DU-03 EntityOwnershipVerificationUnit',
      action: 'AttestVerificationEvidence',
      details: 'Formally attested Companies House registry reconciliation and 100% UBO validation.',
      hash: 'sha256_88b1f492a01ce94',
      previousHash: 'sha256_01a4e892c90df1b',
    },
    {
      id: 'AUD-003',
      timestamp: '2026-10-23 14:30:00',
      actorId: 'Julian Montgomery',
      actorRole: 'COMMERCIAL_DIRECTOR',
      deployableUnit: 'DU-07 LendingRequestPricingUnit',
      action: 'AuthorisePricingAndTermsDualSignoff',
      details: 'Four-eyes independent authorization of 2.65% SONIA margin & covenants.',
      hash: 'sha256_31c9e882a19bf02',
      previousHash: 'sha256_88b1f492a01ce94',
    },
  ]);

  const activeCase = useMemo(() => {
    return cases.find((c) => c.caseId === activeCaseId) || cases[0];
  }, [cases, activeCaseId]);

  const appendAudit = useCallback(
    (action: string, du: string, details: string) => {
      const lastHash = auditLedger.length > 0 ? auditLedger[auditLedger.length - 1].hash : '0000000000000000';
      const newHash = generateSHA256Hash(`${action}-${details}-${Date.now()}`);
      const newRecord: AuditRecord = {
        id: `AUD-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorId: `User (${currentUserRole})`,
        actorRole: currentUserRole,
        deployableUnit: du,
        action,
        details,
        hash: newHash,
        previousHash: lastHash,
      };
      setAuditLedger((prev) => [...prev, newRecord]);
    },
    [auditLedger, currentUserRole]
  );

  const updateActiveCase = useCallback(
    (updater: (c: CreditCase) => CreditCase) => {
      setCases((prev) =>
        prev.map((c) => (c.caseId === activeCaseId ? updater(c) : c))
      );
    },
    [activeCaseId]
  );

  // Telemetry computation (CALC-013, REQ-093 to REQ-097)
  const telemetry = useMemo(() => {
    const stageEffort = [
      { stage: 'DU-01 Intake & Triage', minutes: 3.5 },
      { stage: 'DU-02 Info Gathering & Ingestion', minutes: 6.2 },
      { stage: 'DU-03 Registry & Ownership Reconciliation', minutes: 4.8 },
      { stage: 'DU-04 Financial Crime & Screening', minutes: 5.1 },
      { stage: 'DU-05 Financial Spreading & Ratios', minutes: 8.4 },
      { stage: 'DU-06 Pack Authoring & Narrative Review', minutes: 7.2 },
      { stage: 'DU-07 Four-Eyes Pricing & Structuring', minutes: 3.0 },
      { stage: 'DU-08 Completeness Gate & Transmission', minutes: 2.5 },
      { stage: 'DU-09 Downstream Post-Approval Fulfillment', minutes: 5.0 },
    ];

    const effort = calculateEffortTelemetry(stageEffort);

    const volumeByLine: Record<LendingLine, number> = {
      WHOLESALE: 18,
      FRANCHISE: 12,
      FLEET: 8,
      RETAIL: 4,
    };

    const volumeBySource: Record<string, number> = {
      OEM_PARTNER: 22,
      FIELD_TEAM: 9,
      DEALER_DIRECT: 6,
      BANK_REFERRAL: 3,
      EXISTING_RELATIONSHIP: 12,
    };

    return {
      totalEffortMinutes: effort.totalEffortMinutes,
      baselineBenchmarkMinutes: effort.baselineBenchmarkMinutes,
      effortVarianceMinutes: effort.varianceMinutes,
      effortSavingsPct: effort.savingsPct,
      stageEffort,
      caseVolumeByLine: volumeByLine,
      caseVolumeBySource: volumeBySource as any,
      reworkCount: 1,
      queryCount: activeCase.underwriterQueries.length,
      exceptionCount: exceptionsRegister.length,
      manualInterventionsCount: 2,
    };
  }, [activeCase, exceptionsRegister]);

  // DU-01 Actions
  const updateCaseClassification = useCallback(
    (primary: RequestCategory, affectedLines: LendingLine[]) => {
      updateActiveCase((prev) => {
        const newChecklist = getRequirementsForCaseType(primary);
        return {
          ...prev,
          classification: {
            ...prev.classification,
            primaryCategory: primary,
            affectedLendingLines: affectedLines,
          },
          requirementChecklist: newChecklist,
        };
      });
      appendAudit(
        'ClassifyCaseType',
        'DU-01 RequestIntakeAndTriageUnit',
        `Reclassified case to ${primary} with lending lines: ${affectedLines.join(', ')}`
      );
    },
    [updateActiveCase, appendAudit]
  );

  const assignCaseOwner = useCallback(
    (ownerName: string, role: UserRole) => {
      updateActiveCase((prev) => ({
        ...prev,
        assignedOwner: ownerName,
        ownerRole: role,
      }));
      appendAudit(
        'AssignAccountableOwner',
        'DU-01 RequestIntakeAndTriageUnit',
        `Assigned accountable case owner to ${ownerName} (${role}) per REQ-005`
      );
    },
    [updateActiveCase, appendAudit]
  );

  // DU-02 Actions
  const toggleChecklistItem = useCallback(
    (itemId: string) => {
      updateActiveCase((prev) => ({
        ...prev,
        requirementChecklist: prev.requirementChecklist.map((item) =>
          item.id === itemId
            ? { ...item, satisfied: !item.satisfied, effectiveDate: new Date().toISOString().split('T')[0] }
            : item
        ),
      }));
      appendAudit('EvaluateProvenanceAndGapAnalysis', 'DU-02 DealerInformationGatheringUnit', `Toggled checklist status for ${itemId}`);
    },
    [updateActiveCase, appendAudit]
  );

  const addInformationRequest = useCallback(
    (itemCode: string, description: string, recipient: string, dueDate: string) => {
      const newReq: InformationRequest = {
        id: `inf-${Date.now().toString().slice(-4)}`,
        itemCode,
        description,
        owner: activeCase.assignedOwner,
        recipient,
        dueDate,
        status: 'DISPATCHED',
      };
      updateActiveCase((prev) => ({
        ...prev,
        informationRequests: [...prev.informationRequests, newReq],
      }));
      appendAudit(
        'ExecuteDeltaInformationChase',
        'DU-02 DealerInformationGatheringUnit',
        `Dispatched targeted information request to ${recipient} for ${itemCode} (Due: ${dueDate})`
      );
    },
    [activeCase.assignedOwner, updateActiveCase, appendAudit]
  );

  const closeInformationRequest = useCallback(
    (requestId: string, rationale: string) => {
      updateActiveCase((prev) => ({
        ...prev,
        informationRequests: prev.informationRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'CLOSED_WITH_RATIONALE', closureRationale: rationale } : r
        ),
      }));
      appendAudit(
        'EvaluateProvenanceAndGapAnalysis',
        'DU-02 DealerInformationGatheringUnit',
        `Closed information request ${requestId} with rationale: ${rationale} (BR-P12)`
      );
    },
    [updateActiveCase, appendAudit]
  );

  const addQualitativeNote = useCallback(
    (note: Omit<QualitativeNote, 'id' | 'timestamp' | 'authorId' | 'authorRole'>) => {
      const newNote: QualitativeNote = {
        id: `note-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        authorId: activeCase.assignedOwner.split(' ')[0],
        authorRole: currentUserRole,
        visitType: note.visitType,
        content: note.content,
        keyTakeaways: note.keyTakeaways,
      };
      updateActiveCase((prev) => ({
        ...prev,
        qualitativeNotes: [newNote, ...prev.qualitativeNotes],
      }));
      appendAudit('CaptureQualitativeDealerNotes', 'DU-02 DealerInformationGatheringUnit', `Logged qualitative visit note: ${note.visitType}`);
    },
    [activeCase.assignedOwner, currentUserRole, updateActiveCase, appendAudit]
  );

  // DU-03 Actions
  const resolveDiscrepancy = useCallback(
    (field: string, resolutionNote: string) => {
      updateActiveCase((prev) => ({
        ...prev,
        registryDiscrepancies: prev.registryDiscrepancies.map((d) =>
          d.field === field ? { ...d, status: 'RESOLVED', resolutionNote } : d
        ),
      }));
      appendAudit(
        'ReconcileEntityAndOfficers',
        'DU-03 EntityOwnershipVerificationUnit',
        `Resolved discrepancy for ${field}: ${resolutionNote} (BR-D01)`
      );
    },
    [updateActiveCase, appendAudit]
  );

  const attestEntityVerification = useCallback(() => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    updateActiveCase((prev) => ({
      ...prev,
      verificationAttested: true,
      verificationAttestedBy: `Analyst (${currentUserRole})`,
      verificationAttestedAt: timestamp,
    }));
    appendAudit(
      'AttestVerificationEvidence',
      'DU-03 EntityOwnershipVerificationUnit',
      `Onboarding Analyst formally attested 100% entity details and UBO structure (Gate IBVC-04-G1 passed)`
    );
  }, [currentUserRole, updateActiveCase, appendAudit]);

  // DU-04 Actions
  const adjudicateScreeningHit = useCallback(
    (hitId: string, disposition: 'DISPOSITIONED_FALSE_POSITIVE' | 'CONFIRMED_MATCH', rationale: string) => {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      updateActiveCase((prev) => ({
        ...prev,
        screeningFindings: prev.screeningFindings.map((f) =>
          f.id === hitId
            ? {
                ...f,
                status: disposition,
                dispositionRationale: rationale,
                dispositionedBy: `FCC Officer (${currentUserRole})`,
                dispositionedAt: timestamp,
              }
            : f
        ),
      }));
      appendAudit(
        'AdjudicateHitDisposition',
        'DU-04 DueDiligenceScreeningUnit',
        `FCC adjudication on hit ${hitId}: ${disposition}. Rationale: ${rationale} (REQ-032 / BR-P03)`
      );
    },
    [currentUserRole, updateActiveCase, appendAudit]
  );

  const escalateToMLRO = useCallback(
    (hitId: string, notes: string) => {
      updateActiveCase((prev) => ({
        ...prev,
        screeningFindings: prev.screeningFindings.map((f) =>
          f.id === hitId ? { ...f, status: 'CONFIRMED_MATCH', severity: 'CRITICAL', details: `${f.details} | MLRO ESCALATION: ${notes}` } : f
        ),
      }));
      appendAudit(
        'EscalateToFinancialCrimeCompliance',
        'DU-04 DueDiligenceScreeningUnit',
        `CRITICAL: MLRO Escalation triggered on hit ${hitId}. Case progression frozen per LR-02 (Anti-tipping-off)`
      );
    },
    [updateActiveCase, appendAudit]
  );

  const recordCRA = useCallback(
    (craRating: CRARating, rationale: string) => {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const cadence = craRating === 'HIGH' ? 'MONTHLY' : craRating === 'MEDIUM' ? 'QUARTERLY' : 'ANNUAL';
      updateActiveCase((prev) => ({
        ...prev,
        customerRiskAssessment: {
          craRating,
          rationale,
          recommendedReviewCadence: cadence,
          assessedAt: timestamp,
          assessedBy: `FCC Analyst (${currentUserRole})`,
        },
      }));
      appendAudit(
        'ProduceCustomerRiskAssessment',
        'DU-04 DueDiligenceScreeningUnit',
        `Recorded formal Customer Risk Assessment (CRA): ${craRating}. Review cadence set to ${cadence} (REQ-029 / BR-D03)`
      );
    },
    [currentUserRole, updateActiveCase, appendAudit]
  );

  // DU-05 Actions
  const updateFinancialCell = useCallback(
    (periodIndex: number, field: string, value: number) => {
      updateActiveCase((prev) => {
        const updatedPeriods = [...prev.financialPeriods];
        const target = { ...updatedPeriods[periodIndex], [field]: value };
        // recalculate basic subtotals if turnover/costOfSales changed
        if (field === 'turnover' || field === 'costOfSales') {
          target.grossProfit = target.turnover - target.costOfSales;
          target.ebit = target.grossProfit - target.operatingExpenses;
          target.profitBeforeTax = target.ebit - target.interestCharge;
          target.netProfit = target.profitBeforeTax - target.tax;
        }
        updatedPeriods[periodIndex] = target;
        return { ...prev, financialPeriods: updatedPeriods };
      });
      appendAudit('NormaliseFinancialStatements', 'DU-05 FinancialSpreadingAnalysisUnit', `Updated financial spreading field ${field} in period ${periodIndex}`);
    },
    [updateActiveCase, appendAudit]
  );

  // DU-06 Actions
  const reviewNarrativeSection = useCallback(
    (sectionId: string, decision: 'ACCEPTED' | 'AMENDED' | 'REJECTED', amendedText?: string) => {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      updateActiveCase((prev) => ({
        ...prev,
        narrativeSections: prev.narrativeSections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                status: decision,
                reviewedBy: `${activeCase.assignedOwner} (${currentUserRole})`,
                reviewedAt: timestamp,
                amendedText: decision === 'AMENDED' ? amendedText : sec.amendedText,
              }
            : sec
        ),
      }));
      appendAudit(
        'HumanReviewAndAttestationOfNarrative',
        'DU-06 CreditApplicationAuthoringUnit',
        `Narrative statement ${sectionId} ${decision} by ${currentUserRole} (REQ-052 / BR-U01 / PR-02)`
      );
    },
    [activeCase.assignedOwner, currentUserRole, updateActiveCase, appendAudit]
  );

  // DU-07 Actions
  const updateFacilityRequest = useCallback(
    (partialReq: Partial<FacilityRequest>) => {
      updateActiveCase((prev) => ({
        ...prev,
        facilityRequest: { ...prev.facilityRequest, ...partialReq },
        pricingSignoff: { ...prev.pricingSignoff, isAuthorized: false }, // Reset authorization on edit
      }));
      appendAudit('FormulateFacilityRequest', 'DU-07 LendingRequestPricingUnit', `Updated facility request terms`);
    },
    [updateActiveCase, appendAudit]
  );

  const authorizePricing = useCallback(
    (authorizerId: string, conditions?: string) => {
      // BR-E02 / REQ-088: Segregation of duties - preparer cannot be authorizer
      if (currentUserRole === activeCase.pricingSignoff.preparerRole) {
        return {
          success: false,
          error: `Segregation of Duties Violation (BR-E02 / REQ-088): The preparer role (${activeCase.pricingSignoff.preparerRole}) cannot authorize facility pricing. Must be authorized by an independent Commercial Director.`,
        };
      }

      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      updateActiveCase((prev) => ({
        ...prev,
        pricingSignoff: {
          ...prev.pricingSignoff,
          isAuthorized: true,
          authorizerId,
          authorizerRole: currentUserRole,
          authorizedAt: timestamp,
          conditionsOrNotes: conditions || 'Approved per commercial risk guidelines.',
        },
      }));
      appendAudit(
        'AuthorisePricingAndTermsDualSignoff',
        'DU-07 LendingRequestPricingUnit',
        `Independent four-eyes sign-off completed by ${authorizerId} (${currentUserRole}). Gate GATE-07 passed.`
      );
      return { success: true };
    },
    [activeCase.pricingSignoff.preparerRole, currentUserRole, updateActiveCase, appendAudit]
  );

  // DU-08 Actions
  const checkCompleteness = useCallback(() => {
    const hasUndispositionedHits = activeCase.screeningFindings.some(
      (f) => f.status === 'POTENTIAL_MATCH' || f.status === 'CONFIRMED_MATCH'
    );
    const hasCRA = !!activeCase.customerRiskAssessment;
    const areNarrativesReviewed =
      activeCase.narrativeSections.length > 0 &&
      activeCase.narrativeSections.every((n) => n.status !== 'PENDING_REVIEW');

    return evaluateCompletenessGate({
      checklist: activeCase.requirementChecklist,
      hasUndispositionedHits,
      hasCRA,
      verificationAttested: activeCase.verificationAttested,
      isPricingAuthorized: activeCase.pricingSignoff.isAuthorized,
      areNarrativesReviewed,
    });
  }, [activeCase]);

  const authorizeSubmissionToCredit = useCallback(() => {
    // BR-E01: Only accountable owner can authorize submission
    if (currentUserRole !== 'ACCOUNT_MANAGER' && currentUserRole !== 'WHOLESALE_MANAGER') {
      return {
        success: false,
        error: `Policy Rule BR-E01: Only the accountable Account Manager or Wholesale Manager can authorize submission to Credit Underwriting. Current active role is ${currentUserRole}.`,
      };
    }

    const gateResult = checkCompleteness();
    if (gateResult.isBlocked) {
      return {
        success: false,
        error: `Deterministic Completeness Gate (DT-2 / BR-P04) Failed: ${gateResult.blockingReasons.map((b) => b.reason).join(' | ')}`,
      };
    }

    const nextVer = `v1.${activeCase.submissionSnapshots.length}`;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const sha = generateSHA256Hash(`${activeCase.caseId}-${nextVer}-${timestamp}`);
    const queueTx = `TX-CR-${Date.now().toString().slice(-6)}`;

    const newSnapshot = {
      snapshotId: `SNAP-${activeCase.caseId}-${nextVer}`,
      packVersion: nextVer,
      submittedAt: timestamp,
      submittedBy: activeCase.assignedOwner,
      sha256Seal: sha,
      creditQueueTxId: queueTx,
      status: 'QUEUED_IN_CREDIT' as const,
    };

    updateActiveCase((prev) => ({
      ...prev,
      status: 'UNDERWRITING_REVIEW',
      currentStageNumber: 8,
      submissionSnapshots: [newSnapshot, ...prev.submissionSnapshots],
    }));

    appendAudit(
      'GenerateImmutableSnapshotAndTransmit',
      'DU-08 CreditSubmissionGatewayUnit',
      `Authorized and sealed decision-ready credit pack snapshot ${nextVer} with SHA-256 seal ${sha}. Transmitted to Underwriting queue ${queueTx} (REQ-063, REQ-064, BR-P05)`
    );

    return { success: true };
  }, [currentUserRole, checkCompleteness, activeCase, updateActiveCase, appendAudit]);

  const recordUnderwritingDecision = useCallback(
    (outcome: UnderwritingOutcome, rationale: string, conditions?: string[]) => {
      // BR-G01: Only Credit Underwriter can decide credit
      if (currentUserRole !== 'CREDIT_UNDERWRITER') {
        alert('Policy Rule BR-G01 / REQ-067: Only an independent Credit Underwriter can record underwriting decisions.');
        return;
      }

      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const creditRef = `CR-DEC-${Date.now().toString().slice(-5)}`;
      const conditionsList = (conditions || []).map((desc, idx) => ({
        id: `cp-${idx + 1}`,
        description: desc,
        satisfied: false,
      }));

      updateActiveCase((prev) => {
        let newStatus = prev.status;
        let newStage = prev.currentStageNumber;
        if (outcome === 'APPROVED' || outcome === 'APPROVED_WITH_CONDITIONS') {
          newStatus = 'POST_APPROVAL_FULFILLMENT';
          newStage = 9;
        }

        return {
          ...prev,
          status: newStatus,
          currentStageNumber: newStage,
          underwritingDecision: {
            outcome,
            creditReference: creditRef,
            decisionDate: timestamp,
            underwriterId: 'Independent Credit Underwriter',
            rationale,
            conditionsPrecedent: conditionsList,
          },
        };
      });

      appendAudit(
        'RecordCreditOutcome',
        'DU-08 CreditSubmissionGatewayUnit',
        `Independent underwriter recorded binding decision: ${outcome} (Ref: ${creditRef}). Rationale: ${rationale} (REQ-066 / BR-G01)`
      );
    },
    [currentUserRole, updateActiveCase, appendAudit]
  );

  const raiseUnderwriterQuery = useCallback(
    (queryText: string) => {
      const newQuery = {
        id: `qry-${Date.now().toString().slice(-4)}`,
        raisedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        underwriterName: 'Credit Underwriting Panel',
        queryText,
        assignedOwner: activeCase.assignedOwner,
        status: 'OPEN' as const,
      };

      updateActiveCase((prev) => ({
        ...prev,
        status: 'UNDERWRITING_REVIEW',
        underwriterQueries: [newQuery, ...prev.underwriterQueries],
      }));

      appendAudit(
        'HandleCreditQueryAndVersionPack',
        'DU-08 CreditSubmissionGatewayUnit',
        `Credit Underwriter raised formal query: "${queryText}". Assigned to case owner ${activeCase.assignedOwner} (REQ-065 / BR-P13)`
      );
    },
    [activeCase.assignedOwner, updateActiveCase, appendAudit]
  );

  const resolveUnderwriterQuery = useCallback(
    (queryId: string, resolutionText: string) => {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
      updateActiveCase((prev) => ({
        ...prev,
        underwriterQueries: prev.underwriterQueries.map((q) =>
          q.id === queryId ? { ...q, status: 'RESOLVED', resolutionResponse: resolutionText, resolvedAt: timestamp } : q
        ),
      }));
      appendAudit(
        'HandleCreditQueryAndVersionPack',
        'DU-08 CreditSubmissionGatewayUnit',
        `Resolved underwriter query ${queryId} with clarification: "${resolutionText}" (Rework loop closed)`
      );
    },
    [updateActiveCase, appendAudit]
  );

  // DU-09 Actions
  const updateHandoffStatus = useCallback(
    (track: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED') => {
      updateActiveCase((prev) => ({
        ...prev,
        fulfillmentHandoffs: prev.fulfillmentHandoffs.map((h) =>
          h.track === track ? { ...h, status, completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined } : h
        ),
      }));
      appendAudit('InitiateDownstreamHandoffs', 'DU-09 PostApprovalFulfillmentUnit', `Updated downstream handoff ${track} to ${status}`);
    },
    [updateActiveCase, appendAudit]
  );

  const satisfyConditionPrecedent = useCallback(
    (conditionId: string, docName: string) => {
      updateActiveCase((prev) => {
        if (!prev.underwritingDecision) return prev;
        const updatedConditions = prev.underwritingDecision.conditionsPrecedent.map((c) =>
          c.id === conditionId ? { ...c, satisfied: true, evidenceDoc: docName } : c
        );
        return {
          ...prev,
          underwritingDecision: {
            ...prev.underwritingDecision,
            conditionsPrecedent: updatedConditions,
          },
        };
      });
      appendAudit(
        'TrackApprovalConditionsPrecedent',
        'DU-09 PostApprovalFulfillmentUnit',
        `Satisfied Condition Precedent ${conditionId} with evidence: ${docName} (REQ-072 / BR-P08)`
      );
    },
    [updateActiveCase, appendAudit]
  );

  const enableOperationalFunding = useCallback(() => {
    updateActiveCase((prev) => ({
      ...prev,
      status: 'ACTIVE_FUNDING',
      currentStageNumber: 9,
    }));
    appendAudit(
      'FinaliseCaseClosureAndNotifyMilestones',
      'DU-09 PostApprovalFulfillmentUnit',
      `All handoffs and Conditions Precedent satisfied. Operational wholesale vehicle drawdowns ENABLED. Gate GATE-09 passed.`
    );
  }, [updateActiveCase, appendAudit]);

  // DU-10 Actions
  const triggerLifecycleEvent = useCallback(
    (eventType: string) => {
      const today = new Date().toISOString().split('T')[0];
      updateActiveCase((prev) => ({
        ...prev,
        periodicReview: {
          ...prev.periodicReview,
          triggerEventsHistory: [{ date: today, eventType, resolved: false }, ...prev.periodicReview.triggerEventsHistory],
        },
      }));
      appendAudit(
        'SpawnEventDrivenReviewCase',
        'DU-10 PeriodicLifecycleReviewUnit',
        `Statutory trigger event detected: ${eventType}. Spawned event-driven review case per REQ-075`
      );
    },
    [updateActiveCase, appendAudit]
  );

  // DU-11 Actions
  const refreshPassportItem = useCallback(
    (itemType: string) => {
      const today = new Date().toISOString().split('T')[0];
      updateActiveCase((prev) => ({
        ...prev,
        masterPassport: {
          ...prev.masterPassport,
          reusablePassportItems: prev.masterPassport.reusablePassportItems.map((item) =>
            item.itemType === itemType
              ? { ...item, verifiedDate: today, ageDays: 0, isStale: false }
              : item
          ),
        },
      }));
      appendAudit(
        'CurateCrossLendingLineDataReuse',
        'DU-11 MasterDataReuseUnit',
        `Refreshed external provider record for ${itemType} across shared Master Passport (REQ-079 / BR-E06)`
      );
    },
    [updateActiveCase, appendAudit]
  );

  // DU-12 Actions
  const recordExceptionOverride = useCallback(
    (exceptionType: string, reason: string) => {
      const newRec: ExceptionOverrideRecord = {
        id: `EXC-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        caseId: activeCase.caseId,
        exceptionType,
        reason,
        approverId: `${activeCase.assignedOwner} (${currentUserRole})`,
        approverRole: currentUserRole,
      };
      setExceptionsRegister((prev) => [newRec, ...prev]);
      appendAudit(
        'LogExceptionsAndOverridesWithApprovedJustification',
        'DU-12 GovernanceAuditTelemetryUnit',
        `Recorded policy exception ${exceptionType}: ${reason} (REQ-091 / BR-E04)`
      );
    },
    [activeCase.caseId, activeCase.assignedOwner, currentUserRole, appendAudit]
  );

  return (
    <CreditAssessmentContext.Provider
      value={{
        cases,
        activeCaseId,
        activeCase,
        currentUserRole,
        setCurrentUserRole,
        activeDU,
        setActiveDU,
        auditLedger,
        exceptionsRegister,
        telemetry,
        selectCase: setActiveCaseId,
        updateCaseClassification,
        assignCaseOwner,
        toggleChecklistItem,
        addInformationRequest,
        closeInformationRequest,
        addQualitativeNote,
        resolveDiscrepancy,
        attestEntityVerification,
        adjudicateScreeningHit,
        escalateToMLRO,
        recordCRA,
        updateFinancialCell,
        reviewNarrativeSection,
        updateFacilityRequest,
        authorizePricing,
        checkCompleteness,
        authorizeSubmissionToCredit,
        recordUnderwritingDecision,
        raiseUnderwriterQuery,
        resolveUnderwriterQuery,
        updateHandoffStatus,
        satisfyConditionPrecedent,
        enableOperationalFunding,
        triggerLifecycleEvent,
        refreshPassportItem,
        recordExceptionOverride,
      }}
    >
      {children}
    </CreditAssessmentContext.Provider>
  );
};

export const useCreditAssessment = () => {
  const context = useContext(CreditAssessmentContext);
  if (!context) {
    throw new Error('useCreditAssessment must be used within a CreditAssessmentProvider');
  }
  return context;
};
