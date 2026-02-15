import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export interface NotionFetcherConfig {
  apiKey: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ArticleMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  properties: Record<string, any>;
}

export interface FetchArticleResponse {
  metadata: ArticleMetadata;
  blocks: BlockObjectResponse[];
}

export class NotionFetcherError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'NotionFetcherError';
  }
}
