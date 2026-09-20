/**
 * Verification test for TypeORM Entity Registration & Metadata Resolution
 * Validates:
 * 1. TestTemplateEntity & TestAssertionEntity registration in ALL_DATABASE_ENTITIES
 * 2. TypeORM DataSource metadata resolution without EntityMetadataNotFoundError
 * 3. Table and column mapping integrity
 * 4. Relationship integrity (TestTemplateEntity 1:N TestAssertionEntity)
 * 5. DB routing configuration in db-routing.config.json
 */

import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { TestTemplateEntity } from '../src/modules/c-modules/test-builder/entities/test-template.entity';
import { TestAssertionEntity } from '../src/modules/c-modules/test-builder/entities/test-assertion.entity';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function verifyTypeOrmMetadata() {
  console.log('=== VERIFYING TYPEORM ENTITY METADATA & REGISTRATION ===\n');

  // Check 1: Entities present in ALL_DATABASE_ENTITIES
  console.log('[Check 1] ALL_DATABASE_ENTITIES contains TestTemplateEntity and TestAssertionEntity');
  const entityNames = ALL_DATABASE_ENTITIES.map((e: any) => e?.name);
  assert.ok(
    entityNames.includes('TestTemplateEntity'),
    'TestTemplateEntity must be included in ALL_DATABASE_ENTITIES',
  );
  assert.ok(
    entityNames.includes('TestAssertionEntity'),
    'TestAssertionEntity must be included in ALL_DATABASE_ENTITIES',
  );
  console.log('  -> PASS: Both entities registered in ALL_DATABASE_ENTITIES array\n');

  // Check 2: DataSource metadata build
  console.log('[Check 2] TypeORM DataSource builds metadata successfully');
  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });

  await ds.build();

  assert.strictEqual(
    ds.hasMetadata(TestTemplateEntity),
    true,
    'DataSource must contain metadata for TestTemplateEntity',
  );
  assert.strictEqual(
    ds.hasMetadata(TestAssertionEntity),
    true,
    'DataSource must contain metadata for TestAssertionEntity',
  );
  console.log('  -> PASS: TypeORM has valid metadata for both entities (No metadata error resolved)\n');

  // Check 3: Table and column definitions
  console.log('[Check 3] Entity metadata table name and schema checks');
  const templateMeta = ds.getMetadata(TestTemplateEntity);
  const assertionMeta = ds.getMetadata(TestAssertionEntity);

  assert.strictEqual(templateMeta.tableName, 'test_templates');
  assert.strictEqual(assertionMeta.tableName, 'test_assertions');

  const requiredTemplateCols = [
    'id',
    'name',
    'code',
    'sku',
    'firmwareVersion',
    'executionMode',
    'flowConfig',
    'timeoutSeconds',
    'minPacketsRequired',
    'isActive',
  ];
  for (const col of requiredTemplateCols) {
    assert.ok(
      templateMeta.findColumnWithPropertyName(col),
      `TestTemplateEntity missing column: ${col}`,
    );
  }

  const requiredAssertionCols = [
    'id',
    'templateId',
    'fieldName',
    'operator',
    'expectedValue',
    'severity',
  ];
  for (const col of requiredAssertionCols) {
    assert.ok(
      assertionMeta.findColumnWithPropertyName(col),
      `TestAssertionEntity missing column: ${col}`,
    );
  }
  console.log('  -> PASS: Table names and column schemas verified\n');

  // Check 4: Relation mapping
  console.log('[Check 4] Entity relationship mapping (1:N)');
  const assertionsRel = templateMeta.findRelationWithPropertyPath('assertions');
  assert.ok(assertionsRel, 'TestTemplateEntity must have assertions relation');
  assert.strictEqual(assertionsRel?.isOneToMany, true);

  const templateRel = assertionMeta.findRelationWithPropertyPath('template');
  assert.ok(templateRel, 'TestAssertionEntity must have template relation');
  assert.strictEqual(templateRel?.isManyToOne, true);
  console.log('  -> PASS: TestTemplate (1) <-> TestAssertion (N) relation verified\n');

  // Check 5: DB routing config
  console.log('[Check 5] db-routing.config.json table_routes');
  const routingConfigPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(routingConfigPath), 'db-routing.config.json must exist');
  const routingConfig = JSON.parse(fs.readFileSync(routingConfigPath, 'utf8'));
  assert.ok(
    routingConfig.table_routes?.['test_templates'],
    'table_routes must route test_templates',
  );
  assert.ok(
    routingConfig.table_routes?.['test_assertions'],
    'table_routes must route test_assertions',
  );
  console.log(
    `  -> PASS: test_templates -> ${routingConfig.table_routes['test_templates']}, test_assertions -> ${routingConfig.table_routes['test_assertions']}\n`,
  );

  console.log('=== ALL TYPEORM METADATA VERIFICATION CHECKS PASSED ===\n');
}

verifyTypeOrmMetadata().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
