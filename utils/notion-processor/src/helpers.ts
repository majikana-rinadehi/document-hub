import { NotionProcessor } from './processor';
import type { NotionProcessorConfig, ProcessedArticle } from './types';

export async function processNotionArticle(
  articleId: string,
  config: NotionProcessorConfig,
): Promise<ProcessedArticle> {
  const processor = new NotionProcessor(config);
  return processor.processArticle(articleId);
}

export async function processNotionArticles(
  articleIds: string[],
  config: NotionProcessorConfig,
): Promise<ProcessedArticle[]> {
  const processor = new NotionProcessor(config);
  const result = await processor.processMultipleArticles(articleIds);
  
  if (result.failed.length > 0) {
    console.warn(`${result.failed.length}件の記事の処理に失敗しました:`, result.failed);
  }
  
  return result.successful;
}

export function createNotionProcessor(config: NotionProcessorConfig): NotionProcessor {
  return new NotionProcessor(config);
}

export function validateConfig(config: Partial<NotionProcessorConfig>): boolean {
  if (!config.notionApiKey) {
    console.error('Notion APIキーが設定されていません');
    return false;
  }
  
  if (config.imageDirectory && typeof config.imageDirectory !== 'string') {
    console.error('imageDirectoryは文字列である必要があります');
    return false;
  }
  
  if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 10)) {
    console.error('maxRetriesは0から10の間である必要があります');
    return false;
  }
  
  return true;
}