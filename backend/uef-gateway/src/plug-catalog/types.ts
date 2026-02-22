/**
 * Plug Catalog — Type Definitions
 *
 * The Plug Catalog is the unified registry of deployable AI tools, agents,
 * and platforms that AIMS customers can spin up with one click. Every tool
 * — whether OpenClaw, ii-agent, Agent Zero, DeerFlow, or a custom vertical
 * like Per|Form — follows the same Plug structure.
 *
 * The MIM (Make It Mind) template ensures the ONLY thing that changes
 * between plugs is the tool itself. Structure, security, deployment,
 * and delivery all remain identical.
 */

// ---------------------------------------------------------------------------
// Core Plug Definition
// ---------------------------------------------------------------------------

export type PlugCategory =
  | 'agent-framework'      // OpenClaw, Agent Zero, CrewAI, Dify, Coze Studio
  | 'code-execution'       // ii-agent, E2B, Daytona, Continue
  | 'workflow-automation'   // n8n, Windmill, Temporal, Flowise
  | 'research-agent'        // DeerFlow, GPT Researcher
  | 'computer-use'          // OpenClaw, Trey AI, browser-use
  | 'voice-agent'           // PersonaPlex, Vapi, Retell
  | 'content-engine'        // Content generation, social media, video
  | 'data-pipeline'         // ETL, scraping, analytics
  | 'custom-vertical'       // Per|Form, real estate, etc.
  | 'dev-tools'             // IDEs, sandboxes, dashboards
  | 'chat-ui'               // Open WebUI, LibreChat
  | 'database'              // Supabase, NocoDB
  | 'storage'               // MinIO, R2
  | 'monitoring'            // Uptime Kuma, Grafana
  | 'cms'                   // Ghost, Strapi
  | 'model-serving'         // Ollama, vLLM, TGI
  | 'chatbot'               // Typebot, Botpress
  | 'security'              // Vaultwarden, Authentik
  | 'project-management';   // Plane, Huly

export type PlugTier = 'free' | 'starter' | 'pro' | 'enterprise';

export type DeliveryMode = 'hosted' | 'exported' | 'hybrid';

export type SecurityLevel = 'standard' | 'hardened' | 'enterprise';

export interface PlugResource {
  cpuLimit: string;         // e.g. '1' or '2'
  memoryLimit: string;      // e.g. '1G' or '2G'
  diskLimit?: string;       // e.g. '10G'
  gpuRequired: boolean;
  gpuType?: string;         // e.g. 'L4', 'A100'
}

export interface PlugPort {
  internal: number;
  description: string;
  protocol: 'http' | 'https' | 'ws' | 'tcp';
}

export interface PlugEnvVar {
  key: string;
  description: string;
  required: boolean;
  default?: string;
  sensitive: boolean;       // If true, will be masked in UI and encrypted
  category: 'core' | 'llm' | 'api-key' | 'database' | 'custom';
}

export interface PlugVolume {
  name: string;
  mountPath: string;
  description: string;
  persistent: boolean;
}

export interface PlugHealthCheck {
  endpoint: string;         // e.g. '/health'
  interval: string;         // e.g. '30s'
  timeout: string;
  retries: number;
  startPeriod: string;
}

export interface PlugNetworkPolicy {
  internetAccess: boolean;
  allowedEgress: string[];  // Domains that can be reached
  isolatedSandbox: boolean; // If true, runs in sandbox-network
  bridgeToAims: boolean;    // If true, can reach aims-network via agent-bridge
}

export interface PlugCustomization {
  id: string;
  label: string;
  description: string;
  type: 'text' | 'select' | 'multi-select' | 'toggle' | 'number';
  options?: string[];
  default: string | boolean | number;
  envMapping?: string;      // Maps to an env var when deployed
}

// ---------------------------------------------------------------------------
// The Plug — Central Data Model
// ---------------------------------------------------------------------------

export interface PlugDefinition {
  id: string;                          // e.g. 'openclaw', 'ii-agent'
  name: string;                        // Display name
  tagline: string;                     // One-liner
  description: string;                 // Full description
  category: PlugCategory;
  tags: string[];
  tier: PlugTier;
  version: string;
  sourceUrl?: string;                  // GitHub / docs URL
  license: string;

  // Docker configuration
  docker: {
    image?: string;                    // Pre-built image (e.g. 'frdel/agent-zero-run:latest')
    buildContext?: string;             // Build from source path
    dockerfile?: string;              // Custom Dockerfile path
    composeProfile?: string;          // Existing AIMS profile if applicable
  };

  // Resource requirements
  resources: PlugResource;
  ports: PlugPort[];
  volumes: PlugVolume[];
  healthCheck: PlugHealthCheck;

  // Environment
  envVars: PlugEnvVar[];

  // Security
  networkPolicy: PlugNetworkPolicy;
  securityLevel: SecurityLevel;

  // Customization options shown to user
  customizations: PlugCustomization[];

  // Dependencies (other plugs or AIMS services required)
  dependencies: string[];              // Plug IDs or AIMS service names

  // Delivery
  supportedDelivery: DeliveryMode[];
  defaultDelivery: DeliveryMode;

  // Metadata
  icon?: string;                       // Lucide icon name or URL
  accentColor: string;                 // Brand color for UI
  featured: boolean;
  comingSoon: boolean;
  addedAt: string;
}

// ---------------------------------------------------------------------------
// Needs Analysis — Business Client Intake
// ---------------------------------------------------------------------------

export interface NeedsQuestion {
  id: string;
  section: 'business' | 'technical' | 'security' | 'delivery' | 'budget';
  question: string;
  type: 'text' | 'select' | 'multi-select' | 'scale' | 'toggle';
  options?: string[];
  required: boolean;
  helpText?: string;
  conditionalOn?: { questionId: string; answer: string | string[] };
}

export interface NeedsResponse {
  questionId: string;
  answer: string | string[] | number | boolean;
}

export interface NeedsAnalysisResult {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  scale: 'solo' | 'small-team' | 'department' | 'enterprise';

  // Derived recommendations
  recommendedPlugs: string[];          // Plug IDs
  recommendedTier: PlugTier;
  recommendedDelivery: DeliveryMode;
  securityLevel: SecurityLevel;
  estimatedMonthlyCost: number;

  // Risk assessment
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  complianceRequirements: string[];    // e.g. 'HIPAA', 'SOC2', 'GDPR'
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  // Raw responses
  responses: NeedsResponse[];

  createdAt: string;
}

// ---------------------------------------------------------------------------
// Plug Instance — A deployed plug for a specific user/client
// ---------------------------------------------------------------------------

export type PlugInstanceStatus =
  | 'configuring'
  | 'provisioning'
  | 'building'
  | 'starting'
  | 'running'
  | 'stopped'
  | 'failed'
  | 'exported';

export interface PlugInstance {
  instanceId: string;
  plugId: string;
  userId: string;
  name: string;                        // User's name for this instance
  status: PlugInstanceStatus;
  deliveryMode: DeliveryMode;

  // Runtime config
  assignedPort: number;
  domain?: string;
  envOverrides: Record<string, string>;
  customizationValues: Record<string, string | boolean | number>;

  // Security
  securityLevel: SecurityLevel;
  dspId?: string;                      // Deploy Security Packet ID

  // Metrics
  lucCost: number;
  uptimeSeconds: number;
  lastHealthCheck?: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';

  // Export info (if delivered)
  exportBundle?: {
    composeFile: string;
    envTemplate: string;
    readmeContent: string;
    setupScript: string;
    generatedAt: string;
  };

  // Lifecycle
  createdAt: string;
  startedAt?: string;
  stoppedAt?: string;
}

// ---------------------------------------------------------------------------
// Catalog API shapes
// ---------------------------------------------------------------------------

export interface CatalogSearchQuery {
  q?: string;                          // Free text search
  category?: PlugCategory;
  tier?: PlugTier;
  tags?: string[];
  featured?: boolean;
  delivery?: DeliveryMode;
}

export interface CatalogSearchResult {
  plugs: PlugDefinition[];
  total: number;
  categories: Record<PlugCategory, number>;
}

export interface SpinUpRequest {
  plugId: string;
  userId: string;
  instanceName: string;
  deliveryMode: DeliveryMode;
  customizations: Record<string, string | boolean | number>;
  envOverrides: Record<string, string>;
  securityLevel?: SecurityLevel;
  domain?: string;
  /** Set true to deploy a plug marked comingSoon (experimental) */
  allowExperimental?: boolean;
}

export interface SpinUpResult {
  instance: PlugInstance;
  deploymentId: string;
  estimatedReadyTime: string;
  lucQuote: number;
  events: Array<{
    timestamp: string;
    stage: string;
    message: string;
  }>;
}

export interface ExportRequest {
  instanceId: string;
  format: 'docker-compose' | 'helm-chart' | 'terraform';
  includeData: boolean;
}

export interface ExportResult {
  bundleId: string;
  files: Record<string, string>;      // filename -> content
  instructions: string;
  downloadUrl?: string;
  generatedAt: string;
}
