import { Injectable } from '@nestjs/common';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

@Injectable()
export class ConfigService {
  private secretClient: SecretClient;
  private cache: Map<string, string> = new Map();

  constructor() {
    // This will be configured when running in production with Azure KeyVault access
    const keyVaultName = process.env.KEY_VAULT_NAME;
    
    if (keyVaultName) {
      const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
      this.secretClient = new SecretClient(keyVaultUrl, new DefaultAzureCredential());
    }
  }

  // Default values for local development
  private defaults = {
    'mongodb-connection-string': 'mongodb+srv://tennisleague:ERm559sAusIWQIeD@cluster0.evwk5bc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    'auth0-domain': 'dev-ik81nhdv5j46bwjt.us.auth0.com',
    'auth0-audience': 'https://dev-ik81nhdv5j46bwjt.us.auth0.com/api/v2/',
    'auth0-client-id': 'gZo9AwUnNoOBE2eQ8AdZytbR1zSIk41B',
    'auth0-client-secret': 'xonOvNC3hTdvxDTzrFNo-Kpv-PXob2cOk_4qEEGuvUfB8nKGyGj2VAtI1vThaLpn', // Note: Client secret isn't exposed in the client app
  };

  async getSecret(secretName: string): Promise<string> {
    // Check if we have it cached
    if (this.cache.has(secretName)) {
      return this.cache.get(secretName) || '';
    }

    // For local development or if KeyVault is not configured
    if (!this.secretClient) {
      return this.defaults[secretName] || '';
    }

    try {
      // In production, fetch from Azure KeyVault
      const secret = await this.secretClient.getSecret(secretName);
      const value = secret.value || '';
      
      // Cache the result
      this.cache.set(secretName, value);
      
      return value;
    } catch (error) {
      console.error(`Error fetching secret ${secretName}:`, error);
      
      // Fall back to default values if available
      return this.defaults[secretName] || '';
    }
  }

  // Convenience methods for commonly used secrets
  async getMongoConnectionString(): Promise<string> {
    return this.getSecret('mongodb-connection-string');
  }

  async getAuth0Domain(): Promise<string> {
    return this.getSecret('auth0-domain');
  }

  async getAuth0Audience(): Promise<string> {
    return this.getSecret('auth0-audience');
  }

  async getAuth0ClientId(): Promise<string> {
    return this.getSecret('auth0-client-id');
  }
}