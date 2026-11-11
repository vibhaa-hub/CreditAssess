import { auth, requiresAuth } from 'express-openid-connect';
import type { Application, RequestHandler } from 'express';

export interface AuthSetup {
  developmentBypass: boolean;
  protectApi: RequestHandler;
  protectPage: RequestHandler;
  actorId: (request: Parameters<RequestHandler>[0]) => string;
  actorRoles: (request: Parameters<RequestHandler>[0]) => string[];
  mount: (app: Application) => void;
}

const applicationRoles = [
  'ACCOUNT_MANAGER',
  'WHOLESALE_MANAGER',
  'ONBOARDING_ANALYST',
  'FCC_ANALYST',
  'COMMERCIAL_DIRECTOR',
  'CREDIT_UNDERWRITER',
  'OPERATIONS_ANALYST',
  'GOVERNANCE_AUDITOR',
];

export function configureAuthentication(): AuthSetup {
  const developmentBypass =
    process.env.NODE_ENV !== 'production' &&
    process.env.AUTH_DISABLED_FOR_LOCAL_DEV === 'true';

  if (developmentBypass) {
    return {
      developmentBypass,
      protectApi: (_request, _response, next) => next(),
      protectPage: (_request, _response, next) => next(),
      actorId: () => 'local-development-user',
      actorRoles: () => applicationRoles,
      mount: () => {},
    };
  }

  const required = [
    'OIDC_ISSUER_URL',
    'OIDC_CLIENT_ID',
    'OIDC_CLIENT_SECRET',
    'OIDC_BASE_URL',
    'SESSION_SECRET',
  ] as const;
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Configure OIDC before starting: ${missing.join(', ')}.`);
  }
  if ((process.env.SESSION_SECRET?.length ?? 0) < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.OIDC_BASE_URL?.startsWith('https://') || !process.env.OIDC_ISSUER_URL?.startsWith('https://'))
  ) {
    throw new Error('Production OIDC issuer and application URLs must use HTTPS.');
  }

  const oidcMiddleware = auth({
    authRequired: false,
    auth0Logout: false,
    secret: process.env.SESSION_SECRET!,
    baseURL: process.env.OIDC_BASE_URL!,
    clientID: process.env.OIDC_CLIENT_ID!,
    clientSecret: process.env.OIDC_CLIENT_SECRET!,
    issuerBaseURL: process.env.OIDC_ISSUER_URL!,
    session: {
      cookie: {
        httpOnly: true,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    routes: {
      login: '/login',
      callback: '/callback',
      logout: '/logout',
    },
  });

  return {
    developmentBypass,
    protectApi: requiresAuth(),
    protectPage: requiresAuth(),
    actorId: (request) => {
      const oidcRequest = request as typeof request & { oidc?: { user?: { sub?: string } } };
      return oidcRequest.oidc?.user?.sub ?? 'authenticated-user';
    },
    actorRoles: (request) => {
      const claimName = process.env.OIDC_ROLE_CLAIM ?? 'roles';
      const oidcRequest = request as typeof request & { oidc?: { user?: Record<string, unknown> } };
      const claim = oidcRequest.oidc?.user?.[claimName];
      if (!Array.isArray(claim)) return [];
      return claim.filter((role): role is string =>
        typeof role === 'string' && applicationRoles.includes(role)
      );
    },
    mount: (app) => app.use(oidcMiddleware),
  };
}
