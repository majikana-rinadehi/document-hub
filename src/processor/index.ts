export { NotionProcessor } from './processor';
export { NotionFetcher } from '../fetcher/client';
export { NotionConverter } from '../converter/converter';

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

export { NotionFetcherError } from '../fetcher/types';
export { NotionConverterError } from '../converter/types';
