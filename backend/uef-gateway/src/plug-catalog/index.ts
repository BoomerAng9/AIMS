/**
 * Plug Catalog — Public API
 *
 * The unified entry point for AIMS's tool deployment platform.
 * Customers browse the catalog → answer needs analysis → spin up
 * with one click → or export for self-hosting.
 *
 * The Port Authority (UEF Gateway) routes all plug operations
 * through this module.
 */

// Types
export type {
  PlugCategory,
  PlugTier,
  DeliveryMode,
  SecurityLevel,
  PlugResource,
  PlugPort,
  PlugEnvVar,
  PlugVolume,
  PlugHealthCheck,
  PlugNetworkPolicy,
  PlugCustomization,
  PlugDefinition,
  PlugInstance,
  PlugInstanceStatus,
  NeedsQuestion,
  NeedsResponse,
  NeedsAnalysisResult,
  CatalogSearchQuery,
  CatalogSearchResult,
  SpinUpRequest,
  SpinUpResult,
  ExportRequest,
  ExportResult,
} from './types';

// Catalog
export { PlugCatalog, plugCatalog } from './catalog';

// Deploy Engine
export { PlugDeployEngine, plugDeployEngine } from './deploy-engine';

// Needs Analysis
export { NeedsAnalysisEngine, needsAnalysis } from './needs-analysis';

// Docker Runtime
export { DockerRuntime, dockerRuntime } from './docker-runtime';

// PaaS Operations Layer
export { PortAllocator, portAllocator } from './port-allocator';
export { HealthMonitor, healthMonitor } from './health-monitor';
export { InstanceLifecycle, instanceLifecycle } from './instance-lifecycle';
export { KVSync, kvSync } from './kv-sync';
export { instanceStore } from './instance-store';

// API Router
export { plugRouter } from './router';
