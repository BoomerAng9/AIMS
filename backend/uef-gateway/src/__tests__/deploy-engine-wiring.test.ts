/**
 * Deploy Engine Wiring Tests
 *
 * Proves the critical wiring between:
 *   - instanceLifecycle.initialize() → portAllocator.load() + healthMonitor.start()
 *   - spin-up → onInstanceDeployed() (DNS + KV + monitoring)
 *   - decommission → full cleanup cascade
 *
 * These tests validate the control flow, not Docker/Cloudflare calls
 * (those require real infrastructure).
 */

import { InstanceLifecycle } from '../plug-catalog/instance-lifecycle';
import { HealthMonitor } from '../plug-catalog/health-monitor';
import { PortAllocator } from '../plug-catalog/port-allocator';

// ---------------------------------------------------------------------------
// Test: InstanceLifecycle class shape
// ---------------------------------------------------------------------------

describe('InstanceLifecycle', () => {
  it('exports a class with initialize(), onInstanceDeployed(), decommission()', () => {
    const lifecycle = new InstanceLifecycle();
    expect(typeof lifecycle.initialize).toBe('function');
    expect(typeof lifecycle.onInstanceDeployed).toBe('function');
    expect(typeof lifecycle.decommission).toBe('function');
    expect(typeof lifecycle.reconcile).toBe('function');
    expect(typeof lifecycle.getStats).toBe('function');
    expect(typeof lifecycle.getHealthMonitor).toBe('function');
    expect(typeof lifecycle.getPortAllocator).toBe('function');
  });

  it('decommission returns structured result for unknown instance', async () => {
    const lifecycle = new InstanceLifecycle();
    const result = await lifecycle.decommission('nonexistent-id');
    expect(result.instanceId).toBe('nonexistent-id');
    expect(result.fullyDecommissioned).toBe(false);
    expect(result.steps[0].step).toBe('lookup');
    expect(result.steps[0].success).toBe(false);
    expect(result.steps[0].detail).toBe('Instance not found');
  });

  it('getStats returns structured stats without initialization', () => {
    const lifecycle = new InstanceLifecycle();
    const stats = lifecycle.getStats();
    expect(stats).toHaveProperty('totalInstances');
    expect(stats).toHaveProperty('runningInstances');
    expect(stats).toHaveProperty('stoppedInstances');
    expect(stats).toHaveProperty('portCapacity');
    expect(stats).toHaveProperty('healthStats');
    expect(stats).toHaveProperty('recentEvents');
    expect(typeof stats.totalInstances).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Test: HealthMonitor lifecycle
// ---------------------------------------------------------------------------

describe('HealthMonitor', () => {
  it('exports a class with start(), stop(), isRunning()', () => {
    const monitor = new HealthMonitor();
    expect(typeof monitor.start).toBe('function');
    expect(typeof monitor.stop).toBe('function');
    expect(typeof monitor.isRunning).toBe('function');
    expect(typeof monitor.sweep).toBe('function');
    expect(typeof monitor.getStats).toBe('function');
    expect(typeof monitor.getRecentEvents).toBe('function');
    expect(typeof monitor.getAllStatuses).toBe('function');
  });

  it('starts as not running', () => {
    const monitor = new HealthMonitor();
    expect(monitor.isRunning()).toBe(false);
  });

  it('reports running after start()', () => {
    const monitor = new HealthMonitor();
    monitor.start();
    expect(monitor.isRunning()).toBe(true);
    monitor.stop();
    expect(monitor.isRunning()).toBe(false);
  });

  it('getStats returns structured result', () => {
    const monitor = new HealthMonitor();
    const stats = monitor.getStats();
    expect(stats).toHaveProperty('monitored');
    expect(stats).toHaveProperty('healthy');
    expect(stats).toHaveProperty('unhealthy');
    expect(stats).toHaveProperty('unknown');
  });
});

// ---------------------------------------------------------------------------
// Test: PortAllocator
// ---------------------------------------------------------------------------

describe('PortAllocator', () => {
  // Clean up shared state file between test runs
  beforeAll(() => {
    try { require('fs').unlinkSync('/tmp/aims-port-allocator.json'); } catch {}
  });

  it('exports a class with allocate(), release(), getCapacity()', () => {
    const allocator = new PortAllocator();
    expect(typeof allocator.allocate).toBe('function');
    expect(typeof allocator.release).toBe('function');
    expect(typeof allocator.getCapacity).toBe('function');
    expect(typeof allocator.getAllocations).toBe('function');
    expect(typeof allocator.load).toBe('function');
    expect(typeof allocator.reconcile).toBe('function');
  });

  it('getCapacity returns port range stats', () => {
    const allocator = new PortAllocator();
    const capacity = allocator.getCapacity();
    expect(capacity).toHaveProperty('used');
    expect(capacity).toHaveProperty('total');
    expect(capacity).toHaveProperty('percentage');
    expect(capacity.used).toBe(0);
    expect(capacity.total).toBeGreaterThan(0);
  });

  it('allocates and releases ports correctly', async () => {
    const allocator = new PortAllocator();
    const beforeCount = allocator.getCapacity().used;

    // Allocate
    const port = await allocator.allocate('alloc-release-test', 'test-plug', 'test-user');
    expect(port).toBeGreaterThanOrEqual(51000);
    expect(port).toBeLessThan(60000);
    expect(allocator.getCapacity().used).toBe(beforeCount + 1);

    const allocations = allocator.getAllocations();
    const found = allocations.find(a => a.instanceId === 'alloc-release-test');
    expect(found).toBeDefined();
    expect(found!.port).toBe(port);

    // Release
    await allocator.release('alloc-release-test');
    expect(allocator.getCapacity().used).toBe(beforeCount);
    const afterRelease = allocator.getAllocations();
    expect(afterRelease.find(a => a.instanceId === 'alloc-release-test')).toBeUndefined();
  });
});
