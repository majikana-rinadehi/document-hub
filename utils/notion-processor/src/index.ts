export { NotionProcessor } from './processor';
export { NotionFetcher } from '../../notion-fetcher/src/client';
export { NotionConverter } from '../../notion-converter/src/converter';

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

export { NotionFetcherError } from '../../notion-fetcher/src/types';
export { NotionConverterError } from '../../notion-converter/src/types';