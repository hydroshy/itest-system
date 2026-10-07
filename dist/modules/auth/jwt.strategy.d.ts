import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { User } from '../users/entities/user.entity';
export interface JwtPayload {
    sub: string;
    username: string;
    userType: string;
}
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly dbService;
    constructor(dbService: DynamicDatabaseService);
    validate(payload: JwtPayload): Promise<User>;
}
export {};
