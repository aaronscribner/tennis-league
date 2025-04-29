import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '../config/config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.getAuth0Domain().then(domain => domain)}/.well-known/jwks.json`,
      }),
      audience: configService.getAuth0Audience().then(audience => audience),
      issuer: `https://${configService.getAuth0Domain().then(domain => domain)}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: any) {
    // This will be attached to the Request as req.user
    return {
      userId: payload.sub,
      username: payload.nickname,
      email: payload.email,
      permissions: payload.permissions || [],
    };
  }
}