export interface ModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  authType: 'api_key' | 'oauth' | 'none';
  encryptedSecretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelProfile {
  id: string;
  name: string;
  providerId: string;
  modelName: string;
  endpoint: string | null;
  fallbackProfileId: string | null;
  budgetLimit: number | null;
  budgetUsed: number;
  rateLimitRpm: number | null;
  contextLimitTokens: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateModelProviderInput {
  name: string;
  baseUrl: string;
  authType: 'api_key' | 'oauth' | 'none';
}

export interface CreateModelProfileInput {
  name: string;
  providerId: string;
  modelName: string;
  endpoint?: string;
  fallbackProfileId?: string;
  budgetLimit?: number;
  rateLimitRpm?: number;
  contextLimitTokens?: number;
}
