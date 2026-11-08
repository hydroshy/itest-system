import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Optional,
} from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { RealtimeService } from '../realtime/modules/realtime/realtime.service';
import { SoTestBatchEntity } from '../core-models/so-test-batch.entity';

export interface LinkSoBatchDto {
  soId?: string;
  soNumber?: string;
  batchId?: string;
  batchCode?: string;
  notes?: string;
  createdBy?: string;
}

export interface UnlinkSoBatchDto {
  linkId?: string;
  soId?: string;
  soNumber?: string;
  batchId?: string;
}

@Controller()
export class SoTestBatchAdapterController {
  private readonly logger = new Logger(SoTestBatchAdapterController.name);

  constructor(
    private readonly databaseService: DynamicDatabaseService,
    @Optional() private readonly realtimeService?: RealtimeService,
  ) {}

  private getDataSource() {
    return this.databaseService.getDataSourceForTable('so_test_batches');
  }

  private getRepository() {
    return this.databaseService.getRepositoryForTable('so_test_batches', SoTestBatchEntity);
  }

  // ============================================================================
  // 1. GET SOs WITH ASSOCIATED TEST BATCHES (TABULATOR & QUICK FILTER)
  // ============================================================================
  @Get([
    'api/v1/plugins/so-test-batch/sos',
    'api/plugins/so-test-batch/sos',
    'plugins/so-test-batch/sos',
    'api/v1/plugins/testing/so-test-batch/sos',
    'api/plugins/testing/so-test-batch/sos',
    'plugins/testing/so-test-batch/sos',
  ])
  async getSos(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const ds = this.getDataSource();

      let sql = `
        SELECT
          so_id AS "id",
          so_number AS "soNumber",
          COALESCE(customer_name, '—') AS "customerName",
          customer_email AS "customerEmail",
          partner_email AS "partnerEmail",
          notes,
          created_at AS "createdAt",
          updated_at AS "updatedAt",
          COALESCE(test_batches, '[]'::jsonb) AS "testBatches",
          COALESCE(test_batch_count, 0) AS "testBatchCount"
        FROM system_schema.v_so_with_test_batches
        WHERE 1=1
      `;
      const params: any[] = [];

      if (status === 'HAS_BATCH') {
        sql += ` AND test_batch_count > 0`;
      } else if (status === 'NO_BATCH') {
        sql += ` AND test_batch_count = 0`;
      }

      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        const idx = params.length;
        sql += ` AND (
          so_number ILIKE $${idx}
          OR customer_name ILIKE $${idx}
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(COALESCE(test_batches, '[]'::jsonb)) elem
            WHERE elem->>'batchCode' ILIKE $${idx} OR elem->>'batchName' ILIKE $${idx}
          )
        )`;
      }

      sql += ` ORDER BY created_at DESC`;

      if (limit && parseInt(limit, 10) > 0) {
        const lim = parseInt(limit, 10);
        const p = page && parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
        sql += ` LIMIT ${lim} OFFSET ${(p - 1) * lim}`;
      }

      const rows = await ds.query(sql, params).catch(async (err) => {
        this.logger.warn(`View v_so_with_test_batches error, falling back to direct join: ${err.message}`);
        return ds.query(`
          SELECT
            so.id AS "id",
            so.so_number AS "soNumber",
            COALESCE(so.customer_name, '—') AS "customerName",
            so.customer_email AS "customerEmail",
            so.partner_email AS "partnerEmail",
            so.notes,
            so.created_at AS "createdAt",
            so.updated_at AS "updatedAt",
            COALESCE(
              JSONB_AGG(
                JSONB_BUILD_OBJECT(
                  'linkId', sotb.id,
                  'batchId', b.id,
                  'batchCode', b.batch_code,
                  'batchName', b.batch_name,
                  'itemCode', b.item_code,
                  'fwVersion', b.fw_version,
                  'status', b.status,
                  'deviceCount', COALESCE((SELECT COUNT(*)::int FROM system_schema.device_test_batch_items bi WHERE bi.batch_id = b.id), 0),
                  'linkedAt', sotb.created_at
                ) ORDER BY sotb.created_at DESC
              ) FILTER (WHERE sotb.id IS NOT NULL),
              '[]'::jsonb
            ) AS "testBatches",
            COUNT(sotb.id)::int AS "testBatchCount"
          FROM traceability_manager.traceability_so so
          LEFT JOIN system_schema.so_test_batches sotb ON so.id = sotb.so_id
          LEFT JOIN system_schema.device_test_batches b ON sotb.batch_id = b.id
          GROUP BY so.id, so.so_number, so.customer_name, so.customer_email, so.partner_email, so.notes, so.created_at, so.updated_at
          ORDER BY so.created_at DESC
        `);
      });

      return {
        success: true,
        data: rows,
        total: rows.length,
      };
    } catch (error: any) {
      this.logger.error(`Error querying SOs with test batches: ${error.message}`);
      throw new HttpException(
        { success: false, message: error.message || 'Lỗi khi tải danh sách SO' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // 2. GET AVAILABLE TEST BATCHES FOR LINKING MODAL
  // ============================================================================
  @Get([
    'api/v1/plugins/so-test-batch/available-batches',
    'api/plugins/so-test-batch/available-batches',
    'plugins/so-test-batch/available-batches',
    'api/v1/plugins/testing/so-test-batch/available-batches',
    'api/plugins/testing/so-test-batch/available-batches',
    'plugins/testing/so-test-batch/available-batches',
  ])
  async getAvailableBatches() {
    try {
      const ds = this.getDataSource();
      const rows = await ds.query(`
        SELECT
          id,
          batch_code AS "batchCode",
          batch_name AS "batchName",
          item_code AS "itemCode",
          long_fw AS "longFw",
          fw_version AS "fwVersion",
          simu_id AS "simuId",
          max_devices AS "maxDevices",
          status,
          verdict,
          duration_seconds AS "durationSeconds",
          created_at AS "createdAt",
          device_count AS "deviceCount"
        FROM system_schema.v_available_test_batches
        ORDER BY created_at DESC
      `).catch(async (err) => {
        this.logger.warn(`View v_available_test_batches error, falling back to direct table: ${err.message}`);
        return ds.query(`
          SELECT
            b.id,
            b.batch_code AS "batchCode",
            b.batch_name AS "batchName",
            b.item_code AS "itemCode",
            b.long_fw AS "longFw",
            b.fw_version AS "fwVersion",
            b.simu_id AS "simuId",
            b.max_devices AS "maxDevices",
            b.status,
            b.verdict,
            b.duration_seconds AS "durationSeconds",
            b.created_at AS "createdAt",
            COALESCE((SELECT COUNT(*)::int FROM system_schema.device_test_batch_items bi WHERE bi.batch_id = b.id), 0) AS "deviceCount"
          FROM system_schema.device_test_batches b
          ORDER BY b.created_at DESC
        `);
      });

      return {
        success: true,
        data: rows,
        total: rows.length,
      };
    } catch (error: any) {
      this.logger.error(`Error querying available batches: ${error.message}`);
      throw new HttpException(
        { success: false, message: error.message || 'Lỗi khi tải danh sách Test Batch' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // 3. LINK TEST BATCH TO SO
  // ============================================================================
  @Post([
    'api/v1/plugins/so-test-batch/link',
    'api/plugins/so-test-batch/link',
    'plugins/so-test-batch/link',
    'api/v1/plugins/testing/so-test-batch/link',
    'api/plugins/testing/so-test-batch/link',
    'plugins/testing/so-test-batch/link',
  ])
  async linkBatch(@Body() dto: LinkSoBatchDto) {
    if (!dto) {
      throw new BadRequestException('Request body is required');
    }

    const ds = this.getDataSource();

    // 1. Resolve SO
    let soId = dto.soId;
    let soNumber = dto.soNumber;

    if (!soId && !soNumber) {
      throw new BadRequestException('Cần cung cấp soId hoặc soNumber');
    }

    if (!soId && soNumber) {
      const soRows = await ds.query(
        `SELECT id, so_number FROM traceability_manager.traceability_so WHERE so_number = $1 LIMIT 1`,
        [soNumber],
      );
      if (!soRows || soRows.length === 0) {
        throw new NotFoundException(`Không tìm thấy SO với mã ${soNumber}`);
      }
      soId = soRows[0].id;
    } else if (soId && !soNumber) {
      const soRows = await ds.query(
        `SELECT id, so_number FROM traceability_manager.traceability_so WHERE id = $1 LIMIT 1`,
        [soId],
      );
      if (!soRows || soRows.length === 0) {
        throw new NotFoundException(`Không tìm thấy SO với id ${soId}`);
      }
      soNumber = soRows[0].so_number;
    }

    // 2. Resolve Test Batch
    let batchId = dto.batchId;
    let batchCode = dto.batchCode;

    if (!batchId && !batchCode) {
      throw new BadRequestException('Cần cung cấp batchId hoặc batchCode');
    }

    if (!batchId && batchCode) {
      const batchRows = await ds.query(
        `SELECT id, batch_code FROM system_schema.device_test_batches WHERE batch_code = $1 LIMIT 1`,
        [batchCode],
      );
      if (!batchRows || batchRows.length === 0) {
        throw new NotFoundException(`Không tìm thấy Test Batch với mã ${batchCode}`);
      }
      batchId = batchRows[0].id;
    } else if (batchId && !batchCode) {
      const batchRows = await ds.query(
        `SELECT id, batch_code FROM system_schema.device_test_batches WHERE id = $1 LIMIT 1`,
        [batchId],
      );
      if (!batchRows || batchRows.length === 0) {
        throw new NotFoundException(`Không tìm thấy Test Batch với id ${batchId}`);
      }
      batchCode = batchRows[0].batch_code;
    }

    // 3. Check for existing link
    const existing = await ds.query(
      `SELECT id FROM system_schema.so_test_batches WHERE so_id = $1 AND batch_id = $2 LIMIT 1`,
      [soId, batchId],
    );
    if (existing && existing.length > 0) {
      throw new BadRequestException(`Test Batch ${batchCode} đã được liên kết với SO ${soNumber} trước đó.`);
    }

    // 4. Insert link
    const insertRes = await ds.query(
      `INSERT INTO system_schema.so_test_batches (so_id, so_number, batch_id, batch_code, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, so_id, so_number, batch_id, batch_code, notes, created_at`,
      [soId, soNumber, batchId, batchCode, dto.notes || null, dto.createdBy || 'SYSTEM'],
    );

    const record = insertRes[0];

    // Realtime notification
    try {
      this.realtimeService?.publishPluginLifecycle?.('so-test-batch:linked', {
        linkId: record.id,
        soId,
        soNumber,
        batchId,
        batchCode,
      });
    } catch {}

    return {
      success: true,
      message: `Đã liên kết Test Batch ${batchCode} với SO ${soNumber} thành công`,
      data: record,
    };
  }

  // ============================================================================
  // 4. UNLINK TEST BATCH FROM SO
  // ============================================================================
  @Post([
    'api/v1/plugins/so-test-batch/unlink',
    'api/plugins/so-test-batch/unlink',
    'plugins/so-test-batch/unlink',
    'api/v1/plugins/testing/so-test-batch/unlink',
    'api/plugins/testing/so-test-batch/unlink',
    'plugins/testing/so-test-batch/unlink',
  ])
  async unlinkBatch(@Body() dto: UnlinkSoBatchDto) {
    if (!dto) {
      throw new BadRequestException('Request body is required');
    }

    const ds = this.getDataSource();

    let deletedRows: any[] = [];

    if (dto.linkId) {
      deletedRows = await ds.query(
        `DELETE FROM system_schema.so_test_batches WHERE id = $1 RETURNING id, so_id, so_number, batch_id, batch_code`,
        [dto.linkId],
      );
    } else if (dto.soId && dto.batchId) {
      deletedRows = await ds.query(
        `DELETE FROM system_schema.so_test_batches WHERE so_id = $1 AND batch_id = $2 RETURNING id, so_id, so_number, batch_id, batch_code`,
        [dto.soId, dto.batchId],
      );
    } else if (dto.soNumber && dto.batchId) {
      deletedRows = await ds.query(
        `DELETE FROM system_schema.so_test_batches WHERE so_number = $1 AND batch_id = $2 RETURNING id, so_id, so_number, batch_id, batch_code`,
        [dto.soNumber, dto.batchId],
      );
    } else {
      throw new BadRequestException('Cần cung cấp linkId hoặc cặp (soId/soNumber, batchId) để hủy liên kết');
    }

    if (!deletedRows || deletedRows.length === 0) {
      throw new NotFoundException('Không tìm thấy liên kết phù hợp để hủy');
    }

    const rec = deletedRows[0];

    try {
      this.realtimeService?.publishPluginLifecycle?.('so-test-batch:unlinked', {
        linkId: rec.id,
        soId: rec.so_id,
        soNumber: rec.so_number,
        batchId: rec.batch_id,
        batchCode: rec.batch_code,
      });
    } catch {}

    return {
      success: true,
      message: `Đã hủy liên kết Test Batch ${rec.batch_code} khỏi SO ${rec.so_number}`,
      data: rec,
    };
  }

  @Delete([
    'api/v1/plugins/so-test-batch/unlink/:linkId',
    'api/plugins/so-test-batch/unlink/:linkId',
    'plugins/so-test-batch/unlink/:linkId',
    'api/v1/plugins/so-test-batch/link/:linkId',
  ])
  async unlinkBatchByParam(@Param('linkId') linkId: string) {
    return this.unlinkBatch({ linkId });
  }

  // ============================================================================
  // 5. DETAIL OF LINKED BATCHES FOR AN SO
  // ============================================================================
  @Get([
    'api/v1/plugins/so-test-batch/detail/:soId',
    'api/plugins/so-test-batch/detail/:soId',
    'plugins/so-test-batch/detail/:soId',
  ])
  async getSoDetail(@Param('soId') soId: string) {
    const ds = this.getDataSource();
    const rows = await ds.query(
      `SELECT * FROM system_schema.v_so_test_batches_detail WHERE so_id = $1 OR so_number = $1 ORDER BY linked_at DESC`,
      [soId],
    );
    return {
      success: true,
      data: rows,
    };
  }
}
