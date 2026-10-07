import { Observable } from 'rxjs';
import { RealtimeService } from './realtime.service';
export declare class RealtimeController {
    private readonly realtimeService;
    constructor(realtimeService: RealtimeService);
    stream(): Observable<MessageEvent>;
    status(): {
        success: boolean;
        websocket: string;
        sse: string;
        timestamp: string;
    };
}
