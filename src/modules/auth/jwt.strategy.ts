import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { User } from '../users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  username: string;
  userType: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly dbService: DynamicDatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
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
  }

  async validate(payload: JwtPayload): Promise<User> {
    const userRepo = this.dbService.getRepositoryForTable('users', User);
    let user: User | null = null;
    try {
      user = await userRepo.findOne({
        where: { id: payload.sub },
        relations: ['roles', 'roles.permissions'],
      });
    } catch (e) {
      user = await userRepo.findOne({
        where: { id: payload.sub },
      });
    }

    if (!user) {
      throw new UnauthorizedException('User not found or session revoked');
    }

    return user;
  }
}
