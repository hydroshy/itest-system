import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger;
    server: Server;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeTelemetry(client: Socket): {
        event: string;
        topic: string;
    };
    handleSubscribeDevice(client: Socket, data: {
        devEUI?: string;
    }): {
        event: string;
        room: string;
        message?: undefined;
    } | {
        event: string;
        message: string;
        room?: undefined;
    };
    handleSubscribeHmi(client: Socket): {
        event: string;
        topic: string;
    };
    broadcastTelemetry(telemetry: any): void;
    broadcastDownlink(downlinkEvent: any): void;
}
