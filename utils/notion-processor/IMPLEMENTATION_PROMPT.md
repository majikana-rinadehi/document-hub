# notion-processor 実装プロンプト

## プロジェクト概要
notion-processorは、NotionAPIから記事データを取得し、Markdown形式に変換する統合ライブラリです。notion-fetcherとnotion-converterを組み合わせて、バッチ処理や並列処理をサポートします。

## 実装タスク

### 1. テスト環境の構築とテストケースの実装

#### 1.1 テストファイル構造
```
utils/notion-processor/
├── tests/
│   ├── processor.test.ts      # NotionProcessorクラスのテスト
│   ├── helpers.test.ts         # ヘルパー関数のテスト
│   ├── integration.test.ts    # 統合テスト
│   └── fixtures/              # テスト用のモックデータ
│       ├── notion-responses.json
│       └── expected-outputs.json
```

#### 1.2 実装すべきテストケース

##### processor.test.ts
```typescript
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { NotionProcessor } from '../src/processor';

describe('NotionProcessor', () => {
  describe('constructor', () => {
    test('設定パラメータが正しく初期化される');
    test('NotionFetcherとNotionConverterが正しくインスタンス化される');
    test('無効な設定でエラーが発生する');
  });

  describe('processArticle', () => {
    test('単一記事を正常に処理できる');
    test('記事が存在しない場合にエラーが発生する');
    test('変換エラーが適切に処理される');
    test('メタデータが正しく取得される');
    test('画像が正しく処理される');
  });

  describe('processMultipleArticles', () => {
    test('複数記事を並列処理できる');
    test('並行数が正しく制御される');
    test('進捗コールバックが正しく呼ばれる');
    test('エラーコールバックが正しく呼ばれる');
    test('成功と失敗の結果が正しく分類される');
    test('空の配列を処理できる');
  });

  describe('testConnection', () => {
    test('接続成功時にtrueを返す');
    test('接続失敗時にfalseを返す');
    test('テストページIDが未設定の場合にfalseを返す');
  });
});
```

##### helpers.test.ts
```typescript
import { describe, test, expect } from 'bun:test';
import {
  processNotionArticle,
  processNotionArticles,
  createNotionProcessor,
  validateConfig,
} from '../src/helpers';

describe('Helpers', () => {
  describe('validateConfig', () => {
    test('有効な設定を検証できる');
    test('APIキーが欠けている場合にエラー');
    test('無効なURLプレフィックスでエラー');
    test('無効なディレクトリパスでエラー');
  });

  describe('createNotionProcessor', () => {
    test('環境変数から設定を読み込める');
    test('カスタム設定をマージできる');
    test('デフォルト値が適用される');
  });

  describe('processNotionArticle', () => {
    test('単一記事を処理できる');
    test('エラーハンドリングが適切');
  });

  describe('processNotionArticles', () => {
    test('複数記事をバッチ処理できる');
    test('進捗レポートが機能する');
  });
});
```

##### integration.test.ts
```typescript
import { describe, test, expect, beforeAll } from 'bun:test';
import { NotionProcessor } from '../src/processor';

describe('Integration Tests', () => {
  describe('実際のNotion APIとの連携', () => {
    test('実際の記事を取得して変換できる', { timeout: 30000 });
    test('画像を含む記事を正しく処理できる', { timeout: 30000 });
    test('ネストされたブロックが正しく変換される');
    test('カスタムブロックタイプが処理される');
  });

  describe('エラーリカバリー', () => {
    test('API制限に達した場合のリトライ');
    test('ネットワークエラーからの回復');
    test('部分的な失敗の処理');
  });

  describe('パフォーマンステスト', () => {
    test('大量記事の並列処理');
    test('メモリ使用量の監視');
    test('処理速度のベンチマーク');
  });
});
```

### 2. ヘルパー関数の完全実装

#### helpers.ts の実装内容
```typescript
import { NotionProcessor } from './processor';
import type {
  NotionProcessorConfig,
  ProcessedArticle,
  BatchProcessOptions,
  BatchProcessResult,
} from './types';

// 設定検証関数
export function validateConfig(config: Partial<NotionProcessorConfig>): NotionProcessorConfig {
  // 必須項目の検証
  if (!config.notionApiKey) {
    throw new Error('Notion APIキーが設定されていません');
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

// 環境変数からProcessorを作成
export function createNotionProcessor(
  overrides?: Partial<NotionProcessorConfig>
): NotionProcessor {
  const config = validateConfig({
    notionApiKey: process.env.NOTION_API_KEY || overrides?.notionApiKey,
    imageDirectory: process.env.NOTION_IMAGE_DIR || overrides?.imageDirectory,
    imageUrlPrefix: process.env.NOTION_IMAGE_PREFIX || overrides?.imageUrlPrefix,
    ...overrides,
  });

  return new NotionProcessor(config);
}

// 単一記事処理のラッパー
export async function processNotionArticle(
  articleId: string,
  config?: Partial<NotionProcessorConfig>
): Promise<ProcessedArticle> {
  const processor = createNotionProcessor(config);
  return processor.processArticle(articleId);
}

// 複数記事処理のラッパー
export async function processNotionArticles(
  articleIds: string[],
  config?: Partial<NotionProcessorConfig>,
  options?: BatchProcessOptions
): Promise<BatchProcessResult> {
  const processor = createNotionProcessor(config);
  return processor.processMultipleArticles(articleIds, options);
}
```

### 3. 型定義の強化

#### types.ts の完全実装
```typescript
import type { Client } from '@notionhq/client';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

// エラー型定義
export class NotionProcessorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'NotionProcessorError';
  }
}

// 設定型
export interface NotionProcessorConfig {
  notionApiKey: string;
  imageDirectory?: string;
  imageUrlPrefix?: string;
  maxRetries?: number;
  retryDelay?: number;
  customTransformers?: Map<string, (block: BlockObjectResponse) => string>;
}

// メタデータ型
export interface ArticleMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  properties: Record<string, any>;
  tags?: string[];
  author?: string;
  status?: string;
}

// 画像情報型
export interface ImageInfo {
  originalUrl: string;
  localPath: string;
  markdownPath: string;
  width?: number;
  height?: number;
  format?: string;
}

// 処理結果型
export interface ProcessedArticle {
  metadata: ArticleMetadata;
  markdown: string;
  images: ImageInfo[];
  processedAt: Date;
  processingTime?: number;
}

// バッチ処理オプション
export interface BatchProcessOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
  onError?: (error: Error, articleId: string) => void;
  continueOnError?: boolean;
  retryFailedArticles?: boolean;
}

// バッチ処理結果
export interface BatchProcessResult {
  successful: ProcessedArticle[];
  failed: Array<{
    articleId: string;
    error: Error;
  }>;
  totalProcessed?: number;
  totalTime?: number;
}

// 外部パッケージの型を再エクスポート
export type { BlockObjectResponse };
export type { NotionFetcherConfig } from '@document-hub/notion-fetcher/src/types';
export type { ConversionConfig } from '@document-hub/notion-converter/src/types';
```

### 4. パフォーマンス最適化

#### 実装すべき最適化機能

1. **キャッシュシステム**
```typescript
class CacheManager {
  private cache: Map<string, ProcessedArticle>;
  private ttl: number;

  constructor(ttl: number = 3600000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key: string): ProcessedArticle | null;
  set(key: string, value: ProcessedArticle): void;
  invalidate(key: string): void;
  clear(): void;
}
```

2. **並列処理の最適化**
```typescript
class ParallelProcessor {
  async processWithQueue<T>(
    items: T[],
    processor: (item: T) => Promise<any>,
    concurrency: number
  ): Promise<any[]>;
  
  async processWithWorkers<T>(
    items: T[],
    workerPath: string,
    workerCount: number
  ): Promise<any[]>;
}
```

3. **ストリーミング処理**
```typescript
class StreamingProcessor {
  async *processStream(
    articleIds: AsyncIterable<string>
  ): AsyncGenerator<ProcessedArticle>;
  
  async processLargeArticle(
    articleId: string,
    chunkSize: number
  ): AsyncIterable<string>;
}
```

### 5. エラーハンドリングの強化

#### 実装すべきエラー処理

1. **リトライメカニズム**
```typescript
class RetryManager {
  async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries: number;
      delay: number;
      backoff: 'linear' | 'exponential';
      onRetry?: (attempt: number, error: Error) => void;
    }
  ): Promise<T>;
}
```

2. **エラー分類とレポート**
```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_LIMIT = 'API_LIMIT',
  INVALID_DATA = 'INVALID_DATA',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN = 'UNKNOWN',
}

class ErrorClassifier {
  classify(error: Error): ErrorType;
  shouldRetry(errorType: ErrorType): boolean;
  getRecoveryStrategy(errorType: ErrorType): () => Promise<void>;
}
```

### 6. CLIツールの実装

#### cli.ts の実装
```typescript
#!/usr/bin/env bun

import { Command } from 'commander';
import { createNotionProcessor } from './helpers';

const program = new Command();

program
  .name('notion-processor')
  .description('Notion記事をMarkdownに変換するCLIツール')
  .version('1.0.0');

program
  .command('process <articleId>')
  .description('単一の記事を処理')
  .option('-o, --output <path>', '出力先ディレクトリ')
  .option('-i, --images <path>', '画像保存先ディレクトリ')
  .action(async (articleId, options) => {
    // 実装
  });

program
  .command('batch <file>')
  .description('複数の記事をバッチ処理')
  .option('-c, --concurrency <number>', '並行処理数', '3')
  .option('-o, --output <path>', '出力先ディレクトリ')
  .action(async (file, options) => {
    // 実装
  });

program
  .command('test')
  .description('Notion API接続をテスト')
  .action(async () => {
    // 実装
  });

program.parse();
```

### 7. ドキュメントの作成

#### README.md の内容
- インストール方法
- 基本的な使用方法
- API リファレンス
- 設定オプション
- エラーハンドリング
- パフォーマンスチューニング
- トラブルシューティング

### 8. GitHub Actions ワークフローの作成

#### .github/workflows/test.yml
```yaml
name: Test notion-processor

on:
  push:
    paths:
      - 'utils/notion-processor/**'
  pull_request:
    paths:
      - 'utils/notion-processor/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: cd utils/notion-processor && bun install
      - run: cd utils/notion-processor && bun test
      - run: cd utils/notion-processor && bun run lint
      - run: cd utils/notion-processor && bun run type-check
```

## 実装優先順位

1. **フェーズ1: テスト基盤** (必須)
   - テストファイル構造の作成
   - モックデータの準備
   - 基本的なユニットテストの実装

2. **フェーズ2: コア機能の完成** (必須)
   - helpers.tsの完全実装
   - types.tsの型定義強化
   - エラーハンドリングの基本実装

3. **フェーズ3: 統合テスト** (必須)
   - 実際のNotion APIとの統合テスト
   - E2Eテストの実装
   - パフォーマンステスト

4. **フェーズ4: 最適化** (推奨)
   - キャッシュシステムの実装
   - 並列処理の最適化
   - ストリーミング処理の実装

5. **フェーズ5: ツールとドキュメント** (オプション)
   - CLIツールの実装
   - 包括的なドキュメントの作成
   - CI/CDパイプラインの設定

## テスト実行コマンド

```bash
# すべてのテストを実行
bun test

# 特定のテストファイルを実行
bun test tests/processor.test.ts

# カバレッジレポート付きでテスト
bun test --coverage

# ウォッチモードでテスト
bun test --watch
```

## 環境変数の設定

```bash
# .env.test ファイル
NOTION_API_KEY=your_test_api_key
NOTION_TEST_PAGE_ID=test_page_id
NOTION_IMAGE_DIR=./test-images
NOTION_IMAGE_PREFIX=/test-images
```

## 品質基準

- テストカバレッジ: 80%以上
- TypeScript strictモード: エラーなし
- ESLint: 警告・エラーなし
- パフォーマンス: 1記事あたり2秒以内の処理
- メモリ使用量: 100MB以下（通常の記事サイズ）

## 注意事項

1. すべてのコードは日本語でコメントを記述
2. エラーメッセージは日本語で表示
3. Bunの機能を最大限活用
4. 非同期処理は適切にハンドリング
5. メモリリークを防ぐ適切なリソース管理