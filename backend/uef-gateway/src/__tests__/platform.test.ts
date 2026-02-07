/**
 * Platform Module Tests — DB, Intake, Templates, Scaffolder,
 * Pipeline, Deployer, Integrations, Analytics, Make It Mine
 *
 * Tests the full plug-building platform infrastructure.
 */

import { projectStore, plugStore, deploymentStore, Store } from '../db';
import { getQuestions, analyzeRequirements, generateProjectSpec, createProject } from '../intake';
import { templateLibrary } from '../templates';
import { scaffolder } from '../scaffolder';
import { pipeline } from '../pipeline';
import { deployer } from '../deployer';
import { integrationRegistry } from '../integrations';
import { analytics } from '../analytics';
import { makeItMine } from '../make-it-mine';

// Unique suffix per test run to avoid UNIQUE constraint clashes in persistent SQLite
const RUN = Date.now().toString(36);

// ---------------------------------------------------------------------------
// DB Store
// ---------------------------------------------------------------------------
describe('DB Store', () => {
  it('creates and retrieves items', () => {
    const tbl = `test_cr_${RUN}`;
    const store = new Store<{ id: string; name: string }>('test', tbl);
    const item = store.create({ id: `test-1-${RUN}`, name: 'Test Item' });
    expect(item.id).toBe(`test-1-${RUN}`);
    expect(store.get(`test-1-${RUN}`)?.name).toBe('Test Item');
  });

  it('updates items', () => {
    const tbl = `test_up_${RUN}`;
    const store = new Store<{ id: string; name: string }>('test', tbl);
    store.create({ id: `u-1-${RUN}`, name: 'Original' });
    const updated = store.update(`u-1-${RUN}`, { name: 'Updated' });
    expect(updated?.name).toBe('Updated');
  });

  it('deletes items', () => {
    const tbl = `test_del_${RUN}`;
    const store = new Store<{ id: string; name: string }>('test', tbl);
    store.create({ id: `d-1-${RUN}`, name: 'Delete Me' });
    expect(store.delete(`d-1-${RUN}`)).toBe(true);
    expect(store.get(`d-1-${RUN}`)).toBeUndefined();
  });

  it('lists and filters items', () => {
    const tbl = `test_filt_${RUN}`;
    const store = new Store<{ id: string; type: string }>('test', tbl);
    store.create({ id: `f-1-${RUN}`, type: 'a' });
    store.create({ id: `f-2-${RUN}`, type: 'b' });
    store.create({ id: `f-3-${RUN}`, type: 'a' });
    expect(store.list()).toHaveLength(3);
    expect(store.findBy(i => i.type === 'a')).toHaveLength(2);
  });

  it('exports singleton stores', () => {
    expect(projectStore).toBeDefined();
    expect(plugStore).toBeDefined();
    expect(deploymentStore).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Intake Engine
// ---------------------------------------------------------------------------
describe('Intake Engine', () => {
  it('returns generic questions when no archetype specified', () => {
    const questions = getQuestions();
    expect(questions.length).toBeGreaterThanOrEqual(4);
    expect(questions[0].question).toBeDefined();
    expect(questions[0].type).toBeDefined();
  });

  it('returns archetype-specific questions', () => {
    const generic = getQuestions();
    const saas = getQuestions('saas');
    expect(saas.length).toBeGreaterThanOrEqual(generic.length);
  });

  it('analyzes requirements and determines complexity', () => {
    const analysis = analyzeRequirements([], 'Build a SaaS dashboard with user auth, payments, and analytics');
    expect(analysis.complexity).toBeDefined();
    expect(analysis.features.length).toBeGreaterThan(0);
    expect(['simple', 'intermediate', 'complex']).toContain(analysis.complexity);
  });

  it('generates a project spec from analysis', () => {
    const analysis = analyzeRequirements([], 'Build an e-commerce marketplace with search and payments');
    const spec = generateProjectSpec(analysis);
    expect(spec.archetype).toBeDefined();
    expect(spec.techStack.frontend).toBeDefined();
    expect(spec.techStack.backend).toBeDefined();
    expect(spec.pages.length).toBeGreaterThan(0);
    expect(spec.estimatedFiles).toBeGreaterThan(0);
  });

  it('creates a project in the store', () => {
    const analysis = analyzeRequirements([], 'Build a portfolio site');
    const spec = generateProjectSpec(analysis);
    const project = createProject('test-user', 'My Portfolio', 'A portfolio site', spec);
    expect(project.id).toBeDefined();
    expect(project.name).toBe('My Portfolio');
    expect(project.userId).toBe('test-user');
    expect(project.spec).toEqual(spec);
  });
});

// ---------------------------------------------------------------------------
// Template Library
// ---------------------------------------------------------------------------
describe('Template Library', () => {
  it('has at least 6 templates', () => {
    expect(templateLibrary.list().length).toBeGreaterThanOrEqual(6);
  });

  it('each template has required fields', () => {
    for (const tmpl of templateLibrary.list()) {
      expect(tmpl.id).toBeDefined();
      expect(tmpl.name).toBeDefined();
      expect(tmpl.archetype).toBeDefined();
      expect(['simple', 'intermediate', 'complex']).toContain(tmpl.complexity);
      expect(tmpl.features.length).toBeGreaterThan(0);
      expect(tmpl.techStack.frontend).toBeDefined();
      expect(tmpl.pages.length).toBeGreaterThan(0);
    }
  });

  it('can look up templates by ID', () => {
    const portfolio = templateLibrary.get('portfolio');
    expect(portfolio).toBeDefined();
    expect(portfolio?.complexity).toBe('simple');
  });

  it('filters by complexity', () => {
    const simple = templateLibrary.getByComplexity('simple');
    expect(simple.length).toBeGreaterThanOrEqual(1);
    for (const t of simple) {
      expect(t.complexity).toBe('simple');
    }
  });
});

// ---------------------------------------------------------------------------
// Scaffolder
// ---------------------------------------------------------------------------
describe('Project Scaffolder', () => {
  it('scaffolds a project from a spec', () => {
    const spec = {
      archetype: 'portfolio',
      techStack: { frontend: 'Next.js', backend: 'Express', database: 'SQLite' },
      pages: ['home', 'about', 'projects', 'contact'],
      apiRoutes: ['/api/contact'],
      dbModels: ['user'],
      integrations: [],
      estimatedFiles: 15,
      estimatedBuildTime: '30 min',
    };
    const result = scaffolder.scaffold(spec, 'MyPortfolio');
    expect(result.projectName).toBe('MyPortfolio');
    expect(result.totalFiles).toBeGreaterThan(0);
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.dockerConfig).toContain('FROM');
    expect(result.envTemplate).toContain('NODE_ENV');
  });

  it('generated files have path, content, and type', () => {
    const spec = {
      archetype: 'saas',
      techStack: { frontend: 'Next.js', backend: 'Express', database: 'PostgreSQL' },
      pages: ['dashboard', 'settings'],
      apiRoutes: ['/api/users'],
      dbModels: ['user', 'subscription'],
      integrations: ['stripe'],
      estimatedFiles: 30,
      estimatedBuildTime: '2 hrs',
    };
    const result = scaffolder.scaffold(spec, 'SaaSApp');
    for (const file of result.files) {
      expect(file.path).toBeDefined();
      expect(file.content).toBeDefined();
      expect(file.type).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
describe('Execution Pipeline', () => {
  it('starts a pipeline for a project', () => {
    const state = pipeline.start('pipeline-test-001');
    expect(state.projectId).toBe('pipeline-test-001');
    expect(state.currentStage).toBe('INTAKE');
    expect(state.overallStatus).toBe('running');
  });

  it('advances through stages', () => {
    pipeline.start('pipeline-test-002');
    const result = pipeline.advanceStage('pipeline-test-002');
    expect(result.stage).toBe('INTAKE');
    expect(result.status).toBe('completed');
    expect(result.nextStage).toBe('SCOPE');
  });

  it('tracks pipeline state', () => {
    pipeline.start('pipeline-test-003');
    const state = pipeline.getState('pipeline-test-003');
    expect(state).toBeDefined();
    expect(state?.currentStage).toBe('INTAKE');
  });

  it('lists active pipelines', () => {
    const active = pipeline.listActive();
    expect(active.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Deployer
// ---------------------------------------------------------------------------
describe('Deployment Manager', () => {
  it('deploys a plug', () => {
    const status = deployer.deploy({
      plugId: 'deploy-test-001',
      projectName: 'test-project',
      provider: 'docker',
      port: 0,
      envVars: {},
      sslEnabled: false,
    });
    expect(status.deploymentId).toBeDefined();
    expect(status.status).toBe('running');
    expect(status.port).toBeGreaterThan(0);
    expect(status.logs.length).toBeGreaterThan(0);
  });

  it('stops a deployment', () => {
    const initial = deployer.deploy({
      plugId: 'deploy-test-002',
      projectName: 'stop-test',
      provider: 'docker',
      port: 0,
      envVars: {},
      sslEnabled: false,
    });
    const stopped = deployer.stop(initial.deploymentId);
    expect(stopped?.status).toBe('stopped');
  });

  it('generates docker compose config', () => {
    const config = deployer.generateDockerCompose({
      plugId: 'dc-test',
      projectName: 'docker-test',
      provider: 'docker',
      port: 3050,
      envVars: { NODE_ENV: 'production' },
      sslEnabled: false,
    });
    expect(config).toContain('docker-test');
    expect(config).toContain('3050');
  });
});

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------
describe('Integration Registry', () => {
  it('has at least 10 integrations', () => {
    expect(integrationRegistry.list().length).toBeGreaterThanOrEqual(10);
  });

  it('each integration has required fields', () => {
    for (const int of integrationRegistry.list()) {
      expect(int.id).toBeDefined();
      expect(int.name).toBeDefined();
      expect(int.category).toBeDefined();
      expect(int.provider).toBeDefined();
      expect(int.npmPackages.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('filters by category', () => {
    const email = integrationRegistry.getByCategory('email');
    expect(email.length).toBeGreaterThanOrEqual(1);
    for (const e of email) {
      expect(e.category).toBe('email');
    }
  });

  it('reports stats', () => {
    const stats = integrationRegistry.getStats();
    expect(stats.total).toBeGreaterThanOrEqual(10);
    expect(stats.byCategory).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
describe('Analytics Engine', () => {
  it('records events and retrieves metrics', () => {
    analytics.record('analytics-test-001', 'request');
    analytics.record('analytics-test-001', 'request');
    analytics.record('analytics-test-001', 'error');
    const metrics = analytics.getMetrics('analytics-test-001');
    expect(metrics.requests).toBe(2);
    expect(metrics.errors).toBe(1);
  });

  it('provides daily stats', () => {
    analytics.record('analytics-test-002', 'request');
    const daily = analytics.getDailyStats('analytics-test-002', 7);
    expect(daily.length).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Make It Mine
// ---------------------------------------------------------------------------
describe('Make It Mine Engine', () => {
  it('clones a template with customizations', () => {
    const result = makeItMine.clone({
      templateId: 'portfolio',
      projectName: 'My Construction Portfolio',
      industry: 'construction',
      branding: {
        primaryColor: '#f59e0b',
        secondaryColor: '#1e293b',
        companyName: 'BuildRight Co.',
      },
      featureOverrides: {
        add: ['file-upload'],
        remove: [],
      },
      terminologyMap: { 'Project': 'Build Site', 'Contact': 'Inquiry' },
    });
    expect(result.projectName).toBe('My Construction Portfolio');
    expect(result.baseTemplate).toBe('portfolio');
    expect(result.customizations.length).toBeGreaterThan(0);
    expect(result.spec).toBeDefined();
  });

  it('suggests customizations for an industry', () => {
    const suggestions = makeItMine.suggestCustomizations('crm', 'real-estate');
    expect(suggestions.features.length).toBeGreaterThanOrEqual(0);
    expect(suggestions.terminology).toBeDefined();
  });
});
