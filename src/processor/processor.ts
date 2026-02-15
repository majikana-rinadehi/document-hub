import { Client } from '@notionhq/client';
import { NotionFetcher } from '../fetcher/client';
import { NotionConverter } from '../converter/converter';
import {
  NotionProcessorError,
} from './types';
import type {
  NotionProcessorConfig,
  ProcessedArticle,
  BatchProcessOptions,
  BatchProcessResult,
  EnhancedArticleMetadata,
  EnhancedImageInfo,
} from './types';

export interface ProcessorContext {
  fetcher: NotionFetcher;
  converter: NotionConverter;
  config: NotionProcessorConfig;
}

export function createProcessor(config: Partial<NotionProcessorConfig>): ProcessorContext {
  // Validate and set defaults
  if (!config.notionApiKey) {
    throw new NotionProcessorError(
      'Notion APIキーが設定されていません',
      'MISSING_API_KEY',
    );
  }

  const processedConfig: NotionProcessorConfig = {
    notionApiKey: config.notionApiKey,
    imageDirectory: config.imageDirectory ?? './images',
    imageUrlPrefix: config.imageUrlPrefix ?? '/images',
    maxRetries: config.maxRetries ?? 3,
    retryDelay: config.retryDelay ?? 1000,
    customTransformers: config.customTransformers,
  };

  const fetcher = new NotionFetcher({
    apiKey: processedConfig.notionApiKey,
    maxRetries: processedConfig.maxRetries,
    retryDelay: processedConfig.retryDelay,
  });

  const notionClient = new Client({
    auth: processedConfig.notionApiKey,
  });

  const converter = new NotionConverter(notionClient, {
    imageDirectory: processedConfig.imageDirectory,
    imageUrlPrefix: processedConfig.imageUrlPrefix,
    customTransformers: processedConfig.customTransformers,
  });

  return {
    fetcher,
    converter,
    config: processedConfig,
  };
}

export async function processArticle(
  context: ProcessorContext,
  articleId: string
): Promise<ProcessedArticle> {
  const startTime = Date.now();

  try {
    const articleData = await context.fetcher.fetchArticleById(articleId);
    const conversionResult = await context.converter.convertPageToMarkdown(articleId);

    // Extract enhanced metadata
    const enhancedMetadata: EnhancedArticleMetadata = {
      ...articleData.metadata,
      tags: extractTags(articleData.metadata.properties),
      author: extractAuthor(articleData.metadata.properties),
      status: extractStatus(articleData.metadata.properties),
    };

    // Enhance image info
    const enhancedImages: EnhancedImageInfo[] = conversionResult.images.map((img) => ({
      ...img,
      format: extractImageFormat(img.originalUrl),
    }));

    const processingTime = Date.now() - startTime;

    return {
      metadata: enhancedMetadata,
      markdown: conversionResult.markdown,
      images: enhancedImages,
      processedAt: new Date(),
      processingTime,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new NotionProcessorError(
        `記事の処理に失敗しました: ${error.message}`,
        'PROCESS_FAILED',
        { articleId, originalError: error },
      );
    }
    throw error;
  }
}

export async function processMultipleArticles(
  context: ProcessorContext,
  articleIds: string[],
  options?: BatchProcessOptions,
): Promise<BatchProcessResult> {
  const startTime = Date.now();
  const concurrency = options?.concurrency ?? 3;
  const onProgress = options?.onProgress;
  const onError = options?.onError;
  const continueOnError = options?.continueOnError ?? true;

  const successful: ProcessedArticle[] = [];
  const failed: { articleId: string; error: Error }[] = [];

  if (articleIds.length === 0) {
    return {
      successful, failed, totalProcessed: 0, totalTime: 0,
    };
  }

  const chunks = chunkArray(articleIds, concurrency);
  let completed = 0;

  const processArticleWithHandling = async (articleId: string): Promise<void> => {
    try {
      const result = await processArticle(context, articleId);

      successful.push(result);
      completed += 1;

      if (onProgress) {
        onProgress(completed, articleIds.length);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      failed.push({ articleId, error: err });
      completed += 1;

      if (onError) {
        onError(err, articleId);
      }

      if (onProgress) {
        onProgress(completed, articleIds.length);
      }

      if (!continueOnError) {
        throw err;
      }
    }
  };

  try {
    for (const chunk of chunks) {
      await Promise.all(chunk.map(processArticleWithHandling));
    }
  } catch (error) {
    if (!continueOnError) {
      throw error;
    }
  }

  const totalTime = Date.now() - startTime;

  return {
    successful,
    failed,
    totalProcessed: articleIds.length,
    totalTime,
  };
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

export async function testConnection(context: ProcessorContext): Promise<boolean> {
  try {
    const testPageId = process.env.NOTION_TEST_PAGE_ID;

    if (!testPageId) {
      throw new NotionProcessorError(
        'テストページIDが設定されていません',
        'MISSING_TEST_PAGE_ID',
      );
    }

    await context.fetcher.fetchPageProperties(testPageId);

    return true;
  } catch (error) {
    console.error('Notion APIへの接続テストに失敗:', error);

    return false;
  }
}

function extractTags(properties: Record<string, any>): string[] {
  const tags = properties.tags || properties.Tags;

  if (tags?.multi_select) {
    return tags.multi_select.map((tag: any) => tag.name);
  }

  return [];
}

function extractAuthor(properties: Record<string, any>): string | undefined {
  const author = properties.author || properties.Author;

  if (author?.people && author.people.length > 0) {
    return author.people[0].name;
  }
  if (author?.rich_text && author.rich_text.length > 0) {
    return author.rich_text[0].text.content;
  }

  return undefined;
}

function extractStatus(properties: Record<string, any>): string | undefined {
  const status = properties.status || properties.Status;

  if (status?.select) {
    return status.select.name;
  }

  return undefined;
}

function extractImageFormat(url: string): string | undefined {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);

  return match ? match[1].toLowerCase() : undefined;
}

// Backward compatibility class wrapper
export class NotionProcessor {
  private context: ProcessorContext;

  constructor(config: Partial<NotionProcessorConfig>) {
    this.context = createProcessor(config);
  }

  get fetcher(): NotionFetcher {
    return this.context.fetcher;
  }

  get converter(): NotionConverter {
    return this.context.converter;
  }

  get config(): NotionProcessorConfig {
    return this.context.config;
  }

  async processArticle(articleId: string): Promise<ProcessedArticle> {
    return processArticle(this.context, articleId);
  }

  async processMultipleArticles(
    articleIds: string[],
    options?: BatchProcessOptions,
  ): Promise<BatchProcessResult> {
    return processMultipleArticles(this.context, articleIds, options);
  }

  async testConnection(): Promise<boolean> {
    return testConnection(this.context);
  }
}
