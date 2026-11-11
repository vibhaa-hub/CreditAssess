/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Express Full-Stack Server on Port 3000 with Python Multi-Agent Subsystem
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { GoogleGenAI } from '@google/genai';
import { configureAuthentication } from './backend/auth';
import { assertDatabaseSchema, createDatabasePool } from './backend/database';
import {
  CaseAuthorizationError,
  CaseConflictError,
  IntegrationUnavailableError,
  CaseNotFoundError,
  CaseRepository,
} from './backend/caseRepository';
import { listIntegrationStatuses } from './backend/integrations';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini client with proper User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

async function startServer() {
  const pool = createDatabasePool();
  await pool.query('SELECT 1');
  await assertDatabaseSchema(pool);
  const caseRepository = new CaseRepository(pool);
  const authentication = configureAuthentication();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', process.env.TRUST_PROXY === 'true');
  app.use(express.json({ limit: '2mb' }));
  authentication.mount(app);

  app.get('/healthz', async (_req: Request, res: Response) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      console.error('Health check database query failed:', error);
      res.status(503).json({ status: 'unavailable', database: 'unavailable' });
    }
  });

  app.use('/api', authentication.protectApi);
  app.use((req: Request, res: Response, next) => {
    if (req.path === '/healthz' || req.path.startsWith('/api/')) return next();
    return authentication.protectPage(req, res, next);
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const oidcRequest = req as Request & { oidc?: { user?: Record<string, unknown> } };
    if (authentication.developmentBypass) {
      return res.json({
        subject: 'local-development-user',
        roles: authentication.actorRoles(req),
        developmentBypass: true,
      });
    }
    return res.json({
      subject: oidcRequest.oidc?.user?.sub ?? null,
      roles: authentication.actorRoles(req),
      developmentBypass: false,
    });
  });

  app.get('/api/integrations', (_req: Request, res: Response) => {
    res.json({ integrations: listIntegrationStatuses() });
  });

  app.get('/api/cases', async (_req: Request, res: Response) => {
    try {
      res.json({ cases: await caseRepository.list() });
    } catch (error) {
      console.error('Failed to list cases:', error);
      res.status(500).json({ error: 'Could not load cases.' });
    }
  });

  app.get('/api/cases/:caseId', async (req: Request, res: Response) => {
    try {
      const creditCase = await caseRepository.get(req.params.caseId);
      if (!creditCase) return res.status(404).json({ error: 'Case not found.' });
      return res.json(creditCase);
    } catch (error) {
      console.error('Failed to load case:', error);
      return res.status(500).json({ error: 'Could not load case.' });
    }
  });

  app.post('/api/cases', async (req: Request, res: Response) => {
    try {
      const creditCase = await caseRepository.create(
        req.body?.caseData,
        authentication.actorId(req),
        authentication.actorRoles(req)
      );
      return res.status(201).json(creditCase);
    } catch (error) {
      if (error instanceof CaseAuthorizationError) {
        return res.status(403).json({ error: error.message });
      }
      const message = error instanceof Error ? error.message : 'Invalid case data.';
      const status = (error as { code?: string }).code === '23505'
        ? 409
        : message.startsWith('Invalid case data:') ? 400 : 500;
      if (status === 500) console.error('Failed to import case:', error);
      return res.status(status).json({
        error: status === 409 ? 'A case with that case ID already exists.' : message,
      });
    }
  });

  app.put('/api/cases/:caseId', async (req: Request, res: Response) => {
    try {
      const updatedCase = await caseRepository.replace(
        req.params.caseId,
        req.body?.caseData,
        req.body?.expectedVersion,
        authentication.actorId(req),
        authentication.actorRoles(req)
      );
      return res.json(updatedCase);
    } catch (error) {
      if (error instanceof CaseNotFoundError) return res.status(404).json({ error: error.message });
      if (error instanceof CaseConflictError) return res.status(409).json({ error: error.message });
      if (error instanceof CaseAuthorizationError) return res.status(403).json({ error: error.message });
      if (error instanceof IntegrationUnavailableError) return res.status(503).json({ error: error.message });
      const message = error instanceof Error ? error.message : 'Invalid case update.';
      const status = message.startsWith('Invalid case data:') || message.includes('required')
        || message.includes('must match') ? 400 : 500;
      if (status === 500) console.error('Failed to update case:', error);
      return res.status(status).json({ error: message });
    }
  });

  app.get('/api/cases/:caseId/audit', async (req: Request, res: Response) => {
    try {
      if (!(await caseRepository.get(req.params.caseId))) {
        return res.status(404).json({ error: 'Case not found.' });
      }
      return res.json({ events: await caseRepository.listAudit(req.params.caseId) });
    } catch (error) {
      console.error('Failed to load case audit events:', error);
      return res.status(500).json({ error: 'Could not load audit events.' });
    }
  });

  app.post('/api/cases/:caseId/audit', async (req: Request, res: Response) => {
    const { action, details } = req.body ?? {};
    if (typeof action !== 'string' || action.trim().length === 0 || action.length > 120
      || typeof details !== 'string' || details.trim().length === 0 || details.length > 4000) {
      return res.status(400).json({ error: 'A valid action and details are required.' });
    }
    if (authentication.actorRoles(req).length === 0) {
      return res.status(403).json({ error: 'Your identity has no ApexCredit application roles.' });
    }
    try {
      await caseRepository.recordAudit(
        req.params.caseId,
        authentication.actorId(req),
        action.trim(),
        details.trim()
      );
      return res.status(201).json({ status: 'recorded' });
    } catch (error) {
      if (error instanceof CaseNotFoundError) return res.status(404).json({ error: error.message });
      console.error('Failed to write case audit event:', error);
      return res.status(500).json({ error: 'Could not record audit event.' });
    }
  });

  const pythonCliPath = path.join(__dirname, 'python_agents', 'agent_cli.py');

  // Helper to execute Python agent commands
  const executePython = (command: string, payload: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const payloadStr = JSON.stringify(payload);
      const pythonExecutable = process.env.PYTHON_EXECUTABLE
        || (process.platform === 'win32' ? 'python' : 'python3');
      const pyProcess = spawn(pythonExecutable, [pythonCliPath, command, payloadStr], {
        cwd: __dirname,
      });

      let stdoutData = '';
      let stderrData = '';

      pyProcess.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString();
      });

      pyProcess.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      pyProcess.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Python process exited with code ${code}: ${stderrData || stdoutData}`));
        }
        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (err) {
          resolve({ raw_output: stdoutData.trim(), error: 'JSON parse error', stderr: stderrData });
        }
      });
    });
  };

  // API 1: List all registered Python agents
  app.get('/api/python/agents/list', async (req: Request, res: Response) => {
    try {
      const data = await executePython('list-agents', {});
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 2: Run full orchestrated multi-agent cycle
  app.post('/api/python/agents/evaluate-all', async (req: Request, res: Response) => {
    try {
      const result = await executePython('evaluate-all', req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 3: Run targeted Python agent command
  app.post('/api/python/agents/run', async (req: Request, res: Response) => {
    try {
      const { command, payload } = req.body;
      const result = await executePython(command, payload || {});
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 4: View source code of any Python agent file
  app.get('/api/python/agents/code/:filename', (req: Request, res: Response) => {
    try {
      const filename = path.basename(req.params.filename);
      let targetPath = path.join(__dirname, 'python_agents', 'agents', filename);
      if (!fs.existsSync(targetPath)) {
        targetPath = path.join(__dirname, 'python_agents', filename);
      }
      if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      const code = fs.readFileSync(targetPath, 'utf-8');
      res.json({ filename, code });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // GOOGLE ADK, RULE ENGINE DSL, DOCLING & RAG ENDPOINTS
  // ==========================================

  // Google ADK API 1: List all ADK Agents & Declarative Tool Schemas
  app.get('/api/adk/agents', async (req: Request, res: Response) => {
    try {
      const data = await executePython('adk-list', {});
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Google ADK API 2: Run Multi-Agent ADK Pipeline with HITL Checkpoints
  app.post('/api/adk/run', async (req: Request, res: Response) => {
    try {
      const data = await executePython('adk-run', req.body || {});
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Google ADK API 3: Commit Human-in-the-Loop Attestation Signoff
  app.post('/api/adk/hitl-signoff', async (req: Request, res: Response) => {
    try {
      const data = await executePython('adk-hitl-signoff', req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Deterministic Rule Engine DSL API: Evaluate Statutory Invariants
  app.post('/api/rule-engine/evaluate', async (req: Request, res: Response) => {
    try {
      const data = await executePython('rule-engine-eval', req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Docling & OCR Ingestion API: Extract Tables & Cells with Bounding Boxes
  app.post('/api/docling/extract', async (req: Request, res: Response) => {
    try {
      const data = await executePython('docling-extract', req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // RAG Search API: Retrieve Grounded Policy and Document Citations
  app.post('/api/rag/search', async (req: Request, res: Response) => {
    try {
      const data = await executePython('rag-search', req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Risk & Pricing Prediction Model API: Evaluate Custom Scenario
  app.post('/api/risk-model/evaluate', async (req: Request, res: Response) => {
    try {
      const data = await executePython('risk-model-eval', req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Risk & Pricing Prediction Model API: Comparative £7M Loan Study
  app.get('/api/risk-model/study', async (req: Request, res: Response) => {
    try {
      const data = await executePython('risk-model-study', {});
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // GEMINI 3.8 FLASH LLM ASSISTANCE ENDPOINTS
  // AI output is unverified and must not be presented as a regulatory control.
  // ==========================================

  // Gemini API 1: Generate Section Narrative with citations
  app.post('/api/gemini/generate-narrative', async (req: Request, res: Response) => {
    const { sectionKey, sectionTitle, dealerName, sector, contextData } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Narrative drafting is unavailable until Gemini is configured.' });
    }

    const systemPrompt = `You are a drafting assistant for UK commercial credit case notes.
    Use only the supplied context. Do not claim to have checked Companies House, a bureau, sanctions sources, or documents unless that evidence is explicitly included in the context.
    Never invent figures, source references, approvals, or regulatory conclusions. If evidence for a statement is absent, mark it as requiring verification.
    All output is an unverified draft; do not make a credit decision.`;

    const userPrompt = `Draft the credit pack commentary for section "${sectionTitle}" (${sectionKey}) regarding dealer "${dealerName}" (${sector}).
Context information provided:
${JSON.stringify(contextData, null, 2)}

Requirements:
- Paragraph 1: Executive overview and trading posture using only supported facts.
- Paragraph 2: Operational strengths and asset quality.
- Paragraph 3: Risk considerations, mitigants, and recommended covenants.
- Keep output concise (under 250 words), direct, and identify any unsupported facts as requiring verification.
Do not use source labels unless the exact source reference is present in the supplied context.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        },
      });
      return res.json({
        text: response.text,
        model: 'gemini-3.8-flash',
        isLiveAi: true,
        fcaLabel: 'AI-GENERATED DRAFT — REQUIRES INDEPENDENT HUMAN VERIFICATION',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Gemini narrative generation failed:', err.message);
      return res.status(502).json({ error: 'Gemini narrative generation failed.' });
    }
  });

  // Gemini API 2: Adjudicate Screening Hits
  app.post('/api/gemini/adjudicate-screening', async (req: Request, res: Response) => {
    const { checkType, entityName, hitDetails } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Screening assistance is unavailable until Gemini is configured.' });
    }

    const prompt = `You are a Senior AML & Financial Crime Compliance Officer assisting under FCA SYSC 6.3 and JMLSG guidelines.
Analyze the following screening alert:
- Check Type: ${checkType}
- Target Entity / Individual: ${entityName}
- Alert Details: ${JSON.stringify(hitDetails)}

Task:
Provide a structured assessment covering:
1. Hit Evaluation (Identity match confidence, DOB/Jurisdiction reconciliation).
2. Risk Contextualization (Direct vs Indirect exposure, Politically Exposed Person tier if applicable).
3. Proposed Adjudication Disposition (FALSE POSITIVE / CLEARED WITH MITIGANT / ESCALATE TO MLRO).
4. Recommended Audit Rationale for human AML compliance officer 4-eyes signoff.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
        },
      });
      return res.json({
        reasoning: response.text,
        model: 'gemini-3.8-flash',
        isLiveAi: true,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Gemini screening adjudication failed:', err.message);
      return res.status(502).json({ error: 'Gemini screening assistance failed.' });
    }
  });

  // Gemini API 3: Synthesize Financial Spreading Commentary
  app.post('/api/gemini/financial-commentary', async (req: Request, res: Response) => {
    const { dealerName, ratios, spreadPeriods, requestedLimit } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Financial commentary is unavailable until Gemini is configured.' });
    }

    const prompt = `Analyze commercial financials for "${dealerName}" applying CALC-001 through CALC-014:
Financial Spreading Data:
${JSON.stringify({ ratios, spreadPeriods, requestedLimit }, null, 2)}

Provide a rigorous financial assessment:
1. Profitability & EBITDA trajectory (FY2022 -> FY2024).
2. Leverage & Gearing analysis (Net Debt / EBITDA, Debt Service Coverage Ratio CALC-003).
3. Working Capital & Liquidity (Quick Ratio CALC-002, Debtor Days CALC-008, Stock Turn CALC-007).
4. Facility headroom stress-test against proposed £${(requestedLimit || 0).toLocaleString()} facility.
Use only supplied values. Do not invent source references or claim external verification. Mark unsupported conclusions as requiring human review.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
        },
      });
      return res.json({
        commentary: response.text,
        model: 'gemini-3.8-flash',
        isLiveAi: true,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Gemini financial commentary failed:', err.message);
      return res.status(502).json({ error: 'Gemini financial commentary failed.' });
    }
  });

  // Gemini API 4: Underwriter Assistant & Query Clarifier
  app.post('/api/gemini/underwriter-assistant', async (req: Request, res: Response) => {
    const { queryType, contextData, underwriterQuestion } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Underwriter assistance is unavailable until Gemini is configured.' });
    }

    const prompt = `You are ApexCredit's Senior Underwriting Copilot.
User Query: "${underwriterQuestion}"
Context Data:
${JSON.stringify(contextData, null, 2)}
Query Type: ${queryType}

Provide an actionable, regulatory-compliant recommendation for the underwriter with specific policy condition references and conditions precedent (CP).`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });
      return res.json({
        response: response.text,
        model: 'gemini-3.8-flash',
        isLiveAi: true,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Gemini underwriter assistant failed:', err.message);
      return res.status(502).json({ error: 'Gemini underwriter assistance failed.' });
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT ?? 3000);
  const HOST = process.env.HOST ?? '127.0.0.1';
  app.listen(PORT, HOST, () => {
    console.log(`ApexCredit Multi-Agent Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
