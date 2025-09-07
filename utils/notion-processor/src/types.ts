import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { 
  ArticleMetadata, 
  NotionFetcherConfig 
} from '../../notion-fetcher/src/types';
import type { 
  ConversionConfig, 
  ImageInfo 
} from '../../notion-converter/src/types';

export interface NotionProcessorConfig {
  notionApiKey: string;
  imageDirectory?: string;
  imageUrlPrefix?: string;
  maxRetries?: number;
  retryDelay?: number;
  customTransformers?: Map<string, (block: BlockObjectResponse) => Promise<string>>;
}

export interface ProcessedArticle {
  metadata: ArticleMetadata;
  markdown: string;
  images: ImageInfo[];
  processedAt: Date;
}

export interface BatchProcessOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
  onError?: (error: Error, articleId: string) => void;
}

export interface BatchProcessResult {
  successful: ProcessedArticle[];
  failed: Array<{
    articleId: string;
    error: Error;
  }>;
}

export class NotionProcessorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'NotionProcessorError';
  }
}

export type { 
  ArticleMetadata, 
  ImageInfo,
  BlockObjectResponse,
  NotionFetcherConfig,
  ConversionConfig
};