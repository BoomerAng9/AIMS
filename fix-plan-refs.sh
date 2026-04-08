#!/bin/bash
# Fix all old PLAN_IDS references after branch merge

echo "=== Fixing PLAN_IDS references ==="

# Fix luc-storage.ts
FILE="/root/aims/frontend/lib/db/luc-storage.ts"
echo "Fixing $FILE..."
sed -i 's/PLAN_IDS\.FREE/PLAN_IDS.P2P/g' "$FILE"
sed -i 's/PLAN_IDS\.STARTER/PLAN_IDS.COFFEE/g' "$FILE"
echo "  FREE->P2P, STARTER->COFFEE done"

# Add DATA_ENTRY quota block after COFFEE block if not present
if ! grep -q 'PLAN_IDS.DATA_ENTRY' "$FILE"; then
  echo "  Adding DATA_ENTRY quota block..."
  # We'll add it via python for complex multi-line insert
  python3 << 'PYEOF'
import re

with open("/root/aims/frontend/lib/db/luc-storage.ts", "r") as f:
    content = f.read()

# Find the COFFEE block and add DATA_ENTRY after it
# Pattern: find the closing of COFFEE block (  },) and add DATA_ENTRY block after it
coffee_pattern = r'(\[PLAN_IDS\.COFFEE\]: \{[^}]+\},)'
match = re.search(coffee_pattern, content, re.DOTALL)
if match:
    coffee_block = match.group(1)
    data_entry_block = """  [PLAN_IDS.DATA_ENTRY]: {
    [SERVICE_KEYS.LLM_TOKENS_IN]: 250000,
    [SERVICE_KEYS.LLM_TOKENS_OUT]: 125000,
    [SERVICE_KEYS.N8N_EXECUTIONS]: 1250,
    [SERVICE_KEYS.NODE_RUNTIME_SECONDS]: 7500,
    [SERVICE_KEYS.SWARM_CYCLES]: 250,
    [SERVICE_KEYS.BRAVE_QUERIES]: 2500,
    [SERVICE_KEYS.VOICE_CHARS]: 250000,
    [SERVICE_KEYS.STT_MINUTES]: 250,
    [SERVICE_KEYS.CONTAINER_HOURS]: 25,
    [SERVICE_KEYS.STORAGE_GB_MONTH]: 25,
    [SERVICE_KEYS.BANDWIDTH_GB]: 25,
    [SERVICE_KEYS.BOOMER_ANG_INVOCATIONS]: 500,
    [SERVICE_KEYS.AGENT_EXECUTIONS]: 1250,
    [SERVICE_KEYS.DEPLOY_OPERATIONS]: 125,
    [SERVICE_KEYS.API_CALLS]: 12500,
  },"""
    content = content.replace(coffee_block, coffee_block + "\n" + data_entry_block)
    with open("/root/aims/frontend/lib/db/luc-storage.ts", "w") as f:
        f.write(content)
    print("  DATA_ENTRY block added successfully")
else:
    print("  WARNING: Could not find COFFEE block to insert DATA_ENTRY after")
PYEOF
fi

# Verify all files
echo ""
echo "=== Verification ==="
echo "Remaining FREE refs:"
grep -rn 'PLAN_IDS\.FREE' /root/aims/aims-tools/luc/ /root/aims/frontend/lib/ 2>/dev/null || echo "  None found (good!)"
echo "Remaining STARTER refs:"
grep -rn 'PLAN_IDS\.STARTER' /root/aims/aims-tools/luc/ /root/aims/frontend/lib/ 2>/dev/null || echo "  None found (good!)"
echo ""
echo "Current plan refs in luc-storage.ts:"
grep -n 'PLAN_IDS\.' /root/aims/frontend/lib/db/luc-storage.ts
echo ""
echo "Current plan refs in luc.schemas.ts:"
grep -n 'PLAN_IDS\.' /root/aims/aims-tools/luc/luc.schemas.ts
echo ""
echo "=== Fix complete ==="
