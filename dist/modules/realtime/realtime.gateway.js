"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor() {
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
    }
    afterInit(server) {
        this.logger.log('⚡ Realtime WebSocket Gateway initialized on port / namespace /');
    }
    handleConnection(client) {
        this.logger.log(`⚡ WebSocket client connected: [${client.id}]`);
        client.emit('connection:ack', {
            connected: true,
            socketId: client.id,
            timestamp: new Date().toISOString(),
        });
    }
    handleDisconnect(client) {
        this.logger.log(`⚡ WebSocket client disconnected: [${client.id}]`);
    }
    handleSubscribeTelemetry(client) {
        client.join('telemetry');
        return { event: 'subscribed', topic: 'telemetry' };
    }
    handleSubscribeDevice(client, data) {
        if (data?.devEUI) {
            const room = `device:${data.devEUI.trim().toUpperCase()}`;
            client.join(room);
            return { event: 'subscribed', room };
        }
        return { event: 'error', message: 'devEUI required' };
    }
    handleSubscribeHmi(client) {
        client.join('hmi');
        return { event: 'subscribed', topic: 'hmi' };
    }
    broadcastTelemetry(telemetry) {
        if (!this.server)
            return;
        this.server.emit('telemetry:uplink', telemetry);
        this.server.to('telemetry').emit('telemetry:uplink', telemetry);
        this.server.to('hmi').emit('telemetry:uplink', telemetry);
        const devEUI = (telemetry?.devEUI || telemetry?.devEui || '').trim().toUpperCase();
        if (devEUI) {
            this.server.to(`device:${devEUI}`).emit('telemetry:uplink', telemetry);
        }
    }
    broadcastDownlink(downlinkEvent) {
        if (!this.server)
            return;
        this.server.emit('downlink:status', downlinkEvent);
        this.server.to('hmi').emit('downlink:status', downlinkEvent);
        const devEUI = (downlinkEvent?.devEUI || '').trim().toUpperCase();
        if (devEUI) {
            this.server.to(`device:${devEUI}`).emit('downlink:status', downlinkEvent);
        }
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:telemetry'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribeTelemetry", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:device'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribeDevice", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:hmi'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribeHmi", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: true,
            credentials: true,
        },
        namespace: '/',
    })
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map