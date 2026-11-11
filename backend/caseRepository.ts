import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';

const caseDataSchema = z.object({
  caseId: z.string().trim().min(1).max(100),
  receiptDate: z.string().min(1),
  originationSource: z.enum(['OEM_PARTNER', 'FIELD_TEAM', 'DEALER_DIRECT', 'BANK_REFERRAL', 'EXISTING_RELATIONSHIP']),
  assignedOwner: z.string(),
  ownerRole: z.enum([
    'ACCOUNT_MANAGER', 'WHOLESALE_MANAGER', 'ONBOARDING_ANALYST', 'FCC_ANALYST',
    'COMMERCIAL_DIRECTOR', 'CREDIT_UNDERWRITER', 'OPERATIONS_ANALYST', 'GOVERNANCE_AUDITOR',
  ]),
  status: z.enum([
    'INTAKE', 'INFORMATION_GATHERING', 'ENTITY_VERIFICATION', 'DUE_DILIGENCE_SCREENING',
    'FINANCIAL_SPREADING', 'CREDIT_AUTHORING', 'PRICING_AND_TERMS', 'CREDIT_GATEWAY',
    'UNDERWRITING_REVIEW', 'POST_APPROVAL_FULFILLMENT', 'ACTIVE_FUNDING', 'CLOSED',
  ]),
  currentStageNumber: z.number().int().min(1).max(12),
  dealerProfile: z.object({
    legalName: z.string().trim().min(1).max(300),
    registeredNumber: z.string().trim().min(1).max(100),
  }).passthrough(),
  classification: z.object({
    primaryCategory: z.enum([
      'NEW_RELATIONSHIP', 'NEW_FRANCHISE', 'INCREASED_BORROWING', 'ACQUISITION',
      'DISPOSAL', 'DIRECTOR_SHAREHOLDER_CHANGE', 'PERIODIC_REVIEW',
    ]),
    affectedLendingLines: z.array(z.enum(['FRANCHISE', 'WHOLESALE', 'FLEET', 'RETAIL'])),
  }).passthrough(),
  requirementChecklist: z.array(z.object({
    mandatory: z.boolean(),
    satisfied: z.boolean(),
  }).passthrough()),
  verificationAttested: z.boolean(),
  screeningFindings: z.array(z.object({ status: z.string() }).passthrough()),
  customerRiskAssessment: z.unknown().optional(),
  financialPeriods: z.array(z.unknown()),
  crossLineExposures: z.array(z.unknown()),
  narrativeSections: z.array(z.object({ status: z.string() }).passthrough()),
  pricingSignoff: z.object({ isAuthorized: z.boolean() }).passthrough(),
  submissionSnapshots: z.array(z.unknown()),
  underwriterQueries: z.array(z.object({
    id: z.string().optional(),
    status: z.string().optional(),
  }).passthrough()),
  fulfillmentHandoffs: z.array(z.object({ status: z.string() }).passthrough()),
  underwritingDecision: z.object({
    conditionsPrecedent: z.array(z.object({ satisfied: z.boolean() }).passthrough()),
  }).passthrough().optional(),
}).passthrough();

export type CaseData = z.infer<typeof caseDataSchema>;

export interface PersistedCase {
  caseId: string;
  caseData: CaseData;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  caseId: string;
  actorId: string;
  action: string;
  details: string;
  previousHash: string;
  eventHash: string;
  createdAt: string;
}

export class CaseNotFoundError extends Error {}
export class CaseConflictError extends Error {}
export class CaseAuthorizationError extends Error {}
export class IntegrationUnavailableError extends Error {}

const fieldPermissions: Record<string, string[]> = {
  receiptDate: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  originationSource: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  dealerProfile: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  classification: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  assignedOwner: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  ownerRole: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  duplicateAlert: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  requirementChecklist: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  informationRequests: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  qualitativeNotes: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  registrySnapshot: ['ONBOARDING_ANALYST'],
  registryDiscrepancies: ['ONBOARDING_ANALYST'],
  directorsAndShareholders: ['ONBOARDING_ANALYST'],
  verificationAttested: ['ONBOARDING_ANALYST'],
  verificationAttestedBy: ['ONBOARDING_ANALYST'],
  verificationAttestedAt: ['ONBOARDING_ANALYST'],
  screeningFindings: ['FCC_ANALYST'],
  customerRiskAssessment: ['FCC_ANALYST'],
  financialPeriods: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  crossLineExposures: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  narrativeSections: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  facilityRequest: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  currentStageNumber: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER', 'CREDIT_UNDERWRITER', 'OPERATIONS_ANALYST'],
  submissionSnapshots: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'],
  underwritingDecision: ['CREDIT_UNDERWRITER', 'OPERATIONS_ANALYST'],
  underwriterQueries: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER', 'CREDIT_UNDERWRITER'],
  fulfillmentHandoffs: ['OPERATIONS_ANALYST'],
  periodicReview: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER', 'OPERATIONS_ANALYST'],
  masterPassport: ['GOVERNANCE_AUDITOR'],
  securities: ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER', 'COMMERCIAL_DIRECTOR'],
};

function assertCaseUpdateAuthorized(
  current: CaseData,
  proposed: CaseData,
  roles: string[]
): void {
  if (roles.length === 0) {
    throw new CaseAuthorizationError('Your identity has no ApexCredit application roles.');
  }

  const currentRecord = current as Record<string, unknown>;
  const proposedRecord = proposed as Record<string, unknown>;
  if (current.caseId !== proposed.caseId) {
    throw new CaseAuthorizationError('A case ID cannot be changed.');
  }
  for (const field of new Set([...Object.keys(currentRecord), ...Object.keys(proposedRecord)])) {
    if (
      JSON.stringify(currentRecord[field]) !== JSON.stringify(proposedRecord[field]) &&
      field !== 'status' &&
      field !== 'pricingSignoff' &&
      !fieldPermissions[field]
    ) {
      throw new CaseAuthorizationError(`No update permission is configured for ${field}.`);
    }
  }

  for (const [field, allowedRoles] of Object.entries(fieldPermissions)) {
    if (
      JSON.stringify(currentRecord[field]) !== JSON.stringify(proposedRecord[field]) &&
      !roles.some((role) => allowedRoles.includes(role))
    ) {
      throw new CaseAuthorizationError(`Changing ${field} requires one of: ${allowedRoles.join(', ')}.`);
    }
  }

  if (JSON.stringify(currentRecord.underwriterQueries) !== JSON.stringify(proposedRecord.underwriterQueries)) {
    const newQueries = proposed.underwriterQueries.filter((query: { id?: string }) =>
      !current.underwriterQueries.some((existing: { id?: string }) => existing.id === query.id)
    );
    const resolvedQueries = proposed.underwriterQueries.filter((query: { id?: string; status?: string }) => {
      const previous = current.underwriterQueries.find((existing: { id?: string }) => existing.id === query.id);
      return previous?.status === 'OPEN' && query.status === 'RESOLVED';
    });
    if (newQueries.length > 0 && !roles.includes('CREDIT_UNDERWRITER')) {
      throw new CaseAuthorizationError('Raising an underwriting query requires CREDIT_UNDERWRITER.');
    }
    if (
      resolvedQueries.length > 0 &&
      !roles.some((role) => ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'].includes(role))
    ) {
      throw new CaseAuthorizationError('Resolving an underwriting query requires the accountable deal owner.');
    }
  }

  if (JSON.stringify(currentRecord.underwritingDecision) !== JSON.stringify(proposedRecord.underwritingDecision)) {
    const existingDecision = current.underwritingDecision;
    const proposedDecision = proposed.underwritingDecision;
    const decisionChanged = !existingDecision || !proposedDecision ||
      existingDecision.outcome !== proposedDecision.outcome ||
      existingDecision.rationale !== proposedDecision.rationale ||
      existingDecision.creditReference !== proposedDecision.creditReference;
    if (decisionChanged && !roles.includes('CREDIT_UNDERWRITER')) {
      throw new CaseAuthorizationError('Recording or changing an underwriting decision requires CREDIT_UNDERWRITER.');
    }
    if (!decisionChanged && !roles.includes('OPERATIONS_ANALYST')) {
      throw new CaseAuthorizationError('Satisfying conditions precedent requires OPERATIONS_ANALYST.');
    }
  }

  if (JSON.stringify(currentRecord.pricingSignoff) !== JSON.stringify(proposedRecord.pricingSignoff)) {
    const proposedIsAuthorized = proposed.pricingSignoff.isAuthorized;
    const authorizedRole = proposedIsAuthorized
      ? roles.includes('COMMERCIAL_DIRECTOR')
      : roles.some((role) => ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER', 'COMMERCIAL_DIRECTOR'].includes(role));
    if (!authorizedRole) {
      throw new CaseAuthorizationError(
        proposedIsAuthorized
          ? 'Pricing approval requires COMMERCIAL_DIRECTOR.'
          : 'Pricing-signoff changes require an authorized deal owner or COMMERCIAL_DIRECTOR.'
      );
    }
  }

  const statusChanged = current.status !== proposed.status;
  if (statusChanged) {
    const allowedRoles = proposed.status === 'ACTIVE_FUNDING'
      ? ['OPERATIONS_ANALYST']
      : proposed.status === 'UNDERWRITING_REVIEW'
        ? ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER']
        : proposed.status === 'POST_APPROVAL_FULFILLMENT'
          ? ['CREDIT_UNDERWRITER']
          : ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER', 'CREDIT_UNDERWRITER'];
    if (!roles.some((role) => allowedRoles.includes(role))) {
      throw new CaseAuthorizationError(`Changing status to ${proposed.status} requires one of: ${allowedRoles.join(', ')}.`);
    }
  }

  if (
    proposed.submissionSnapshots.length < current.submissionSnapshots.length ||
    current.submissionSnapshots.some((snapshot: unknown, index: number) =>
      JSON.stringify(snapshot) !== JSON.stringify(proposed.submissionSnapshots[index])
    )
  ) {
    throw new CaseAuthorizationError('Submitted snapshots are immutable and may not be removed or edited.');
  }

  const newSnapshots = proposed.submissionSnapshots.length > current.submissionSnapshots.length;
  if (newSnapshots) {
    const mandatoryItems = proposed.requirementChecklist.filter((item: { mandatory?: boolean }) => item.mandatory);
    const checklistComplete = mandatoryItems.length > 0
      && mandatoryItems.every((item: { satisfied?: boolean }) => item.satisfied);
    const noOpenHits = proposed.screeningFindings.every((finding: { status?: string }) =>
      finding.status !== 'POTENTIAL_MATCH' && finding.status !== 'CONFIRMED_MATCH'
    );
    const narrativesReviewed = proposed.narrativeSections.length > 0
      && proposed.narrativeSections.every((section: { status?: string }) => section.status !== 'PENDING_REVIEW');
    if (
      !checklistComplete ||
      !proposed.verificationAttested ||
      !proposed.pricingSignoff.isAuthorized ||
      !narrativesReviewed ||
      !noOpenHits ||
      !proposed.customerRiskAssessment
    ) {
      throw new CaseAuthorizationError('Submission is blocked until the server-side completeness gate passes.');
    }
    throw new IntegrationUnavailableError('Credit submission is unavailable until a credit-gateway integration is implemented.');
  }

  if (proposed.status === 'ACTIVE_FUNDING' && current.status !== 'ACTIVE_FUNDING') {
    const handoffsComplete = proposed.fulfillmentHandoffs.length > 0
      && proposed.fulfillmentHandoffs.every((handoff: { status?: string }) => handoff.status === 'COMPLETED');
    const conditions = proposed.underwritingDecision?.conditionsPrecedent ?? [];
    const conditionsComplete = conditions.length > 0
      && conditions.every((condition: { satisfied?: boolean }) => condition.satisfied);
    if (!handoffsComplete || !conditionsComplete) {
      throw new CaseAuthorizationError('Funding is blocked until every handoff and condition precedent is complete.');
    }
    throw new IntegrationUnavailableError('Funding activation is unavailable until a servicing integration is implemented.');
  }
}

function parseCaseData(input: unknown): CaseData {
  const result = caseDataSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid case data: ${result.error.issues.map((issue) => issue.message).join('; ')}`);
  }
  return result.data;
}

function makeEventHash(input: {
  caseId: string;
  actorId: string;
  action: string;
  details: string;
  previousHash: string;
  createdAt: string;
}): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

async function appendAuditEvent(
  client: PoolClient,
  caseId: string,
  actorId: string,
  action: string,
  details: string
): Promise<void> {
  const previous = await client.query<{ event_hash: string }>(
    'SELECT event_hash FROM audit_events WHERE case_id = $1 ORDER BY id DESC LIMIT 1',
    [caseId]
  );
  const previousHash = previous.rows[0]?.event_hash ?? '0'.repeat(64);
  const createdAt = new Date().toISOString();
  const eventHash = makeEventHash({ caseId, actorId, action, details, previousHash, createdAt });
  await client.query(
    `INSERT INTO audit_events (case_id, actor_id, action, details, previous_hash, event_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [caseId, actorId, action, details, previousHash, eventHash, createdAt]
  );
}

function toPersistedCase(row: {
  case_id: string;
  case_data: CaseData;
  version: number;
  created_at: Date;
  updated_at: Date;
}): PersistedCase {
  return {
    caseId: row.case_id,
    caseData: row.case_data,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class CaseRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<PersistedCase[]> {
    const result = await this.pool.query(
      `SELECT case_id, case_data, version, created_at, updated_at
       FROM credit_cases ORDER BY updated_at DESC`
    );
    return result.rows.map(toPersistedCase);
  }

  async get(caseId: string): Promise<PersistedCase | undefined> {
    const result = await this.pool.query(
      `SELECT case_id, case_data, version, created_at, updated_at
       FROM credit_cases WHERE case_id = $1`,
      [caseId]
    );
    return result.rows[0] ? toPersistedCase(result.rows[0]) : undefined;
  }

  async create(input: unknown, actorId: string, roles: string[]): Promise<PersistedCase> {
    if (!roles.some((role) => ['ACCOUNT_MANAGER', 'WHOLESALE_MANAGER'].includes(role))) {
      throw new CaseAuthorizationError('Case import requires ACCOUNT_MANAGER or WHOLESALE_MANAGER.');
    }
    const caseData = parseCaseData(input);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO credit_cases (case_id, case_data, created_by, updated_by)
         VALUES ($1, $2, $3, $3)
         RETURNING case_id, case_data, version, created_at, updated_at`,
        [caseData.caseId, caseData, actorId]
      );
      await appendAuditEvent(client, caseData.caseId, actorId, 'CASE_IMPORTED', 'Case data imported.');
      await client.query('COMMIT');
      return toPersistedCase(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async replace(
    caseId: string,
    input: unknown,
    expectedVersion: number,
    actorId: string,
    roles: string[]
  ): Promise<PersistedCase> {
    const caseData = parseCaseData(input);
    if (caseData.caseId !== caseId) {
      throw new Error('The case ID in the request must match the URL.');
    }
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new Error('A valid expectedVersion is required.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(
        `SELECT case_id, case_data, version, created_at, updated_at
         FROM credit_cases WHERE case_id = $1 FOR UPDATE`,
        [caseId]
      );
      if (!current.rows[0]) {
        throw new CaseNotFoundError(`Case ${caseId} was not found.`);
      }
      if (current.rows[0].version !== expectedVersion) {
        throw new CaseConflictError('This case changed in another session. Reload the case before saving.');
      }
      assertCaseUpdateAuthorized(current.rows[0].case_data, caseData, roles);
      const currentCase = current.rows[0].case_data as CaseData;
      if (!currentCase.verificationAttested && caseData.verificationAttested) {
        caseData.verificationAttestedBy = actorId;
        caseData.verificationAttestedAt = new Date().toISOString();
      }
      if (!currentCase.pricingSignoff.isAuthorized && caseData.pricingSignoff.isAuthorized) {
        caseData.pricingSignoff.authorizerId = actorId;
        caseData.pricingSignoff.authorizerRole = 'COMMERCIAL_DIRECTOR';
        caseData.pricingSignoff.authorizedAt = new Date().toISOString();
      }
      if (caseData.underwritingDecision) {
        caseData.underwritingDecision.underwriterId = actorId;
      }

      const result = await client.query(
        `UPDATE credit_cases
         SET case_data = $2, version = version + 1, updated_by = $3, updated_at = now()
         WHERE case_id = $1
         RETURNING case_id, case_data, version, created_at, updated_at`,
        [caseId, caseData, actorId]
      );
      await appendAuditEvent(client, caseId, actorId, 'CASE_UPDATED', `Saved case version ${result.rows[0].version}.`);
      await client.query('COMMIT');
      return toPersistedCase(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listAudit(caseId: string): Promise<AuditEvent[]> {
    const result = await this.pool.query(
      `SELECT id, case_id, actor_id, action, details, previous_hash, event_hash, created_at
       FROM audit_events WHERE case_id = $1 ORDER BY id`,
      [caseId]
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      caseId: row.case_id,
      actorId: row.actor_id,
      action: row.action,
      details: row.details,
      previousHash: row.previous_hash,
      eventHash: row.event_hash,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async recordAudit(
    caseId: string,
    actorId: string,
    action: string,
    details: string
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(
        'SELECT case_id FROM credit_cases WHERE case_id = $1 FOR UPDATE',
        [caseId]
      );
      if (!current.rows[0]) throw new CaseNotFoundError(`Case ${caseId} was not found.`);
      await appendAuditEvent(client, caseId, actorId, action, details);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
