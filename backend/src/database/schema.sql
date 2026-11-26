-- Levitate3D Platform Database Schema
-- Includes PostgreSQL WORM Immutable Audit Ledger with UPDATE/DELETE Blocking Triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER', -- 'CUSTOMER', 'ADMIN', 'SUPPLIER'
    full_name VARCHAR(255),
    phone VARCHAR(50),
    device_token VARCHAR(255), -- Device-bound token for Supplier Windows App
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GENERATIONS TABLE (Tripo3D generation requests and cached models)
CREATE TABLE IF NOT EXISTS generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    prompt_type VARCHAR(50) NOT NULL, -- 'TEXT', 'IMAGE', 'SKETCH'
    prompt_text TEXT,
    input_image_url TEXT,
    tripo_task_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'
    progress INT DEFAULT 0,
    model_glb_url TEXT,
    model_thumbnail_url TEXT,
    model_sha256 VARCHAR(64),
    api_cost NUMERIC(10, 4) DEFAULT 0.20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
    
    -- Customization specs
    base_option VARCHAR(100) NOT NULL DEFAULT 'MAGNETIC_LEVITATING_BASE',
    internal_led_lighting BOOLEAN NOT NULL DEFAULT FALSE,
    size VARCHAR(50) NOT NULL DEFAULT 'STANDARD', -- 'STANDARD' (12cm), 'LARGE' (18cm)
    finish VARCHAR(50) NOT NULL DEFAULT 'MATTE_WHITE', -- 'MATTE_WHITE', 'TRANSLUCENT_GLOW', 'FULL_COLOR'
    designer_notes TEXT,
    reference_image_url TEXT,
    
    -- Pricing and Financials (Never exposed to Supplier)
    currency VARCHAR(10) DEFAULT 'USD',
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 149.00,
    internal_led_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    finish_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shipping_price NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 164.00,
    cogs_amount NUMERIC(10, 2) NOT NULL DEFAULT 48.00,
    supplier_payout NUMERIC(10, 2) NOT NULL DEFAULT 55.00,
    tripo_api_cost NUMERIC(10, 4) NOT NULL DEFAULT 0.20,
    
    -- Status pipeline
    status VARCHAR(50) NOT NULL DEFAULT 'ORDER_PLACED', 
    -- 'ORDER_PLACED', 'DESIGNER_REFINING', 'REFINED_MODEL_READY', 'PRINTING_LED_ASSEMBLY', 'QUALITY_CHECK_SHIPPED', 'DELIVERED', 'CANCELLED'
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'REFUNDED'
    stripe_payment_intent_id VARCHAR(255),
    
    -- Shipping and Carrier (Exposed to supplier strictly as anonymized shipping label / recipient city)
    shipping_address JSONB,
    carrier VARCHAR(50),
    tracking_number VARCHAR(100),
    tracking_url TEXT,
    
    -- Supplier Workflow
    assigned_supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    supplier_stage VARCHAR(50) DEFAULT 'UNASSIGNED', -- 'UNASSIGNED', 'NEEDS_REFINEMENT', 'REFINEMENT_COMPLETE', 'PRINTING_WIRING', 'PACKAGED_SHIPPED'
    refined_model_url TEXT,
    refined_model_sha256 VARCHAR(64),
    refined_notes TEXT,
    refined_at TIMESTAMP WITH TIME ZONE,
    
    -- Social Share Kit
    share_token VARCHAR(100) UNIQUE,
    turntable_video_url TEXT,
    showcase_image_url TEXT,
    customer_review TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SCOPED JOB CHAT MESSAGES (Supplier can only communicate on assigned Job_ID without seeing customer contact details)
CREATE TABLE IF NOT EXISTS job_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_role VARCHAR(50) NOT NULL, -- 'SUPPLIER', 'ADMIN', 'CUSTOMER'
    message_text TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- WORM (WRITE-ONCE-READ-MANY) LEGAL & TRANSACTION AUDIT LEDGER
-- Cryptographic SHA-256 Hash Chain + PostgreSQL Immutable Table Trigger
-- ====================================================================

CREATE TABLE IF NOT EXISTS worm_audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_num BIGSERIAL UNIQUE NOT NULL,
    timestamp_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_role VARCHAR(50) NOT NULL, -- 'CUSTOMER', 'ADMIN', 'SUPPLIER', 'SYSTEM'
    actor_id VARCHAR(100),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    -- 'USER_INPUT_UPLOADED', 'TRIPO3D_MODEL_GENERATED', 'CUSTOMIZATION_SUBMITTED',
    -- 'PAYMENT_AUTHORIZED_AND_CAPTURED', 'JOB_DISPATCHED_TO_SUPPLIER',
    -- 'SUPPLIER_MODEL_UPLOADED', 'CUSTOMER_APPROVAL_RECORDED', 'PRODUCTION_STAGE_UPDATED',
    -- 'SHIPMENT_DISPATCHED', 'DELIVERY_CONFIRMED', 'ADMIN_OVERRIDE_LOGGED'
    payload_json JSONB NOT NULL,
    artifact_sha256 VARCHAR(64),
    previous_event_hash VARCHAR(64),
    event_hash VARCHAR(64) NOT NULL
);

-- INDEXES for fast retrieval and verification
CREATE INDEX IF NOT EXISTS idx_worm_order_id ON worm_audit_events(order_id);
CREATE INDEX IF NOT EXISTS idx_worm_seq_num ON worm_audit_events(sequence_num);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(assigned_supplier_id);

-- WORM TRIGGER: FORBID ANY UPDATE OR DELETE OPERATIONS
CREATE OR REPLACE FUNCTION prevent_worm_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'WORM_VIOLATION: Records in worm_audit_events are immutable and cannot be updated or deleted. Legal Chain-of-Custody Protected.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_worm_audit_mutation ON worm_audit_events;
CREATE TRIGGER trg_prevent_worm_audit_mutation
BEFORE UPDATE OR DELETE ON worm_audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_worm_audit_mutation();
