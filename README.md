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

Experimental risk scoring, policy retrieval, rule evaluation, ADK sessions, and HITL endpoints are disabled because their bundled implementations are not production-validated. Unused experimental modules remain in the repository but are not exposed through the worker allowlist or enabled UI. Provider integrations, document retention, file storage, comprehensive data validation, organization-specific authorization, operational monitoring, backup/restore, and compliance approval remain required before production use.

## Python worker and agents

The Express API starts the Python worker as a bounded subprocess. Python dependencies for the enabled paths use the standard library; no Python package installation is required. The worker accepts only JSON input and allows these commands:

- `list-agents`: reports the current bounded capabilities.
- `evaluate-all`: read-only analysis of a case loaded from PostgreSQL by the authenticated API. It does not write decisions or invoke external providers.
- `docling-extract`: despite the legacy command name, currently parses uploaded UTF-8 CSV bytes only. It enforces 2 MB, 2,000-row, 100-column, and 20,000-character-per-cell limits. It returns source-preserving cells and a SHA-256 content hash; it does not persist the file, verify it, map financial meaning, reconcile statements, or support PDF/OCR/Excel/iXBRL.

The available agents validate supplied intake values, calculate a limited set of financial ratios only when required inputs are present, summarize case-record screening flags without claiming live checks, and report completeness without transmitting a submission. Their output is analytical-only and is not an approval or credit decision. Live screening, document storage/parsing, credit submission, approved policy/rules, persisted human attestations, and a validated risk model are not configured.

Run the Python boundary tests from the project root:

```powershell
python -m unittest discover -s python_agents/tests
```

The server uses `python` on Windows and `python3` on other platforms by default; set `PYTHON_EXECUTABLE` if the intended interpreter is not on `PATH`.

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
