export type IntegrationStatus = 'NOT_CONFIGURED' | 'CONFIGURED_UNVERIFIED';

export interface IntegrationDescriptor {
  id: string;
  purpose: string;
  status: IntegrationStatus;
}

const requiredEnvironment: Record<string, { purpose: string; variables: string[] }> = {
  company_registry: {
    purpose: 'Company identity and registry records',
    variables: ['COMPANY_REGISTRY_BASE_URL', 'COMPANY_REGISTRY_API_KEY'],
  },
  credit_bureau: {
    purpose: 'Commercial credit bureau checks',
    variables: ['CREDIT_BUREAU_BASE_URL', 'CREDIT_BUREAU_API_KEY'],
  },
  sanctions_screening: {
    purpose: 'Sanctions, PEP and adverse-media screening',
    variables: ['SCREENING_BASE_URL', 'SCREENING_API_KEY'],
  },
  document_storage: {
    purpose: 'Encrypted document storage',
    variables: ['DOCUMENT_STORAGE_BASE_URL', 'DOCUMENT_STORAGE_CLIENT_SECRET'],
  },
  credit_gateway: {
    purpose: 'Credit decisioning and servicing platform',
    variables: ['CREDIT_GATEWAY_BASE_URL', 'CREDIT_GATEWAY_CLIENT_SECRET'],
  },
};

export function listIntegrationStatuses(): IntegrationDescriptor[] {
  return Object.entries(requiredEnvironment).map(([id, integration]) => ({
    id,
    purpose: integration.purpose,
    status: integration.variables.every((key) => Boolean(process.env[key]))
      ? 'CONFIGURED_UNVERIFIED'
      : 'NOT_CONFIGURED',
  }));
}
