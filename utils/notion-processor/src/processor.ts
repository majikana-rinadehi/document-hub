import { NotionFetcher } from '../../notion-fetcher/src/client';
import { NotionConverter } from '../../notion-converter/src/converter';
import { Client } from '@notionhq/client';
import type {
  NotionProcessorConfig,
  ProcessedArticle,
  BatchProcessOptions,
  BatchProcessResult,
  NotionProcessorError,
} from './types';

export class NotionProcessor {
  private fetcher: NotionFetcher;
  private converter: NotionConverter;
  private config: NotionProcessorConfig;

  constructor(config: NotionProcessorConfig) {
    this.config = config;
    
    this.fetcher = new NotionFetcher({
      apiKey: config.notionApiKey,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
    });

    const notionClient = new Client({
      auth: config.notionApiKey,
    });

    this.converter = new NotionConverter(notionClient, {
      imageDirectory: config.imageDirectory,
      imageUrlPrefix: config.imageUrlPrefix,
      customTransformers: config.customTransformers,
    });
  }

  async processArticle(articleId: string): Promise<ProcessedArticle> {
    try {
      console.log(`記事を処理中: ${articleId}`);
      
      const articleData = await this.fetcher.fetchArticleById(articleId);
      
      const conversionResult = await this.converter.convertPageToMarkdown(
        articleId,
        articleData.blocks,
      );
      
      return {
        metadata: articleData.metadata,
        markdown: conversionResult.markdown,
        images: conversionResult.images,
        processedAt: new Date(),
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

  async processMultipleArticles(
    articleIds: string[],
    options?: BatchProcessOptions,
  ): Promise<BatchProcessResult> {
    const concurrency = options?.concurrency ?? 3;
    const onProgress = options?.onProgress;
    const onError = options?.onError;
    
    const successful: ProcessedArticle[] = [];
    const failed: Array<{ articleId: string; error: Error }> = [];
    
    const chunks = this.chunkArray(articleIds, concurrency);
    let completed = 0;
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (articleId) => {
        try {
          const result = await this.processArticle(articleId);
          successful.push(result);
          completed++;
          
          if (onProgress) {
            onProgress(completed, articleIds.length);
          }
          
          return { success: true, result };
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          failed.push({ articleId, error: err });
          completed++;
          
          if (onError) {
            onError(err, articleId);
          }
          
          if (onProgress) {
            onProgress(completed, articleIds.length);
          }
          
          return { success: false, error: err };
        }
      });
      
      await Promise.all(promises);
    }
    
    return { successful, failed };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPageId = process.env.NOTION_TEST_PAGE_ID;
      if (!testPageId) {
        console.warn('NOTION_TEST_PAGE_IDが設定されていません');
        return false;
      }
      
      await this.fetcher.fetchPageProperties(testPageId);
      return true;
    } catch (error) {
      console.error('Notion APIへの接続テストに失敗:', error);
      return false;
    }
  }

  getConfig(): Readonly<NotionProcessorConfig> {
    return { ...this.config };
  }
}