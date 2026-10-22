/**
 * Verification test for Core TypeORM Entity Registration & Metadata Resolution
 * Validates:
 * 1. Core entities registration in ALL_DATABASE_ENTITIES (User, Role, Permission, CorePluginEntity, PluginAuditLogEntity, UnifiedDeviceEntity)
 * 2. TypeORM DataSource metadata resolution without EntityMetadataNotFoundError
 * 3. Table and column mapping integrity for Core Micro-kernel
 * 4. DB routing configuration in db-routing.config.json
 */

import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { User } from '../src/backend/identity/modules/users/entities/user.entity';
import { Role } from '../src/backend/identity/modules/roles-permissions/entities/role.entity';
import { Permission } from '../src/backend/identity/modules/roles-permissions/entities/permission.entity';
import { CorePluginEntity } from '../src/backend/core-models/core-plugin.entity';
import { PluginAuditLogEntity } from '../src/backend/core-models/plugin-audit-log.entity';
import { UnifiedDeviceEntity } from '../src/backend/core-models/unified-device.entity';
import { MemmapProfileEntity } from '../src/backend/core-models/memmap-profile.entity';
import { MemmapRegisterEntity } from '../src/backend/core-models/memmap-register.entity';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function verifyTypeOrmMetadata() {
  console.log('=== VERIFYING CORE TYPEORM ENTITY METADATA & REGISTRATION ===\n');

  // Check 1: Entities present in ALL_DATABASE_ENTITIES
  console.log('[Check 1] ALL_DATABASE_ENTITIES contains Core Micro-kernel entities');
  const entityNames = ALL_DATABASE_ENTITIES.map((e: any) => e?.name);
  const expectedEntities = [
    'User',
    'Role',
    'Permission',
    'CorePluginEntity',
    'PluginAuditLogEntity',
    'UnifiedDeviceEntity',
    'MemmapProfileEntity',
    'MemmapRegisterEntity',
  ];

  for (const expected of expectedEntities) {
    assert.ok(
      entityNames.includes(expected),
      `${expected} must be included in ALL_DATABASE_ENTITIES`,
    );
  }
  console.log('  -> PASS: All Core entities registered in ALL_DATABASE_ENTITIES array\n');

  // Check 2: DataSource metadata resolution without EntityMetadataNotFoundError
  console.log('[Check 2] TypeORM DataSource resolves metadata cleanly for all Core entities');
  const testDs = new TestDataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    database: 'itest_test_db',
    entities: ALL_DATABASE_ENTITIES,
    synchronize: false,
  });

  await testDs.build();

  for (const entity of ALL_DATABASE_ENTITIES) {
    const meta = testDs.getMetadata(entity);
    assert.ok(meta, `Metadata for ${entity.name} must resolve cleanly`);
    assert.ok(meta.tableName, `Table name for ${entity.name} must be defined`);
    console.log(`  -> Entity '${entity.name}' maps to table '${meta.tableName}' (${meta.columns.length} columns)`);
  }
  console.log('  -> PASS: All Core entities resolve without EntityMetadataNotFoundError\n');

  // Check 3: Relationship integrity (Role <-> Permission N:M and MemmapProfile <-> MemmapRegister 1:N)
  console.log('[Check 3] Core Relationship integrity');
  const roleMeta = testDs.getMetadata(Role);
  const permRelation = roleMeta.relations.find((r) => r.propertyName === 'permissions');
  assert.ok(permRelation, 'Role must have permissions relation');
  assert.strictEqual(permRelation.relationType, 'many-to-many', 'Role-Permission must be many-to-many');
  console.log('  -> PASS: Role-Permission many-to-many relation verified');

  const profileMeta = testDs.getMetadata(MemmapProfileEntity);
  const registersRelation = profileMeta.relations.find((r) => r.propertyName === 'registers');
  assert.ok(registersRelation, 'MemmapProfileEntity must have registers relation');
  assert.strictEqual(registersRelation.relationType, 'one-to-many', 'MemmapProfile-Register must be one-to-many');
  console.log('  -> PASS: MemmapProfile-MemmapRegister 1:N relation verified\n');

  // Check 4: DB routing configuration
  console.log('[Check 4] db-routing.config.json routes all Core tables');
  const configPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(configPath), 'db-routing.config.json must exist');
  const configContent = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const coreTables = [
    'users',
    'roles',
    'permission',
    'core_plugins',
    'plugin_audit_logs',
    'unified_devices',
    'memmap_profiles',
    'memmap_registers',
  ];
  for (const table of coreTables) {
    assert.ok(
      configContent.table_routes[table] !== undefined,
      `Table '${table}' must be mapped in db-routing.config.json`,
    );
  }
  console.log('  -> PASS: Core tables mapped in db-routing.config.json\n');

  console.log('=== ALL CORE ENTITY METADATA CHECKS PASSED SUCCESSFULLY ===');
}

verifyTypeOrmMetadata().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
