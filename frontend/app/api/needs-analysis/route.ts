/**
 * Needs Analysis API Routes
 *
 * GET  /api/needs-analysis            → Get questions (optional ?section=)
 * POST /api/needs-analysis            → Submit responses, get recommendations
 */

import { NextRequest, NextResponse } from 'next/server';

const NEEDS_QUESTIONS = [
  // Business
  { id: 'company-name', section: 'business', question: 'What is your company or project name?', type: 'text', required: true },
  { id: 'industry', section: 'business', question: 'What industry are you in?', type: 'select', options: ['technology', 'real-estate', 'construction', 'healthcare', 'legal', 'education', 'fitness', 'finance', 'e-commerce', 'manufacturing', 'media-entertainment', 'professional-services', 'non-profit', 'other'], required: true },
  { id: 'team-size', section: 'business', question: 'How many people will use this tool?', type: 'select', options: ['just-me', '2-5', '6-20', '21-100', '100+'], required: true, helpText: 'Determines tier and resources.' },
  { id: 'primary-goal', section: 'business', question: 'What is your primary goal?', type: 'select', options: ['automate-workflows', 'build-ai-agents', 'research-analysis', 'content-creation', 'code-development', 'customer-service', 'data-extraction', 'internal-tools', 'other'], required: true },
  { id: 'specific-workflows', section: 'business', question: 'Describe the specific workflows or tasks you want to automate', type: 'text', required: true, helpText: 'Be specific about what you need automated.' },
  // Technical
  { id: 'existing-tools', section: 'technical', question: 'What tools do you currently use?', type: 'multi-select', options: ['slack', 'microsoft-teams', 'google-workspace', 'notion', 'jira', 'salesforce', 'hubspot', 'shopify', 'quickbooks', 'zapier', 'n8n', 'airtable', 'zoho', 'none'], required: false },
  { id: 'data-sources', section: 'technical', question: 'Where does your data come from?', type: 'multi-select', options: ['manual-entry', 'spreadsheets', 'databases', 'apis', 'web-scraping', 'email', 'crm', 'erp', 'legacy-software', 'files'], required: true },
  { id: 'legacy-systems', section: 'technical', question: 'Do you have legacy systems that lack APIs?', type: 'toggle', required: true, helpText: 'We can use computer-use agents.' },
  { id: 'tech-comfort', section: 'technical', question: 'What is your technical comfort level?', type: 'select', options: ['non-technical', 'basic', 'intermediate', 'developer'], required: true },
  // Security
  { id: 'data-sensitivity', section: 'security', question: 'What type of data will the tool process?', type: 'multi-select', options: ['public-data', 'internal-business', 'customer-pii', 'financial', 'health-records', 'legal-documents', 'trade-secrets', 'none-sensitive'], required: true },
  { id: 'compliance', section: 'security', question: 'Do you need to comply with any regulations?', type: 'multi-select', options: ['none', 'gdpr', 'ccpa', 'hipaa', 'soc2', 'pci-dss', 'iso-27001', 'fedramp'], required: true },
  { id: 'access-control', section: 'security', question: 'Do you need role-based access control?', type: 'toggle', required: true },
  // Delivery
  { id: 'hosting-preference', section: 'delivery', question: 'Where do you want the tool hosted?', type: 'select', options: ['aims-hosted', 'self-hosted', 'hybrid', 'undecided'], required: true, helpText: 'AIMS-hosted: we manage. Self-hosted: you run.' },
  { id: 'uptime-requirement', section: 'delivery', question: 'What uptime do you need?', type: 'select', options: ['best-effort', '99-percent', '99.9-percent', '99.99-percent'], required: true },
  { id: 'support-level', section: 'delivery', question: 'What support level do you need?', type: 'select', options: ['self-service', 'email-support', 'priority-support', 'dedicated-account'], required: true },
  // Budget
  { id: 'monthly-budget', section: 'budget', question: 'What is your monthly budget for this tool?', type: 'select', options: ['under-50', '50-200', '200-500', '500-2000', '2000-plus', 'flexible'], required: true },
  { id: 'scaling-plan', section: 'budget', question: 'Do you expect to scale usage over time?', type: 'select', options: ['stable', 'moderate-growth', 'rapid-growth', 'unknown'], required: false },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  let questions = [...NEEDS_QUESTIONS];
  if (section) {
    questions = questions.filter(q => q.section === section);
  }

  return NextResponse.json({
    questions,
    sections: ['business', 'technical', 'security', 'delivery', 'budget'],
    total: questions.length,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { responses } = body;

  if (!responses || !Array.isArray(responses)) {
    return NextResponse.json(
      { error: 'responses array is required' },
      { status: 400 },
    );
  }

  // In production, this calls UEF Gateway's needs-analysis engine
  // For now, basic recommendation logic

  const answer = (qId: string) => {
    const r = responses.find((resp: { questionId: string }) => resp.questionId === qId);
    return r?.answer;
  };

  const industry = answer('industry') || 'other';
  const goal = answer('primary-goal') || 'other';
  const teamSize = answer('team-size') || 'just-me';
  const dataSensitivity = answer('data-sensitivity') || [];
  const compliance = answer('compliance') || [];
  const budget = answer('monthly-budget') || 'flexible';

  // Simple recommendation engine
  const GOAL_MAP: Record<string, string[]> = {
    'automate-workflows': ['n8n', 'windmill', 'openclaw'],
    'build-ai-agents': ['agent-zero', 'openclaw', 'ii-agent'],
    'research-analysis': ['deerflow', 'browser-use'],
    'content-creation': ['content-engine', 'n8n'],
    'code-development': ['ii-agent', 'agent-zero'],
    'customer-service': ['personaplex', 'n8n'],
    'data-extraction': ['browser-use', 'trey-ai', 'n8n'],
    'internal-tools': ['n8n', 'windmill', 'ii-agent'],
    other: ['n8n', 'ii-agent'],
  };

  const recommendedPlugs = GOAL_MAP[goal as string] || GOAL_MAP['other'];

  const sensitiveData = Array.isArray(dataSensitivity) &&
    dataSensitivity.some((d: string) => ['customer-pii', 'financial', 'health-records'].includes(d));

  const hasCompliance = Array.isArray(compliance) &&
    compliance.length > 0 && !compliance.includes('none');

  const result = {
    id: crypto.randomUUID(),
    companyName: answer('company-name') || 'Unknown',
    industry,
    scale: teamSize === '100+' ? 'enterprise' : teamSize === '21-100' ? 'department' : 'small-team',
    recommendedPlugs,
    recommendedTier: teamSize === '100+' ? 'enterprise' : teamSize === '21-100' ? 'pro' : 'starter',
    recommendedDelivery: answer('hosting-preference') === 'self-hosted' ? 'exported' : 'hosted',
    securityLevel: sensitiveData && hasCompliance ? 'enterprise' : sensitiveData ? 'hardened' : 'standard',
    estimatedMonthlyCost: budget === '2000-plus' ? 1500 : budget === '500-2000' ? 800 : 300,
    riskLevel: sensitiveData ? 'high' : 'medium',
    dataClassification: sensitiveData ? 'confidential' : 'internal',
    complianceRequirements: Array.isArray(compliance) ? compliance.filter((c: string) => c !== 'none') : [],
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
