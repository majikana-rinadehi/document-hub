import { describe, test, expect } from 'bun:test';
import { 
  validateConfig, 
  getDefaultConfig,
  checkEnvironmentVariables,
  RetryManager,
  DefaultErrorClassifier 
} from './helpers';
import { ErrorType } from './types';

describe('Unit Tests', () => {
  describe('validateConfig', () => {
    test('有効な設定を検証できる', () => {
      const config = {
        notionApiKey: 'test-key',
        imageDirectory: './images',
        imageUrlPrefix: '/images',
        maxRetries: 3,
        retryDelay: 1000,
      };

      const result = validateConfig(config);
      expect(result).toEqual(config);
    });

    test('APIキーが欠けている場合にエラー', () => {
      const config = {
        imageDirectory: './images',
      };

      expect(() => validateConfig(config)).toThrow(
        'Notion APIキーが設定されていません'
      );
    });

    test('デフォルト値が適用される', () => {
      const config = {
        notionApiKey: 'test-key',
      };

      const result = validateConfig(config);
      expect(result.imageDirectory).toBe('./images');
      expect(result.imageUrlPrefix).toBe('/images');
      expect(result.maxRetries).toBe(3);
      expect(result.retryDelay).toBe(1000);
    });

    test('無効なディレクトリパスでエラー', () => {
      const config = {
        notionApiKey: 'test-key',
        imageDirectory: '', // 空文字は無効
      };

      expect(() => validateConfig(config)).toThrow(
        'imageDirectoryは空文字列にできません'
      );
    });

    test('maxRetriesの範囲チェック', () => {
      const config1 = {
        notionApiKey: 'test-key',
        maxRetries: -1,
      };

      const config2 = {
        notionApiKey: 'test-key',
        maxRetries: 11,
      };

      expect(() => validateConfig(config1)).toThrow(
        'maxRetriesは0から10の間である必要があります'
      );

      expect(() => validateConfig(config2)).toThrow(
        'maxRetriesは0から10の間である必要があります'
      );
    });

    test('retryDelayの範囲チェック', () => {
      const config = {
        notionApiKey: 'test-key',
        retryDelay: -1,
      };

      expect(() => validateConfig(config)).toThrow(
        'retryDelayは0以上である必要があります'
      );
    });
  });

  describe('getDefaultConfig', () => {
    test('デフォルト設定を取得できる', () => {
      const config = getDefaultConfig();
      
      expect(config.notionApiKey).toBe('');
      expect(config.imageDirectory).toBe('./images');
      expect(config.imageUrlPrefix).toBe('/images');
      expect(config.maxRetries).toBe(3);
      expect(config.retryDelay).toBe(1000);
    });
  });

  describe('checkEnvironmentVariables', () => {
    test('環境変数のチェックが機能する', () => {
      // 現在の環境変数を保存
      const originalApiKey = process.env.NOTION_API_KEY;
      
      // 環境変数をクリア
      delete process.env.NOTION_API_KEY;
      
      const result = checkEnvironmentVariables();
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('NOTION_API_KEY');
      
      // 環境変数を復元
      if (originalApiKey) {
        process.env.NOTION_API_KEY = originalApiKey;
      }
    });

    test('必須環境変数が設定されている場合', () => {
      const originalApiKey = process.env.NOTION_API_KEY;
      process.env.NOTION_API_KEY = 'test-key';
      
      const result = checkEnvironmentVariables();
      
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
      
      // 復元
      if (originalApiKey) {
        process.env.NOTION_API_KEY = originalApiKey;
      } else {
        delete process.env.NOTION_API_KEY;
      }
    });
  });

  describe('RetryManager', () => {
    test('成功時はリトライしない', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        return 'success';
      };

      const result = await RetryManager.withRetry(fn, {
        maxRetries: 3,
        delay: 10,
        backoff: 'linear',
      });

      expect(result).toBe('success');
      expect(callCount).toBe(1);
    });

    test('失敗時にリトライする', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('temporary error');
        }
        return 'success';
      };

      const result = await RetryManager.withRetry(fn, {
        maxRetries: 3,
        delay: 10,
        backoff: 'linear',
      });

      expect(result).toBe('success');
      expect(callCount).toBe(3);
    });

    test('最大リトライ回数に達したら失敗', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        throw new Error('persistent error');
      };

      await expect(RetryManager.withRetry(fn, {
        maxRetries: 2,
        delay: 10,
        backoff: 'linear',
      })).rejects.toThrow('persistent error');

      expect(callCount).toBe(3); // 初回 + 2回のリトライ
    });

    test('指数バックオフが機能する', async () => {
      const delays: number[] = [];
      let callCount = 0;
      
      const fn = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('temporary error');
        }
        return 'success';
      };

      const onRetry = (attempt: number) => {
        delays.push(attempt);
      };

      await RetryManager.withRetry(fn, {
        maxRetries: 3,
        delay: 100,
        backoff: 'exponential',
        onRetry,
      });

      expect(delays).toEqual([1, 2]);
    }, { timeout: 10000 });
  });

  describe('DefaultErrorClassifier', () => {
    const classifier = new DefaultErrorClassifier();

    test('APIレート制限エラーを分類する', () => {
      const error = new Error('Rate limit exceeded');
      const type = classifier.classify(error);
      expect(type).toBe(ErrorType.API_LIMIT);
      expect(classifier.shouldRetry(type)).toBe(true);
    });

    test('ネットワークエラーを分類する', () => {
      const error = new Error('Network timeout');
      const type = classifier.classify(error);
      expect(type).toBe(ErrorType.NETWORK_ERROR);
      expect(classifier.shouldRetry(type)).toBe(true);
    });

    test('認証エラーを分類する', () => {
      const error = new Error('Unauthorized access');
      const type = classifier.classify(error);
      expect(type).toBe(ErrorType.PERMISSION_DENIED);
      expect(classifier.shouldRetry(type)).toBe(false);
    });

    test('データエラーを分類する', () => {
      const error = new Error('Invalid page id');
      const type = classifier.classify(error);
      expect(type).toBe(ErrorType.INVALID_DATA);
      expect(classifier.shouldRetry(type)).toBe(false);
    });

    test('不明なエラーを分類する', () => {
      const error = new Error('Some unknown error');
      const type = classifier.classify(error);
      expect(type).toBe(ErrorType.UNKNOWN);
      expect(classifier.shouldRetry(type)).toBe(false);
    });

    test('回復戦略が機能する', async () => {
      const startTime = Date.now();
      await classifier.getRecoveryStrategy(ErrorType.NETWORK_ERROR);
      const endTime = Date.now();
      
      // 少なくとも1秒は待機するはず
      expect(endTime - startTime).toBeGreaterThan(900);
    }, { timeout: 5000 });
  });
});