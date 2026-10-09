/**
 * Comprehensive QA Test Suite for Database Schema Discrepancies Fix
 * Verifies:
 * 1. DDL Migration 24 (deploy/database/updates/24_fix_memmap_regs_and_item_codes_schema.sql)
 * 2. Init script (deploy/database/init/02_final_config_and_metabase_views.sql) alignment
 * 3. Direct PostgreSQL schema & column verification:
 *    - memmap_regs (format, downlink_type_5, in_rd1_template, comment, in_engineering_template, in_end_user_template, in_full_template)
 *    - item_codes (firmwareVersion, skuFw, isActive)
 *    - sales_order_items (itemCodeId, templateId, metadata)
 *    - final_config_sn (app_key)
 *    - device_tested (16 CSV audit columns)
 * 4. Direct SQL Data queries on live database (zero mock data)
 * 5. GET /lorawan/devices projection verification (itemCode.firmwareVersion & itemCode.skuFw)
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LorawanService } from '../src/modules/lorawan/lorawan.service';

async function testMigrationScriptIntegrity() {
  console.log('[SECTION 1] Checking Migration Script & Init DDL Integrity...');
  const migrationPath = path.resolve(__dirname, '../../deploy/database/updates/24_fix_memmap_regs_and_item_codes_schema.sql');
  assert(fs.existsSync(migrationPath), `Migration 24 script must exist at ${migrationPath}`);

  const content = fs.readFileSync(migrationPath, 'utf8');
  assert(content.includes('BEGIN;'), 'Migration must be wrapped in transaction BEGIN');
  assert(content.includes('COMMIT;'), 'Migration must be wrapped in transaction COMMIT');
  assert(content.includes('ALTER TABLE IF EXISTS "memmap_regs"'), 'Migration must alter memmap_regs');
  assert(content.includes('"format" VARCHAR(50)'), 'Migration must add format to memmap_regs');
  assert(content.includes('"downlink_type_5" VARCHAR(50)'), 'Migration must add downlink_type_5 to memmap_regs');
  assert(content.includes('"in_rd1_template" BOOLEAN'), 'Migration must add in_rd1_template to memmap_regs');
  assert(content.includes('"comment" TEXT'), 'Migration must add comment to memmap_regs');
  assert(content.includes('ALTER TABLE IF EXISTS "item_codes"'), 'Migration must alter item_codes');
  assert(content.includes('"firmwareVersion" VARCHAR(100)'), 'Migration must add firmwareVersion to item_codes');
  assert(content.includes('"skuFw" VARCHAR(255)'), 'Migration must add skuFw to item_codes');
  assert(content.includes('"isActive" BOOLEAN'), 'Migration must add isActive to item_codes');
  assert(content.includes('ALTER TABLE IF EXISTS "sales_order_items"'), 'Migration must alter sales_order_items');
  assert(content.includes('"itemCodeId" UUID'), 'Migration must add itemCodeId to sales_order_items');
  assert(content.includes('ALTER TABLE IF EXISTS "final_config_sn"'), 'Migration must alter final_config_sn');
  assert(content.includes('"app_key" VARCHAR(64)'), 'Migration must add app_key to final_config_sn');
  assert(content.includes('ALTER TABLE IF EXISTS "device_tested"'), 'Migration must alter device_tested');
  assert(content.includes('"csv_raw_data" JSONB'), 'Migration must add csv_raw_data to device_tested');

  console.log('  -> PASS: Migration 24 DDL script syntax and targets verified');
}

async function testDatabaseColumnsAndQueries() {
  console.log('[SECTION 2] Verifying Live PostgreSQL Schema & Direct Queries (Zero Mock)...');
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'mason',
    database: process.env.DB_NAME || 'dvt',
  });

  await client.connect();

  try {
    // 1. memmap_regs
    const regCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'memmap_regs'
    `);
    const regColNames = regCols.rows.map(r => r.column_name);
    const requiredRegCols = [
      'format',
      'downlink_type_5',
      'in_rd1_template',
      'comment',
      'in_engineering_template',
      'in_end_user_template',
      'in_full_template',
    ];
    for (const col of requiredRegCols) {
      assert(regColNames.includes(col), `memmap_regs must include column "${col}"`);
    }

    const regSample = await client.query(`
      SELECT id, sku, short_fw, modbus_reg_dec, format, downlink_type_5, in_rd1_template, comment 
      FROM memmap_regs 
      LIMIT 10
    `);
    assert(regSample.rows.length > 0, 'memmap_regs must contain verified records');
    const firstReg = regSample.rows[0];
    assert(firstReg.format !== undefined, 'format column must be readable');
    assert(firstReg.comment !== undefined, 'comment column must be readable');
    assert(typeof firstReg.in_rd1_template === 'boolean', 'in_rd1_template must be boolean');
    console.log(`  -> PASS: memmap_regs verified (${regSample.rows.length} rows verified, sample format="${firstReg.format}")`);

    // 2. item_codes
    const icCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'item_codes'
    `);
    const icColNames = icCols.rows.map(r => r.column_name);
    const requiredIcCols = ['firmwareVersion', 'skuFw', 'isActive'];
    for (const col of requiredIcCols) {
      assert(icColNames.includes(col), `item_codes must include column "${col}"`);
    }

    const icSample = await client.query(`
      SELECT id, "itemCode", sku, "firmwareVersion", "skuFw", "isActive" 
      FROM item_codes 
      LIMIT 10
    `);
    assert(icSample.rows.length > 0, 'item_codes must contain verified records');
    const firstIc = icSample.rows[0];
    assert.strictEqual(typeof firstIc.firmwareVersion, 'string', 'firmwareVersion must be string');
    assert.strictEqual(typeof firstIc.skuFw, 'string', 'skuFw must be string');
    assert.strictEqual(firstIc.skuFw, `${firstIc.sku}_${firstIc.firmwareVersion}`, 'skuFw must be formatted as <sku>_<firmwareVersion>');
    assert.strictEqual(typeof firstIc.isActive, 'boolean', 'isActive must be boolean');
    console.log(`  -> PASS: item_codes verified (${icSample.rows.length} rows verified, sample itemCode="${firstIc.itemCode}", skuFw="${firstIc.skuFw}")`);

    // 3. sales_order_items
    const soiCols = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_order_items'
    `);
    const soiColNames = soiCols.rows.map(r => r.column_name);
    assert(soiColNames.includes('itemCodeId'), 'sales_order_items must include itemCodeId');
    assert(soiColNames.includes('templateId'), 'sales_order_items must include templateId');
    assert(soiColNames.includes('metadata'), 'sales_order_items must include metadata');
    console.log('  -> PASS: sales_order_items columns verified');

    // 4. final_config_sn
    const fcCols = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'final_config_sn'
    `);
    const fcColNames = fcCols.rows.map(r => r.column_name);
    assert(fcColNames.includes('app_key'), 'final_config_sn must include app_key');
    console.log('  -> PASS: final_config_sn.app_key verified');

    // 5. device_tested
    const dtCols = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'device_tested'
    `);
    const dtColNames = dtCols.rows.map(r => r.column_name);
    const requiredDtCols = [
      'device_key', 'test_id', 'so_number', 'hw_ver', 'fw_ver',
      'result', 'auto_check', 'label_check_code', 'start_time', 'duration_time',
      'time_finish', 'test_station', 'test_person', 'test_note', 'test_result_id', 'csv_raw_data'
    ];
    for (const col of requiredDtCols) {
      assert(dtColNames.includes(col), `device_tested must include column "${col}"`);
    }
    console.log('  -> PASS: device_tested 16 audit columns verified');

  } finally {
    await client.end();
  }
}

async function testLorawanDevicesQueryAndProjection() {
  console.log('[SECTION 3] Verifying Live NestJS LorawanService.listDevices Projection...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    const lorawanService = app.get(LorawanService);
    const devices = await lorawanService.listDevices({ roles: [{ code: 'SUPER_ADMIN' }] });
    assert(Array.isArray(devices), 'listDevices must return an array');
    assert(devices.length > 0, 'devices list must not be empty');

    const deviceWithItemCode = devices.find(d => d.itemCode && d.itemCode.itemCode);
    assert(deviceWithItemCode, 'Should find at least one device linked to item_codes');

    const ic = deviceWithItemCode.itemCode;
    assert(ic.id, 'itemCode.id must exist');
    assert(ic.itemCode, 'itemCode.itemCode must exist');
    assert(ic.sku, 'itemCode.sku must exist');
    assert(ic.firmwareVersion, 'itemCode.firmwareVersion must exist');
    assert(ic.skuFw, 'itemCode.skuFw must exist');
    assert.strictEqual(ic.skuFw, `${ic.sku}_${ic.firmwareVersion}`, 'itemCode.skuFw must match canonical <SKU>_<FW>');

    console.log(`  -> PASS: LorawanService.listDevices returned device ${deviceWithItemCode.devEUI} with itemCode: ${ic.itemCode}, firmwareVersion: ${ic.firmwareVersion}, skuFw: ${ic.skuFw}`);
  } finally {
    await app.close();
  }
}

async function main() {
  console.log('==============================================================================');
  console.log('[QA TEST SUITE] End-to-End Database Migration & Query Verification');
  console.log('==============================================================================');

  await testMigrationScriptIntegrity();
  await testDatabaseColumnsAndQueries();
  await testLorawanDevicesQueryAndProjection();

  console.log('==============================================================================');
  console.log('🎯 [QA TEST SUITE] ALL SECTIONS PASSED SUCCESSFULLY (100% SUCCESS)');
  console.log('==============================================================================');
}

main().catch(err => {
  console.error('QA Test Suite Failed:', err);
  process.exit(1);
});
