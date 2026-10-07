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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const dynamic_database_service_1 = require("../database/dynamic-database.service");
const user_entity_1 = require("../users/entities/user.entity");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(dbService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req) => {
                    let token = null;
                    if (req && req.cookies) {
                        token = req.cookies['access_token'] || req.cookies['lorawan_token'];
                    }
                    return token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'super_secret_lorawan_key_2025',
        });
        this.dbService = dbService;
    }
    async validate(payload) {
        const userRepo = this.dbService.getRepositoryForTable('users', user_entity_1.User);
        let user = null;
        const lookupWhere = [];
        if (payload.sub)
            lookupWhere.push({ id: payload.sub });
        if (payload.username)
            lookupWhere.push({ username: payload.username });
        try {
            user = await userRepo.findOne({
                where: lookupWhere.length > 0 ? lookupWhere : { id: payload.sub },
                relations: ['roles', 'roles.permissions'],
            });
        }
        catch (e) {
            try {
                user = await userRepo.findOne({
                    where: lookupWhere.length > 0 ? lookupWhere : { id: payload.sub },
                });
            }
            catch (err) { }
        }
        if (!user) {
            throw new common_1.UnauthorizedException('User not found or session revoked');
        }
        return user;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map