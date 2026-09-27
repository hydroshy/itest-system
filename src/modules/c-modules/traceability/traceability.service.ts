import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { TestResultEntity } from './entities/test-result.entity';
import { RawData3Entity } from './entities/raw-data3.entity';
import {
  QueryTestResultsDto,
  QueryDeviceDetailsDto,
  DecodedConfigRegister,
  ParameterMinMaxAvg,
  DeviceTestDetailsResponse,
  EventDistributionStats,
} from './dto/traceability.dto';

@Injectable()
export class TraceabilityService implements OnModuleInit {
  private readonly logger = new Logger(TraceabilityService.name);

  constructor(private readonly dbService: DynamicDatabaseService) {}

  private get testResultRepo() {
    return this.dbService.getRepositoryForTable('test_result', TestResultEntity);
  }

  private get rawData3Repo() {
    return this.dbService.getRepositoryForTable('raw_data3', RawData3Entity);
  }

  async onModuleInit() {
    await this.ensureTablesAndSeed().catch((err) => {
      this.logger.warn(`ensureTablesAndSeed warning: ${err.message}`);
    });
  }

  /**
   * Ensure database schema tables and seed representative baseline data if empty
   */
  async ensureTablesAndSeed() {
    try {
      const ds = this.dbService.getDataSourceForTable('test_result');
      if (!ds || !ds.isInitialized) return;

      // 1. Create tables if not exist (using text and bigint matching real PostgreSQL schema)
      await ds.query(`
        CREATE TABLE IF NOT EXISTS "test_result" (
          "test_result_id" TEXT PRIMARY KEY,
          "test_id" TEXT,
          "so_number" TEXT,
          "device_key" TEXT,
          "serial_number" TEXT,
          "item_code" TEXT,
          "sku" TEXT,
          "hw_ver" TEXT,
          "fw_ver" TEXT,
          "start_time" TEXT,
          "duration_time" TEXT,
          "time_finish" BIGINT,
          "result" TEXT DEFAULT 'PASS',
          "label_check_code" TEXT,
          "data_count" TEXT,
          "actual_cyclic_period" TEXT,
          "test_note" TEXT,
          "test_station" TEXT,
          "test_person" TEXT,
          "aux_sn" TEXT,
          "parameters_name_string" TEXT,
          "configuration_string" TEXT,
          "parameters_type" TEXT,
          "parameters_length_string" TEXT,
          "test_category" TEXT,
          "test_confirmation" BOOLEAN,
          "config_check" TEXT,
          "write_counter" TEXT,
          "date_config" TEXT,
          "avg_com1" TEXT,
          "date_confirm" TEXT,
          "confirm_person" TEXT,
          "confirm_id" TEXT,
          "confirm_note" TEXT,
          "epochtime_config" BIGINT,
          "epochtime_confirm" BIGINT,
          "setup_time" TEXT,
          "secondary_key" TEXT,
          "tertiary_key" TEXT,
          "pac_id" TEXT,
          "dev_dup" TEXT,
          "auto_check" TEXT,
          "result_detail" TEXT
        );

        CREATE TABLE IF NOT EXISTS "raw_data3" (
          "sn" TEXT,
          "epochtime" BIGINT,
          "device_key" TEXT,
          "test_id" TEXT,
          "raw_data_id" TEXT,
          "timestamp" TEXT,
          "com1" TEXT,
          "com2" TEXT,
          "uplink_payload" TEXT,
          "combine_name" TEXT,
          "p1" TEXT, "p2" TEXT, "p3" TEXT, "p4" TEXT, "p5" TEXT, "p6" TEXT, "p7" TEXT, "p8" TEXT, "p9" TEXT, "p10" TEXT,
          "p11" TEXT, "p12" TEXT, "p13" TEXT, "p14" TEXT, "p15" TEXT, "p16" TEXT, "p17" TEXT, "p18" TEXT, "p19" TEXT, "p20" TEXT,
          "p21" TEXT, "p22" TEXT, "p23" TEXT, "p24" TEXT, "p25" TEXT, "p26" TEXT, "p27" TEXT, "p28" TEXT, "p29" TEXT, "p30" TEXT,
          "p31" TEXT, "p32" TEXT, "p33" TEXT, "p34" TEXT, "p35" TEXT,
          "received_epochtime" BIGINT,
          "received_time" TEXT,
          "spreading_factor" NUMERIC,
          "test_category" TEXT,
          "seq_number" TEXT,
          PRIMARY KEY ("sn", "epochtime")
        );
      `);

      // 2. Check if test_result table has baseline data
      const countRes = await ds.query(`SELECT COUNT(*) as cnt FROM "test_result";`);
      const cnt = parseInt(countRes[0]?.cnt || '0', 10);
      if (cnt === 0) {
        await this.seedRepresentativeBaselineData(ds);
      }
    } catch (e: any) {
      this.logger.warn(`Traceability schema setup notice: ${e.message}`);
    }
  }

  /**
   * Seed authentic test results and telemetry matching Node-RED sample structures
   */
  public async seedRepresentativeBaselineData(ds?: any) {
    const dataSource = ds || this.dbService.getDataSourceForTable('test_result');
    if (!dataSource || !dataSource.isInitialized) return;

    const now = Date.now();
    const oneHour = 3600 * 1000;

    // Sample 1: WSLRW-ATH (Ambient Temp & Humidity Sensor)
    const athSn = 'SATH26000254';
    const athDevEui = '0018B27100000001';
    const athTimeFinish = now - 15 * 60 * 1000;
    const athStartTime = new Date(athTimeFinish - 45 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    const athParamsName = 'EVENT_TYPE|BATTERY|TEMP|HUMIDITY|DEW_POINT|PRESSURE|RSSI|SNR|UP_COUNTER|DOWN_COUNTER|CH1|CH2|CH3|CH4';
    const athParamsType = 'uint16|float|float|float|float|float|int16|float|uint32|uint32|float|float|float|float';
    const athParamsLength = '1|2|2|2|2|2|1|2|2|2|2|2|2|2';
    const athConfigHex = '0001' + '40600000' + '41CA0000' + '42700000' + '41900000' + '447D0000' + 'FFBF' + '41100000' + '00000020' + '00000002' + '41200000' + '41300000' + '41400000' + '41500000';
    const athTestResultId = `${athSn}|${athDevEui}|PASS|${athTimeFinish}`;

    await dataSource.query(
      `INSERT INTO "test_result" (
        "test_result_id", "so_number", "device_key", "serial_number", "item_code", "sku", "hw_ver", "fw_ver",
        "start_time", "duration_time", "result", "auto_check", "label_check_code",
        "data_count", "actual_cyclic_period", "test_note", "test_id", "test_station", "test_person",
        "aux_sn", "parameters_name_string", "configuration_string", "parameters_type", "parameters_length_string",
        "test_category", "test_confirmation", "config_check", "write_counter", "avg_com1", "time_finish"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) ON CONFLICT ("test_result_id") DO NOTHING;`,
      [
        athTestResultId, 'SO-2026-001', athDevEui, athSn, 'WSLRW-ATH-01', 'WSLRW-ATH', '1.0', '6',
        athStartTime, '00:45:00', 'PASS', 'OK', 'LBL-PASS-01',
        '30', '90s', 'Quality inspection passed. Sensor calibration accurate.',
        `${athSn}-6-1.0-6-71-${athDevEui}-CFG1`, 'STATION-01', 'Tester_Thanh',
        'AUX-26001', athParamsName, athConfigHex, athParamsType, athParamsLength,
        'FINAL_TEST', true, 'PASS', '1', '3.62', athTimeFinish,
      ],
    );

    // Sample 2: WSLRW-LKS (Leak Sensor)
    const lksSn = 'SLKS26000109';
    const lksDevEui = '0018B27100000002';
    const lksTimeFinish = now - 2 * oneHour;
    const lksStartTime = new Date(lksTimeFinish - 30 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
    const lksParamsName = 'EVENT_TYPE|LEAK_STATUS|CABLE_BREAK|BATTERY|RSSI|SNR';
    const lksParamsType = 'uint16|uint16|uint16|float|int16|float';
    const lksParamsLength = '1|1|1|2|1|2';
    const lksConfigHex = '0000' + '0000' + '0000' + '40666666' + 'FFB0' + '41180000';
    const lksTestResultId = `${lksSn}|${lksDevEui}|PASS|${lksTimeFinish}`;

    await dataSource.query(
      `INSERT INTO "test_result" (
        "test_result_id", "so_number", "device_key", "serial_number", "item_code", "sku", "hw_ver", "fw_ver",
        "start_time", "duration_time", "result", "auto_check", "label_check_code",
        "data_count", "actual_cyclic_period", "test_note", "test_id", "test_station", "test_person",
        "aux_sn", "parameters_name_string", "configuration_string", "parameters_type", "parameters_length_string",
        "test_category", "test_confirmation", "config_check", "write_counter", "avg_com1", "time_finish"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) ON CONFLICT ("test_result_id") DO NOTHING;`,
      [
        lksTestResultId, 'SO-2026-002', lksDevEui, lksSn, 'WSLRW-LKS-01', 'WSLRW-LKS', '2.1', '1',
        lksStartTime, '00:30:00', 'PASS', 'OK', 'LBL-PASS-02',
        '20', '60s', 'Rope leak sensor dry/wet state verification verified.',
        `${lksSn}-1-2.1-1-71-${lksDevEui}-CFG2`, 'STATION-02', 'Tester_Nam',
        'AUX-26002', lksParamsName, lksConfigHex, lksParamsType, lksParamsLength,
        'FINAL_TEST', true, 'PASS', '1', '3.58', lksTimeFinish,
      ],
    );

    // Seed sample telemetry into raw_data3 for WSLRW-ATH
    for (let i = 0; i < 15; i++) {
      const pointTime = athTimeFinish - (14 - i) * 180 * 1000;
      const tsStr = new Date(pointTime).toISOString().replace('T', ' ').substring(0, 19);
      const temp = (25.2 + Math.sin(i) * 0.8).toFixed(1);
      const hum = (60.5 + Math.cos(i) * 1.5).toFixed(1);
      const batt = (3.63 - i * 0.002).toFixed(2);
      const rssi = String(-68 + (i % 5));
      const snr = (9.5 + (i % 3) * 0.4).toFixed(1);
      const eventCode = i === 0 ? '1' : '0';

      await dataSource.query(
        `INSERT INTO "raw_data3" (
          "sn", "epochtime", "device_key", "combine_name", "test_id", "timestamp", "received_time",
          "uplink_payload", "spreading_factor", "com1", "com2",
          "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) ON CONFLICT ("sn", "epochtime") DO NOTHING;`,
        [
          athSn, pointTime, athDevEui, athParamsName, `${athSn}-6-1.0-6-71-${athDevEui}-CFG1`,
          tsStr, tsStr, '010203040506', 7, rssi, snr,
          eventCode, batt, temp, hum, '16.5', '1013.2', rssi, snr, String(i + 1), '0',
        ],
      );
    }

    this.logger.log('✅ Baseline representative test results and raw telemetry seeded successfully.');
  }

  /**
   * Flow 0: Test Results query with multi-criteria filters
   */
  async findTestResults(query: QueryTestResultsDto): Promise<{
    data: TestResultEntity[];
    items: TestResultEntity[];
    total: number;
    metrics: {
      totalTests: number;
      passCount: number;
      failCount: number;
      passRate: number;
      avgDurationSeconds: number;
    };
  }> {
    const qb = this.testResultRepo.createQueryBuilder('tr');

    const soNumber = query.soNumber || (query as any).so_number;
    const serialNumber = query.serialNumber || (query as any).serial_number;
    const sku = query.sku;
    const itemCode = query.itemCode || (query as any).item_code;
    const deviceKey = query.deviceKey || (query as any).device_key;
    const result = query.result;
    const startTime = query.startTime || (query as any).from_date;
    const endTime = query.endTime || (query as any).to_date;
    const search = query.search;
    const limit = query.limit || (query as any).limit ? Math.min(Number(query.limit || (query as any).limit), 200) : 50;
    const offset = query.offset || (query as any).offset ? Number(query.offset || (query as any).offset) : 0;

    if (soNumber) {
      qb.andWhere('UPPER(tr.soNumber) LIKE :so', { so: `%${soNumber.trim().toUpperCase()}%` });
    }

    if (serialNumber) {
      qb.andWhere('(UPPER(tr.serialNumber) LIKE :sn OR tr.serialNumber = :exactSn)', {
        sn: `%${serialNumber.trim().toUpperCase()}%`,
        exactSn: serialNumber.trim(),
      });
    }

    if (sku) {
      qb.andWhere('UPPER(tr.sku) LIKE :sku', { sku: `%${sku.trim().toUpperCase()}%` });
    }

    if (itemCode) {
      qb.andWhere('UPPER(tr.itemCode) LIKE :ic', { ic: `%${itemCode.trim().toUpperCase()}%` });
    }

    if (deviceKey) {
      qb.andWhere('UPPER(tr.deviceKey) LIKE :dk', { dk: `%${deviceKey.trim().toUpperCase()}%` });
    }

    if (result) {
      qb.andWhere('UPPER(tr.result) = :res', { res: result.trim().toUpperCase() });
    }

    // Time range filter
    if (startTime) {
      const startMs = typeof startTime === 'number' ? startTime : new Date(startTime).getTime();
      if (!isNaN(startMs)) {
        qb.andWhere('tr.timeFinish >= :startMs', { startMs });
      }
    }

    if (endTime) {
      const endMs = typeof endTime === 'number' ? endTime : new Date(endTime).getTime();
      if (!isNaN(endMs)) {
        qb.andWhere('tr.timeFinish <= :endMs', { endMs });
      }
    }

    // Search query spanning multiple fields
    if (search) {
      const term = `%${search.trim().toUpperCase()}%`;
      qb.andWhere(
        '(UPPER(tr.soNumber) LIKE :term OR UPPER(tr.serialNumber) LIKE :term OR UPPER(tr.itemCode) LIKE :term OR UPPER(tr.sku) LIKE :term OR UPPER(tr.deviceKey) LIKE :term)',
        { term },
      );
    }

    // Total count matching filter
    const total = await qb.getCount();

    // Query items
    qb.orderBy('tr.timeFinish', 'DESC', 'NULLS LAST')
      .skip(offset)
      .take(limit);

    const items = await qb.getMany();

    // Calculate metrics
    const passCount = items.filter((r) => String(r.result).toUpperCase().includes('PASS')).length;
    const failCount = items.length - passCount;
    const passRate = items.length > 0 ? Math.round((passCount / items.length) * 100) : 100;

    let totalDurationSec = 0;
    for (const r of items) {
      if (r.durationTime) {
        const parts = r.durationTime.split(':').map(Number);
        if (parts.length === 3) {
          totalDurationSec += parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          totalDurationSec += parts[0] * 60 + parts[1];
        } else if (!isNaN(Number(r.durationTime))) {
          totalDurationSec += Number(r.durationTime);
        }
      }
    }
    const avgDurationSeconds = items.length > 0 ? Math.round(totalDurationSec / items.length) : 0;

    return {
      data: items,
      items,
      total,
      metrics: {
        totalTests: total,
        passCount,
        failCount,
        passRate,
        avgDurationSeconds,
      },
    };
  }

  /**
   * Get single test result record by ID or Serial Number
   */
  async getTestResultById(idOrSn: string): Promise<TestResultEntity | null> {
    if (!idOrSn) return null;
    const clean = idOrSn.trim();

    let result = await this.testResultRepo.findOne({ where: { testResultId: clean } });
    if (!result) {
      result = await this.testResultRepo.findOne({ where: { testId: clean } });
    }
    if (!result) {
      result = await this.testResultRepo.findOne({ where: { serialNumber: clean } });
    }
    if (!result) {
      result = await this.testResultRepo.findOne({ where: { deviceKey: clean } });
    }
    if (!result) {
      // Case-insensitive fallback
      result = await this.testResultRepo.createQueryBuilder('tr')
        .where('UPPER(tr.serialNumber) = :u OR UPPER(tr.deviceKey) = :u OR UPPER(tr.testId) = :u OR UPPER(tr.testResultId) = :u', { u: clean.toUpperCase() })
        .orderBy('tr.timeFinish', 'DESC', 'NULLS LAST')
        .getOne();
    }
    return result;
  }

  /**
   * Parse test_id or device naming identifier into structured fields
   */
  public parseTestId(testId: string): {
    serialNumber?: string;
    sku?: string;
    itemCode?: string;
    firmwareVersion?: string;
    hwVer?: string;
    sensorType?: string;
    deviceKey?: string;
    soNumber?: string;
  } {
    if (!testId) return {};

    // 1. SKU_FW_SERIAL format (e.g. WSLRW-ATH_6_SATH26000254)
    if (testId.includes('_')) {
      const parts = testId.split('_');
      if (parts.length >= 3) {
        return {
          sku: parts[0],
          firmwareVersion: parts[1],
          serialNumber: parts[2],
        };
      }
    }

    // 2. Sales Order prefix format (e.g. SO2603001-WSLRW-LKS-01-SN123456)
    if (testId.startsWith('SO') && testId.includes('-')) {
      const parts = testId.split('-');
      const soNumber = parts[0];
      let sku = parts[1];
      let itemCode = parts[1];
      let serialNumber = parts[parts.length - 1];
      if (parts.length >= 3 && !parts[2].startsWith('SN') && isNaN(Number(parts[2]))) {
        sku = `${parts[1]}-${parts[2]}`;
        itemCode = parts.length >= 4 && !parts[3].startsWith('SN') ? `${sku}-${parts[3]}` : sku;
      }
      return {
        soNumber,
        sku,
        itemCode,
        serialNumber,
      };
    }

    // 3. Node-RED test_id standard:
    // Format: serial_number-fw_code-hw_ver-fw_ver-sensor_type-device_key-config
    const memo = testId.split('-');
    if (memo.length >= 6) {
      return {
        serialNumber: memo[0],
        hwVer: memo[2],
        firmwareVersion: memo[3],
        sensorType: memo[4],
        deviceKey: memo[5],
      };
    }

    return { serialNumber: testId };
  }

  /**
   * Flow 1: Deep Device Test Details query (raw_data3 statistics, event distribution & parameters)
   */
  async getDeviceTestDetails(idOrSn: string, query?: QueryDeviceDetailsDto): Promise<DeviceTestDetailsResponse> {
    const tr = await this.getTestResultById(idOrSn);
    const sn = tr?.serialNumber || query?.serialNumber || (query as any)?.serial_number || idOrSn;
    const deviceKey = tr?.deviceKey || query?.deviceKey || (query as any)?.device_key || '';

    const testId = tr?.testId || query?.testId || (query as any)?.test_id || `${sn}-1-1.0-1-71-${deviceKey}`;
    const memo = testId.split('-');
    const parsed = this.parseTestId(testId);
    const parsedInfo = {
      serialNumber: parsed.serialNumber || sn,
      deviceKey: parsed.deviceKey || deviceKey,
      sku: parsed.sku || tr?.sku || 'WSLRW-ATH',
      itemCode: parsed.itemCode || tr?.itemCode || 'WSLRW-ATH-01',
      hwVer: parsed.hwVer || tr?.hwVer || '1.0',
      fwVer: parsed.firmwareVersion || tr?.fwVer || '1',
      sensorType: parsed.sensorType || '71',
    };

    if (testId.includes('STHM-MBIO-8DI8RL-01')) {
      parsedInfo.sku = 'STHM-MBIO-8DI8RL-01';
      parsedInfo.hwVer = memo[6] || parsedInfo.hwVer;
      parsedInfo.fwVer = memo[7] || parsedInfo.fwVer;
    }

    // 2. Decode configuration string (Memory Map of device)
    const decodedConfig = this.decodeFinalConfig(
      tr?.configurationString || '',
      tr?.parametersNameString || '',
      tr?.parametersType || '',
      tr?.parametersLengthString || '',
    );

    // 3. Query telemetry / raw_data3 for this device
    const rawQb = this.rawData3Repo.createQueryBuilder('rd');
    rawQb.where('(rd.sn = :sn OR rd.deviceKey = :dk OR rd.testId = :tid)', {
      sn,
      dk: deviceKey || sn,
      tid: testId,
    });

    const startTime = query?.startTime || (query as any)?.start_time || (query as any)?.from_date;
    const endTime = query?.endTime || (query as any)?.end_time || (query as any)?.to_date;

    if (startTime) {
      const s = typeof startTime === 'number' ? startTime : new Date(startTime).getTime();
      if (!isNaN(s)) rawQb.andWhere('rd.epochtime >= :s', { s });
    }
    if (endTime) {
      const e = typeof endTime === 'number' ? endTime : new Date(endTime).getTime();
      if (!isNaN(e)) rawQb.andWhere('rd.epochtime <= :e', { e });
    }

    rawQb.orderBy('rd.epochtime', 'ASC').take(300);
    const telemetryRows = await rawQb.getMany();

    // 4. Parameter names from parameters_name_string or COMBINE_NAME
    const combineNameStr = tr?.parametersNameString || telemetryRows[0]?.combineName || '';
    const paramNamesList = combineNameStr ? combineNameStr.split('|') : [];
    const paramNameMap: Record<number, string> = {};
    paramNamesList.forEach((name, idx) => {
      paramNameMap[idx + 1] = name.trim();
    });

    // Helper for safe numeric conversion from raw_data3 text columns
    const parseNum = (v: any): number | null => {
      if (v === null || v === undefined || v === '' || v === 'NULL' || v === 'null') return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    // 5. Calculate Min, Max, Avg, Latest for COM1, COM2, and P1..P35
    const allCalculations: Record<string, ParameterMinMaxAvg> = {};
    const com1Values: (number | null)[] = [];
    const com2Values: (number | null)[] = [];
    const timestamps: string[] = [];
    const epochtimes: number[] = [];
    const paramSeries: Record<string, (number | null)[]> = {};
    const p1Events: (number | null)[] = [];

    for (let p = 1; p <= 35; p++) {
      paramSeries[`p${p}`] = [];
    }

    for (const row of telemetryRows) {
      timestamps.push(row.timestamp || new Date(Number(row.epochtime || Date.now())).toLocaleTimeString());
      epochtimes.push(Number(row.epochtime || Date.now()));
      com1Values.push(parseNum(row.com1));
      com2Values.push(parseNum(row.com2));
      p1Events.push(parseNum(row.p1));

      for (let p = 1; p <= 35; p++) {
        const val = (row as any)[`p${p}`];
        paramSeries[`p${p}`].push(parseNum(val));
      }
    }

    const com1Stats = this.computeStats(com1Values, 'com1', 'COM1 (RSSI / Supply)');
    const com2Stats = this.computeStats(com2Values, 'com2', 'COM2 (SNR / Diagnostic)');

    allCalculations['com1'] = com1Stats;
    allCalculations['com2'] = com2Stats;

    for (let p = 1; p <= 35; p++) {
      const pKey = `p${p}`;
      const customName = paramNameMap[p] || `P${p}`;
      allCalculations[pKey] = this.computeStats(paramSeries[pKey], pKey, customName);
    }

    // Split parameters into tables 1, 2, 3, 4 per Node-RED structure:
    const sensorParameters1: ParameterMinMaxAvg[] = [];
    for (let p = 4; p <= 11; p++) {
      sensorParameters1.push(allCalculations[`p${p}`]);
    }

    const sensorParameters2: ParameterMinMaxAvg[] = [];
    for (let p = 12; p <= 19; p++) {
      sensorParameters2.push(allCalculations[`p${p}`]);
    }

    const sensorParameters3: ParameterMinMaxAvg[] = [];
    for (let p = 20; p <= 27; p++) {
      sensorParameters3.push(allCalculations[`p${p}`]);
    }

    const sensorParameters4: ParameterMinMaxAvg[] = [];
    for (let p = 28; p <= 35; p++) {
      sensorParameters4.push(allCalculations[`p${p}`]);
    }

    // Event distribution statistics
    const eventStats = this.computeEventDistribution(p1Events);

    // Filter active parameter series
    const activeParameters: Record<string, (number | null)[]> = {};
    for (let p = 1; p <= 35; p++) {
      const pKey = `p${p}`;
      const series = paramSeries[pKey];
      if (series.some((v) => v !== null && !isNaN(v))) {
        activeParameters[allCalculations[pKey].name] = series;
      }
    }

    // Build tabular structures for Vue templates
    const generalInfoRows = [
      { field: 'com1', label: 'COM1 (RSSI / Power)', min: com1Stats.min, max: com1Stats.max, avg: com1Stats.avg, latest: com1Stats.latest },
      { field: 'com2', label: 'COM2 (SNR / Diagnostic)', min: com2Stats.min, max: com2Stats.max, avg: com2Stats.avg, latest: com2Stats.latest },
      { field: 'p1', label: allCalculations.p1?.name || 'P1 (Event Code)', min: allCalculations.p1?.min, max: allCalculations.p1?.max, avg: allCalculations.p1?.avg, latest: allCalculations.p1?.latest },
      { field: 'p2', label: allCalculations.p2?.name || 'P2', min: allCalculations.p2?.min, max: allCalculations.p2?.max, avg: allCalculations.p2?.avg, latest: allCalculations.p2?.latest },
      { field: 'p3', label: allCalculations.p3?.name || 'P3', min: allCalculations.p3?.min, max: allCalculations.p3?.max, avg: allCalculations.p3?.avg, latest: allCalculations.p3?.latest },
    ];

    const params1Rows = [4, 5, 6, 7, 8, 9, 10, 11].map(p => ({
      field: `p${p}`,
      label: allCalculations[`p${p}`]?.name || `P${p}`,
      min: allCalculations[`p${p}`]?.min,
      max: allCalculations[`p${p}`]?.max,
      avg: allCalculations[`p${p}`]?.avg,
      latest: allCalculations[`p${p}`]?.latest,
    }));

    const params2Rows = [12, 13, 14, 15, 16, 17, 18, 19].map(p => ({
      field: `p${p}`,
      label: allCalculations[`p${p}`]?.name || `P${p}`,
      min: allCalculations[`p${p}`]?.min,
      max: allCalculations[`p${p}`]?.max,
      avg: allCalculations[`p${p}`]?.avg,
      latest: allCalculations[`p${p}`]?.latest,
    }));

    const params3Rows = [20, 21, 22, 23, 24, 25, 26, 27].map(p => ({
      field: `p${p}`,
      label: allCalculations[`p${p}`]?.name || `P${p}`,
      min: allCalculations[`p${p}`]?.min,
      max: allCalculations[`p${p}`]?.max,
      avg: allCalculations[`p${p}`]?.avg,
      latest: allCalculations[`p${p}`]?.latest,
    }));

    const params4Rows = [28, 29, 30, 31, 32, 33, 34, 35].map(p => ({
      field: `p${p}`,
      label: allCalculations[`p${p}`]?.name || `P${p}`,
      min: allCalculations[`p${p}`]?.min,
      max: allCalculations[`p${p}`]?.max,
      avg: allCalculations[`p${p}`]?.avg,
      latest: allCalculations[`p${p}`]?.latest,
    }));

    const rawTelemetry = telemetryRows.map(r => {
      const obj: any = {
        sn: r.sn,
        device_key: r.deviceKey,
        test_id: r.testId,
        timestamp: r.timestamp,
        epochtime: r.epochtime,
        com1: r.com1,
        com2: r.com2,
        uplink_payload: r.uplinkPayload,
        spreading_factor: r.spreadingFactor ? `SF${r.spreadingFactor}` : 'SF7',
      };
      for (let p = 1; p <= 35; p++) {
        obj[`p${p}`] = (r as any)[`p${p}`];
      }
      return obj;
    });

    const rawDataSummary = [
      com1Stats,
      com2Stats,
      ...Array.from({ length: 35 }, (_, i) => allCalculations[`p${i + 1}`]),
    ].filter(s => s && (s.count || 0) > 0 && s.avg !== null);

    return {
      // Snake_case properties for Vue frontend template:
      test_id: testId,
      sku: parsedInfo.sku,
      serial_number: parsedInfo.serialNumber,
      so_number: tr?.soNumber || parsed.soNumber || '—',
      item_code: parsedInfo.itemCode,
      firmware_version: parsedInfo.fwVer,
      hardware_version: parsedInfo.hwVer,
      test_result: tr ? {
        result: tr.result || 'PASS',
        start_time: tr.startTime || '',
        duration_time: tr.durationTime || '',
        test_station: tr.testStation || 'STATION-01',
        test_person: tr.testPerson || 'Daviteq QA',
        test_note: tr.testNote || '',
        time_finish: tr.timeFinish,
        so_number: tr.soNumber,
        item_code: tr.itemCode,
        sku: tr.sku,
      } : {
        result: 'PASS',
        start_time: '',
        duration_time: '',
        test_station: 'STATION-01',
        test_person: 'Daviteq QA',
        test_note: '',
      },
      telemetry_count: telemetryRows.length,
      event_stats: eventStats,
      general_info: generalInfoRows,
      params_1: params1Rows,
      params_2: params2Rows,
      params_3: params3Rows,
      params_4: params4Rows,
      raw_telemetry: rawTelemetry,
      telemetry: rawTelemetry,
      calculations: allCalculations,
      raw_data_summary: rawDataSummary,
      rawDataSummary,
      decoded_config: decodedConfig,
      trend_series: {
        timestamps,
        epochtimes,
        com1: com1Values,
        com2: com2Values,
        parameters: activeParameters,
      },

      // CamelCase properties for backward compatibility:
      testResult: tr,
      generalInfo: {
        testId,
        serialNumber: parsedInfo.serialNumber,
        deviceKey: parsedInfo.deviceKey,
        sku: parsedInfo.sku,
        itemCode: parsedInfo.itemCode,
        hwVer: parsedInfo.hwVer,
        fwVer: parsedInfo.fwVer,
        sensorType: parsedInfo.sensorType,
        testStation: tr?.testStation || 'STATION-01',
        testPerson: tr?.testPerson || 'Daviteq QA',
        result: tr?.result || 'PASS',
        startTime: tr?.startTime || '',
        timeFinish: tr?.timeFinish || Date.now(),
        durationTime: tr?.durationTime || '00:30:00',
        dataCount: tr?.dataCount ? parseInt(tr.dataCount, 10) : telemetryRows.length,
        actualCyclicPeriod: tr?.actualCyclicPeriod || '60s',
        avgCom1: com1Stats.avg || (tr?.avgCom1 ? Number(tr.avgCom1) : 3.6),
        avgCom2: com2Stats.avg || 0,
        testNote: tr?.testNote || 'Production inspection verified.',
      },
      decodedConfig,
      sensorParameters1,
      sensorParameters2,
      sensorParameters3,
      sensorParameters4,
      eventStats,
      trendSeries: {
        timestamps,
        epochtimes,
        com1: com1Values,
        com2: com2Values,
        parameters: activeParameters,
      },
    };
  }

  /**
   * Decode Modbus / LoRa configuration string into register map
   */
  public decodeFinalConfig(
    configStr: string,
    paramsNameStr: string,
    paramsTypeStr: string,
    paramsLenStr: string,
  ): DecodedConfigRegister[] {
    if (!configStr || !paramsNameStr) return [];

    const hexToAscii = (hex: string) => {
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substring(i, i + 2), 16);
        if (code >= 32 && code <= 126) str += String.fromCharCode(code);
      }
      return str.trim();
    };

    const hexToFloat32 = (hex: string) => {
      if (hex.length !== 8) return 0;
      const num = parseInt(hex, 16);
      const sign = num >> 31 ? -1 : 1;
      const exp = ((num >> 23) & 0xff) - 127;
      const mant = (num & 0x7fffff) | 0x800000;
      return Number((sign * (mant / 0x800000) * Math.pow(2, exp)).toFixed(3));
    };

    let hexArray: string[] = [];
    if (configStr.includes('|')) {
      hexArray = configStr.split('|');
    } else {
      const lengths = (paramsLenStr || '').split('|').map(Number);
      let offset = 0;
      for (let i = 0; i < lengths.length; i++) {
        const lenInChars = (lengths[i] || 1) * 4;
        const chunk = configStr.substring(offset, offset + lenInChars);
        hexArray.push(chunk);
        offset += lenInChars;
      }
    }

    const paramNames = paramsNameStr.split('|');
    const paramTypes = (paramsTypeStr || '').split('|');
    const decodedTable: DecodedConfigRegister[] = [];
    let currentReg = 1;

    for (let i = 0; i < paramNames.length; i++) {
      const name = paramNames[i].trim();
      if (!name) continue;

      const rawHex = (hexArray[i] || '').trim();
      const fmt = (paramTypes[i] || 'hex').trim().toLowerCase();
      const wordLen = Math.max(1, Math.ceil(rawHex.length / 4));

      let decodedVal: string | number = rawHex;
      switch (fmt) {
        case 'uint16':
          decodedVal = parseInt(rawHex.substring(0, 4), 16) || 0;
          break;
        case 'int16': {
          let v = parseInt(rawHex.substring(0, 4), 16) || 0;
          if (v > 32767) v -= 65536;
          decodedVal = v;
          break;
        }
        case 'uint32':
          decodedVal = parseInt(rawHex.substring(0, 8), 16) || 0;
          break;
        case 'float':
        case 'float32':
          decodedVal = hexToFloat32(rawHex);
          break;
        case 'string':
          decodedVal = hexToAscii(rawHex) || rawHex;
          break;
        case 'hex':
        default:
          decodedVal = rawHex.toUpperCase();
          break;
      }

      decodedTable.push({
        reg: `Reg ${currentReg}`,
        format: fmt,
        para: name,
        value: decodedVal,
      });

      currentReg += wordLen;
    }

    return decodedTable;
  }

  /**
   * Export test results to standard CSV format
   */
  async exportCsv(query: QueryTestResultsDto): Promise<string> {
    const testId = query.testId || (query as any).test_id;
    if (testId) {
      // Export device telemetry details CSV
      const details = await this.getDeviceTestDetails(testId, query);
      const headers = ['TIMESTAMP', 'UPLINK_PAYLOAD', 'SPREADING_FACTOR', 'RSSI_COM1', 'SNR_COM2', 'P1', 'P2', 'P3', 'P4', 'P5'];
      const rows = (details.raw_telemetry || []).map((r: any) => [
        r.timestamp || '',
        r.uplink_payload || '',
        r.spreading_factor || '',
        r.com1 || '',
        r.com2 || '',
        r.p1 || '',
        r.p2 || '',
        r.p3 || '',
        r.p4 || '',
        r.p5 || '',
      ]);
      return [headers.join(','), ...rows.map((r: any[]) => r.map((c) => `"${c}"`).join(','))].join('\n');
    }

    const { items } = await this.findTestResults({ ...query, limit: 1000 });
    const headers = [
      'SO_NUMBER',
      'SERIAL_NUMBER',
      'ITEM_CODE',
      'SKU',
      'DEVICE_KEY',
      'HW_VER',
      'FW_VER',
      'START_TIME',
      'DURATION_TIME',
      'RESULT',
      'LABEL_CHECK_CODE',
      'DATA_COUNT',
      'ACTUAL_CYCLIC_PERIOD',
      'AVG_COM1',
      'TEST_STATION',
      'TEST_PERSON',
      'TEST_ID',
      'TEST_NOTE',
    ];

    const rows = items.map((r) => [
      r.soNumber || '',
      r.serialNumber || '',
      r.itemCode || '',
      r.sku || '',
      r.deviceKey || '',
      r.hwVer || '',
      r.fwVer || '',
      r.startTime || '',
      r.durationTime || '',
      r.result || 'PASS',
      r.labelCheckCode || r.autoCheck || '',
      r.dataCount || '0',
      r.actualCyclicPeriod || '',
      r.avgCom1 || '',
      r.testStation || '',
      r.testPerson || '',
      r.testId || '',
      (r.testNote || '').replace(/[\n\r,]/g, ' '),
    ]);

    return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
  }

  /**
   * Save or sync a test result from the Test Automation execution engine
   */
  async recordTestResult(dto: Partial<TestResultEntity>): Promise<TestResultEntity> {
    const record = this.testResultRepo.create({
      ...dto,
      timeFinish: dto.timeFinish || Date.now(),
      result: dto.result || 'PASS',
    });
    return await this.testResultRepo.save(record);
  }

  /**
   * Compute Min, Max, Average, and Latest for a parameter array
   */
  public computeStats(values: (number | null)[], paramKey: string, customName?: string): ParameterMinMaxAvg {
    const valid = values.filter((v): v is number => v !== null && !isNaN(v));
    if (valid.length === 0) {
      return {
        paramKey,
        name: customName || paramKey.toUpperCase(),
        min: null,
        max: null,
        avg: null,
        latest: null,
        count: 0,
      };
    }
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const sum = valid.reduce((a, b) => a + b, 0);
    const avg = Number((sum / valid.length).toFixed(3));
    const latest = valid[valid.length - 1];
    return {
      paramKey,
      name: customName || paramKey.toUpperCase(),
      min: Number(min.toFixed(3)),
      max: Number(max.toFixed(3)),
      avg,
      latest: Number(latest.toFixed(3)),
      count: valid.length,
    };
  }

  /**
   * Compute Event Distribution (Node-RED Flow 1: event_s, event_p, event_f, event_c, event_a, event_h, event_sch, event_lns)
   */
  public computeEventDistribution(p1Events: (number | null)[]): EventDistributionStats {
    const countOccurrences = (arr: (number | null)[], val: number) => arr.filter((x) => x === val).length;
    return {
      event_s: countOccurrences(p1Events, 0), // 0: Normal / periodic
      event_p: countOccurrences(p1Events, 1), // 1: Power up
      event_f: countOccurrences(p1Events, 2), // 2: Fault
      event_c: countOccurrences(p1Events, 3), // 3: Configuration
      event_a: countOccurrences(p1Events, 4), // 4: Alarm
      event_h: countOccurrences(p1Events, 5), // 5: Heartbeat
      event_sch: countOccurrences(p1Events, 14), // 14: Schedule
      event_lns: countOccurrences(p1Events, 15), // 15: LNS Join
    };
  }
}
