``
CreditPackAssessmentProcess (Root)
│
├── [DU-01] RequestIntakeAndTriageUnit (Deployable Unit 1 / P-01 | Domain: DOM-01 Origination)
│   ├── Ingress: POST /api/v1/cases/intake | Event: dealer.referral.received
│   ├── Sequence: IntakePipeline
│   │   ├── Activity: RegisterCreditRequest
│   │   │   ├── Description: Captures the inbound request from email, portal, or OEM referral, timestamps receipt, and initializes the master case file.
│   │   │   ├── Agent: IntakeTriageAgent [Autonomous]
│   │   │   ├── Reads: [RawIncomingMessage, ChannelMetadata (Source channel, sender, timestamp)]
│   │   │   ├── Writes: [DealerCaseHeader (Unique Case ID, receipt date, originating source)]
│   │   │   └── Rules:
│   │   │       ├── REQ-001: Record every credit request as a uniquely identified case at point of receipt.
│   │   │       ├── REQ-003: Record origination source (OEM partner, field team, dealer direct, bank referral, existing relationship).
│   │   │       └── BR-G02: Every action on a case must be attributable to an actor, date, and timestamp.
│   │   │
│   │   ├── Activity: ClassifyCaseType
│   │   │   ├── Description: Analyzes the application scope and categorizes the request into one or more standard lifecycle event types.
│   │   │   ├── Agent: IntakeTriageAgent [Autonomous]
│   │   │   ├── Reads: [DealerCaseHeader, ChannelPayload (Application form, dealer request letter)]
│   │   │   ├── Writes: [CaseClassification (New relationship, new franchise, increased borrowing, acquisition, disposal, director/shareholder change, review)]
│   │   │   └── Rules:
│   │   │       └── REQ-002: Classify case into one or more of the seven statutory request categories.
│   │   │
│   │   ├── Activity: AssignAccountableOwner
│   │   │   ├── Description: Evaluates relationship lines (Franchise vs. Wholesale) and assigns case ownership to a single accountable Account Manager or Wholesale Manager.
│   │   │   ├── Agent: IntakeTriageAgent [Autonomous / Supervised by Sales Management]
│   │   │   ├── Reads: [CaseClassification, TeamCapacityRoster (Account Manager availability, regional coverage)]
│   │   │   ├── Writes: [CaseOwnershipAssignment (Designated case owner ID, assignment timestamp)]
│   │   │   └── Rules:
│   │   │       ├── REQ-005: Assign every case to exactly one accountable Account Manager or Wholesale Manager.
│   │   │       └── BR-E01: Only the accountable owner can authorize pack submission to Credit.
│   │   │
│   │   ├── Activity: DetectDuplicateOrRecentCases
│   │   │   ├── Description: Queries the master dealer repository to check for open or recently closed submissions for the same legal entity to prevent duplicate work.
│   │   │   ├── Agent: MasterDataAgent [Autonomous]
│   │   │   ├── Reads: [DealerCaseHeader, DealerMasterRegistry (Company registration numbers, active case registry)]
│   │   │   ├── Writes: [DuplicateAlertRecord (Conflict status, linked open case IDs, owner details)]
│   │   │   └── Rules:
│   │   │       ├── REQ-006: Alert the case owner when an open or recent case exists for the same dealer entity.
│   │   │       └── BR-G05: Policy parameters (recency window) must be dynamically configured, not hardcoded.
│   │   │
│   │   └── Activity: ResolveRequirementSetChecklist
│   │       ├── Description: Evaluates the classification against Decision Table DT-1 to determine all required documents, verifications, checks, and financial spreading tasks.
│   │       ├── Agent: IntakeTriageAgent [Autonomous]
│   │       ├── Reads: [CaseClassification, ExistingHeldData (Previously verified items within validity window)]
│   │       ├── Writes: [ApplicableRequirementSet (Itemized dynamic checklist of mandatory evidence and checks)]
│   │       └── Rules:
│   │           ├── REQ-004: Display affected lending lines (franchise, wholesale, fleet, retail) and held information.
│   │           ├── REQ-007: Determine the applicable requirement set at case creation and display as an active checklist.
│   │           ├── DT-1: Case-type to activity applicability decision table.
│   │           └── BR-P01: The case type strictly determines the applicable requirement set.
│   │
│   └── ControlGate: IBVC-01-G1 (Intake Requirement Set Confirmed)
│       └── Condition: Case type classified, accountable owner assigned, and dynamic checklist generated.
│
├── [DU-02] DealerInformationGatheringUnit (Deployable Unit 2 / P-02 | Domain: DOM-06 Evidence Management)
│   ├── Ingress: POST /api/v1/cases/{id}/documents | Event: case.registered
│   ├── ParallelFanOut: MultiFormatIngestion (Joins when all parallel streams complete)
│   │   ├── Activity: IngestLegalEntityData
│   │   │   ├── Description: Extracts and normalises legal entity identification attributes from uploaded documents, OEM feeds, or dealer portals.
│   │   │   ├── Agent: DocumentIngestionAgent [Autonomous OCR / NLP]
│   │   │   ├── Reads: [DealerApplicationForm, OEMChannelData]
│   │   │   ├── Writes: [DealerEntityProfile (Legal name, registered number, registered address, trading names, legal form)]
│   │   │   └── Rules:
│   │   │       ├── REQ-008: Capture dealer legal entity details (name, registered number, address, trading name, legal form).
│   │   │       └── REQ-014: Ingest information from multi-format sources (PDFs, Excel, images, emails, application forms).
│   │   │
│   │   ├── Activity: IngestDirectorAndShareholderData
│   │   │   ├── Agent: DocumentIngestionAgent [Autonomous OCR / NLP]
│   │   │   ├── Description: Extracts named individuals, roles, shareholdings, and beneficial owners from onboarding forms and corporate filings.
│   │   │   ├── Reads: [DealerApplicationForm, OnboardingPacks]
│   │   │   ├── Writes: [PartyIdentityGraph (Director names, appointment dates, shareholder equity %, UBO declarations)]
│   │   │   └── Rules:
│   │   │       ├── REQ-009: Capture director information (name, role, appointment details, ID&V identifiers).
│   │   │       ├── REQ-010: Capture shareholder information, including equity % and ultimate beneficial owners (UBOs).
│   │   │       └── LR-01: Money Laundering Regulations 2017 - Customer due diligence and beneficial ownership identification.
│   │   │
│   │   ├── Activity: IngestFinancialStatements
│   │   │   ├── Description: Parses audited annual accounts, management information (MI), and bank statements across varied formats (scanned PDFs, Excel spreadsheets).
│   │   │   ├── Agent: DocumentIngestionAgent [Autonomous OCR / Tabular Parser]
│   │   │   ├── Reads: [AnnualAccountsPDF, ManagementAccountsXLS, RawScans]
│   │   │   ├── Writes: [RawFinancialArtifacts (Raw balance sheet, P&L, cashflow, notes, statements by period)]
│   │   │   └── Rules:
│   │   │       ├── REQ-011: Capture financial information supplied by dealer (annual accounts, MI, statements).
│   │   │       ├── REQ-014: Accept mixed data formats without requiring manual pre-conversion.
│   │   │       └── REQ-083: Flag unreadable documents and prompt for readable alternatives or manual transcription.
│   │   │
│   │   └── Activity: IngestConsentAndDataProtectionDocs
│   │       ├── Description: Validates presence of signed search consents, credit bureau search mandates, and GDPR privacy notifications.
│   │       ├── Agent: DocumentIngestionAgent [Autonomous Document Classifier]
│   │       ├── Reads: [SignedConsentPDF, GDPRNotice]
│   │       ├── Writes: [SearchAuthorityConsent (Signed consent records, signatory names, execution dates)]
│   │       └── Rules:
│   │           ├── REQ-012: Capture authority and search consent documentation prior to external bureau checks.
│   │           ├── REQ-013: Capture data protection and privacy notices for each case.
│   │           └── LR-04: UK GDPR & Data Protection Act 2018 - Establish lawful basis for personal data processing.
│   │
│   ├── Activity: CaptureQualitativeDealerNotes
│   │   ├── Description: Logs qualitative notes from physical dealer visits, telephone interviews, and management discussions directly against the case.
│   │   ├── Agent: AccountManagerAgent [Human-in-the-Loop]
│   │   ├── Reads: [CallTranscripts, MeetingMinutes, DirectDealerInterviews]
│   │   ├── Writes: [QualitativeContextNotes (Discussion summaries, operational impressions, author ID, timestamp)]
│   │   └── Rules:
│   │       └── REQ-017: Capture qualitative information from dealer meetings and phone calls linked to author, date, and case.
│   │
│   ├── Activity: EvaluateProvenanceAndGapAnalysis
│   │   ├── Description: Compares captured artifacts against the Applicable Requirement Set to verify information provenance, detect missing items, and identify expired data.
│   │   ├── Agent: InformationGatheringAgent [Autonomous]
│   │   ├── Reads: [ApplicableRequirementSet, DealerEntityProfile, PartyIdentityGraph, RawFinancialArtifacts]
│   │   ├── Writes: [MissingInformationChecklist (Itemized gap log), InformationRequestDocket (Actionable requests with due dates)]
│   │   └── Rules:
│   │       ├── REQ-015: Record provenance (source, provider, date received, effective date) for every item.
│   │       ├── REQ-016: Identify missing, inconsistent, or stale information against the checklist.
│   │       ├── REQ-018: Record outstanding information requests with owner, recipient, and due date.
│   │       ├── BR-P12: Each information request must have an owner and due date; closing without receipt requires a reason.
│   │       └── BR-G03: A value without a recorded source is marked unverified and cannot be presented as fact.
│   │
│   └── Activity: ExecuteDeltaInformationChase
│       ├── Description: Automatically generates targeted dealer communications requesting missing documents or clarifying inconsistent figures.
│       ├── Agent: InformationGatheringAgent [Autonomous / Supervised by AM]
│       ├── Reads: [InformationRequestDocket]
│       ├── Writes: [DispatchedDealerRequests, ReceivedInformationDeltas]
│       └── Rules:
│           ├── REQ-018: Track information requests until received or closed with an authorized business rationale.
│           ├── REQ-019: Retrieve and display existing relationship data before requesting items again.
│           └── BR-E06: Information already held and within policy validity must be reused, not requested again.
│
├── [DU-03] EntityOwnershipVerificationUnit (Deployable Unit 3 / P-03 | Domain: DOM-02 Due Diligence)
│   ├── Ingress: POST /api/v1/verify/entity | Event: dealer.data.ingested
│   ├── Sequence: RegistryReconciliationPipeline
│   │   ├── Activity: FetchExternalRegistryData
│   │   │   ├── Description: Queries Companies House and official corporate registries to retrieve authoritative registration, officer, and PSC (Persons with Significant Control) records.
│   │   │   ├── Agent: RegistryVerificationAgent [Autonomous API Connector]
│   │   │   ├── Reads: [DealerEntityProfile.RegisteredNumber]
│   │   │   ├── Writes: [CompaniesHouseSnapshot, CreditBureauEntitySnapshot]
│   │   │   └── Rules:
│   │   │       ├── REQ-020: Verify dealer legal entity details against official Companies House records.
│   │   │       ├── LR-05: Companies Act 2006 - Verification of registered details and Persons with Significant Control (PSC).
│   │   │       └── BR-E05: External provider data must be retained and used strictly within contractual licensing terms.
│   │   │
│   │   ├── Activity: ReconcileEntityAndOfficers
│   │   │   ├── Description: Reconciles dealer-supplied entity details, trading names, registered directors, and shareholders against official Companies House registry data.
│   │   │   ├── Agent: RegistryVerificationAgent [Autonomous]
│   │   │   ├── Reads: [DealerEntityProfile, PartyIdentityGraph, CompaniesHouseSnapshot]
│   │   │   ├── Writes: [EntityReconciliationRecord (Match confirmations, discrepancies), ValidatedOwnershipStructure (Tree of corporate and natural owners)]
│   │   │   └── Rules:
│   │   │       ├── REQ-020: Show every discrepancy between dealer-supplied entity details and Companies House.
│   │   │       ├── REQ-021: Compare directors and shareholders with registry record and highlight differences.
│   │   │       ├── REQ-022: Present ownership and control structure, including group affiliations, to case owner.
│   │   │       ├── BR-D01: Entity details must reconcile with registry, or discrepancies must be formally resolved.
│   │   │       └── BR-D10: Ownership percentages must reconcile to 100% within policy tolerance.
│   │   │
│   │   ├── Activity: TraverseConnectedPartyAffiliations
│   │   │   ├── Description: Graph-traverses directors and beneficial owners across the lender's historical customer database to detect shared directorships or inter-dealer affiliations.
│   │   │   ├── Agent: RegistryVerificationAgent [Autonomous Graph Engine]
│   │   │   ├── Reads: [ValidatedOwnershipStructure, DealerMasterRegistry]
│   │   │   ├── Writes: [ConnectedDealerAffiliationReport (List of connected dealers, cross-directorships, aggregated group exposures)]
│   │   │   └── Rules:
│   │   │       ├── REQ-023: Identify directors and shareholders linked to other known entities or dealers.
│   │   │       └── BR-D11: Any director or shareholder linked to another known dealer must be disclosed to Credit.
│   │   │
│   │   └── Activity: AttestVerificationEvidence
│   │       ├── Description: Enables an Onboarding Analyst to review reconciliation deltas, confirm resolving evidence, and formally attest verification outcomes.
│   │       ├── Agent: OnboardingAnalystAgent [Human-in-the-Loop]
│   │       ├── Reads: [EntityReconciliationRecord, ValidatedOwnershipStructure, ConnectedDealerAffiliationReport]
│   │       ├── Writes: [EntityVerificationAttestation (Sign-off record, evidence links, verification timestamp)]
│   │       └── Rules:
│   │           ├── REQ-024: Record verification outcome and evidence for each entity and individual verified.
│   │           └── BR-G02: Actions attributable to user ID and timestamp.
│   │
│   └── ControlGate: IBVC-04-G1 / IBVC-07-G1 (Ownership Reconciled & UBOs Confirmed)
│       └── Condition: 100% of entity details match registry or have approved discrepancy resolutions; UBOs confirmed.
│
├── [DU-04] DueDiligenceScreeningUnit (Deployable Unit 4 / P-04 | Domain: DOM-02 Financial Crime Compliance)
│   ├── Ingress: POST /api/v1/screening/execute | Event: entity.verified
│   ├── ParallelFanOut: FinancialCrimeChecks (Joins when all 5 checks complete)
│   │   ├── Activity: ExecuteSanctionsScreening
│   │   │   ├── Description: Screens legal entities, all directors, shareholders, and ultimate beneficial owners against UK OFSI, EU, UN, and US sanctions watchlists.
│   │   │   ├── Agent: DueDiligenceScreeningAgent [Autonomous Screening Engine]
│   │   │   ├── Reads: [ValidatedOwnershipStructure.Parties, SanctionsWatchlists (OFSI, international lists)]
│   │   │   ├── Writes: [SanctionsScreeningReport (Match scores, list versions, timestamps, zero-hit certificates)]
│   │   │   └── Rules:
│   │   │       ├── REQ-027: Screen dealer entity, directors, shareholders, and beneficial owners against sanctions lists before submission.
│   │   │       ├── LR-03: Sanctions and Anti-Money Laundering Act 2018 / OFSI Guidance - Strict prohibition on dealing with designated persons.
│   │   │       └── BR-D02: All parties must be sanction-screened; late-added parties require fresh screening prior to submission.
│   │   │
│   │   ├── Activity: PerformPartyIDAndVerification
│   │   │   ├── Description: Executes electronic Identity Verification (ID&V) for required individuals (directors, major shareholders) via credit bureaus and government databases.
│   │   │   ├── Agent: DueDiligenceScreeningAgent [Autonomous ID&V Connector]
│   │   │   ├── Reads: [PartyIdentityGraph.Individuals (Names, DOB, residential addresses, passport/driving licence numbers)]
│   │   │   ├── Writes: [IDVOutcomeRecord (Pass/Fail status, electronic match scores, evidence reference)]
│   │   │   └── Rules:
│   │   │       ├── REQ-028: Perform ID&V checks for each individual required by the applicable requirement set.
│   │   │       └── LR-01: UK Money Laundering Regulations 2017 - Verify individual customer identities on a risk-sensitive basis.
│   │   │
│   │   ├── Activity: ExecuteKYCAndAMLChecks
│   │   │   ├── Description: Conducts statutory corporate KYC/AML risk assessment, checking legal status, nature of business, jurisdiction, and political exposure (PEP screening).
│   │   │   ├── Agent: DueDiligenceScreeningAgent [Autonomous]
│   │   │   ├── Reads: [DealerEntityProfile, ValidatedOwnershipStructure, PEPDatabases]
│   │   │   ├── Writes: [KYCAMLAssessmentRecord (PEP flags, jurisdictional risk ratings, risk factors)]
│   │   │   └── Rules:
│   │   │       ├── REQ-025: Perform or obtain KYC checks for the entity and relevant individuals.
│   │   │       ├── REQ-026: Perform or obtain AML checks for the entity and relevant individuals.
│   │   │       └── LR-01: UK MLR 2017 - Ongoing customer due diligence and enhanced due diligence for PEPs.
│   │   │
│   │   ├── Activity: RunFCARegulatoryCheck
│   │   │   ├── Description: Verifies dealer permissions on the FCA Financial Services Register (credit broking, insurance distribution permissions, disciplinary history).
│   │   │   ├── Agent: DueDiligenceScreeningAgent [Autonomous Registry Connector]
│   │   │   ├── Reads: [DealerEntityProfile.RegisteredName, DealerEntityProfile.RegisteredNumber, FCARegister]
│   │   │   ├── Writes: [FCARegulatoryStatusRecord (FCA authorization number, permissions scope, disciplinary flags)]
│   │   │   └── Rules:
│   │   │       ├── REQ-030: Perform FCA regulatory checks required for the case type.
│   │   │       └── LR-09: FCA Permissions Verification - Ensure counterparty holds necessary regulated credit broking status.
│   │   │
│   │   └── Activity: ExecuteAdverseMediaSearch
│   │       ├── Description: Executes targeted search queries across negative news, regulatory sanction notices, litigation databases, and press archives for adverse media.
│   │       ├── Agent: DueDiligenceScreeningAgent [Autonomous Web/News Agent]
│   │       ├── Reads: [DealerEntityProfile, ValidatedOwnershipStructure.Parties, AdverseMediaCorpora]
│   │       ├── Writes: [AdverseMediaDossier (Identified articles, sentiment scores, relevance ranking, source links)]
│   │       └── Rules:
│   │           ├── REQ-031: Perform adverse media review for dealer entity and relevant individuals, recording sources and findings.
│   │           └── LR-01: Risk-based customer evaluation incorporating reputational and criminal exposure.
│   │
│   ├── ChoiceGate: TriageAndDispositionGate (Decision Table DT-3)
│   │   ├── Condition: Check if any screening activity yielded potential matches, sanctions hits, or adverse media findings.
│   │   ├── PassBranch: All checks return Clear -> Proceed directly to Customer Risk Assessment.
│   │   └── ExceptionBranch: Potential Match or Confirmed Finding
│   │       ├── Activity: AdjudicateHitDisposition
│   │       │   ├── Description: Reviews potential watchlist matches or negative news items, evaluates contextual evidence, and records a reasoned disposition (False Positive vs. Confirmed Match).
│   │       │   ├── Agent: FinancialCrimeComplianceAnalyst [Human-in-the-Loop]
│   │       │   ├── Reads: [SanctionsScreeningReport, AdverseMediaDossier, AdditionalEvidenceSuppliedByDealer]
│   │       │   ├── Writes: [HitDispositionLog (Adjudication decision, detailed rationale, adjudicator identity, timestamp)]
│   │       │   └── Rules:
│   │           │   ├── REQ-032: Present potential matches/findings to an authorized person; no hit may be cleared without recorded disposition.
│   │           │   ├── REQ-034: Block submission to Credit while any mandatory check is outstanding or any hit is undispositioned.
│   │           │   ├── DT-3: Check outcome to required action decision table.
│   │           │   └── BR-P03: No hit or adverse finding is cleared without a recorded disposition by an authorized person.
│   │       │
│   │       └── Activity: EscalateToFinancialCrimeCompliance
│   │           ├── Description: Automatically suspends case progression and escalates to the Money Laundering Reporting Officer (MLRO) upon confirmed sanctions or serious financial crime hits.
│   │           ├── Agent: FinancialCrimeComplianceAnalyst [Human-in-the-Loop / MLRO]
│   │           ├── Reads: [HitDispositionLog (Confirmed match status)]
│   │           ├── Writes: [MLROEscalationRecord, CaseHoldCommand (Case frozen, anti-tipping-off protocols applied)]
│   │           └── Rules:
│   │               ├── REQ-037: Escalate to Financial Crime Compliance when a check result meets escalation criteria.
│   │               └── LR-02: Proceeds of Crime Act 2002 & Terrorism Act 2000 - Suspicion reporting and tipping-off constraints.
│   │
│   ├── Activity: ProduceCustomerRiskAssessment
│   │   ├── Description: Aggregates verified corporate structure, KYC findings, jurisdictional exposure, and financial crime checks into an overall Customer Risk Assessment (CRA) score.
│   │   ├── Agent: DueDiligenceScreeningAgent [Autonomous with FCC Analyst Oversight]
│   │   ├── Reads: [EntityVerificationAttestation, KYCAMLAssessmentRecord, HitDispositionLog, FCARegulatoryStatusRecord]
│   │   ├── Writes: [CustomerRiskAssessmentCRA (CRA risk rating [Low/Medium/High], risk rationale, recommended review cadence)]
│   │   └── Rules:
│   │       ├── REQ-029: Produce a Customer Risk Assessment (CRA) outcome for the relationship and record its basis.
│   │       ├── BR-D03: A CRA outcome must be formally recorded before submission to Credit.
│   │       └── LR-01: Risk-based customer due diligence rating.
│   │
│   └── ControlGate: IBVC-01-G2 / DT-3 (Zero Undispositioned Hits & Valid CRA)
│       └── Condition: 100% of mandatory checks complete, 0 undispositioned hits, and CRA rating recorded.
│
├── [DU-05] FinancialSpreadingAnalysisUnit (Deployable Unit 5 / P-05 | Domain: DOM-03 Credit Analysis)
│   ├── Ingress: POST /api/v1/financials/spread | Event: dealer.data.ingested
│   ├── Sequence: SpreadingAndAnalyticsPipeline
│   │   ├── Activity: NormaliseFinancialStatements
│   │   │   ├── Description: Maps heterogeneous chart of accounts from audited and management statements into standardized credit spreading categories with full cell lineage back to source PDFs.
│   │   │   ├── Agent: FinancialAnalystAgent [Autonomous Spreading Engine]
│   │   │   ├── Reads: [RawFinancialArtifacts (Scanned balance sheets, P&L statements, notes)]
│   │   │   ├── Writes: [NormalisedFinancialChartOfAccounts (Standardized multi-year balance sheets, P&L, cashflows, lineage tags)]
│   │   │   └── Rules:
│   │   │       ├── REQ-038: Capture financial statement data and normalize into standard credit analysis fields with source links.
│   │   │       └── BR-D04: Each financial statement must record period, audited status, and currency.
│   │   │
│   │   ├── Activity: ValidateStatementReconciliation
│   │   │   ├── Description: Performs mathematical integrity audits across financial periods (Balance Sheet equation, Opening vs. Closing Equity, Cashflow reconciliation).
│   │   │   ├── Agent: FinancialAnalystAgent [Autonomous Arithmetic Engine]
│   │   │   ├── Reads: [NormalisedFinancialChartOfAccounts]
│   │   │   ├── Writes: [FinancialQualityAuditReport (Reconciliation differences, unaudited statement alerts, missing period flags)]
│   │   │   └── Rules:
│   │   │       ├── REQ-044: Flag financial data quality issues: missing periods, unaudited accounts, unreconciled totals, inconsistencies.
│   │   │       └── CALC-007: Cashflow reconciliation: Opening Cash + Inflows - Outflows = Closing Cash (Flags discrepancy if != 0).
│   │   │
│   │   ├── ParallelFanOut: FinancialRatioCalculations (Computes credit analytics concurrently)
│   │   │   ├── Activity: ComputeSolvencyAndGearing
│   │   │   │   ├── Description: Calculates Total Borrowings ÷ Net Worth to evaluate enterprise leverage and balance sheet risk.
│   │   │   │   ├── Agent: FinancialAnalystAgent [Autonomous]
│   │   │   │   ├── Reads: [NormalisedFinancialChartOfAccounts.TotalBorrowings, NormalisedFinancialChartOfAccounts.NetWorth]
│   │   │   │   ├── Writes: [GearingRatioRecord (Gearing ratio [x], edge condition flags)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-039: Calculate financial analysis measures from captured data.
│   │   │   │       ├── CALC-001: Gearing = Total Borrowings ÷ Net Worth (Returns 'not meaningful' if Net Worth <= 0).
│   │   │   │       └── BR-D05: Follow defined calculation operations and precision edge rules; never invent values for invalid denominators.
│   │   │   │
│   │   │   ├── Activity: ComputeLiquidityAndCurrentRatio
│   │   │   │   ├── Description: Calculates Current Assets ÷ Current Liabilities to measure short-term obligations coverage.
│   │   │   │   ├── Agent: FinancialAnalystAgent [Autonomous]
│   │   │   │   ├── Reads: [NormalisedFinancialChartOfAccounts.CurrentAssets, NormalisedFinancialChartOfAccounts.CurrentLiabilities]
│   │   │   │   ├── Writes: [CurrentRatioRecord (Current ratio, liquidity commentary)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-039: Calculate financial analysis measures.
│   │   │   │       └── CALC-002: Current Ratio = Current Assets ÷ Current Liabilities (Returns 'not calculable' if CL = 0).
│   │   │   │
│   │   │   ├── Activity: ComputeInterestCover
│   │   │   │   ├── Description: Calculates EBIT ÷ Interest Charge to evaluate capacity to service commercial lending debt.
│   │   │   │   ├── Agent: FinancialAnalystAgent [Autonomous]
│   │   │   │   ├── Reads: [NormalisedFinancialChartOfAccounts.EBIT, NormalisedFinancialChartOfAccounts.InterestCharge]
│   │   │   │   ├── Writes: [InterestCoverRecord (Interest cover ratio [x])]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-039: Calculate financial analysis measures.
│   │   │   │       └── CALC-003: Interest Cover = EBIT ÷ Interest Charge (Returns negative ratio with flag if EBIT is negative).
│   │   │   │
│   │   │   ├── Activity: ComputeMarginsAndYearOnYearTrends
│   │   │   │   ├── Description: Calculates Net Profit Margin ((NP ÷ Turnover) * 100) and multi-year YoY growth trajectories for revenue and EBITDA.
│   │   │   │   ├── Agent: FinancialAnalystAgent [Autonomous]
│   │   │   │   ├── Reads: [NormalisedFinancialChartOfAccounts.MultiPeriodPnL]
│   │   │   │   ├── Writes: [ProfitabilityAndTrendRecord (Net profit margin %, multi-period YoY % delta)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-040: Present financial trends across all available periods.
│   │   │   │       ├── REQ-041: Present trading performance and profitability analysis.
│   │   │   │       ├── CALC-004: Net Profit Margin = (Net Profit ÷ Turnover) * 100.
│   │   │   │       └── CALC-005: YoY Change = ((Current Value - Prior Value) ÷ |Prior Value|) * 100.
│   │   │   │
│   │   │   ├── Activity: ComputeStockDaysAndCashflow
│   │   │   │   ├── Description: Evaluates dealer vehicle inventory turnover speed (Average Stock ÷ Cost of Sales * 365) and operating cash movements.
│   │   │   │   ├── Agent: FinancialAnalystAgent [Autonomous]
│   │   │   │   ├── Reads: [NormalisedFinancialChartOfAccounts.Inventory, NormalisedFinancialChartOfAccounts.CostOfSales]
│   │   │   │   ├── Writes: [StockDaysCashflowRecord (Stock turnaround days, cash conversion cycles)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-041: Trading performance analysis for motor dealers.
│   │   │   │       ├── REQ-042: Present cashflow analysis for the dealer.
│   │   │   │       └── CALC-009: Stock Days = ((Opening Stock + Closing Stock) ÷ 2 ÷ Cost of Sales) * 365.
│   │   │   │
│   │   │   └── Activity: ComputeROTEWhereRequired
│   │   │       ├── Description: Computes Return on Tangible Equity (Net Profit Attributable ÷ Average Tangible Equity * 100) where required by policy.
│   │   │       ├── Agent: FinancialAnalystAgent [Autonomous]
│   │   │       ├── Reads: [NormalisedFinancialChartOfAccounts.TangibleEquity, CaseClassification]
│   │   │       ├── Writes: [ROTERecord (ROTE % or omission note)]
│   │   │       └── Rules:
│   │   │           ├── REQ-045: Include ROTE information where case type or policy requires it.
│   │   │           ├── CALC-010: ROTE = (Net Profit Attributable ÷ Average Tangible Equity) * 100.
│   │   │           └── BR-D09: ROTE is included only where case type or policy explicitly requires it.
│   │   │
│   │   └── Activity: AggregateCrossLineBorrowingProfile
│   │       ├── Description: Consolidates dealer debt and credit limits across all existing lending lines (Franchise, Wholesale, Fleet, Retail) and external disclosed debts.
│   │       ├── Agent: FinancialAnalystAgent [Autonomous Exposure Aggregator]
│   │       ├── Reads: [DealerMasterRegistry, WholesaleFundingPlatformData (SOPRA Apak live balances), DisclosedBorrowings]
│   │       ├── Writes: [ConsolidatedBorrowingProfile (Drawn facilities, total limits, headroom, facility utilization %)]
│   │       └── Rules:
│   │           ├── REQ-043: Present borrowing profile across all lending lines and dealer-disclosed external debt.
│   │           ├── CALC-006: Facility Utilisation = (Drawn ÷ Limit) * 100; Headroom = Limit - Drawn.
│   │           └── BR-D06: Borrowing profile must cover every lending line where dealer currently holds exposure.
│   │
│   └── OutputPayload: FullySpreadingAnalyticsSet (Normalised accounts, credit ratios, trend graphs, exposure profile)
│
├── [DU-06] CreditApplicationAuthoringUnit (Deployable Unit 6 / P-06 | Domain: DOM-03 Credit Analysis)
│   ├── Ingress: POST /api/v1/pack/author | Event: financials.normalised
│   ├── Sequence: TemplateAuthoringPipeline
│   │   ├── Activity: PopulateFCACreditTemplateQuantitativeData
│   │   │   ├── Description: Programmatically populates standardized FCA credit application Excel templates with normalized financial data and ratios without manual re-keying.
│   │   │   ├── Agent: CreditPackAuthoringAgent [Autonomous Spreadsheet Engine]
│   │   │   ├── Reads: [FullySpreadingAnalyticsSet, DealerEntityProfile, ConsolidatedBorrowingProfile]
│   │   │   ├── Writes: [DraftFCATemplate (Populated Excel workbook, recorded template version)]
│   │   │   └── Rules:
│   │   │       ├── REQ-046: Populate the FCA credit template with captured quantitative data without re-keying.
│   │   │       └── BR-G06: Content generated by automated means must be explicitly labeled with its source.
│   │   │
│   │   ├── ParallelFanOut: NarrativeCommentaryDrafting (Generates initial drafts with verifiable source links)
│   │   │   ├── Activity: DraftBusinessBackgroundNarrative
│   │   │   │   ├── Description: Generates descriptive narrative detailing dealer operational history, franchise brand relationships, and local market positioning.
│   │   │   │   ├── Agent: CreditPackAuthoringAgent [Autonomous AI Drafter]
│   │   │   │   ├── Reads: [QualitativeContextNotes, EntityVerificationAttestation]
│   │   │   │   ├── Writes: [BusinessBackgroundSection (Draft text with inline source citations)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-047: Author business background commentary with each factual assertion linked to evidence or author.
│   │   │   │       ├── REQ-090: Label any content generated by non-human means and require human review before use.
│   │   │   │       └── BR-D07: Every narrative statement must trace to verified evidence or a named human author.
│   │   │   │
│   │   │   ├── Activity: DraftManagementCapabilityAssessment
│   │   │   │   ├── Description: Synthesizes director CVs, industry experience, historical track record, and operational management depth into a cohesive assessment.
│   │   │   │   ├── Agent: CreditPackAuthoringAgent [Autonomous AI Drafter]
│   │   │   │   ├── Reads: [PartyIdentityGraph, QualitativeContextNotes]
│   │   │   │   ├── Writes: [ManagementAssessmentSection (Management depth assessment, succession risk notes)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-048: Author management assessment commentary, including management capability.
│   │   │   │       └── REQ-090: AI disclosure label applied.
│   │   │   │
│   │   │   ├── Activity: DraftConductAndPerformanceAssessment
│   │   │   │   ├── Description: Summarizes dealer regulatory standing, customer complaint metrics, audit findings, and historical payment performance.
│   │   │   │   ├── Agent: CreditPackAuthoringAgent [Autonomous AI Drafter]
│   │   │   │   ├── Reads: [CustomerRiskAssessmentCRA, FCARegulatoryStatusRecord, AuditSupplierReports]
│   │   │   │   ├── Writes: [ConductAssessmentSection (Regulatory conduct summary, audit compliance commentary)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-049: Author conduct and performance assessment commentary for the dealer.
│   │   │   │       └── REQ-090: Mandatory human review flag attached.
│   │   │   │
│   │   │   ├── Activity: FormulateSecurityReviewAndValuation
│   │   │   │   ├── Description: Documents proposed debentures, personal guarantees, stock charges, and property collateral, calculating security coverage ratios.
│   │   │   │   ├── Agent: CreditPackAuthoringAgent [Autonomous]
│   │   │   │   ├── Reads: [DisclosedSecurities, CALC-008 SecurityCover]
│   │   │   │   ├── Writes: [SecurityReviewSection (Collateral schedule, haircut valuations, security cover ratio)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-050: Support security review, recording security held or proposed and its valuation.
│   │   │   │       └── CALC-008: Security Cover = Security Value ÷ Exposure (Requires recorded valuation date).
│   │   │   │
│   │   │   └── Activity: DraftESGCommentaryWhereMandated
│   │   │       ├── Description: Drafts Environmental, Social, and Governance commentary covering EV transition readiness and corporate governance where required.
│   │   │       ├── Agent: CreditPackAuthoringAgent [Autonomous AI Drafter]
│   │   │       ├── Reads: [DealerApplicationForm, ESGChecklists]
│   │   │       ├── Writes: [ESGCommentarySection (EV fleet readiness, environmental compliance statements)]
│   │   │       └── Rules:
│   │   │           ├── REQ-051: Support authoring of ESG commentary where the template requires it.
│   │   │           └── BR-D08: ESG commentary is completed where template mandates it.
│   │   │
│   │   ├── Activity: HumanReviewAndAttestationOfNarrative
│   │   │   ├── Description: Forces an interactive review session where the Account Manager must individually accept, edit, or reject every AI-drafted narrative assertion.
│   │   │   ├── Agent: AccountManagerAgent / WholesaleManagerAgent [Human-in-the-Loop]
│   │   │   ├── Reads: [AllDraftNarrativeSections]
│   │   │   ├── Writes: [AttestedNarrativePack (100% human-verified text, audit log of edits and approvals)]
│   │   │   └── Rules:
│   │   │       ├── REQ-052: Require case owner to accept, amend, or reject every narrative statement before pack inclusion.
│   │   │       ├── BR-U01: User can accept, amend, or reject any drafted content; no content is final without user action.
│   │   │       ├── BR-G06: Non-human content is used only after human review.
│   │   │       └── PR-02: Autonomy for gathering and drafting; authority for deciding stays strictly human.
│   │   │
│   │   └── Activity: ExecuteTemplateIntegrityAndValidation
│   │       ├── Description: Reconciles quantitative values across all sheets of the FCA template to detect formula errors, broken links, or mathematical discrepancies.
│   │       ├── Agent: CreditPackAuthoringAgent [Autonomous Integrity Engine]
│   │       ├── Reads: [DraftFCATemplate, AttestedNarrativePack]
│   │       ├── Writes: [ValidatedCreditApplicationTemplate (Sealed workbook, version timestamp, validation report)]
│   │       └── Rules:
│   │           ├── REQ-053: Validate template: mandatory sections present, numbers consistent between sections.
│   │           └── REQ-054: Retain each template version and display field-by-field differences.
│   │
│   └── ControlGate: IBVC-01-G3 (Narrative Human-Reviewed & Numbers Cross-Reconciled)
│       └── Condition: 100% of narrative assertions accepted/edited by AM, template passes cross-section validation.
│
├── [DU-07] LendingRequestPricingUnit (Deployable Unit 7 / P-07 | Domain: DOM-03 Credit Analysis)
│   ├── Ingress: POST /api/v1/pricing/structure | Event: template.populated
│   ├── Sequence: PricingAndStructuringPipeline
│   │   ├── Activity: FormulateFacilityRequest
│   │   │   ├── Description: Formulates the proposed credit lines (Wholesale Stocking, Demonstrator, Parts, Term Loan), requesting limits, revolving terms, and purpose.
│   │   │   ├── Agent: PricingStructuringAgent [Autonomous / Supervised by AM]
│   │   │   ├── Reads: [DealerCaseHeader, CaseClassification, ConsolidatedBorrowingProfile]
│   │   │   ├── Writes: [LendingFacilityRequestDocket (Requested limits, facility types, purpose, delta vs. existing limit)]
│   │   │   └── Rules:
│   │   │       ├── REQ-055: Record lending request: facility type, amount, purpose, and change requested.
│   │   │       └── REQ-059: Record request-type-specific content (acquisition debt, disposal impact, franchise expansion).
│   │   │
│   │   ├── Activity: StructureCovenantsAndTerms
│   │   │   ├── Description: Defines facility parameters, tenor, repayment schedules, audit frequencies, curtailment rules, and financial covenants.
│   │   │   ├── Agent: PricingStructuringAgent [Autonomous / Supervised by AM]
│   │   │   ├── Reads: [LendingFacilityRequestDocket, CreditPolicyGuidelines]
│   │   │   ├── Writes: [ProposedTermsDocket (Standard terms, curtailment schedules, financial covenants)]
│   │   │   └── Rules:
│   │   │       └── REQ-056: Record the terms and parameters proposed for the lending request.
│   │   │
│   │   ├── Activity: ComputePricingSchedule
│   │   │   ├── Description: Calculates interest margins, base rate linkages (SONIA), commitment fees, and vehicle stocking charges according to risk tiering.
│   │   │   ├── Agent: PricingStructuringAgent [Autonomous Financial Calculator]
│   │   │   ├── Reads: [LendingFacilityRequestDocket, DealerRateCards, CostOfFundsTables]
│   │   │   ├── Writes: [FacilityPricingSchedule (Margin over SONIA, stocking fee schedule, over-allowance pricing)]
│   │   │   └── Rules:
│   │   │       └── REQ-057: Record the pricing information for the lending request.
│   │   │
│   │   └── Activity: AuthorisePricingAndTermsDualSignoff
│   │       ├── Description: Enforces four-eyes governance requiring an independent commercial credit authority to approve pricing and terms.
│   │       ├── Agent: AuthorisedPricingApproverRole [Human-in-the-Loop Commercial Director]
│   │       ├── Reads: [ProposedTermsDocket, FacilityPricingSchedule, PreparerIdentity]
│   │       ├── Writes: [AuthorisedLendingRequestPackage (Authorized commercial terms, digital signature, approval timestamp)]
│   │       └── Rules:
│   │           ├── REQ-058: Require pricing and terms to be authorized by an authorized role and record the authorizer.
│   │           ├── REQ-088: Keep the preparer of pricing and terms separate from the authorizer (Segregation of Duties).
│   │           └── BR-E02: The preparer of pricing and terms is strictly prohibited from being the sole authorizer.
│   │
│   └── ControlGate: GATE-07 (Segregation of Duties Pricing Signoff)
│       └── Condition: Commercial terms and pricing approved by an independent authorized role distinct from the preparer.
│
├── [DU-08] CreditSubmissionGatewayUnit (Deployable Unit 8 / P-08 | Domain: DOM-03 Credit Assessment)
│   ├── Ingress: POST /api/v1/pack/submit | Event: pricing.terms_approved
│   ├── Sequence: SubmissionOrchestrationPipeline
│   │   ├── Activity: AssembleDecisionReadyCreditPack
│   │   │   ├── Description: Compiles the validated FCA template, authorized pricing package, due diligence evidence, registry reports, and financial spreading sheets into a unified pack.
│   │   │   ├── Agent: CreditSubmissionGatewayAgent [Autonomous Pack Compiler]
│   │   │   ├── Reads: [ValidatedCreditApplicationTemplate, AuthorisedLendingRequestPackage, EntityVerificationAttestation, CustomerRiskAssessmentCRA]
│   │   │   ├── Writes: [AssembledDecisionReadyPack (Unified credit dossier containing all quantitative and qualitative evidence)]
│   │   │   └── Rules:
│   │   │       └── REQ-060: Assemble credit pack from template, lending request, terms, pricing, and supporting evidence.
│   │   │
│   │   ├── Activity: ExecuteDeterministicCompletenessGate
│   │   │   ├── Description: Evaluates the assembled pack against Decision Table DT-2 to verify that 100% of mandatory fields, checks, and attachments are present before submission.
│   │   │   ├── Agent: CreditSubmissionGatewayAgent [Autonomous Rules Engine]
│   │   │   ├── Reads: [AssembledDecisionReadyPack, ApplicableRequirementSet]
│   │   │   ├── Writes: [CompletenessGateReport (Pass/Fail status, completeness %, itemized blocking gap list)]
│   │   │   └── Rules:
│   │   │       ├── REQ-061: Run a completeness check before submission and report each gap as blocking or advisory.
│   │   │       ├── CALC-011: Pack Completeness = (Completed Mandatory Items ÷ Applicable Mandatory Items) * 100 (Must equal 100.00%).
│   │   │       ├── DT-2: Pack completeness gate decision table (Blocks if any mandatory item, check, or review is missing).
│   │   │       ├── BR-P04: The completeness gate must pass before submission can be authorized.
│   │   │       └── BR-U04: Every blocking message must state the exact reason and corrective action.
│   │   │
│   │   ├── Activity: AuthoriseSubmissionToCredit
│   │   │   ├── Description: Requires the accountable Account Manager to review the completeness audit and digitally authorize transmission to Credit.
│   │   │   ├── Agent: AccountManagerAgent / WholesaleManagerAgent [Human-in-the-Loop Case Owner]
│   │   │   ├── Reads: [CompletenessGateReport, AssembledDecisionReadyPack]
│   │   │   ├── Writes: [SubmissionAuthorisationToken (Authorizer ID, role attestation, digital signature, timestamp)]
│   │   │   └── Rules:
│   │   │       ├── REQ-062: Require case owner to authorize submission and record who authorized it and when.
│   │   │       └── BR-E01: Only the accountable Account Manager or Wholesale Manager can authorize submission.
│   │   │
│   │   ├── Activity: GenerateImmutableSnapshotAndTransmit
│   │   │   ├── Description: Generates a cryptographically hashed, unalterable WORM (Write Once, Read Many) snapshot of the credit pack and transmits it to the Credit Underwriting queue.
│   │   │   ├── Agent: CreditSubmissionGatewayAgent [Autonomous Protocol Handler]
│   │   │   ├── Reads: [AssembledDecisionReadyPack, SubmissionAuthorisationToken]
│   │   │   ├── Writes: [ImmutableSubmittedPackSnapshot (SHA-256 sealed pack), TransmissionReceiptProof (Credit queue transaction ID)]
│   │   │   └── Rules:
│   │   │       ├── REQ-063: Transmit authorized pack to Credit and record confirmation of receipt.
│   │   │       ├── REQ-064: Retain an unalterable snapshot of the pack exactly as submitted.
│   │   │       ├── BR-P05: Submitted pack snapshot is unalterable; any subsequent modification creates a new version.
│   │   │       ├── REQ-067: Business shall not record, state, or imply a credit decision; underwriting remains independent.
│   │   │       └── BR-G01: Only a Credit Underwriter decides credit; pack must contain zero decision recommendations.
│   │   │
│   │   ├── ChoiceGate: CreditAssessmentInterface
│   │   │   ├── Description: Interface node connecting to independent Credit Underwriting systems where underwriters assess risk.
│   │   │   ├── Activity: CreditUnderwriterIndependentAssessment
│   │   │   │   ├── Description: Underwriters evaluate the credit pack independently within Credit's proprietary underwriting environment.
│   │   │   │   ├── Agent: CreditUnderwriterRole [Human-in-the-Loop Independent Credit Underwriter]
│   │   │   │   ├── Reads: [ImmutableSubmittedPackSnapshot]
│   │   │   │   ├── Writes: [CreditAssessmentEvent (QueryRaised | Approved | Declined | ApprovedWithConditions)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-066: Record outcome from Credit (Approved, Declined, Approved with conditions, Referred).
│   │   │   │       ├── REQ-067: Independent assessment and approval strictly remain with Credit.
│   │   │   │       └── AS-01: Credit continues to assess independently in its own systems.
│   │   │   │
│   │   │   ├── BranchA: QueryRaised (Rework Loop)
│   │   │   │   ├── Activity: HandleCreditQueryAndVersionPack
│   │   │   │   │   ├── Description: Logs underwriting queries, assigns resolution tasks to the Account Manager, updates evidence, and produces an incremented pack version.
│   │   │   │   │   ├── Agent: AccountManagerAgent & GatewayAgent [Human-in-the-Loop]
│   │   │   │   │   ├── Reads: [CreditAssessmentEvent.QueryDetails, DealerClarificationData]
│   │   │   │   │   ├── Writes: [QueryResolutionDocket, VersionedPackSnapshot (v1.1, v1.2)]
│   │   │   │   │   └── Rules:
│   │   │   │   │       ├── REQ-065: Record Credit queries, assign to owner, track to resolution, and version amended submissions.
│   │   │   │   │       ├── BR-P13: Each query tracked to closure; responses changing the pack create new versions.
│   │   │   │   │       └── REQ-095: Record rework metrics (Credit queries, returned packs, post-submission changes).
│   │   │   │   └── RouteBack: Resubmit to CreditAssessmentInterface with incremented version.
│   │   │   │
│   │   │   └── BranchB: FormalDecisionRecorded
│   │   │       ├── Activity: RecordCreditOutcome
│   │   │       │   ├── Description: Formally logs the underwriter's binding decision, Credit reference code, approval conditions, and timestamp against the master case file.
│   │   │       │   ├── Agent: CreditSubmissionGatewayAgent [Autonomous]
│   │   │       │   ├── Reads: [CreditAssessmentEvent.Outcome, CreditAssessmentEvent.Conditions]
│   │   │       │   ├── Writes: [RecordedCreditOutcomeRecord (Approved/Declined status, condition schedule, credit reference)]
│   │   │       │   └── Rules:
│   │   │       │       ├── REQ-066: Record outcome received from Credit with date and Credit reference.
│   │   │       │       └── BR-G01: Strict recording of human underwriter outcome.
│   │   │       └── RouteForward: If status == Approved -> Initiate [DU-09] PostApprovalFulfillmentUnit.
│   │
│   └── ControlGate: IBVC-01-G4 (Independent Underwriting Approval Recorded)
│       └── Condition: Binding credit decision officially registered from Credit Underwriting.
│
├── [DU-09] PostApprovalFulfillmentUnit (Deployable Unit 9 / P-09 | Domain: DOM-05 Operations & Funding)
│   ├── Ingress: POST /api/v1/fulfillment/start | Event: credit.outcome_recorded
│   ├── Sequence: FulfillmentOrchestrationPipeline
│   │   ├── Activity: InitiateDownstreamHandoffs
│   │   │   ├── Description: Spawns parallel task tracks for Legal Documentation, Direct Debit Mandates, Platform Setup, and Vehicle Inspection upon recorded approval.
│   │   │   ├── Agent: FulfillmentCoordinatorAgent [Autonomous Process Orchestrator]
│   │   │   ├── Reads: [RecordedCreditOutcomeRecord, AuthorisedLendingRequestPackage]
│   │   │   ├── Writes: [PostApprovalHandoffTracker (Multi-track task board with owners, deadlines, and dependencies)]
│   │   │   └── Rules:
│   │   │       ├── REQ-068: Initiate post-approval tasks only after approval is recorded (Legal, Mandates, Ops, Funding, Suppliers).
│   │   │       ├── REQ-069: Track each post-approval handoff with owner, status, due date, and dependency.
│   │   │       └── BR-P06: Post-approval handoffs start strictly after Credit's approval is recorded.
│   │   │
│   │   ├── ParallelFanOut: DownstreamFulfillmentTracks (Concurrent operational execution)
│   │   │   ├── TrackA: LegalDocumentationExecution (IBVC-13)
│   │   │   │   ├── Activity: TransferTermsToLegalWithoutRekeying
│   │   │   │   │   ├── Description: Pushes approved loan parameters, pricing schedules, and security requirements to the legal documentation system without re-keying.
│   │   │   │   │   ├── Agent: FulfillmentCoordinatorAgent [Autonomous API Connector]
│   │   │   │   │   ├── Reads: [AuthorisedLendingRequestPackage, RecordedCreditOutcomeRecord]
│   │   │   │   │   ├── Writes: [LegalContractPayload (Validated contract generation parameters)]
│   │   │   │   │   └── Rules:
│   │   │   │   │       ├── REQ-070: Transfer approved terms to legal, ops, and funding without re-keying; flag any mismatch.
│   │   │   │   │       └── BR-P07: Approved terms pass downstream unchanged; any value mismatch blocks execution.
│   │   │   │   │
│   │   │   │   └── Activity: ExecuteLegalDocuments
│   │   │   │       ├── Description: Facilitates contract generation, dealer legal review, digital execution via DocuSign, and receipt of executed debentures/guarantees.
│   │   │   │       ├── Agent: LegalTeamAgent [Human-in-the-Loop Legal Counsel]
│   │   │   │       ├── Reads: [LegalContractPayload, DealerSignatoryCredentials]
│   │   │   │       ├── Writes: [ExecutedLegalContractArtifact (Signed contracts, executed personal guarantees, debenture filings)]
│   │   │   │       └── Rules:
│   │   │   │           └── REQ-068: Execute legal documentation post-approval.
│   │   │   │
│   │   │   ├── TrackB: DirectDebitAndBankingSetup (IBVC-14)
│   │   │   │   ├── Description: Dispatches BACS direct debit mandate requests to dealer bank, confirms setup with clearing house, and validates bank account ownership.
│   │   │   │   ├── Agent: OperationsSetupAgent [Human-in-the-Loop Operations Analyst]
│   │   │   │   ├── Reads: [DealerEntityProfile.BankDetails, AuthorisedLendingRequestPackage]
│   │   │   │   ├── Writes: [DirectDebitMandateRecord (Active BACS mandate reference, bank confirmation certificate)]
│   │   │   │   └── Rules:
│   │   │   │       └── REQ-068: Esta
│   │ 
│   │   │   │   └── Rules:
│   │   │   │       └── REQ-068:Establish direct debit mandates and banking operations setup.
│   │   │   │
│   │   │   ├── TrackC: WholesaleStockingPlatformConfiguration (IBVC-15)
│   │   │   │   ├── Description: Configures approved credit lines, interest charging matrices, unit limits, and curtailment rules directly in the SOPRA Apak platform.
│   │   │   │   ├── Agent: OperationsSetupAgent [Autonomous System Connector / Supervised]
│   │   │   │   ├── Reads: [AuthorisedLendingRequestPackage]
│   │   │   │   ├── Writes: [SOPRAApakConfigurationPayload (Active stocking platform facility profile)]
│   │   │   │   └── Rules:
│   │   │   │       ├── REQ-070: Direct transmission of approved parameters to wholesale platform.
│   │   │   │       └── BR-P07: Parameter integrity enforcement.
│   │   │   │
│   │   │   └── TrackD: ThirdPartyInspectionSupplierActivation (IBVC-16)
│   │   │       ├── Description: Transmits facility limits, dealership premises locations, and audit schedules to Auxiga Smart3 for vehicle stock auditing and physical inspections.
│   │   │       ├── Agent: FulfillmentCoordinatorAgent [Autonomous Integration Agent]
│   │   │       ├── Reads: [DealerEntityProfile.Locations, AuthorisedLendingRequestPackage]
│   │   │       ├── Writes: [AuxigaSmart3InstructionRecord (Active inspection profile, scheduled audit frequency)]
│   │   │       └── Rules:
│   │   │           └── REQ-068: Instruct third-party supplier activity (Auxiga Smart3).
│   │   │
│   │   ├── Activity: TrackApprovalConditionsPrecedent
│   │   │   ├── Description: Tracks compliance with all mandatory underwriting conditions precedent (e.g., proof of insurance, execution of PG) and blocks facility activation until satisfied.
│   │   │   ├── Agent: FulfillmentCoordinatorAgent [Autonomous Conditions Engine]
│   │   │   ├── Reads: [RecordedCreditOutcomeRecord.Conditions, ExecutedLegalContractArtifact, DirectDebitMandateRecord]
│   │   │   ├── Writes: [ConditionsSatisfactionRecord (Satisfaction proof for each condition, timestamp)]
│   │   │   └── Rules:
│   │   │       ├── REQ-072: Track each condition of approval to recorded satisfaction before dependent steps proceed.
│   │   │       └── BR-P08: A condition of approval must be satisfied with evidence before any dependent step proceeds.
│   │   │
│   │   └── Activity: FinaliseCaseClosureAndNotifyMilestones
│   │       ├── Description: Validates that all handoffs are 100% complete, notifies case stakeholders, enables operational funding, and closes the origination case file.
│   │       ├── Agent: FulfillmentCoordinatorAgent [Autonomous]
│   │       ├── Reads: [PostApprovalHandoffTracker, ConditionsSatisfactionRecord]
│   │       ├── Writes: [CaseClosureAttestation, OperationalFundingEnabledEvent (Facility live for vehicle drawdowns)]
│   │       └── Rules:
│   │           ├── REQ-071: Notify the case owner of each completed handoff milestone.
│   │           ├── REQ-073: Close case only when all handoffs are complete or closed with recorded reason.
│   │           └── BR-P10: A case closes only when every handoff is complete or closed with a recorded reason.
│   │
│   └── ControlGate: GATE-09 (All Conditions Satisfied Prior to Funding Activation)
│       └── Condition: Legal executed, direct debit active, platform configured, and 100% conditions satisfied.
│
├── [DU-10] PeriodicLifecycleReviewUnit (Deployable Unit 10 / P-10 | Domain: DOM-01 Origination)
│   ├── Ingress: CRON: CadenceSchedule | Event: operational_funding.enabled | Event: dealer.trigger_event.detected
│   ├── Sequence: MonitoringAndReviewPipeline
│   │   ├── Activity: ComputeNextPeriodicReviewDate
│   │   │   ├── Description: Evaluates dealer risk rating and lifecycle status against policy table DT-4 to compute and register the next mandatory credit review date.
│   │   │   ├── Agent: LifecycleReviewAgent [Autonomous]
│   │   │   ├── Reads: [CustomerRiskAssessmentCRA, CreditPolicyCadenceTable]
│   │   │   ├── Writes: [ScheduledReviewCalendarEntry (Target review date: monthly, quarterly, semi-annually, annually)]
│   │   │   └── Rules:
│   │   │       ├── REQ-074: Schedule periodic dealer credit reviews at monthly, quarterly, half-yearly, or annual intervals per risk profile.
│   │   │       ├── CALC-012: Next Review Date = Last Review Date + N calendar months (Handles month-end clipping).
│   │   │       ├── DT-4: Review cadence decision table (Maps risk profile and lifecycle stage to review frequency).
│   │   │       └── BR-P09: Review cadence follows the governed policy table by risk profile.
│   │   │
│   │   ├── ChoiceGate: TriggerEventMonitor
│   │   │   ├── Description: Continually monitors event feeds (Companies House filings, OEM franchise updates, credit bureau score alerts) for material changes.
│   │   │   ├── Condition: Incoming event matches statutory review trigger (director resignation, acquisition, new franchise request, credit score degradation).
│   │   │   └── MatchFound:
│   │   │       └── Activity: SpawnEventDrivenReviewCase
│   │   │           ├── Description: Instantiates an event-driven review case, flags affected entities, and alerts the assigned Account Manager.
│   │   │           ├── Agent: LifecycleReviewAgent [Autonomous]
│   │   │           ├── Reads: [TriggerEventPayload, DealerMasterRegistry]
│   │   │           ├── Writes: [EventDrivenReviewCaseDocket (New case ID, trigger event classification, assigned owner)]
│   │   │           └── Rules:
│   │   │               ├── REQ-075: Create an event-driven case when a trigger event occurs (director change, acquisition, new franchise).
│   │   │               └── BR-G05: Policy-governed trigger criteria.
│   │   │
│   │   ├── Activity: CompilePeriodicReviewPackWithDeltaView
│   │   │   ├── Description: Pre-assembles the review pack pulling refreshed registry data and latest accounts, highlighting differences since the previous credit approval.
│   │   │   ├── Agent: LifecycleReviewAgent [Autonomous Pack Compiler]
│   │   │   ├── Reads: [DealerMasterRegistry, HistoricalPackSnapshots, RefreshedFinancialStatements]
│   │   │   ├── Writes: [DeltaHighlightedReviewPack (Pre-populated review template with highlighted delta comparisons)]
│   │   │   └── Rules:
│   │   │       ├── REQ-076: Prepare periodic review pack from held information and highlight what changed since previous review.
│   │   │       └── BR-E06: Reuse valid held information; require refresh only for changed or expired elements.
│   │   │
│   │   ├── Activity: DispatchOverdueReviewAlerts
│   │   │   ├── Description: Monitors the calendar queue and escalates alerts to the Account Manager and Credit Management when reviews breach due dates.
│   │   │   ├── Agent: LifecycleReviewAgent [Autonomous Alert Dispatcher]
│   │   │   ├── Reads: [ScheduledReviewCalendarEntry, CurrentDate]
│   │   │   ├── Writes: [OverdueReviewAlertNotification (Escalation alerts sent to AM and Senior Leadership)]
│   │   │   └── Rules:
│   │   │       ├── REQ-077: Notify case owner of each review that is due or overdue.
│   │   │       └── OBJ-05: Maintain zero overdue periodic reviews without recorded governance reason.
│   │   │
│   │   └── Activity: ArchiveCompleteReviewHistory
│   │       ├── Description: Maintains a complete chronological record of all periodic and event-driven review outcomes for longitudinal auditability.
│   │       ├── Agent: LifecycleReviewAgent [Autonomous]
│   │       ├── Reads: [DeltaHighlightedReviewPack, UnderwriterReviewOutcome]
│   │       ├── Writes: [DealerImmutableReviewHistory (Audit trail of all reviews, dates, and underwriter affirmations)]
│   │       └── Rules:
│   │           └── REQ-078: Retain the complete history of every review for each dealer relationship.
│   │
│   └── ReEntryLink: Feeds review pack into [DU-04] and [DU-08] for refreshed underwriting assessment.
│
├── [DU-11] MasterDataReuseUnit (Deployable Unit 11 / P-11 | Domain: DOM-06 Shared Master Data Service)
│   ├── Ingress: GET /api/v1/master/dealer/{id} | POST /api/v1/master/resolve
│   ├── ServicePipeline: MasterEntityCurator
│   │   ├── Activity: ResolveCanonicalDealerIdentity
│   │   │   ├── Description: Reconciles dealer identifiers across corporate divisions to maintain exactly one unified legal entity identity across Franchise, Wholesale, Fleet, and Retail.
│   │   │   ├── Agent: MasterDataAgent [Autonomous MDM Engine]
│   │   │   ├── Reads: [IncomingEntityIdentifiers, CompanyRegistrationNumber, TradingNames]
│   │   │   ├── Writes: [CanonicalDealerMasterRecord (Unique Master Dealer ID, linked divisional customer IDs)]
│   │   │   └── Rules:
│   │   │       ├── REQ-080: Keep one consistent dealer identity across lending lines, sources, and cases.
│   │   │       └── PR-01: Gather once, reuse many times across all lending channels.
│   │   │
│   │   ├── Activity: CurateCrossLendingLineDataReuse
│   │   │   ├── Description: Makes verified documents and check outcomes captured in one lending division available to others to eliminate duplicate dealer requests.
│   │   │   ├── Agent: MasterDataAgent [Autonomous Data Broker]
│   │   │   ├── Reads: [CanonicalDealerMasterRecord, FranchiseVault, WholesaleVault, FleetVault]
│   │   │   ├── Writes: [CrossLineReusableEntityPassport (Sharable KYC, verified ownership structures, financial packs)]
│   │   │   └── Rules:
│   │   │       ├── REQ-079: Gather each dealer information item once and make available across lending lines within permitted use.
│   │   │       └── BR-E06: Information already held and valid must be reused and not requested again.
│   │   │
│   │   ├── Activity: EvaluateInformationStalenessAndExpiry
│   │   │   ├── Description: Validates timestamps of retained credit bureau reports, registry records, and ID&V checks against Decision Table DT-5 validity policies.
│   │   │   ├── Agent: MasterDataAgent [Autonomous Currency Evaluator]
│   │   │   ├── Reads: [CrossLineReusableEntityPassport.ItemTimestamps, PolicyValidityParameters]
│   │   │   ├── Writes: [StaleDataAuditFlags (Expired items requiring refresh, active valid items approved for reuse)]
│   │   │   └── Rules:
│   │   │       ├── REQ-081: Retain external provider results with dates within provider contractual terms.
│   │   │       ├── REQ-082: Flag any information item used after its policy validity period has elapsed.
│   │   │       ├── CALC-014: Information Age = As-At Date - Data Date (Flags Stale if Age > Validity Window).
│   │   │       ├── DT-5: Information validity periods decision table.
│   │   │       └── BR-P11: A check must be re-performed when a trigger event occurs or validity period ends.
│   │   │
│   │   └── Activity: ProcessUnreadableDocumentsManualTranscription
│   │       ├── Description: Identifies illegible or corrupted document uploads, isolates the failure, and provides a secure UI for manual transcription with mandatory evidence attachment.
│   │       ├── Agent: DocumentIngestionAgent & AccountManager [Human-in-the-Loop]
│   │       ├── Reads: [CorruptedOrUnreadableScanArtifacts]
│   │       ├── Writes: [TranscribedDataWithOriginalEvidenceRef (Manually transcribed data linked to source scan)]
│   │       └── Rules:
│   │           ├── REQ-083: Flag unreadable documents and allow readable alternative upload or manual transcription.
│   │           └── BR-U05: User can record a manual alternative when an automated source is unavailable.
│   │
│   └── DataContract: Exposes gRPC/REST APIs to all other Deployable Units for deduplicated, validated entity data.
│
└── [DU-12] GovernanceAuditTelemetryUnit (Deployable Unit 12 / P-12 | Domain: DOM-08 Risk, Governance & BI)
    ├── Ingress: EventStream: All Domain Events (*) | GET /api/v1/reports/telemetry
    ├── SubPipeline: CrossCuttingSecurityAndAudit
    │   ├── Activity: EnforceRoleBasedAccessControlAndMinimisation
    │   │   ├── Description: Evaluates user credentials, role permissions, and data minimisation principles to restrict personal and commercial data access.
    │   │   ├── Agent: GovernanceAuditAgent [Autonomous Security Gateway]
    │   │   ├── Reads: [UserIdentityContext, CaseAccessPolicy, DataMinimisationRules]
    │   │   ├── Writes: [AccessControlDecision (Permitted view fields, redacted personal data)]
    │   │   └── Rules:
    │   │       ├── REQ-084: Restrict access to case data by role and need, applying strict data minimization.
    │   │       ├── LR-04: UK GDPR - Data protection by design and default; access limitation.
    │   │       └── BR-G04: Personal data accessed strictly for stated purpose by authorized roles.
    │   │
    │   ├── Activity: AppendImmutableAuditLedgerRecord
    │   │   ├── Description: Commits every workflow transition, automated agent action, human edit, and gate decision into an immutable WORM audit ledger.
    │   │   ├── Agent: GovernanceAuditAgent [Autonomous Ledger Engine]
    │   │   ├── Reads: [AllSystemActivityEvents, ActorIdentities, CryptographicTimestamps]
    │   │   ├── Writes: [WORMCompliantAuditTrail (Immutable blockchain/WORM audit records)]
    │   │   └── Rules:
    │   │       ├── REQ-085: Keep complete audit trail of every action on a case by person or system with date and time.
    │   │       ├── LR-06: FCA SYSC - Senior Management Arrangements, Systems and Controls: Record-keeping mandates.
    │   │       └── BR-G02: Every action on a case is attributable to an actor, date, and time.
    │   │
    │   ├── Activity: ExecuteRetentionSchedulesAndLegalHolds
    │   │   ├── Description: Manages document retention lifecycles, applying automated disposal at end of statutory retention while enforcing litigation legal holds.
    │   │   ├── Agent: GovernanceAuditAgent [Autonomous]
    │   │   ├── Reads: [WORMCompliantAuditTrail, LegalHoldRegistry, CorporateRetentionSchedule]
    │   │   ├── Writes: [RetentionDisposalLog (Purge certificates, preserved legal hold records)]
    │   │   └── Rules:
    │   │       ├── REQ-086: Retain records for policy period and enforce legal holds overriding deletion.
    │   │       ├── LR-04: UK GDPR storage limitation principles.
    │   │       └── BR-E03: Records kept per retention schedule; legal hold overrides deletion.
    │   │
    │   ├── Activity: ServiceGDPRDataSubjectRequests
    │   │   ├── Description: Scans all case vaults and credit archives to compile or rectify personal data upon receipt of a GDPR Data Subject Access Request (DSAR).
    │   │   ├── Agent: GovernanceAuditAgent & DPO [Human-in-the-Loop]
    │   │   ├── Reads: [DataSubjectRequestNotice, AllCaseDataStores]
    │   │   ├── Writes: [GDPRSubjectInformationDossier (Redacted subject access report)]
    │   │   └── Rules:
    │   │       ├── REQ-087: Handle personal data with recorded lawful basis and support data subject requests.
    │   │       └── LR-04: UK GDPR - Rights of access, rectification, and erasure.
    │   │
    │   ├── Activity: EnforceFourEyesSegregationAndAITransparencyLabels
    │   │   ├── Description: Verifies that AI-generated draft sections carry explicit provenance labels and enforces 4-eyes segregation between preparer and approver roles.
    │   │   ├── Agent: GovernanceAuditAgent [Autonomous Control Monitor]
    │   │   ├── Reads: [DraftContentProvenanceMetadata, UserAuthorisationClaims]
    │   │   ├── Writes: [ControlComplianceAssertion (Verification that AI was reviewed and segregation respected)]
    │   │   └── Rules:
    │   │       ├── REQ-088: Keep preparer of pricing and terms separate from authorizer; keep Credit independent.
    │   │       ├── REQ-090: Label content generated by non-human means, show source, and require human review.
    │   │       ├── BR-E02: Preparer cannot be sole authorizer.
    │   │       ├── BR-G06: AI content labeled and used only after human review.
    │   │       └── LR-12: AI Governance & Model Risk Frameworks (SR 11-7, DORA, SMCR).
    │   │
    │   ├── Activity: LogExceptionsAndOverridesWithApprovedJustification
    │   │   ├── Description: Records all policy overrides, completeness gate exceptions, and manual clearances into an audited exception register.
    │   │   ├── Agent: GovernanceAuditAgent [Autonomous]
    │   │   ├── Reads: [OverrideRequestPayload, ApproverCredentials, BusinessJustificationNotes]
    │   │   ├── Writes: [ExceptionRegisterRecord (Audited exception entry with approver ID and justification)]
    │   │   └── Rules:
    │   │       ├── REQ-091: Record each exception or override with approver and reason.
    │   │       └── BR-E04: Every exception has an authorized approver and recorded reason.
    │   │
    │   └── Activity: FallbackToManualContinuity
    │       ├── Description: Automatically engages manual fallback pathways when external integrations (Companies House, Equifax) experience outages.
    │       ├── Agent: GovernanceAuditAgent [Autonomous Circuit Breaker]
    │       ├── Reads: [IntegrationHeartbeatStatus, APIErrorLogs]
    │       ├── Writes: [ManualFallbackAuditTrail (Logging manual continuity mode activation)]
    │       └── Rules:
    │           ├── REQ-092: Allow users to continue with manual alternative when automated source unavailable.
    │           ├── BR-U05: User can record manual alternative when automated source is unavailable.
    │           └── LR-11: Operational Resilience (FCA SYSC 15A) - Important business service continuity.
    │
    └── SubPipeline: TelemetryAndOperationalIntelligence
        ├── Activity: TelemetryElapsedEffortPerStage
        │   ├── Description: Captures real-time cycle times and active human effort per stage to baseline against historical 90+ minute manual effort benchmarks.
        │   ├── Agent: TelemetryReportingAgent [Autonomous Metric Collector]
        │   ├── Reads: [ActivityLifecycleTimestamps]
        │   ├── Writes: [EffortTelemetryMetrics (Elapsed stage minutes, active human touch time, pause times)]
        │   └── Rules:
        │       ├── REQ-093: Record elapsed time and effort per case by stage to baseline against 90+ minute reference.
        │       ├── CALC-013: Effort per case = Sum of stage minutes; Variance vs. 90-minute reference.
        │       └── OBJ-01: Reduce effort to prepare decision-ready pack.
        │
        ├── Activity: TelemetryCaseVolumeByLineAndSource
        │   ├── Description: Measures throughput volume partitioned by lending line (Franchise, Wholesale, Fleet, Retail) and origination channel.
        │   ├── Agent: TelemetryReportingAgent [Autonomous]
        │   ├── Reads: [DealerCaseHeader, CaseClassification]
        │   ├── Writes: [ThroughputVolumeMetrics (Volume counts by request type, channel, lending line)]
        │   └── Rules:
        │       ├── REQ-094: Record case volumes by request type, lending line, and source.
        │       └── OBJ-07: Baseline the volume of work.
        │
        ├── Activity: TelemetryReworkCreditQueriesAndAmendments
        │   ├── Description: Tracks Credit query counts, pack resubmission rates, and underwriter return reasons to monitor submission quality.
        │   ├── Agent: TelemetryReportingAgent [Autonomous]
        │   ├── Reads: [CreditAssessmentEvent, PackVersionLog]
        │   ├── Writes: [ReworkQualityMetrics (Query rate per pack, rework reasons, version counts)]
        │   └── Rules:
        │       ├── REQ-095: Record rework: Credit queries, returned packs, post-submission amendments.
        │       └── OBJ-03: Raise first-time-complete submissions; reduce Credit queries.
        │
        ├── Activity: TelemetryManualInterventionsAndExceptions
        │   ├── Description: Quantifies frequency and root causes of manual fallbacks and policy exceptions to identify automation friction.
        │   ├── Agent: TelemetryReportingAgent [Autonomous]
        │   ├── Reads: [ExceptionRegisterRecord, HitDispositionLog]
        │   ├── Writes: [ExceptionTelemetryMetrics (Exception counts, manual intervention frequencies)]
        │   └── Rules:
        │       └── REQ-096: Record manual interventions and exceptions per case with reasons.
        │
        └── Activity: PublishExecutiveOperationalBIReports
            ├── Description: Publishes aggregated operational dashboards for executive leadership covering throughput, effort reduction, rework, and risk compliance.
            ├── Agent: TelemetryReportingAgent [Autonomous BI Publisher]
            ├── Reads: [EffortTelemetryMetrics, ThroughputVolumeMetrics, ReworkQualityMetrics, ExceptionTelemetryMetrics]
            ├── Writes: [ManagementOperationsDashboard (Executive BI charts, SLA tracking, compliance status)]
            └── Rules:
                ├── REQ-097: Provide operational reports on volume, effort, rework, exceptions, overdue reviews to Business Management.
                └── OBJ-01..07: Executive progress tracking against measurable objectives.

```
