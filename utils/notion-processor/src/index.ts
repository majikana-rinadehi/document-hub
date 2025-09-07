export { NotionProcessor } from './processor';
export { NotionFetcher } from '@document-hub/notion-fetcher/src/client';
export { NotionConverter } from '@document-hub/notion-converter/src/converter';

export {
  processNotionArticle,
  processNotionArticles,
  createNotionProcessor,
  validateConfig,
} from './helpers';

export type {
  NotionProcessorConfig,
  ProcessedArticle,
  BatchProcessOptions,
  BatchProcessResult,
  NotionProcessorError,
  ArticleMetadata,
  ImageInfo,
  BlockObjectResponse,
  NotionFetcherConfig,
  ConversionConfig,
} from './types';

export { NotionFetcherError } from '@document-hub/notion-fetcher/src/types';
export { NotionConverterError } from '@document-hub/notion-converter/src/types';
