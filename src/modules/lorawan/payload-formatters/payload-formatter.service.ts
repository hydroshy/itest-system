import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as vm from 'vm';

@Injectable()
export class PayloadFormatterService {
  private readonly logger = new Logger(PayloadFormatterService.name);

  decodePayload(script: string, bytesHex: string, fPort: number = 1): Record<string, any> {
    const bytes = Buffer.from(bytesHex, 'hex');
    const input = {
      bytes: Array.from(bytes),
      fPort,
    };

    const sandbox = {
      input,
      console: { log: () => {} },
      result: null as any,
    };

    const context = vm.createContext(sandbox);
    const fullScript = `
      ${script}
      if (typeof decodeUplink === 'function') {
        result = decodeUplink(input);
      } else if (typeof Decoder === 'function') {
        result = Decoder(input.bytes, input.fPort);
      } else {
        throw new Error('No valid decode function found (decodeUplink or Decoder)');
      }
    `;

    try {
      const vmScript = new vm.Script(fullScript);
      vmScript.runInContext(context, { timeout: 1000 });
      return sandbox.result || {};
    } catch (err: any) {
      this.logger.error(`Payload decode error: ${err.message}`);
      throw new BadRequestException(`Payload decoder execution failed: ${err.message}`);
    }
  }
}
