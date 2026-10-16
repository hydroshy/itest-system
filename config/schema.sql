-- ==============================================================================
-- UNIVERSAL IOT PLATFORM - CORE MICRO-KERNEL DATABASE SCHEMA (POSTGRESQL)
-- ==============================================================================
-- File: config/schema.sql
-- Description: Minimal, production-grade schema for Core Micro-kernel:
--              RBAC (Users, Roles, Permissions), Plugin Subsystem, Audit Logs,
--              and Unified Core Device Registry.
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Permission Table
CREATE TABLE IF NOT EXISTS "permission" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "description" VARCHAR(255),
  "module" VARCHAR(100) NOT NULL DEFAULT 'system',
  "action" VARCHAR(100) NOT NULL DEFAULT 'read',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 3. Roles Table
CREATE TABLE IF NOT EXISTS "roles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(100) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 4. Role - Permissions Join Table
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" UUID NOT NULL REFERENCES "permission"("id") ON DELETE CASCADE,
  CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id")
);

-- 5. Users Table
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE,
  "role_id" UUID REFERENCES "roles"("id") ON DELETE SET NULL,
  "fullName" VARCHAR(255),
  "phone" VARCHAR(50),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 6. Core Plugins Table
CREATE TABLE IF NOT EXISTS "core_plugins" (
  "id" VARCHAR(128) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "version" VARCHAR(64) NOT NULL,
  "type" VARCHAR(64) NOT NULL,
  "schemaName" VARCHAR(128) DEFAULT 'public',
  "status" VARCHAR(32) DEFAULT 'ACTIVE',
  "description" TEXT,
  "author" VARCHAR(128),
  "license" VARCHAR(64),
  "repositoryUrl" VARCHAR(512),
  "bundleUrl" VARCHAR(512),
  "bundleType" VARCHAR(32) DEFAULT 'ESM',
  "manifest" JSONB DEFAULT '{}',
  "extensionSlots" JSONB DEFAULT '[]',
  "permissions" JSONB DEFAULT '[]',
  "dependencies" JSONB DEFAULT '{}',
  "config" JSONB DEFAULT '{}',
  "sriHash" VARCHAR(128),
  "installedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "isSystem" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "idx_core_plugins_type" ON "core_plugins"("type");
CREATE INDEX IF NOT EXISTS "idx_core_plugins_status" ON "core_plugins"("status");

-- 7. Plugin Audit Logs Table
CREATE TABLE IF NOT EXISTS "plugin_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pluginId" VARCHAR(128) NOT NULL,
  "action" VARCHAR(64) NOT NULL,
  "userId" VARCHAR(128),
  "details" JSONB,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_plugin_audit_logs_pluginId" ON "plugin_audit_logs"("pluginId");
CREATE INDEX IF NOT EXISTS "idx_plugin_audit_logs_action" ON "plugin_audit_logs"("action");

-- 8. Unified Devices Table (Core Registry)
CREATE TABLE IF NOT EXISTS "unified_devices" (
  "id" VARCHAR(64) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(64) NOT NULL,
  "protocol" VARCHAR(64) NOT NULL,
  "plugin_id" VARCHAR(128),
  "config" JSONB DEFAULT '{}',
  "status" VARCHAR(32) DEFAULT 'OFFLINE',
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_unified_devices_protocol" ON "unified_devices"("protocol");
CREATE INDEX IF NOT EXISTS "idx_unified_devices_plugin_id" ON "unified_devices"("plugin_id");
