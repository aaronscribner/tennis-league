import { Injectable, UnauthorizedException } from '@nestjs/common';
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
        jwksUri: `https://dev-ik81nhdv5j46bwjt.us.auth0.com/.well-known/jwks.json`,
      }),
      algorithms: ['RS256'],
    });
  }

  // This method is called by Passport.js to verify and decode the JWT
  async validate(payload: any) {
    // The token has been verified by the JWKS provider at this point,
    // so we just need to extract any additional claims we need
    
    // Extract roles from Auth0 token using the standard namespace format
    const namespace = 'https://api.tennis-league.com';
    const roles = payload[`${namespace}/roles`] || [];
    const permissions = payload[`${namespace}/permissions`] || [];
                 
    // This will be attached to the Request as req.user
    return {
      userId: payload.sub,
      username: payload.nickname || payload.name,
      email: payload.email,
      roles: roles,
      permissions: permissions,
    };
  }
}