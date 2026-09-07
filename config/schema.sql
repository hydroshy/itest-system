-- ==============================================================================
-- DAVITEQ LoRaWAN PLATFORM - DATABASE SCHEMA SPECIFICATION (POSTGRESQL)
-- ==============================================================================
-- File: config/schema.sql
-- Description: Complete, production-grade schema for Core Governance, RBAC,
--              LoRaWAN Network Servers, Device Fleet, Decoders, Webhooks,
--              and Telemetry Ingestion.
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
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "fullName" VARCHAR(255),
  "userType" VARCHAR(50) NOT NULL DEFAULT 'USER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 6. User - Role Join Table
CREATE TABLE IF NOT EXISTS "user_role" (
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  CONSTRAINT "PK_user_role" PRIMARY KEY ("user_id", "role_id")
);

-- 7. Network Servers Table (ThingPark & ChirpStack)
CREATE TABLE IF NOT EXISTS "network_servers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(50) NOT NULL DEFAULT 'THINGPARK',
  "description" TEXT,
  "apiUrl" VARCHAR(500),
  "apiKey" TEXT,
  "routeRef" VARCHAR(255),
  "applicationId" VARCHAR(255),
  "regionProfiles" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "status" VARCHAR(50) NOT NULL DEFAULT 'ONLINE',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 8. Applications Table
CREATE TABLE IF NOT EXISTS "applications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "appId" VARCHAR(255) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" VARCHAR(255),
  "ownerId" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 9. Devices Table (Fleet Management)
CREATE TABLE IF NOT EXISTS "devices" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "devEUI" VARCHAR(255) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "appId" VARCHAR(255),
  "ownerId" UUID,
  "appEUI" VARCHAR(255) DEFAULT '0102030405060708',
  "networkServerId" UUID REFERENCES "network_servers"("id") ON DELETE SET NULL,
  "regionProfileId" VARCHAR(100),
  "activationMode" VARCHAR(50) NOT NULL DEFAULT 'OTAA',
  "appKey" VARCHAR(255) DEFAULT '0102030405060708090A0B0C0D0E0F10',
  "nwkSKey" VARCHAR(255),
  "appSKey" VARCHAR(255),
  "syncStatus" VARCHAR(50) DEFAULT 'SYNCED',
  "syncDetails" JSONB DEFAULT '{}'::jsonb,
  "decoderId" VARCHAR(255),
  "payloadFormatterScript" TEXT,
  "lastSeenAt" TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 10. Gateways Table
CREATE TABLE IF NOT EXISTS "gateways" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "gatewayEUI" VARCHAR(255) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "networkServerId" UUID REFERENCES "network_servers"("id") ON DELETE SET NULL,
  "regionProfileId" VARCHAR(100),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "altitude" DOUBLE PRECISION,
  "status" VARCHAR(50) NOT NULL DEFAULT 'ONLINE',
  "ownerId" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 11. Uplink Telemetry Table (Optimized Ingestion)
CREATE TABLE IF NOT EXISTS "uplink_telemetry" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "devEui" VARCHAR(50) NOT NULL,
  "fPort" INT NOT NULL DEFAULT 1,
  "fCnt" INT NOT NULL DEFAULT 0,
  "dr" INT,
  "adr" BOOLEAN,
  "data" TEXT,
  "payloadHex" TEXT NOT NULL DEFAULT '',
  "gatewayId" VARCHAR(100),
  "rssi" DOUBLE PRECISION,
  "snr" DOUBLE PRECISION,
  "channel" INT,
  "frequency" BIGINT,
  "bandwidth" INT,
  "spreadingFactor" INT,
  "tenantId" VARCHAR(100),
  "applicationId" VARCHAR(100),
  "deviceName" VARCHAR(255),
  "deviceProfileName" VARCHAR(255),
  "devAddr" VARCHAR(50),
  "object" JSONB,
  "decodedData" JSONB,
  "serverType" VARCHAR(50) DEFAULT 'CHIRPSTACK',
  "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_telemetry_deveui_time" ON "uplink_telemetry" ("devEui", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_telemetry_time" ON "uplink_telemetry" ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_telemetry_gateway" ON "uplink_telemetry" ("gatewayId");

-- 12. Decoder Table (Decoder Manager C-Module)
CREATE TABLE IF NOT EXISTS "decoder" (
  "id" VARCHAR(255) PRIMARY KEY,
  "sku" VARCHAR(255) NOT NULL,
  "firmwareVersion" INT NOT NULL,
  "decoderCode" TEXT NOT NULL,
  "description" TEXT,
  "author" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_decoder_sku" ON "decoder" ("sku");

-- 13. Webhook Logs Table (Webhook Manager C-Module)
CREATE TABLE IF NOT EXISTS "webhook_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "serverType" VARCHAR(50) NOT NULL,
  "devEUI" VARCHAR(255) NOT NULL,
  "fPort" INT NOT NULL DEFAULT 1,
  "fCnt" INT NOT NULL DEFAULT 0,
  "payloadHex" TEXT NOT NULL DEFAULT '',
  "decodedData" JSONB,
  "rawPayload" JSONB,
  "status" VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
  "errorMessage" TEXT,
  "receivedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_webhook_logs_server" ON "webhook_logs" ("serverType", "receivedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_webhook_logs_deveui" ON "webhook_logs" ("devEUI");

-- 14. HMI Screens Table (HMI SCADA Studio C-Module)
CREATE TABLE IF NOT EXISTS "hmi_screens" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "canvasConfig" JSONB NOT NULL DEFAULT '{"width": 1280, "height": 720, "background": "#0b0f19", "grid": 10, "showGrid": true}',
  "widgets" JSONB NOT NULL DEFAULT '[]',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "allowedRoles" JSONB NOT NULL DEFAULT '["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"]',
  "author" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_hmi_screens_published" ON "hmi_screens" ("isPublished");

