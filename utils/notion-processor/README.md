# Notion Processor

Notion記事の取得とMarkdown変換を統合的に処理するライブラリです。

## 概要

`@document-hub/notion-processor`は、`notion-fetcher`と`notion-converter`の機能を統合し、Notion記事を簡単にMarkdownに変換できるようにするライブラリです。

## インストール

```bash
bun add @document-hub/notion-processor
```

## 使用方法

### 基本的な使用例

```typescript
import { NotionProcessor } from '@document-hub/notion-processor';

// プロセッサーの初期化
const processor = new NotionProcessor({
  notionApiKey: process.env.NOTION_API_KEY!,
  imageDirectory: './images',
  imageUrlPrefix: '/images',
  maxRetries: 3,
  retryDelay: 1000,
});

// 単一記事の処理
const result = await processor.processArticle('article-id-123');
console.log(result.markdown);
console.log(result.images);
console.log(result.metadata);
```

### バッチ処理

```typescript
// 複数記事の並列処理
const results = await processor.processMultipleArticles(
  ['id1', 'id2', 'id3'],
  {
    concurrency: 3,
    onProgress: (completed, total) => {
      console.log(`処理進捗: ${completed}/${total}`);
    },
    onError: (error, articleId) => {
      console.error(`記事 ${articleId} の処理に失敗:`, error);
    },
  }
);

console.log(`成功: ${results.successful.length}件`);
console.log(`失敗: ${results.failed.length}件`);
```

### ヘルパー関数の使用

```typescript
import { 
  processNotionArticle, 
  processNotionArticles,
  validateConfig 
} from '@document-hub/notion-processor';

// 設定の検証
const config = {
  notionApiKey: process.env.NOTION_API_KEY!,
  imageDirectory: './images',
};

if (validateConfig(config)) {
  // 単一記事の処理（ワンライナー）
  const article = await processNotionArticle('article-id', config);
  
  // 複数記事の処理
  const articles = await processNotionArticles(['id1', 'id2'], config);
}
```

### 個別モジュールの使用

```typescript
import { 
  NotionFetcher, 
  NotionConverter 
} from '@document-hub/notion-processor';

// Fetcherだけを使用
const fetcher = new NotionFetcher({
  apiKey: process.env.NOTION_API_KEY!,
});
const articleData = await fetcher.fetchArticleById('article-id');

// Converterだけを使用
const converter = new NotionConverter(notionClient, {
  imageDirectory: './images',
});
const markdown = await converter.convertPageToMarkdown('page-id', blocks);
```

## API リファレンス

### NotionProcessor

#### constructor(config: NotionProcessorConfig)
プロセッサーを初期化します。

#### processArticle(articleId: string): Promise<ProcessedArticle>
指定されたIDの記事を処理してMarkdownに変換します。

#### processMultipleArticles(articleIds: string[], options?: BatchProcessOptions): Promise<BatchProcessResult>
複数の記事を並列処理します。

#### testConnection(): Promise<boolean>
Notion APIへの接続をテストします。

### 型定義

```typescript
interface NotionProcessorConfig {
  notionApiKey: string;
  imageDirectory?: string;
  imageUrlPrefix?: string;
  maxRetries?: number;
  retryDelay?: number;
  customTransformers?: Map<string, BlockTransformer>;
}

interface ProcessedArticle {
  metadata: ArticleMetadata;
  markdown: string;
  images: ImageInfo[];
  processedAt: Date;
}

interface BatchProcessOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
  onError?: (error: Error, articleId: string) => void;
}
```

## エラーハンドリング

```typescript
try {
  const result = await processor.processArticle('article-id');
} catch (error) {
  if (error instanceof NotionProcessorError) {
    console.error('処理エラー:', error.code, error.details);
  } else if (error instanceof NotionFetcherError) {
    console.error('取得エラー:', error.code);
  } else if (error instanceof NotionConverterError) {
    console.error('変換エラー:', error.code);
  }
}
```

## 開発

```bash
# 依存関係のインストール
bun install

# ビルド
bun run build

# テスト
bun test

# 型チェック
bun run type-check
```

## ライセンス

MIT