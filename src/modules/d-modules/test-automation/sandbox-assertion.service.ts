import { Injectable, Logger } from '@nestjs/common';
import * as vm from 'vm';
import { TestAssertionEntity } from '../../c-modules/test-builder/entities/test-assertion.entity';
import { TestTemplateEntity } from '../../c-modules/test-builder/entities/test-template.entity';
import { MemmapRegEntity } from '../../c-modules/memmap-upload/entities/memmap-reg.entity';

export interface AssertionEvalResult {
  fieldName: string;
  operator: string;
  expectedValue?: any;
  actualValue?: any;
  pass: boolean;
  severity?: string;
  message?: string;
}

export interface SandboxExecutionContext {
  sessionId?: string;
  sessionCode?: string;
  soCode?: string;
  itemCode?: string;
  sku?: string;
  shortFw?: number;
  devEUI?: string;
  packetCount?: number;
  minPackets?: number;
  durationSeconds?: number;
}

@Injectable()
export class SandboxAssertionService {
  private readonly logger = new Logger(SandboxAssertionService.name);

  /**
   * Helper to extract nested JSON values like 'sensors.temperature' or 'data.temperature'
   */
  public extractFieldValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    if (obj[path] !== undefined) return obj[path];
    const parts = path.split('.');
    let cur = obj;
    for (const part of parts) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[part];
    }
    return cur;
  }

  /**
   * Evaluate a single declarative assertion rule against an actual value.
   * ponytail: compact switch statement covering standard operators with tolerance.
   */
  public evaluateSingleAssertion(
    assertRule: Partial<TestAssertionEntity> & { fieldName: string; operator: string },
    actual: any,
  ): AssertionEvalResult {
    const op = (assertRule.operator || 'EQUALS').toUpperCase();
    const expected = assertRule.expectedValue;
    const tolerance = assertRule.tolerance || 0;
    const severity = assertRule.severity || 'ERROR';

    let pass = false;
    let message = '';

    if (actual === undefined || actual === null) {
      return {
        fieldName: assertRule.fieldName,
        operator: op,
        expectedValue: expected,
        actualValue: actual,
        pass: op === 'IS_NULL',
        severity,
        message:
          op === 'IS_NULL'
            ? 'Field is null as expected'
            : `Field '${assertRule.fieldName}' missing from decoded payload`,
      };
    }

    switch (op) {
      case 'EQUALS':
        if (typeof expected === 'number' && typeof actual === 'number' && tolerance > 0) {
          pass = Math.abs(actual - expected) <= tolerance;
          message = pass
            ? `${actual} == ${expected} (tolerance ±${tolerance})`
            : `${actual} deviated from ${expected} beyond ±${tolerance}`;
        } else {
          pass = String(actual).trim() === String(expected).trim();
          message = pass ? `${actual} == ${expected}` : `${actual} != ${expected}`;
        }
        break;

      case 'NOT_EQUALS':
        pass = String(actual).trim() !== String(expected).trim();
        message = pass ? `${actual} != ${expected}` : `${actual} == ${expected}`;
        break;

      case 'GREATER_THAN':
        pass = Number(actual) > Number(expected);
        message = pass ? `${actual} > ${expected}` : `${actual} <= ${expected}`;
        break;

      case 'LESS_THAN':
        pass = Number(actual) < Number(expected);
        message = pass ? `${actual} < ${expected}` : `${actual} >= ${expected}`;
        break;

      case 'BETWEEN':
      case 'IN_RANGE':
        let min = -Infinity;
        let max = Infinity;
        if (expected && typeof expected === 'object') {
          min = expected.min !== undefined ? Number(expected.min) : -Infinity;
          max = expected.max !== undefined ? Number(expected.max) : Infinity;
        } else if (Array.isArray(expected) && expected.length >= 2) {
          min = Number(expected[0]);
          max = Number(expected[1]);
        }
        pass = Number(actual) >= min && Number(actual) <= max;
        message = pass
          ? `${actual} is within range [${min}, ${max}]`
          : `${actual} is outside range [${min}, ${max}]`;
        break;

      case 'IS_NOT_NULL':
        pass = actual !== null && actual !== undefined && actual !== '';
        message = pass ? `Field '${assertRule.fieldName}' is populated` : 'Field is empty';
        break;

      case 'CONTAINS':
        pass = String(actual).includes(String(expected));
        message = pass ? `${actual} contains '${expected}'` : `${actual} missing '${expected}'`;
        break;

      case 'REGEX':
        try {
          const reg = new RegExp(String(expected));
          pass = reg.test(String(actual));
          message = pass ? `${actual} matches pattern` : `${actual} does not match regex`;
        } catch (e: any) {
          pass = false;
          message = `Invalid regex pattern: ${e.message}`;
        }
        break;

      default:
        pass = false;
        message = `Unknown assertion operator '${op}'`;
    }

    return {
      fieldName: assertRule.fieldName,
      operator: op,
      expectedValue: expected,
      actualValue: actual,
      pass,
      severity,
      message,
    };
  }

  /**
   * Run custom JavaScript assertions inside an isolated Node.js VM sandbox.
   * Prevents prototype pollution and timeouts safely.
   */
  public executeSandboxScript(
    scriptCode: string,
    packet: any,
    context: SandboxExecutionContext,
    memmapRegs?: MemmapRegEntity[],
  ): { pass: boolean; message?: string; logs?: string[] } {
    const logs: string[] = [];

    const fPortVal = packet?.fPort ?? packet?.FPORT ?? 1;
    const fCntVal = packet?.fCnt ?? packet?.FCNT ?? 0;
    const rssiVal = packet?.rssi ?? packet?.RSSI ?? -75;
    const snrVal = packet?.snr ?? packet?.SNR ?? 9.5;

    const sandbox = {
      packet: {
        devEUI: packet?.devEUI || context.devEUI || '',
        fPort: fPortVal,
        fCnt: fCntVal,
        rssi: rssiVal,
        snr: snrVal,
        payloadHex: packet?.payloadHex || '',
        decoded: packet?.decoded || packet?.decodedData || {},
        // Uppercase aliases for compatibility with legacy test builder scripts
        FPORT: fPortVal,
        FCNT: fCntVal,
        RSSI: rssiVal,
        SNR: snrVal,
      },
      context: {
        sessionId: context.sessionId,
        sessionCode: context.sessionCode,
        soCode: context.soCode,
        itemCode: context.itemCode,
        sku: context.sku,
        shortFw: context.shortFw,
        packetCount: context.packetCount || 1,
        minPackets: context.minPackets || 1,
        durationSeconds: context.durationSeconds || 10,
      },
      memmapRegs: memmapRegs || [],
      console: {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
        error: (...args: any[]) => logs.push('[ERR] ' + args.map(String).join(' ')),
      },
      Math,
      JSON,
      Date,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      Buffer: {
        from: (data: any, enc?: any) => Buffer.from(data, enc),
        isBuffer: (obj: any) => Buffer.isBuffer(obj),
      },
    };

    const vmContext = vm.createContext(sandbox);

    const wrappedCode = `
      (function() {
        ${scriptCode}
        if (typeof evaluate === 'function') {
          return evaluate(packet, context, memmapRegs);
        }
        if (typeof assertPayload === 'function') {
          return assertPayload(packet, context, memmapRegs);
        }
        return true;
      })()
    `;

    try {
      const output = vm.runInContext(wrappedCode, vmContext, { timeout: 1000 });
      if (typeof output === 'boolean') {
        return {
          pass: output,
          message: output ? 'Sandbox assertion passed' : 'Sandbox assertion returned false',
          logs,
        };
      }
      if (typeof output === 'object' && output !== null) {
        return {
          pass: Boolean(output.pass ?? output.success ?? true),
          message: output.message || output.reason || (output.pass ? 'Sandbox assertion passed' : 'Sandbox assertion failed'),
          logs,
        };
      }
      return { pass: true, message: 'Sandbox assertion finished', logs };
    } catch (err: any) {
      this.logger.warn(`Sandbox script execution error: ${err.message}`);
      return {
        pass: false,
        message: `Sandbox assertion error: ${err.message}`,
        logs,
      };
    }
  }

  /**
   * Validate decoded data against Modbus register definitions from Memory Map.
   */
  public validateAgainstMemmap(
    decodedData: Record<string, any>,
    memmapRegs?: MemmapRegEntity[],
  ): AssertionEvalResult[] {
    const results: AssertionEvalResult[] = [];
    if (!memmapRegs || memmapRegs.length === 0) return results;

    for (const reg of memmapRegs) {
      if (!reg.description) continue;
      const descKey = reg.description.trim().toLowerCase();

      // Check if decoded data contains matching key
      const matchingVal =
        decodedData[reg.description] ??
        decodedData[descKey] ??
        decodedData[reg.description.toLowerCase().replace(/\s+/g, '_')];

      if (matchingVal === undefined) continue;

      // Range check if range_val is specified (e.g. "1-247" or "0-1")
      if (reg.range_val && typeof matchingVal === 'number') {
        const rangeMatch = reg.range_val.match(/^(\d+)\s*-\s*(\d+)$/);
        if (rangeMatch) {
          const min = Number(rangeMatch[1]);
          const max = Number(rangeMatch[2]);
          const pass = matchingVal >= min && matchingVal <= max;
          results.push({
            fieldName: reg.description,
            operator: 'IN_RANGE',
            expectedValue: [min, max],
            actualValue: matchingVal,
            pass,
            severity: 'WARNING',
            message: pass
              ? `${reg.description} (${matchingVal}) in range [${min}, ${max}]`
              : `${reg.description} (${matchingVal}) outside range [${min}, ${max}]`,
          });
        }
      }
    }

    return results;
  }

  /**
   * Unified assertion engine pipeline evaluating template rules, VM sandbox script, and Memmap constraints.
   */
  public async evaluateAll(
    template: TestTemplateEntity | undefined,
    decodedData: Record<string, any>,
    packetPayload: any,
    context: SandboxExecutionContext,
    memmapRegs?: MemmapRegEntity[],
  ): Promise<{
    pass: boolean;
    assertionResults: AssertionEvalResult[];
    firstErrorMessage?: string;
  }> {
    const assertionResults: AssertionEvalResult[] = [];
    let overallPass = true;
    let firstErrorMessage = '';

    // 1. Evaluate template declarative rules
    const assertions = template?.assertions || [];
    if (assertions.length > 0) {
      for (const rule of assertions) {
        const actualValue = this.extractFieldValue(decodedData, rule.fieldName);
        const evalResult = this.evaluateSingleAssertion(rule, actualValue);
        assertionResults.push(evalResult);

        if (!evalResult.pass && rule.severity === 'ERROR') {
          overallPass = false;
          if (!firstErrorMessage) {
            firstErrorMessage =
              evalResult.message || `Rule '${rule.fieldLabel || rule.fieldName}' failed`;
          }
        }
      }
    } else {
      // Default heuristic rule if no template assertions
      const defaultRules: Array<{ fieldName: string; operator: string; expectedValue: any; severity: 'ERROR' | 'WARNING' }> = [
        { fieldName: 'battery', operator: 'GREATER_THAN', expectedValue: 2.8, severity: 'WARNING' },
      ];
      for (const rule of defaultRules) {
        const val = this.extractFieldValue(decodedData, rule.fieldName);
        if (val !== undefined) {
          assertionResults.push(this.evaluateSingleAssertion(rule as any, val));
        }
      }
    }

    // 2. Evaluate Custom Sandbox Script if configured
    if (template?.customScript && (template.executionMode === 'SCRIPT' || template.executionMode === 'HYBRID')) {
      const scriptResult = this.executeSandboxScript(
        template.customScript,
        {
          ...packetPayload,
          decoded: decodedData,
        },
        context,
        memmapRegs,
      );

      assertionResults.push({
        fieldName: 'SandboxScript',
        operator: 'SCRIPT',
        expectedValue: 'pass: true',
        actualValue: scriptResult.pass ? 'pass: true' : 'pass: false',
        pass: scriptResult.pass,
        severity: 'ERROR',
        message: scriptResult.message,
      });

      if (!scriptResult.pass) {
        overallPass = false;
        if (!firstErrorMessage) {
          firstErrorMessage = scriptResult.message || 'Custom sandbox script assertion failed';
        }
      }
    }

    // 3. Optional Memmap Constraints validation
    if (memmapRegs && memmapRegs.length > 0) {
      const memmapResults = this.validateAgainstMemmap(decodedData, memmapRegs);
      assertionResults.push(...memmapResults);
    }

    return {
      pass: overallPass,
      assertionResults,
      firstErrorMessage: overallPass ? undefined : firstErrorMessage,
    };
  }
}
