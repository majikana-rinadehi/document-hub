import { NotionProcessor } from './processor';
import {
  ErrorType,
} from './types';
import type {
  NotionProcessorConfig,
  ProcessedArticle,
  BatchProcessOptions,
  BatchProcessResult,
  RetryOptions,
  ErrorClassifier,
} from './types';

/**
 * 設定検証関数
 * 設定オブジェクトを検証し、デフォルト値を適用する
 */
export function validateConfig(config: Partial<NotionProcessorConfig>): NotionProcessorConfig {
  // 必須項目の検証
  if (!config.notionApiKey) {
    throw new Error('Notion APIキーが設定されていません');
  }

  // imageDirectoryの検証
  if (config.imageDirectory !== undefined && typeof config.imageDirectory !== 'string') {
    throw new Error('imageDirectoryは文字列である必要があります');
  }

  if (config.imageDirectory === '') {
    throw new Error('imageDirectoryは空文字列にできません');
  }

  // imageUrlPrefixの検証
  if (config.imageUrlPrefix !== undefined && typeof config.imageUrlPrefix !== 'string') {
    throw new Error('imageUrlPrefixは文字列である必要があります');
  }

  // maxRetriesの検証
  if (config.maxRetries !== undefined && (config.maxRetries < 0 || config.maxRetries > 10)) {
    throw new Error('maxRetriesは0から10の間である必要があります');
  }

  // retryDelayの検証
  if (config.retryDelay !== undefined && config.retryDelay < 0) {
    throw new Error('retryDelayは0以上である必要があります');
  }

  // デフォルト値の適用
  return {
    notionApiKey: config.notionApiKey,
    imageDirectory: config.imageDirectory ?? './images',
    imageUrlPrefix: config.imageUrlPrefix ?? '/images',
    maxRetries: config.maxRetries ?? 3,
    retryDelay: config.retryDelay ?? 1000,
    customTransformers: config.customTransformers,
  };
}

/**
 * 環境変数からProcessorを作成
 * 環境変数から設定を読み込み、オーバーライドを適用してNotionProcessorを作成
 */
export function createNotionProcessor(
  overrides?: Partial<NotionProcessorConfig>,
): NotionProcessor {
  const config = validateConfig({
    notionApiKey: process.env.NOTION_API_KEY || overrides?.notionApiKey,
    imageDirectory: process.env.NOTION_IMAGE_DIR || overrides?.imageDirectory,
    imageUrlPrefix: process.env.NOTION_IMAGE_PREFIX || overrides?.imageUrlPrefix,
    maxRetries: overrides?.maxRetries
      ? overrides.maxRetries
      : process.env.NOTION_MAX_RETRIES
        ? parseInt(process.env.NOTION_MAX_RETRIES, 10)
        : undefined,
    retryDelay: overrides?.retryDelay
      ? overrides.retryDelay
      : process.env.NOTION_RETRY_DELAY
        ? parseInt(process.env.NOTION_RETRY_DELAY, 10)
        : undefined,
    customTransformers: overrides?.customTransformers,
  });

  return new NotionProcessor(config);
}

/**
 * 単一記事処理のラッパー
 * 設定を指定して単一の記事を処理
 */
export async function processNotionArticle(
  articleId: string,
  config?: Partial<NotionProcessorConfig>,
): Promise<ProcessedArticle> {
  const processor = config ? new NotionProcessor(config) : createNotionProcessor();

  return processor.processArticle(articleId);
}

/**
 * 複数記事処理のラッパー
 * 設定とオプションを指定して複数の記事をバッチ処理
 */
export async function processNotionArticles(
  articleIds: string[],
  config?: Partial<NotionProcessorConfig>,
  options?: BatchProcessOptions,
): Promise<BatchProcessResult> {
  const processor = config ? new NotionProcessor(config) : createNotionProcessor();

  return processor.processMultipleArticles(articleIds, options);
}

/**
 * 設定のデフォルト値を取得
 */
export function getDefaultConfig(): NotionProcessorConfig {
  return {
    notionApiKey: '',
    imageDirectory: './images',
    imageUrlPrefix: '/images',
    maxRetries: 3,
    retryDelay: 1000,
  };
}

/**
 * 環境変数の存在チェック
 */
export function checkEnvironmentVariables(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 必須環境変数
  if (!process.env.NOTION_API_KEY) {
    missing.push('NOTION_API_KEY');
  }

  // 推奨環境変数
  if (!process.env.NOTION_IMAGE_DIR) {
    warnings.push('NOTION_IMAGE_DIR (デフォルト: ./images)');
  }

  if (!process.env.NOTION_IMAGE_PREFIX) {
    warnings.push('NOTION_IMAGE_PREFIX (デフォルト: /images)');
  }

  if (!process.env.NOTION_TEST_PAGE_ID) {
    warnings.push('NOTION_TEST_PAGE_ID (統合テスト用)');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * 設定の健全性チェック
 */
export function validateEnvironment(): boolean {
  const check = checkEnvironmentVariables();

  if (!check.valid) {
    console.error('必須環境変数が設定されていません:', check.missing);

    return false;
  }

  if (check.warnings.length > 0) {
    console.warn('推奨環境変数が設定されていません:', check.warnings);
  }

  return true;
}

/**
 * 設定情報の表示
 */
export function displayConfig(config: NotionProcessorConfig): void {
  console.log('=== Notion Processor 設定 ===');
  console.log(`API Key: ${config.notionApiKey ? '設定済み' : '未設定'}`);
  console.log(`Image Directory: ${config.imageDirectory}`);
  console.log(`Image URL Prefix: ${config.imageUrlPrefix}`);
  console.log(`Max Retries: ${config.maxRetries}`);
  console.log(`Retry Delay: ${config.retryDelay}ms`);
  console.log(`Custom Transformers: ${config.customTransformers ? config.customTransformers.size : 0} 個`);
  console.log('==============================');
}

/**
 * リトライマネージャー
 * 指定された条件でリトライを実行
 */
export class RetryManager {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === options.maxRetries) {
          throw lastError;
        }

        if (options.onRetry) {
          options.onRetry(attempt + 1, lastError);
        }

        // 遅延を計算
        const delay = options.backoff === 'exponential'
          ? options.delay * 2 ** attempt
          : options.delay * (attempt + 1);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

/**
 * エラー分類器の実装
 */
export class DefaultErrorClassifier implements ErrorClassifier {
  classify(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ErrorType.API_LIMIT;
    }

    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return ErrorType.NETWORK_ERROR;
    }

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorType.PERMISSION_DENIED;
    }

    if (message.includes('invalid') || message.includes('not found') || message.includes('bad request')) {
      return ErrorType.INVALID_DATA;
    }

    return ErrorType.UNKNOWN;
  }

  shouldRetry(errorType: ErrorType): boolean {
    switch (errorType) {
      case ErrorType.API_LIMIT:
      case ErrorType.NETWORK_ERROR:
        return true;
      case ErrorType.PERMISSION_DENIED:
      case ErrorType.INVALID_DATA:
        return false;
      case ErrorType.UNKNOWN:
      default:
        return false;
    }
  }

  async getRecoveryStrategy(errorType: ErrorType): Promise<void> {
    switch (errorType) {
      case ErrorType.API_LIMIT:
        // API制限の場合は長めに待機
        await new Promise((resolve) => setTimeout(resolve, 5000));
        break;
      case ErrorType.NETWORK_ERROR:
        // ネットワークエラーの場合は短めに待機
        await new Promise((resolve) => setTimeout(resolve, 1000));
        break;
      default:
        // その他の場合は何もしない
        break;
    }
  }
}

/**
 * エラーハンドリング付きの記事処理
 */
export async function processNotionArticleWithRetry(
  articleId: string,
  config?: Partial<NotionProcessorConfig>,
  retryOptions?: Partial<RetryOptions>,
): Promise<ProcessedArticle> {
  const classifier = new DefaultErrorClassifier();
  const options: RetryOptions = {
    maxRetries: 3,
    delay: 1000,
    backoff: 'exponential',
    ...retryOptions,
  };

  return RetryManager.withRetry(async () => {
    try {
      return await processNotionArticle(articleId, config);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const errorType = classifier.classify(err);

      if (classifier.shouldRetry(errorType)) {
        await classifier.getRecoveryStrategy(errorType);
        throw err; // リトライのために再スロー
      }

      throw err; // リトライしない場合はそのままスロー
    }
  }, options);
}

/**
 * バッチ処理でのエラーハンドリング
 */
export async function processNotionArticlesWithRetry(
  articleIds: string[],
  config?: Partial<NotionProcessorConfig>,
  options?: BatchProcessOptions,
  retryOptions?: Partial<RetryOptions>,
): Promise<BatchProcessResult> {
  const classifier = new DefaultErrorClassifier();
  const defaultRetryOptions: RetryOptions = {
    maxRetries: 2,
    delay: 500,
    backoff: 'linear',
    ...retryOptions,
  };

  // エラーハンドリング付きの処理関数
  const processWithRetry = async (articleId: string): Promise<ProcessedArticle> => RetryManager.withRetry(async () => processNotionArticle(articleId, config), {
    ...defaultRetryOptions,
    onRetry: (attempt, error) => {
      console.warn(`記事 ${articleId} の処理をリトライ中 (${attempt}/${defaultRetryOptions.maxRetries}): ${error.message}`);
    },
  });

  // カスタムバッチ処理の実装
  const successful: ProcessedArticle[] = [];
  const failed: { articleId: string; error: Error }[] = [];
  const concurrency = options?.concurrency ?? 3;

  let completed = 0;

  // 並列処理のためのチャンク分け
  const chunks: string[][] = [];

  for (let i = 0; i < articleIds.length; i += concurrency) {
    chunks.push(articleIds.slice(i, i + concurrency));
  }

  const startTime = Date.now();

  for (const chunk of chunks) {
    const promises = chunk.map(async (articleId) => {
      try {
        const result = await processWithRetry(articleId);

        successful.push(result);
        completed++;

        if (options?.onProgress) {
          options.onProgress(completed, articleIds.length);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        failed.push({ articleId, error: err });
        completed++;

        if (options?.onError) {
          options.onError(err, articleId);
        }

        if (options?.onProgress) {
          options.onProgress(completed, articleIds.length);
        }

        if (!options?.continueOnError) {
          throw err;
        }
      }
    });

    await Promise.all(promises);
  }

  const totalTime = Date.now() - startTime;

  return {
    successful,
    failed,
    totalProcessed: articleIds.length,
    totalTime,
  };
}
