import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log('⚡ Realtime WebSocket Gateway initialized on port / namespace /');
  }

  handleConnection(client: Socket) {
    this.logger.log(`⚡ WebSocket client connected: [${client.id}]`);
    client.emit('connection:ack', {
      connected: true,
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`⚡ WebSocket client disconnected: [${client.id}]`);
  }

  @SubscribeMessage('subscribe:telemetry')
  handleSubscribeTelemetry(@ConnectedSocket() client: Socket) {
    client.join('telemetry');
    return { event: 'subscribed', topic: 'telemetry' };
  }

  @SubscribeMessage('subscribe:device')
  handleSubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { devEUI?: string },
  ) {
    if (data?.devEUI) {
      const room = `device:${data.devEUI.trim().toUpperCase()}`;
      client.join(room);
      return { event: 'subscribed', room };
    }
    return { event: 'error', message: 'devEUI required' };
  }

  @SubscribeMessage('subscribe:hmi')
  handleSubscribeHmi(@ConnectedSocket() client: Socket) {
    client.join('hmi');
    return { event: 'subscribed', topic: 'hmi' };
  }

  broadcastTelemetry(telemetry: any) {
    if (!this.server) return;
    // Broadcast to root room and telemetry room
    this.server.emit('telemetry:uplink', telemetry);
    this.server.to('telemetry').emit('telemetry:uplink', telemetry);
    this.server.to('hmi').emit('telemetry:uplink', telemetry);

    // Broadcast to device-specific room if devEUI is present
    const devEUI = (telemetry?.devEUI || telemetry?.devEui || '').trim().toUpperCase();
    if (devEUI) {
      this.server.to(`device:${devEUI}`).emit('telemetry:uplink', telemetry);
    }
  }

  broadcastDownlink(downlinkEvent: any) {
    if (!this.server) return;
    this.server.emit('downlink:status', downlinkEvent);
    this.server.to('hmi').emit('downlink:status', downlinkEvent);

    const devEUI = (downlinkEvent?.devEUI || '').trim().toUpperCase();
    if (devEUI) {
      this.server.to(`device:${devEUI}`).emit('downlink:status', downlinkEvent);
    }
  }
}
