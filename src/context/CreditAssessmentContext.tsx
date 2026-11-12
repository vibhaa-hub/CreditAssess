/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ApexCredit Assessment Context Engine
 * Central state orchestration across all 12 AST Deployable Units
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  PeriodFinancials,
} from '../types/ast';
import { emptyCase } from '../data/emptyCase';
import { calculateEffortTelemetry, financialSourceFields, recalculateFinancialPeriod } from '../utils/calculations';
import { evaluateCompletenessGate, getRequirementsForCaseType } from '../data/decisionTables';

interface CreditAssessmentContextType {
  cases: CreditCase[];
  casesLoading: boolean;
  casesError: string | null;
  caseSaveError: string | null;
  refreshCases: () => Promise<void>;
  importCase: (caseData: unknown) => Promise<void>;
  activeCaseId: string;
  activeCase: CreditCase;
  authorizedRoles: UserRole[];
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
  updateDealerProfile: (updates: Partial<CreditCase['dealerProfile']>) => void;
  assignCaseOwner: (ownerName: string, role: UserRole) => void;
  // DU-02 Actions
  recordRequirementEvidence: (itemId: string, evidenceReference: string, provider: string) => void;
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
  updateFinancialCell: (periodIndex: number, field: string, value: number | undefined) => void;
  updateFinancialPeriodMetadata: (
    periodIndex: number,
    metadata: Partial<Pick<PeriodFinancials, 'periodLabel' | 'periodEndDate' | 'isAudited'>>
  ) => void;
  addFinancialPeriod: () => void;
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
  // DU-12 Actions
  recordExceptionOverride: (exceptionType: string, reason: string) => void;
}

const CreditAssessmentContext = createContext<CreditAssessmentContextType | undefined>(undefined);

export const CreditAssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<CreditCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [caseSaveError, setCaseSaveError] = useState<string | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('GOVERNANCE_AUDITOR');
  const [authorizedRoles, setAuthorizedRoles] = useState<UserRole[]>([]);
  const [activeDU, setActiveDU] = useState<number>(8); // Default to Gateway / authoring overview

  const [exceptionsRegister, setExceptionsRegister] = useState<ExceptionOverrideRecord[]>([]);
  const [auditLedger, setAuditLedger] = useState<AuditRecord[]>([]);
  const caseVersions = useRef(new Map<string, number>());
  const casesRef = useRef(cases);
  const writeQueues = useRef(new Map<string, Promise<void>>());
  casesRef.current = cases;

  const activeCase = useMemo(() => {
    return cases.find((c) => c.caseId === activeCaseId) || cases[0] || emptyCase;
  }, [cases, activeCaseId]);

  const refreshCases = useCallback(async () => {
    setCasesLoading(true);
    setCasesError(null);
    try {
      const response = await fetch('/api/cases');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Case loading failed (${response.status}).`);
      const records = data.cases as { caseData: CreditCase; version: number }[];
      const loadedCases = records.map((record) => record.caseData);
      caseVersions.current = new Map(records.map((record) => [record.caseData.caseId, record.version]));
      casesRef.current = loadedCases;
      setCases(loadedCases);
      setActiveCaseId((current) =>
        loadedCases.some((creditCase) => creditCase.caseId === current)
          ? current
          : loadedCases[0]?.caseId ?? ''
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load cases.';
      setCasesError(message);
      throw error;
    } finally {
      setCasesLoading(false);
    }
  }, []);

  const loadAudit = useCallback(async (caseId: string) => {
    const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/audit`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Audit loading failed (${response.status}).`);
    setAuditLedger(
      data.events.map((event: {
        id: string;
        createdAt: string;
        actorId: string;
        action: string;
        details: string;
        eventHash: string;
        previousHash: string;
      }) => ({
        id: event.id,
        timestamp: event.createdAt,
        actorId: event.actorId,
        action: event.action,
        details: event.details,
        hash: event.eventHash,
        previousHash: event.previousHash,
      }))
    );
  }, []);

  const importCase = useCallback(async (caseData: unknown) => {
    setCaseSaveError(null);
    const response = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseData }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Import failed (${response.status}).`);
    const savedCase = result as { caseData: CreditCase; version: number };
    caseVersions.current.set(savedCase.caseData.caseId, savedCase.version);
    const updatedCases = [
      savedCase.caseData,
      ...casesRef.current.filter((item) => item.caseId !== savedCase.caseData.caseId),
    ];
    casesRef.current = updatedCases;
    setCases(updatedCases);
    setActiveCaseId(savedCase.caseData.caseId);
    await loadAudit(savedCase.caseData.caseId);
  }, [loadAudit]);

  useEffect(() => {
    refreshCases().catch(() => {});
  }, [refreshCases]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load identity roles.');
        const validRoles: UserRole[] = [
          'ACCOUNT_MANAGER',
          'WHOLESALE_MANAGER',
          'ONBOARDING_ANALYST',
          'FCC_ANALYST',
          'COMMERCIAL_DIRECTOR',
          'CREDIT_UNDERWRITER',
          'OPERATIONS_ANALYST',
          'GOVERNANCE_AUDITOR',
        ];
        const roles = (data.roles as string[]).filter((role): role is UserRole => validRoles.includes(role as UserRole));
        setAuthorizedRoles(roles);
        if (roles.length > 0) setCurrentUserRole(roles[0]);
      })
      .catch((error) => {
        setCaseSaveError(error instanceof Error ? error.message : 'Could not load identity roles.');
      });
  }, []);

  useEffect(() => {
    if (activeCaseId) {
      loadAudit(activeCaseId).catch((error) => {
        setCaseSaveError(error instanceof Error ? error.message : 'Could not load audit events.');
      });
    } else {
      setAuditLedger([]);
    }
  }, [activeCaseId, loadAudit]);

  const appendAudit = useCallback(
    (action: string, du: string, details: string) => {
      if (!activeCaseId) return;
      const caseId = activeCaseId;
      const previous = writeQueues.current.get(caseId) ?? Promise.resolve();
      const queuedWrite = previous.then(async () => {
        const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/audit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, details: `${du}: ${details}` }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Audit write failed (${response.status}).`);
        await loadAudit(caseId);
      });
      writeQueues.current.set(
        caseId,
        queuedWrite.catch((error) => {
          setCaseSaveError(error instanceof Error ? error.message : 'Could not write audit event.');
        })
      );
    },
    [activeCaseId, loadAudit]
  );

  const updateActiveCase = useCallback(
    (updater: (c: CreditCase) => CreditCase) => {
      const current = casesRef.current.find((creditCase) => creditCase.caseId === activeCaseId);
      if (!current) return;
      const updatedCase = updater(current);
      const updatedCases = casesRef.current.map((creditCase) =>
        creditCase.caseId === activeCaseId ? updatedCase : creditCase
      );
      casesRef.current = updatedCases;
      setCases(updatedCases);
      setCaseSaveError(null);

      const caseId = activeCaseId;
      const previous = writeQueues.current.get(caseId) ?? Promise.resolve();
      const queuedWrite = previous.then(async () => {
        const expectedVersion = caseVersions.current.get(caseId);
        if (expectedVersion === undefined) throw new Error('Case version is missing; reload before editing.');
        const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseData: updatedCase, expectedVersion }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Case save failed (${response.status}).`);
        caseVersions.current.set(caseId, result.version);
      });
      writeQueues.current.set(
        caseId,
        queuedWrite.catch(async (error) => {
          setCaseSaveError(error instanceof Error ? error.message : 'Could not save this case.');
          try {
            const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}`);
            const result = await response.json();
            if (response.ok) {
              caseVersions.current.set(caseId, result.version);
              const refreshedCases = casesRef.current.map((creditCase) =>
                creditCase.caseId === caseId ? result.caseData as CreditCase : creditCase
              );
              casesRef.current = refreshedCases;
              setCases(refreshedCases);
              await loadAudit(caseId);
            }
          } catch (refreshError) {
            setCaseSaveError(
              refreshError instanceof Error
                ? `Save failed and reload failed: ${refreshError.message}`
                : 'Save failed and the current data could not be reloaded.'
            );
          }
        })
      );
    },
    [activeCaseId, loadAudit]
  );

  // Telemetry computation (CALC-013, REQ-093 to REQ-097)
  const telemetry = useMemo(() => {
    const stageEffort: { stage: string; minutes: number }[] = [];
    const effort = calculateEffortTelemetry(stageEffort);
    const volumeByLine: Record<LendingLine, number> = { WHOLESALE: 0, FRANCHISE: 0, FLEET: 0, RETAIL: 0 };
    const volumeBySource: Record<string, number> = {
      OEM_PARTNER: 0,
      FIELD_TEAM: 0,
      DEALER_DIRECT: 0,
      BANK_REFERRAL: 0,
      EXISTING_RELATIONSHIP: 0,
    };
    for (const creditCase of cases) {
      for (const line of creditCase.classification.affectedLendingLines) volumeByLine[line] += 1;
      volumeBySource[creditCase.originationSource] += 1;
    }

    return {
      isMeasured: false,
      totalEffortMinutes: effort.totalEffortMinutes,
      baselineBenchmarkMinutes: effort.baselineBenchmarkMinutes,
      effortVarianceMinutes: effort.varianceMinutes,
      effortSavingsPct: effort.savingsPct,
      stageEffort,
      totalCaseCount: cases.length,
      overdueReviewCount: cases.filter((creditCase) => creditCase.periodicReview.isOverdue).length,
      caseVolumeByLine: volumeByLine,
      caseVolumeBySource: volumeBySource as TelemetryMetrics['caseVolumeBySource'],
      reworkCount: cases.reduce(
        (total, creditCase) => total + creditCase.underwriterQueries.filter((query) => query.status === 'RESOLVED').length,
        0
      ),
      queryCount: activeCase.underwriterQueries.length,
      exceptionCount: exceptionsRegister.length,
      manualInterventionsCount: auditLedger.length,
    };
  }, [cases, activeCase, exceptionsRegister, auditLedger]);

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

  const updateDealerProfile = useCallback(
    (updates: Partial<CreditCase['dealerProfile']>) => {
      updateActiveCase((prev) => ({
        ...prev,
        dealerProfile: { ...prev.dealerProfile, ...updates },
      }));
      appendAudit('UpdateCustomerSuppliedBusinessDetails', 'DU-02 DealerInformationGatheringUnit', 'Updated business identity information supplied for this case');
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
  const recordRequirementEvidence = useCallback(
    (itemId: string, evidenceReference: string, provider: string) => {
      if (!evidenceReference.trim() || !provider.trim()) {
        throw new Error('An evidence reference and source/provider are required.');
      }
      updateActiveCase((prev) => ({
        ...prev,
        requirementChecklist: prev.requirementChecklist.map((item) =>
          item.id === itemId
            ? {
                ...item,
                satisfied: true,
                provenanceSource: evidenceReference.trim(),
                provider: provider.trim(),
                receivedDate: new Date().toISOString().split('T')[0],
                isStale: false,
              }
            : item
        ),
      }));
      appendAudit(
        'RecordRequirementEvidence',
        'DU-02 DealerInformationGatheringUnit',
        `Recorded evidence reference for ${itemId}: ${evidenceReference.trim()} (source/provider: ${provider.trim()})`
      );
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
    (periodIndex: number, field: string, value: number | undefined) => {
      updateActiveCase((prev) => {
        const updatedPeriods = [...prev.financialPeriods];
        const period = updatedPeriods[periodIndex];
        if (!period) return prev;
        const enteredFields = new Set(period.enteredFields ?? financialSourceFields);
        if (value === undefined) enteredFields.delete(field);
        else enteredFields.add(field);
        updatedPeriods[periodIndex] = recalculateFinancialPeriod({
          ...period,
          [field]: value ?? 0,
          enteredFields: [...enteredFields],
        });
        return { ...prev, financialPeriods: updatedPeriods };
      });
      appendAudit('NormaliseFinancialStatements', 'DU-05 FinancialSpreadingAnalysisUnit', `Updated financial spreading field ${field} in period ${periodIndex}`);
    },
    [updateActiveCase, appendAudit]
  );

  const updateFinancialPeriodMetadata = useCallback(
    (
      periodIndex: number,
      metadata: Partial<Pick<PeriodFinancials, 'periodLabel' | 'periodEndDate' | 'isAudited'>>
    ) => {
      updateActiveCase((prev) => ({
        ...prev,
        financialPeriods: prev.financialPeriods.map((period, index) =>
          index === periodIndex ? { ...period, ...metadata } : period
        ),
      }));
      appendAudit('UpdateFinancialPeriodMetadata', 'DU-05 FinancialSpreadingAnalysisUnit', `Updated period metadata for period ${periodIndex}`);
    },
    [updateActiveCase, appendAudit]
  );

  const addFinancialPeriod = useCallback(() => {
    updateActiveCase((prev) => {
      const period: PeriodFinancials = {
        periodLabel: '',
        periodEndDate: '',
        isAudited: false,
        currency: 'GBP',
        turnover: 0,
        costOfSales: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        ebit: 0,
        interestCharge: 0,
        profitBeforeTax: 0,
        tax: 0,
        netProfit: 0,
        currentAssets: 0,
        inventory: 0,
        tradeDebtors: 0,
        cashAndEquivalents: 0,
        totalAssets: 0,
        currentLiabilities: 0,
        tradeCreditors: 0,
        shortTermBorrowings: 0,
        longTermBorrowings: 0,
        totalBorrowings: 0,
        totalLiabilities: 0,
        netAssets: 0,
        shareholdersEquity: 0,
        tangibleEquity: 0,
        openingCash: 0,
        operatingCashflow: 0,
        investingCashflow: 0,
        financingCashflow: 0,
        closingCash: 0,
        cashflowDifference: 0,
        enteredFields: [],
      };
      return { ...prev, financialPeriods: [...prev.financialPeriods, period] };
    });
    appendAudit('AddFinancialPeriod', 'DU-05 FinancialSpreadingAnalysisUnit', 'Added a financial period for source-data entry');
  }, [updateActiveCase, appendAudit]);

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

    return {
      success: false,
      error: 'Credit submission is disabled: no real credit-gateway integration is configured.',
    };
  }, [currentUserRole, checkCompleteness]);

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
    setCaseSaveError('Funding activation is disabled until a real servicing integration is implemented.');
  }, []);

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

  // DU-12 Actions
  const recordExceptionOverride = useCallback(
    (_exceptionType: string, _reason: string) => {
      setCaseSaveError('Exception overrides are disabled until they can be stored and independently authorized on the server.');
    },
    []
  );

  return (
    <CreditAssessmentContext.Provider
      value={{
        cases,
        casesLoading,
        casesError,
        caseSaveError,
        refreshCases,
        importCase,
        activeCaseId,
        activeCase,
        authorizedRoles,
        currentUserRole,
        setCurrentUserRole,
        activeDU,
        setActiveDU,
        auditLedger,
        exceptionsRegister,
        telemetry,
        selectCase: setActiveCaseId,
        updateCaseClassification,
        updateDealerProfile,
        assignCaseOwner,
        recordRequirementEvidence,
        addInformationRequest,
        closeInformationRequest,
        addQualitativeNote,
        resolveDiscrepancy,
        attestEntityVerification,
        adjudicateScreeningHit,
        escalateToMLRO,
        recordCRA,
        updateFinancialCell,
        updateFinancialPeriodMetadata,
        addFinancialPeriod,
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
