import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config();

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string | undefined };

  constructor() {
    try {
      this.envConfig = process.env;
    } catch (error) {
      this.envConfig = {};
    }
  }

  get(key: string): string {
    return this.envConfig[key] || '';
  }

  getMongoUri(): string {
    return this.get('MONGO_URI') || 'mongodb://localhost:27017/tennis-league';
  }

  getJwtSecret(): string {
    return this.get('JWT_SECRET') || 'your_jwt_secret_key';
  }

  getJwtExpiresIn(): string {
    return this.get('JWT_EXPIRES_IN') || '1d';
  }

  getAuth0Domain(): string {
    return this.get('AUTH0_DOMAIN') || '';
  }

  getAuth0Audience(): string {
    return this.get('AUTH0_AUDIENCE') || '';
  }
}