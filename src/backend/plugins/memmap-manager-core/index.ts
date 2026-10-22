export const MEMMAP_DATA_TYPES = [
  'int16',
  'uint16',
  'int32',
  'uint32',
  'float32',
  'float64',
  'boolean',
  'string',
] as const;

export type MemmapDataType = (typeof MEMMAP_DATA_TYPES)[number];
export type MemmapAccessMode = 'read' | 'write' | 'readwrite';
export type MemmapSourceFormat = 'json' | 'csv';

export interface MemmapRegister {
  id?: string;
  name: string;
  address: number;
  dataType: MemmapDataType;
  scale?: number;
  unit?: string;
  accessMode: MemmapAccessMode;
}

export interface MemmapProfileInput {
  id?: string;
  name: string;
  description?: string;
  sourceFormat: MemmapSourceFormat;
  registers: MemmapRegister[];
}

export interface MemmapImportError {
  row?: number;
  field?: string;
  message: string;
}

export interface MemmapPreviewResult {
  valid: boolean;
  profile?: MemmapProfileInput;
  registers: MemmapRegister[];
  errors: MemmapImportError[];
}

export interface MemmapManagerConfig {
  enabled: boolean;
  options?: Record<string, unknown>;
}

export class MemmapManagerService {
  private config: MemmapManagerConfig = { enabled: true };

  configure(cfg: Partial<MemmapManagerConfig>): void {
    this.config = { ...this.config, ...cfg };
  }

  previewImport(content: string, format?: string): MemmapPreviewResult {
    const sourceFormat = this.resolveFormat(content, format);
    if (!sourceFormat) {
      return this.invalid([{ field: 'format', message: 'Only JSON and CSV MemMap imports are supported' }]);
    }

    let candidate: unknown;
    try {
      candidate = sourceFormat === 'json' ? JSON.parse(content) : this.parseCsv(content);
    } catch (error) {
      return this.invalid([{ message: error instanceof Error ? error.message : 'Unable to parse import file' }]);
    }

    return this.validateProfile(candidate, sourceFormat);
  }

  getStatus() {
    return {
      plugin: 'memmap-manager',
      name: 'Memory Map Manager & Upload',
      enabled: this.config.enabled,
      timestamp: new Date().toISOString(),
    };
  }

  validateProfile(candidate: unknown, sourceFormat: MemmapSourceFormat): MemmapPreviewResult {
    const errors: MemmapImportError[] = [];
    const source = this.asRecord(candidate);
    const suppliedRegisters = Array.isArray(source?.registers)
      ? source.registers
      : Array.isArray(candidate)
        ? candidate
        : undefined;

    const profileName = this.asString(source?.name) || 'Imported Profile';
    const profileDescription = this.asString(source?.description);

    if (!source?.name && !Array.isArray(candidate)) {
      errors.push({ field: 'name', message: 'Profile name is required' });
    }

    if (!suppliedRegisters || suppliedRegisters.length === 0) {
      errors.push({ field: 'registers', message: 'At least one register is required' });
      return {
        valid: false,
        profile: {
          name: profileName,
          description: profileDescription,
          sourceFormat,
          registers: [],
        },
        registers: [],
        errors,
      };
    }

    const seenAddresses = new Map<number, number>();
    const registers: MemmapRegister[] = [];

    suppliedRegisters.forEach((item, index) => {
      const row = index + 1;
      const record = this.asRecord(item);
      if (!record) {
        errors.push({ row, message: 'Register item must be an object' });
        return;
      }

      const name = this.asString(record.name ?? record.parameterName);
      if (!name) {
        errors.push({ row, field: 'name', message: 'Register name is required' });
      }

      const address = this.asFiniteNumber(record.address);
      if (address === undefined || !Number.isInteger(address) || address < 0) {
        errors.push({ row, field: 'address', message: 'Address must be a non-negative integer' });
      } else if (seenAddresses.has(address)) {
        errors.push({
          row,
          field: 'address',
          message: `Duplicate address ${address} previously declared at row ${seenAddresses.get(address)}`,
        });
      } else {
        seenAddresses.set(address, row);
      }

      const rawDataType = this.asString(record.dataType ?? record.format)?.toLowerCase();
      if (!rawDataType || !MEMMAP_DATA_TYPES.includes(rawDataType as MemmapDataType)) {
        errors.push({
          row,
          field: 'dataType',
          message: `dataType must be one of: ${MEMMAP_DATA_TYPES.join(', ')}`,
        });
      }

      const rawAccessMode = this.asString(record.accessMode)?.toLowerCase() ?? 'read';
      const normalizedAccess =
        rawAccessMode === 'read' || rawAccessMode === 'ro'
          ? 'read'
          : rawAccessMode === 'write' || rawAccessMode === 'wo'
            ? 'write'
            : rawAccessMode === 'readwrite' || rawAccessMode === 'rw'
              ? 'readwrite'
              : undefined;

      if (!normalizedAccess) {
        errors.push({
          row,
          field: 'accessMode',
          message: 'accessMode must be one of: read, write, readwrite',
        });
      }

      const scale = this.asOptionalFiniteNumber(record.scale);
      if (record.scale !== undefined && record.scale !== '' && scale === undefined) {
        errors.push({ row, field: 'scale', message: 'scale must be a finite number' });
      }

      const unit = this.asString(record.unit);

      if (name && address !== undefined && Number.isInteger(address) && address >= 0 && rawDataType && MEMMAP_DATA_TYPES.includes(rawDataType as MemmapDataType) && normalizedAccess) {
        registers.push({
          name,
          address,
          dataType: rawDataType as MemmapDataType,
          accessMode: normalizedAccess,
          ...(scale !== undefined ? { scale } : {}),
          ...(unit ? { unit } : {}),
        });
      }
    });

    const valid = errors.length === 0;
    return {
      valid,
      profile: {
        name: profileName,
        description: profileDescription,
        sourceFormat,
        registers,
      },
      registers,
      errors,
    };
  }

  private parseCsv(content: string): Record<string, unknown>[] {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new Error('CSV content is empty');
    }

    const headers = this.parseCsvLine(lines[0]).map((h) => this.normalizeCsvHeader(h));
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i += 1) {
      const values = this.parseCsvLine(lines[i]);
      const row: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
      rows.push(row);
    }

    return rows;
  }

  private normalizeCsvHeader(header: string): string {
    const cleaned = header.trim().replace(/^['"]|['"]$/g, '');
    switch (cleaned.toLowerCase()) {
      case 'parametername':
      case 'register_name':
      case 'registername':
        return 'name';
      case 'format':
      case 'type':
      case 'data_type':
        return 'dataType';
      case 'access_mode':
      case 'access':
        return 'accessMode';
      default:
        return cleaned;
    }
  }

  private parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let quoted = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (quoted) {
      throw new Error('CSV contains an unclosed quoted value');
    }

    cells.push(current.trim());
    return cells;
  }

  private resolveFormat(content: string, format?: string): MemmapSourceFormat | undefined {
    const normalized = format?.toLowerCase().replace(/^\./, '');
    if (normalized === 'json' || normalized === 'csv') return normalized;
    const trimmed = content.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : undefined;
  }

  private invalid(errors: MemmapImportError[]): MemmapPreviewResult {
    return { valid: false, registers: [], errors };
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private asFiniteNumber(value: unknown): number | undefined {
    const num = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
    return Number.isFinite(num) ? num : undefined;
  }

  private asOptionalFiniteNumber(value: unknown): number | undefined {
    return value === undefined || value === '' ? undefined : this.asFiniteNumber(value);
  }
}
