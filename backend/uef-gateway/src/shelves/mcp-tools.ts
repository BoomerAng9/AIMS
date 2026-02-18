/**
 * MCP Tool Definitions — Shelf Walking for Chicken Hawk & Lil_Hawks
 *
 * These tool definitions are exposed to agents via the MCP protocol
 * so they can "walk the shelves" — read from and write to every
 * collection in the A.I.M.S. backend.
 *
 * Tools:
 *   shelves.list_shelves     — Discover available shelves and doc counts
 *   shelves.read             — Read a single document from a shelf
 *   shelves.list             — List/query documents on a shelf
 *   shelves.create           — Create a new document on a shelf
 *   shelves.update           — Update an existing document on a shelf
 *   shelves.search           — Search across multiple shelves
 *   luc.estimate             — Get a LUC cost estimate for a project
 *   luc.create_project       — Create a new LUC project record
 *   luc.get_project          — Get a LUC project's status and costs
 */

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[]; items?: { type: string }; properties?: Record<string, unknown> }>;
    required: string[];
  };
}

const SHELF_ENUM = ['projects', 'luc_projects', 'plugs', 'boomer_angs', 'workflows', 'runs', 'logs', 'assets'];

export const shelfMCPTools: MCPToolDefinition[] = [
  // ── Shelf discovery ──────────────────────────────────────────
  {
    name: 'shelves.list_shelves',
    description: 'List all available data shelves in the A.I.M.S. backend with document counts. Use this to discover what data is available before walking specific shelves.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ── Read a document ─────────────────────────────────────────
  {
    name: 'shelves.read',
    description: 'Read a single document by ID from a specific shelf. Returns the full document data.',
    inputSchema: {
      type: 'object',
      properties: {
        shelf: { type: 'string', description: 'The shelf (collection) to read from', enum: SHELF_ENUM },
        id: { type: 'string', description: 'The document ID to read' },
      },
      required: ['shelf', 'id'],
    },
  },

  // ── List/query documents ────────────────────────────────────
  {
    name: 'shelves.list',
    description: 'List or query documents on a shelf. Supports filtering by field values, ordering, and pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        shelf: { type: 'string', description: 'The shelf (collection) to list from', enum: SHELF_ENUM },
        filters: {
          type: 'array',
          description: 'Optional filters: [{field, op, value}]. Ops: ==, !=, <, <=, >, >=, in, array-contains',
          items: { type: 'object' },
        },
        orderBy: { type: 'string', description: 'Field name to order by' },
        orderDir: { type: 'string', description: 'Sort direction: asc or desc', enum: ['asc', 'desc'] },
        limit: { type: 'number', description: 'Maximum documents to return (default 50)' },
      },
      required: ['shelf'],
    },
  },

  // ── Create a document ───────────────────────────────────────
  {
    name: 'shelves.create',
    description: 'Create a new document on a shelf. ID is auto-generated if not provided. Timestamps are auto-set.',
    inputSchema: {
      type: 'object',
      properties: {
        shelf: { type: 'string', description: 'The shelf (collection) to create on', enum: SHELF_ENUM },
        data: { type: 'object', description: 'The document data to create' },
      },
      required: ['shelf', 'data'],
    },
  },

  // ── Update a document ───────────────────────────────────────
  {
    name: 'shelves.update',
    description: 'Update an existing document on a shelf with partial data. Only provided fields are updated.',
    inputSchema: {
      type: 'object',
      properties: {
        shelf: { type: 'string', description: 'The shelf (collection) containing the document', enum: SHELF_ENUM },
        id: { type: 'string', description: 'The document ID to update' },
        data: { type: 'object', description: 'The fields to update' },
      },
      required: ['shelf', 'id', 'data'],
    },
  },

  // ── Search across shelves ───────────────────────────────────
  {
    name: 'shelves.search',
    description: 'Search across multiple shelves for documents matching a text query. Returns matching document IDs with context snippets. Use this to find relevant existing Plugs, workflows, projects, or assets before building something new.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text query to search for across shelf documents' },
        shelves: {
          type: 'array',
          description: 'Optional list of specific shelves to search. Defaults to all shelves.',
          items: { type: 'string' },
        },
      },
      required: ['query'],
    },
  },

  // ── LUC estimation ──────────────────────────────────────────
  {
    name: 'luc.estimate',
    description: 'Get a LUC (Ledger Usage Calculator) cost estimate for a described project scope. Returns time bands, cost bands, model mix, and token estimates.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'string', description: 'Description of the project scope and requirements' },
        models: {
          type: 'array',
          description: 'Optional model IDs to include in estimate. Defaults to Vertex AI standard mix.',
          items: { type: 'string' },
        },
      },
      required: ['scope'],
    },
  },

  // ── LUC project creation ────────────────────────────────────
  {
    name: 'luc.create_project',
    description: 'Create a new LUC project record in the database. This wraps a project description as a priced LUC record with scope, time bands, cost bands, and model mix.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'The parent project ID to link this LUC record to' },
        userId: { type: 'string', description: 'The user who owns this project' },
        scope: { type: 'string', description: 'Scope description (e.g., "Build + Deploy Webapp")' },
        requirements: { type: 'string', description: 'Detailed requirements text' },
      },
      required: ['projectId', 'userId', 'scope', 'requirements'],
    },
  },

  // ── LUC project retrieval ───────────────────────────────────
  {
    name: 'luc.get_project',
    description: 'Get a LUC project record by ID, including status, costs, time bands, and linked runs/assets.',
    inputSchema: {
      type: 'object',
      properties: {
        lucProjectId: { type: 'string', description: 'The LUC project ID to retrieve' },
      },
      required: ['lucProjectId'],
    },
  },
];

/**
 * All MCP tool definitions for the A.I.M.S. backend.
 * Combine with existing tools from mcp-tools/definitions.ts
 */
export const allShelfTools = shelfMCPTools;
