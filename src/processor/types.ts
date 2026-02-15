import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type {
  ArticleMetadata,
  NotionFetcherConfig,
} from '../fetcher/types';
import type {
  ConversionConfig,
  ImageInfo,
} from '../converter/types';

export interface NotionProcessorConfig {
  notionApiKey: string;
  imageDirectory?: string;
  imageUrlPrefix?: string;
  maxRetries?: number;
  retryDelay?: number;
  customTransformers?: Map<string, (block: BlockObjectResponse) => Promise<string>>;
}

export interface ProcessedArticle {
  metadata: EnhancedArticleMetadata;
  markdown: string;
  images: EnhancedImageInfo[];
  processedAt: Date;
  processingTime?: number;
}

export interface BatchProcessOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
  onError?: (error: Error, articleId: string) => void;
  continueOnError?: boolean;
  retryFailedArticles?: boolean;
}

export interface BatchProcessResult {
  successful: ProcessedArticle[];
  failed: {
    articleId: string;
    error: Error;
  }[];
  totalProcessed?: number;
  totalTime?: number;
}

export class NotionProcessorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'NotionProcessorError';
  }
}

// Enhanced metadata type with additional properties
export interface EnhancedArticleMetadata extends ArticleMetadata {
  tags?: string[];
  author?: string;
  status?: string;
}

// Enhanced image info type with additional properties
export interface EnhancedImageInfo extends ImageInfo {
  width?: number;
  height?: number;
  format?: string;
}

// エラータイプ列挙
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_LIMIT = 'API_LIMIT',
  INVALID_DATA = 'INVALID_DATA',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN = 'UNKNOWN',
}

// リトライオプション
export interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
}

// エラー分類器
export interface ErrorClassifier {
  classify(error: Error): ErrorType;
  shouldRetry(errorType: ErrorType): boolean;
  getRecoveryStrategy(errorType: ErrorType): () => Promise<void>;
}

export type {
  ArticleMetadata,
  ImageInfo,
  BlockObjectResponse,
  NotionFetcherConfig,
  ConversionConfig,
};
