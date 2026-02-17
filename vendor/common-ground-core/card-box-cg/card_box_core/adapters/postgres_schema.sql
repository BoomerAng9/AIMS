-- Schema for cards table
CREATE TABLE IF NOT EXISTS cards (
    card_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    content JSONB, -- Using JSONB for better performance and indexing
    tool_calls JSONB,
    tool_call_id TEXT,
    ttl_seconds INTEGER,
    expires_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT current_timestamp
);

-- Index for faster garbage collection queries
CREATE INDEX IF NOT EXISTS idx_cards_expires_at ON cards(expires_at);
CREATE INDEX IF NOT EXISTS idx_cards_tenant_id ON cards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cards_tool_call_id ON cards USING hash(tool_call_id);


CREATE INDEX IF NOT EXISTS idx_cards_meta_agent_turn_type ON cards ((metadata->>'agent_turn_id'), (metadata->>'step_id'), (metadata->>'type'));
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cards_tool_result_call
    ON cards (tenant_id, md5(tool_call_id))
    WHERE tool_call_id IS NOT NULL AND (metadata->>'type') = 'tool.result';


-- Schema for card_operation_logs table
CREATE TABLE IF NOT EXISTS card_operation_logs (
    log_id BIGSERIAL PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    strategy_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT current_timestamp
);

-- Indexes for faster lookups on logs
CREATE INDEX IF NOT EXISTS idx_logs_tenant_id ON card_operation_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logs_trace_id ON card_operation_logs(trace_id);

-- New table to explicitly map card transformations for efficient querying.
CREATE TABLE IF NOT EXISTS card_transformations (
    source_card_id TEXT NOT NULL,
    new_card_id TEXT NOT NULL,
    operation_log_id BIGINT NOT NULL,
    FOREIGN KEY (operation_log_id) REFERENCES card_operation_logs(log_id),
    PRIMARY KEY (source_card_id, new_card_id, operation_log_id)
);

-- Indexes for fast lookups of parent/child relationships
CREATE INDEX IF NOT EXISTS idx_transformations_source_card ON card_transformations(source_card_id);
CREATE INDEX IF NOT EXISTS idx_transformations_new_card ON card_transformations(new_card_id);


CREATE TABLE IF NOT EXISTS card_boxes (
    box_id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    card_ids JSONB, -- Array of strings stored as JSONB
    parent_ids JSONB,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp
);

-- Index for faster lookups on boxes
CREATE INDEX IF NOT EXISTS idx_boxes_tenant_id ON card_boxes(tenant_id, box_id);


-- Schema for card_box_history_logs table
CREATE TABLE IF NOT EXISTS card_box_history_logs (
    box_log_id BIGSERIAL PRIMARY KEY,
    trace_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    box_id UUID,
    strategy_name TEXT NOT NULL,
    strategy_input TEXT,
    input_box_snapshot JSONB,
    output_box_snapshot JSONB,
    timestamp TIMESTAMPTZ DEFAULT current_timestamp
);

-- Indexes for faster lookups on box history logs
CREATE INDEX IF NOT EXISTS idx_box_logs_trace_id ON card_box_history_logs(trace_id);


-- Schema for sync_queue table
-- This table manages asynchronous tasks for syncing data with external systems.
CREATE TABLE IF NOT EXISTS sync_queue (
    task_id BIGSERIAL PRIMARY KEY,
    card_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- e.g., 'index', 'delete'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    attempts INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT current_timestamp,
    process_after TIMESTAMPTZ DEFAULT current_timestamp
);

-- Index for worker to efficiently query for pending tasks
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(status, process_after);


-- Schema for api_logs table
CREATE TABLE IF NOT EXISTS api_logs (
    api_log_id BIGSERIAL PRIMARY KEY,
    trace_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    api_type TEXT,
    endpoint TEXT,
    request_data TEXT,
    response_data TEXT,
    timestamp TIMESTAMPTZ DEFAULT current_timestamp
);

-- Indexes for faster lookups on api logs
CREATE INDEX IF NOT EXISTS idx_api_logs_trace_id ON api_logs(trace_id);
