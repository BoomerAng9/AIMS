
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars from infra/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../infra/.env');
dotenv.config({ path: envPath });

const N8N_HOST = process.env.N8N_HOST || 'http://76.13.96.107:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

const COMMAND = process.argv[2];
const WORKFLOW_NAME = process.argv[3];
const EXTRA_ARG = process.argv[4];

// ---------------------------------------------------------------------------
// Load PMO routing workflow from JSON file
// ---------------------------------------------------------------------------
let pmoRoutingWorkflow = null;
const pmoWorkflowPath = path.resolve(__dirname, '../n8n/workflows/pmo-routing-workflow.json');
try {
    pmoRoutingWorkflow = JSON.parse(fs.readFileSync(pmoWorkflowPath, 'utf-8'));
} catch {
    // Will be null if file not found — template will show as unavailable
}

const templates = {
  "recruiter": {
    "name": "Boomer_Ang_Recruiter",
    "nodes": [
      {
        "parameters": {},
        "name": "Start",
        "type": "n8n-nodes-base.start",
        "typeVersion": 1,
        "position": [250, 300]
      },
      {
         "parameters": {
             "url": "https://api.linkedin.com/v2/me",
             "authentication": "genericCredentialType",
             "genericAuthType": "httpHeaderAuth",
             "headerAuth": { "id": "LINKEDIN_AUTH_ID" }
         },
         "name": "LinkedIn Scraper",
         "type": "n8n-nodes-base.httpRequest",
         "typeVersion": 4.1,
         "position": [450, 300]
      }
    ],
    "connections": {
      "Start": { "main": [[{ "node": "LinkedIn Scraper", "type": "main", "index": 0 }]] }
    }
  },
  "marketer": {
    "name": "Boomer_Ang_Marketer",
    "nodes": [
       { "name": "Start", "type": "n8n-nodes-base.start", "position": [250, 300] },
       { "name": "Twitter Post", "type": "n8n-nodes-base.twitter", "position": [500, 300] }
    ],
    "connections": { "Start": { "main": [[{ "node": "Twitter Post", "type": "main", "index": 0 }]] } }
  },
  "pmo-router": pmoRoutingWorkflow || {
    "name": "AIMS PMO Routing — Chain of Command Pipeline",
    "nodes": [],
    "connections": {},
    "_note": "PMO workflow JSON not loaded — ensure n8n/workflows/pmo-routing-workflow.json exists"
  }
};

// ---------------------------------------------------------------------------
// PMO Keyword Classifier (mirrors backend pmo-router.ts)
// ---------------------------------------------------------------------------

const PMO_OFFICES = {
  'tech-office':       { director: 'Boomer_CTO', keywords: ['deploy', 'infrastructure', 'docker', 'build', 'server', 'api', 'backend', 'database', 'vps'] },
  'finance-office':    { director: 'Boomer_CFO', keywords: ['budget', 'cost', 'token', 'pricing', 'revenue', 'roi', 'billing'] },
  'ops-office':        { director: 'Boomer_COO', keywords: ['workflow', 'automate', 'schedule', 'monitor', 'health', 'scaling', 'ops'] },
  'marketing-office':  { director: 'Boomer_CMO', keywords: ['campaign', 'marketing', 'social', 'seo', 'brand', 'outreach'] },
  'design-office':     { director: 'Boomer_CDO', keywords: ['video', 'design', 'ui', 'ux', 'graphic', 'thumbnail', 'animation'] },
  'publishing-office': { director: 'Boomer_CPO', keywords: ['publish', 'post', 'article', 'blog', 'newsletter', 'editorial'] },
};

function classifyMessage(message) {
    const lower = message.toLowerCase();
    let bestOffice = 'ops-office';
    let bestScore = 0;
    let hits = [];
    for (const [officeId, config] of Object.entries(PMO_OFFICES)) {
        let score = 0;
        const kws = [];
        for (const kw of config.keywords) {
            if (lower.includes(kw)) { score++; kws.push(kw); }
        }
        if (score > bestScore) { bestScore = score; bestOffice = officeId; hits = kws; }
    }
    return { office: bestOffice, director: PMO_OFFICES[bestOffice].director, keywords: hits, confidence: Math.min(bestScore / 5, 1.0) };
}

// ---------------------------------------------------------------------------
// n8n Connectivity
// ---------------------------------------------------------------------------

async function checkN8nConnectivity() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${N8N_HOST}/healthz`, { signal: controller.signal });
        clearTimeout(timeout);
        return { ok: res.ok, status: res.status };
    } catch (e) {
        if (e.name === 'AbortError') {
            return { ok: false, error: 'Connection timed out (5s)' };
        }
        return { ok: false, error: e.message };
    }
}

// ---------------------------------------------------------------------------
// PMO Trigger — send task to n8n PMO routing webhook
// ---------------------------------------------------------------------------

async function triggerPmoWorkflow(message, userId) {
    const webhookUrl = `${N8N_HOST}/webhook/pmo-intake`;
    const classification = classifyMessage(message);

    console.log(`\n--- PMO Classification ---`);
    console.log(`  Office:     ${classification.office}`);
    console.log(`  Director:   ${classification.director}`);
    console.log(`  Keywords:   ${classification.keywords.join(', ') || 'none'}`);
    console.log(`  Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
    console.log(`  Chain:      User -> ACHEEVY -> ${classification.director} -> Chicken Hawk -> Squad -> Lil_Hawks -> Receipt -> ACHEEVY -> User`);
    console.log('');

    const payload = { userId: userId || 'cli-user', message, requestId: `CLI-${Date.now().toString(36).toUpperCase()}` };

    console.log(`Triggering PMO workflow at ${webhookUrl}...`);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) {
            const body = await res.text();
            console.error(`n8n returned HTTP ${res.status}: ${body}`);
            return;
        }

        const data = await res.json();
        console.log('\n--- Pipeline Result ---');
        if (data.summary) console.log(data.summary);
        else console.log(JSON.stringify(data, null, 2));
        if (data.receipt) {
            console.log(`\nReceipt: ${data.receipt.receiptId} | Status: ${data.receipt.shiftStatus}`);
        }
    } catch (e) {
        if (e.name === 'AbortError') {
            console.error('PMO trigger timed out (30s). Is the n8n workflow active?');
        } else {
            console.error(`PMO trigger failed: ${e.message}`);
            console.error('Ensure the PMO routing workflow is deployed and active on n8n.');
            console.error('Deploy it with: node boomer.mjs create-action pmo-router');
        }
    }
}

// ---------------------------------------------------------------------------
// Main CLI
// ---------------------------------------------------------------------------

async function main() {
    console.log(`\nBOOMER_ANG CLI v2.0 — PMO Chain of Command`);
    console.log(`Target: ${N8N_HOST}`);
    console.log(`Chain: User -> ACHEEVY -> Boomer_Ang -> Chicken Hawk -> Squad -> Lil_Hawks -> Receipt -> ACHEEVY -> User\n`);

    if (!N8N_API_KEY) {
        console.warn("WARNING: N8N_API_KEY not found in infra/.env. Deploy operations will be simulated.\n");
    }

    switch(COMMAND) {
        case 'list-templates':
            console.log("Available Boomer_Ang Templates:");
            for (const [name, tpl] of Object.entries(templates)) {
                const nodeCount = tpl.nodes ? tpl.nodes.length : 0;
                console.log(`  ${name.padEnd(15)} ${tpl.name} (${nodeCount} nodes)`);
            }
            break;

        case 'check':
            console.log(`Checking n8n connectivity at ${N8N_HOST}...`);
            const health = await checkN8nConnectivity();
            if (health.ok) {
                console.log(`n8n is reachable (HTTP ${health.status})`);
                if (N8N_API_KEY) {
                    try {
                        const res = await fetch(`${N8N_HOST}/api/v1/workflows`, {
                            headers: { 'X-N8N-API-KEY': N8N_API_KEY }
                        });
                        if (res.ok) {
                            const data = await res.json();
                            const workflows = data.data || [];
                            console.log(`API key valid. ${workflows.length} workflows found.`);
                            const pmo = workflows.find(w => w.name && w.name.includes('PMO Routing'));
                            if (pmo) {
                                console.log(`PMO Routing workflow found: ID=${pmo.id}, Active=${pmo.active}`);
                            } else {
                                console.log('PMO Routing workflow not yet deployed. Run: node boomer.mjs create-action pmo-router');
                            }
                        } else if (res.status === 401) {
                            console.error("API key rejected (401). Generate a new key in n8n > Settings > API.");
                        } else {
                            console.error(`API returned HTTP ${res.status}`);
                        }
                    } catch (e) {
                        console.error("API check failed:", e.message);
                    }
                }
            } else {
                console.error(`Cannot reach n8n: ${health.error}`);
                console.error("\nTroubleshooting:");
                console.error("  1. SSH into VPS and check: docker ps | grep n8n");
                console.error("  2. Verify port 5678 is open: sudo ufw allow 5678");
                console.error("  3. Check n8n logs: docker logs n8n");
            }
            break;

        case 'create-action':
            if (!WORKFLOW_NAME) {
                console.error("Error: Missing workflow name. Usage: node boomer.mjs create-action <template_name>");
                process.exit(1);
            }
            const template = templates[WORKFLOW_NAME.toLowerCase()];
            if (!template) {
                 console.error(`Error: Template '${WORKFLOW_NAME}' not found.`);
                 console.error(`Available: ${Object.keys(templates).join(', ')}`);
                 process.exit(1);
            }

            console.log(`Deploying '${template.name}' to n8n...`);
            if (N8N_API_KEY) {
                const connectivity = await checkN8nConnectivity();
                if (!connectivity.ok) {
                    console.error(`n8n is not reachable: ${connectivity.error}`);
                    console.error("   Run 'node boomer.mjs check' for troubleshooting steps.");
                    process.exit(1);
                }
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 15000);
                    const res = await fetch(`${N8N_HOST}/api/v1/workflows`, {
                        method: 'POST',
                        headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Content-Type': 'application/json' },
                        body: JSON.stringify(template),
                        signal: controller.signal
                    });
                    clearTimeout(timeout);
                    if (!res.ok) {
                        const body = await res.text();
                        if (res.status === 401) {
                            console.error("API key rejected. Generate a new key in n8n > Settings > API.");
                        } else {
                            console.error(`n8n returned HTTP ${res.status}: ${body}`);
                        }
                        process.exit(1);
                    }
                    const data = await res.json();
                    console.log("Success! Workflow ID:", data.id);
                    if (WORKFLOW_NAME.toLowerCase() === 'pmo-router') {
                        console.log("\nPMO Routing workflow deployed. Next steps:");
                        console.log("  1. Activate the workflow in n8n UI or via API");
                        console.log("  2. Test with: node boomer.mjs pmo-trigger 'deploy the api server'");
                        console.log("  3. The webhook endpoint will be: POST /webhook/pmo-intake");
                    }
                } catch (e) {
                    if (e.name === 'AbortError') {
                        console.error("Deploy request timed out (15s).");
                    } else {
                        console.error("Failed to deploy:", e.message);
                    }
                    process.exit(1);
                }
            } else {
                console.log("[SIMULATION] Workflow created successfully (ID: mockup-12345).");
                console.log("  Action: Boomer_Ang agent initialized.");
                if (WORKFLOW_NAME.toLowerCase() === 'pmo-router') {
                    console.log("\n  [SIMULATION] PMO Routing workflow ready.");
                    console.log("  Chain: Webhook -> ACHEEVY Classifier -> PMO Switch -> 6x Boomer Directors -> Chicken Hawk -> Squad -> Verification -> Receipt -> Response");
                    console.log("  Nodes: 14 | Connections: 13");
                }
            }
            break;

        case 'pmo-trigger': {
            const message = WORKFLOW_NAME; // message is the 3rd arg
            if (!message) {
                console.error("Error: Missing message. Usage: node boomer.mjs pmo-trigger '<task description>' [userId]");
                console.error("Example: node boomer.mjs pmo-trigger 'deploy the api to production'");
                process.exit(1);
            }
            await triggerPmoWorkflow(message, EXTRA_ARG);
            break;
        }

        case 'pmo-classify': {
            const msg = WORKFLOW_NAME;
            if (!msg) {
                console.error("Error: Missing message. Usage: node boomer.mjs pmo-classify '<task description>'");
                process.exit(1);
            }
            const result = classifyMessage(msg);
            console.log("PMO Classification:");
            console.log(`  Office:     ${result.office}`);
            console.log(`  Director:   ${result.director}`);
            console.log(`  Keywords:   ${result.keywords.join(', ') || 'none matched'}`);
            console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
            console.log(`  Chain:      User -> ACHEEVY -> ${result.director} -> Chicken Hawk -> Squad -> Lil_Hawks -> Receipt -> ACHEEVY -> User`);
            break;
        }

        case 'collab-demo': {
            const demoMsg = WORKFLOW_NAME;
            const demoUser = EXTRA_ARG || 'Boss';
            if (!demoMsg) {
                console.error("Error: Missing message. Usage: node boomer.mjs collab-demo '<task>' [userName]");
                console.error("Example: node boomer.mjs collab-demo 'build me a landing page' Boss");
                process.exit(1);
            }
            console.log(`\nRunning collaboration demo as ${demoUser}...\n`);
            const UEF_URL = process.env.UEF_URL || 'http://localhost:3001';
            const API_KEY = process.env.INTERNAL_API_KEY || '';
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);
                const res = await fetch(`${UEF_URL}/collaboration/demo`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
                    },
                    body: JSON.stringify({ userName: demoUser, message: demoMsg }),
                    signal: controller.signal,
                });
                clearTimeout(timeout);
                if (!res.ok) {
                    const body = await res.text();
                    console.error(`UEF returned HTTP ${res.status}: ${body}`);
                    process.exit(1);
                }
                const data = await res.json();
                // Print the collaboration feed
                console.log(`Session: ${data.session.id} | Status: ${data.session.status}`);
                console.log(`${'─'.repeat(60)}`);
                for (const entry of data.feed) {
                    const indent = '  '.repeat(entry.depth);
                    const bench = entry.speaker.bench ? ` [${entry.speaker.bench}]` : '';
                    const kunya = entry.speaker.kunya ? ` "${entry.speaker.kunya}"` : '';
                    if (entry.type === 'nugget') {
                        console.log(`${indent}💬 ${entry.speaker.name}${kunya}${bench}`);
                        console.log(`${indent}   "${entry.message}"`);
                    } else if (entry.type === 'handoff') {
                        console.log(`${indent}→ ${entry.speaker.name} [HANDOFF] ${entry.message}`);
                    } else if (entry.type === 'thinking') {
                        console.log(`${indent}💭 ${entry.speaker.name}: ${entry.message}`);
                    } else {
                        console.log(`${indent}${entry.speaker.name}${kunya}${bench} [${entry.type.toUpperCase()}] ${entry.message}`);
                    }
                }
                console.log(`${'─'.repeat(60)}`);
                console.log(`Stats: ${data.stats.totalEntries} entries | ${data.stats.agentsSeen.length} agents | ${data.stats.nuggetsDelivered} nuggets`);
                console.log(`Steps: ${data.stats.stepsCompleted} done, ${data.stats.stepsFailed} failed | ${data.stats.totalDurationMs}ms`);
            } catch (e) {
                if (e.name === 'AbortError') {
                    console.error("Request timed out (30s).");
                } else {
                    console.error("Collaboration demo failed:", e.message);
                    console.error("Make sure UEF Gateway is running (npm run dev in backend/uef-gateway).");
                }
                process.exit(1);
            }
            break;
        }

        default:
            console.log("Usage:");
            console.log("  node boomer.mjs list-templates          List available workflow templates");
            console.log("  node boomer.mjs create-action <name>    Deploy a workflow template to n8n");
            console.log("  node boomer.mjs check                   Check n8n connectivity and PMO workflow status");
            console.log("  node boomer.mjs pmo-trigger '<msg>'     Trigger PMO routing for a task via n8n webhook");
            console.log("  node boomer.mjs pmo-classify '<msg>'    Classify a message to see PMO routing (dry-run)");
            console.log("  node boomer.mjs collab-demo '<msg>'     Run a live collaboration demo with persona voices");
            console.log("");
            console.log("PMO Templates:");
            console.log("  pmo-router   Full chain-of-command workflow (14 nodes)");
            console.log("  recruiter    LinkedIn scraper for lead generation");
            console.log("  marketer     Twitter/X auto-posting agent");
            console.log("");
            console.log("Chain of Command:");
            console.log("  User -> ACHEEVY -> Boomer_Ang(CTO/CFO/COO/CMO/CDO/CPO/Betty-Ann/Astra) -> Chicken Hawk -> Squad -> Lil_Hawks -> Receipt -> ACHEEVY -> User");
            break;
    }
}

main();
