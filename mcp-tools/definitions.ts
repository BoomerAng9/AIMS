/**
 * Model Context Protocol (MCP) Tool Definitions
 * These definitions describe the interfaces for internal tools exposed to Agents.
 *
 * Categories:
 *   - ByteRover (Memory / Context)
 *   - VL-JEPA (Vision & Hallucination Check)
 *   - Execution Tools
 *   - Shelving System (Chicken Hawk / Lil_Hawk shelf walking)
 *   - LUC (Pricing & Effort Oracle)
 */

export const mcpTools = [
  // ----------------------------------------------------------------------
  // ByteRover (Memory / Context)
  // ----------------------------------------------------------------------
  {
    name: 'byterover.retrieve_context',
    description: 'Retrieve project context and patterns based on a semantic query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Semantic search query' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['query']
    }
  },
  {
    name: 'byterover.store_context',
    description: 'Persist new patterns or project knowledge.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        metadata: { type: 'object' }
      },
      required: ['content']
    }
  },
  
  // ----------------------------------------------------------------------
  // VL-JEPA (Vision & Hallucination Check)
  // ----------------------------------------------------------------------
  {
    name: 'vljepa.embed',
    description: 'Generate semantic embedding for text or image.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        imageUrl: { type: 'string' }
      }
    }
  },
  {
    name: 'vljepa.verify_semantic_consistency',
    description: 'Compare intent against output to detect hallucinations.',
    inputSchema: {
      type: 'object',
      properties: {
        originalIntentEmbedding: { type: 'array', items: { type: 'number' } },
        outputContent: { type: 'string' }
      },
      required: ['originalIntentEmbedding', 'outputContent']
    }
  },

  // ----------------------------------------------------------------------
  // Execution Tools
  // ----------------------------------------------------------------------
  {
    name: 'python.run',
    description: 'Execute isolated Python script (constrained env).',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' }
      },
      required: ['code']
    }
  },
  {
    name: 'n8n.trigger_workflow',
    description: 'Trigger an automation workflow in n8n.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
        payload: { type: 'object' }
      },
      required: ['workflowId']
    }
  },

  // ----------------------------------------------------------------------
  // Shelving System (Chicken Hawk / Lil_Hawk Shelf Walking)
  // ----------------------------------------------------------------------
  {
    name: 'shelves.list_shelves',
    description: 'List all available data shelves in the A.I.M.S. backend with document counts.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'shelves.read',
    description: 'Read a single document by ID from a specific shelf.',
    inputSchema: {
      type: 'object',
      properties: {
        shelf: { type: 'string', description: 'Collection name: projects, luc_projects, plugs, boomer_angs, workflows, runs, logs, assets' },
        id: { type: 'string', description: 'Document ID' }
      },
      required: ['shelf', 'id']
    }
  },
  {
    name: 'shelves.list',
    description: 'List or query documents on a shelf with optional filters.',
    inputSchema: {
      type: 'object',
      properties: {
        shelf: { type: 'string' },
        filters: { type: 'array', items: { type: 'object' } },
        orderBy: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['shelf']
    }
  },
  {
    name: 'shelves.create',
    description: 'Create a new document on a shelf.',
    inputSchema: {
      type: 'object',
      properties: {
        shelf: { type: 'string' },
        data: { type: 'object' }
      },
      required: ['shelf', 'data']
    }
  },
  {
    name: 'shelves.update',
    description: 'Update an existing document on a shelf.',
    inputSchema: {
      type: 'object',
      properties: {
        shelf: { type: 'string' },
        id: { type: 'string' },
        data: { type: 'object' }
      },
      required: ['shelf', 'id', 'data']
    }
  },
  {
    name: 'shelves.search',
    description: 'Search across multiple shelves for documents matching a text query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        shelves: { type: 'array', items: { type: 'string' } }
      },
      required: ['query']
    }
  },

  // ----------------------------------------------------------------------
  // LUC (Pricing & Effort Oracle)
  // ----------------------------------------------------------------------
  {
    name: 'luc.estimate',
    description: 'Get a LUC cost estimate for a described project scope.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'string', description: 'Project scope description' },
        models: { type: 'array', items: { type: 'string' } }
      },
      required: ['scope']
    }
  },
  {
    name: 'luc.create_project',
    description: 'Create a new LUC project record wrapping a project as a priced LUC box.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        userId: { type: 'string' },
        scope: { type: 'string' },
        requirements: { type: 'string' }
      },
      required: ['projectId', 'userId', 'scope', 'requirements']
    }
  },
  {
    name: 'luc.get_project',
    description: 'Get a LUC project record by ID with status, costs, and linked data.',
    inputSchema: {
      type: 'object',
      properties: {
        lucProjectId: { type: 'string' }
      },
      required: ['lucProjectId']
    }
  }
];
