import { Controller, Sse, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { RealtimeService } from './realtime.service';

@ApiTags('Realtime Stream (WebSocket & SSE)')
@Controller('api/realtime')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Sse('stream')
  @ApiOperation({ summary: 'Server-Sent Events (SSE) stream for realtime telemetry and downlink events' })
  stream(): Observable<MessageEvent> {
    return this.realtimeService.getStream();
  }

  @Get('status')
  @ApiOperation({ summary: 'Check realtime gateway health and connection status' })
  status() {
    return {
      success: true,
      websocket: 'ready',
      sse: 'active',
      timestamp: new Date().toISOString(),
    };
  }
}
