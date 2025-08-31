# notion-fetcher

Notion APIを使用して記事データを取得するクライアントライブラリ

## 概要

notion-fetcherは、Notion APIを使用してページのデータを効率的に取得するためのTypeScriptライブラリです。リトライ機能付きのエラーハンドリング、ネストされたブロックの完全取得、メタデータの抽出機能を提供します。

## インストール

```bash
bun install
```

## 環境変数

```bash
export NOTION_API_KEY="your-notion-api-key"
```

## 使用方法

### 基本的な使用例

```typescript
import { NotionFetcher } from './src';

// クライアントの初期化
const fetcher = new NotionFetcher({
  apiKey: process.env.NOTION_API_KEY!,
});

// 記事の取得
const article = await fetcher.fetchArticleById('page-id');
console.log(article.metadata.title);
console.log(article.blocks.length);
```

### 設定オプション

```typescript
const fetcher = new NotionFetcher({
  apiKey: process.env.NOTION_API_KEY!,
  maxRetries: 3,        // 最大リトライ回数 (デフォルト: 3)
  retryDelay: 1000,     // リトライ間隔(ms) (デフォルト: 1000)
});
```

## API

### `NotionFetcher`

#### `constructor(config: NotionFetcherConfig)`

新しいNotionFetcherインスタンスを作成します。

#### `fetchArticleById(id: string): Promise<FetchArticleResponse>`

指定されたIDのNotionページを完全に取得します。メタデータとすべてのブロック（ネストされたものも含む）を返します。

#### `fetchPageProperties(id: string): Promise<Record<string, any>>`

ページのプロパティのみを取得します。

#### `fetchPageBlocks(id: string): Promise<BlockObjectResponse[]>`

ページのブロック階層を完全に取得します（子ブロックも含む）。

## 型定義

### `NotionFetcherConfig`

```typescript
interface NotionFetcherConfig {
  apiKey: string;
  maxRetries?: number;
  retryDelay?: number;
}
```

### `ArticleMetadata`

```typescript
interface ArticleMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  properties: Record<string, any>;
}
```

## エラーハンドリング

```typescript
import { NotionFetcherError } from './src';

try {
  const article = await fetcher.fetchArticleById('invalid-id');
} catch (error) {
  if (error instanceof NotionFetcherError) {
    console.error(`エラーコード: ${error.code}`);
    console.error(`詳細: ${error.details}`);
  }
}
```

## 開発

### スクリプト

```bash
# 開発実行
bun run dev

# ビルド
bun run build

# テスト
bun test

# リント
bun run lint
bun run lint:fix

# フォーマット
bun run format

# 型チェック
bun run type-check
```

### テスト実行

```bash
bun test
```

## ライセンス

ISC