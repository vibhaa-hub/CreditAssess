# ApexCredit

ApexCredit is a credit-assessment workflow application. The repository currently contains a product foundation and workflow UI; it is **not yet approved for production credit decisions or for loading live customer data**.

## Current product foundation

- React/TypeScript frontend and Express API.
- PostgreSQL JSONB case storage with optimistic version checks.
- OIDC login for non-local environments; API and UI routes require authentication.
- Server-side role checks for case creation and sensitive changes, using the configured OIDC role claim.
- Append-only, per-case SHA-256 chained audit events.
- JSON case import with API-side schema checks.
- Explicit integration readiness status. A status of `CONFIGURED_UNVERIFIED` means only that environment variables exist; no external provider has been contacted.
- AI drafting endpoints return an error when Gemini is unavailable instead of substituting fabricated credit or screening commentary.

Several workflow screens, risk calculations, agent tools, telemetry, exception handling, and provider-style features still contain prototype logic. Provider integrations, document retention, file storage, comprehensive data validation, organization-specific authorization, operational monitoring, backup/restore, and compliance approval remain required before production use.

## Local setup

Requirements: Node.js 20+, Python 3, and a PostgreSQL database reachable from this machine.

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a development PostgreSQL database.
3. Keep `AUTH_DISABLED_FOR_LOCAL_DEV=true` only for local development. This mode grants all application roles to the local development identity and must never be enabled in production.
4. Install dependencies, apply the database migration, and start:

   ```powershell
   npm install
   npm run db:migrate
   npm run dev
   ```

5. Open `http://localhost:3000`. If the database has no cases, the workspace offers JSON import.

For production, set `NODE_ENV=production`, configure an OIDC issuer/client/callback URL and a strong `SESSION_SECRET`, set the `roles` claim (or `OIDC_ROLE_CLAIM`) to ApexCredit role names, and leave the local auth bypass unset. Use a PostgreSQL connection configured with `sslmode=verify-full`. The server will refuse to start if database, migration, or OIDC configuration is missing.

## Case import format

Import accepts one complete case object matching the `CreditCase` model in `src/types/ast.ts`. The object must include `caseId`, dealer identity, classification, checklist and verification state, screening results, financials, narratives, pricing, snapshots, underwriting queries/decision, fulfillment state, review schedule, and master-passport data. The API rejects duplicate case IDs and malformed required fields.

Case records are persisted to PostgreSQL. Updates include an expected version; conflicting edits are rejected with HTTP 409 and the UI reloads the stored version. Case content may contain sensitive personal and financial data: use only an approved development dataset until the organization has approved access, retention, encryption, residency, and provider arrangements.

## OIDC roles

The identity provider must issue an array claim containing one or more of:

`ACCOUNT_MANAGER`, `WHOLESALE_MANAGER`, `ONBOARDING_ANALYST`, `FCC_ANALYST`, `COMMERCIAL_DIRECTOR`, `CREDIT_UNDERWRITER`, `OPERATIONS_ANALYST`, `GOVERNANCE_AUDITOR`.

The API derives the audit actor from the verified OIDC subject and checks roles server-side. The UI role selector does not grant authorization. Local development bypass is intentionally privileged and must not be used with real customer data.

## Integration boundary

No Companies House, bureau, sanctions/PEP, document-storage, or credit-gateway provider has been selected or supplied. Corresponding environment-variable names are placeholders, not working integrations. Do not configure production credentials until the vendor, API contract, lawful basis, consent flow, data-processing terms, and failure handling have been reviewed. Gemini drafting is optional and is not a decision engine; configured requests send the supplied case context to Google, and this repository does not establish an approved data-processing or retention arrangement. Do not send customer data until that use has been explicitly approved.
