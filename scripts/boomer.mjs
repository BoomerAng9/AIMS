
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
  }
};

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

async function main() {
    console.log(`\n🍌 BOOMER_ANG CLI v1.0`);
    console.log(`Target: ${N8N_HOST}\n`);

    if (!N8N_API_KEY) {
        console.warn("⚠️  WARNING: N8N_API_KEY not found in infra/.env. Operations will be simulated.\n");
    }

    switch(COMMAND) {
        case 'list-templates':
            console.log("Available Boomer_Ang Templates:");
            Object.keys(templates).forEach(t => console.log(` - ${t}`));
            break;

        case 'check':
            console.log(`Checking n8n connectivity at ${N8N_HOST}...`);
            const health = await checkN8nConnectivity();
            if (health.ok) {
                console.log(`✅ n8n is reachable (HTTP ${health.status})`);
                if (N8N_API_KEY) {
                    try {
                        const res = await fetch(`${N8N_HOST}/api/v1/workflows`, {
                            headers: { 'X-N8N-API-KEY': N8N_API_KEY }
                        });
                        if (res.ok) {
                            const data = await res.json();
                            console.log(`✅ API key valid. ${data.data?.length ?? 0} workflows found.`);
                        } else if (res.status === 401) {
                            console.error("❌ API key rejected (401). Generate a new key in n8n > Settings > API.");
                        } else {
                            console.error(`❌ API returned HTTP ${res.status}`);
                        }
                    } catch (e) {
                        console.error("❌ API check failed:", e.message);
                    }
                }
            } else {
                console.error(`❌ Cannot reach n8n: ${health.error}`);
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
                 process.exit(1);
            }

            console.log(`Deploying '${template.name}' to n8n...`);
            if (N8N_API_KEY) {
                const connectivity = await checkN8nConnectivity();
                if (!connectivity.ok) {
                    console.error(`❌ n8n is not reachable: ${connectivity.error}`);
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
                            console.error("❌ API key rejected. Generate a new key in n8n > Settings > API.");
                        } else {
                            console.error(`❌ n8n returned HTTP ${res.status}: ${body}`);
                        }
                        process.exit(1);
                    }
                    const data = await res.json();
                    console.log("✅ Success! Workflow ID:", data.id);
                } catch (e) {
                    if (e.name === 'AbortError') {
                        console.error("❌ Deploy request timed out (15s).");
                    } else {
                        console.error("❌ Failed to deploy:", e.message);
                    }
                    process.exit(1);
                }
            } else {
                console.log("✅ [SIMULATION] Workflow created successfully (ID: mockup-12345).");
                console.log("   Action: Boomer_Ang agent initialized.");
            }
            break;

        default:
            console.log("Usage:");
            console.log("  node boomer.mjs list-templates");
            console.log("  node boomer.mjs create-action <template_name>");
            console.log("  node boomer.mjs check");
            break;
    }
}

main();
