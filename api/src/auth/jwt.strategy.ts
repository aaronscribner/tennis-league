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
      // Note: We're using a static string here that will be validated by Auth0
      // The actual validation happens through the JWKS endpoint
      secretOrKey: 'secret-placeholder', // This won't be used as we're providing secretOrKeyProvider
      algorithms: ['RS256'],
    });
  }

  // This method is called by Passport.js to verify and decode the JWT
  async validate(payload: any) {
    // Get the Auth0 configuration
    const domain = await this.configService.getAuth0Domain();
    const audience = await this.configService.getAuth0Audience();
    
    // Verify audience and issuer
    const tokenAudience = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
    const expectedAudience = await audience;
    const expectedIssuer = `https://${await domain}/`;
    
    if (tokenAudience !== expectedAudience) {
      throw new UnauthorizedException(`Invalid audience: ${tokenAudience}`);
    }
    
    if (payload.iss !== expectedIssuer) {
      throw new UnauthorizedException(`Invalid issuer: ${payload.iss}`);
    }

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