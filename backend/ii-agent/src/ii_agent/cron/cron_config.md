# Cron Job Configuration for Sandbox Timeout Extension

## Setup Instructions

### 1. Install the cron job to run every hour

Open your crontab editor:
```bash
crontab -e
```

Add the following line to run the job every hour:
```bash
# Extend sandbox timeouts every hour
0 * * * * /Users/khoa/work/code/ii/ii-agent/scripts/run_sandbox_timeout_extension.sh
```

### 2. Running with specific session IDs

You have three options to specify session IDs:

#### Option A: Command line argument
```bash
python -m src.ii_agent.cron.extend_sandbox_timeout --session-ids "session-1,session-2,session-3"
```

#### Option B: JSON file
```bash
python -m src.ii_agent.cron.extend_sandbox_timeout --session-ids-file src/ii_agent/cron/session_ids.json
```

#### Option C: No arguments (processes all active sessions)
```bash
python -m src.ii_agent.cron.extend_sandbox_timeout
```

### 3. Monitoring

Check the logs:
```bash
tail -f logs/cron/sandbox_timeout_extension.log
```

### 4. Testing

Test the cron job manually:
```bash
cd /Users/khoa/work/code/ii/ii-agent
./scripts/run_sandbox_timeout_extension.sh
```

## Configuration

- **Timeout Extension**: 2 hours (7200 seconds)
- **Batch Size**: 10 sessions processed concurrently
- **Log Location**: `logs/cron/sandbox_timeout_extension.log`

## Notes

- The job will extend the timeout by 2 hours for each session
- Sessions without sandbox IDs will be skipped
- Failed extensions are logged but don't stop the job
- The job processes sessions in batches to avoid overloading the system