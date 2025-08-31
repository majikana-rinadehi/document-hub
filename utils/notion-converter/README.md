# notion-converter

Notion記事をMarkdown形式に変換し、画像を適切に処理するコンバーターライブラリ

## 概要

notion-converterは、NotionページをMarkdown形式に変換し、含まれる画像を自動的にダウンロード・管理するTypeScriptライブラリです。カスタムブロックトランスフォーマーのサポート、相対パス変換、並列画像処理などの高度な機能を提供します。

## インストール

```bash
bun install
```

## 使用方法

### 基本的な使用例

```typescript
import { NotionConverter } from './src';
import { Client } from '@notionhq/client';

// Notionクライアントの初期化
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// コンバーターの初期化
const converter = new NotionConverter(notion);

// ページの変換
const result = await converter.convertPageToMarkdown('page-id');
console.log(result.markdown);
console.log(`${result.images.length}個の画像を処理しました`);
```

### 設定オプション付きの使用例

```typescript
const converter = new NotionConverter(notion, {
  imageDirectory: './assets/images',     // 画像保存先ディレクトリ
  imageUrlPrefix: '/images/',            // Markdown内での画像パスプレフィックス
});

// カスタムブロックトランスフォーマーの追加
const customTransformers = new Map();
customTransformers.set('callout', (block) => {
  return `> 💡 ${block.callout.rich_text[0]?.plain_text || ''}`;
});

const converter = new NotionConverter(notion, {
  customTransformers,
});
```

## API

### `NotionConverter`

#### `constructor(notionClient: Client, config?: ConversionConfig)`

新しいNotionConverterインスタンスを作成します。

#### `convertPageToMarkdown(pageId: string): Promise<ConversionResult>`

指定されたNotionページを完全にMarkdownに変換します。すべての画像を処理し、相対パスに変換します。

#### `convertToMarkdown(blocks: BlockObjectResponse[]): Promise<ConversionResult>`

Notionブロック配列をMarkdownに変換します。

### `ImageHandler`

#### `downloadImage(url: string, filename: string): Promise<string>`

指定されたURLから画像をダウンロードし、ローカルに保存します。

#### `processImages(markdown: string): Promise<ConversionResult>`

Markdown内の画像URLを検出し、ダウンロード・パス変換を行います。

## 設定オプション

### `ConversionConfig`

```typescript
interface ConversionConfig {
  imageDirectory?: string;          // 画像保存先 (デフォルト: './images')
  imageUrlPrefix?: string;          // Markdown内のパスプレフィックス
  customTransformers?: Map<string, BlockTransformer>;
}
```

### `ConversionResult`

```typescript
interface ConversionResult {
  markdown: string;
  images: ImageInfo[];
}

interface ImageInfo {
  originalUrl: string;    // 元のNotion画像URL
  localPath: string;      // ローカル保存パス
  markdownPath: string;   // Markdown内で使用するパス
}
```

## 機能

### 画像処理
- Notion内の画像を自動検出・ダウンロード
- 一意なファイル名の生成
- 相対パスへの自動変換
- 並列ダウンロードによる高速処理

### カスタムブロック対応
- 標準的なNotionブロックの完全サポート
- カスタムトランスフォーマーによる拡張性
- ネストされたブロック構造の保持

### エラーハンドリング
- 画像ダウンロード失敗時の適切な処理
- URLバリデーション
- HTTPS強制によるセキュリティ確保

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

## ディレクトリ構造

```
notion-converter/
├── src/
│   ├── index.ts          # エクスポート定義
│   ├── converter.ts      # メイン変換ロジック
│   ├── image-handler.ts  # 画像処理ロジック
│   └── types.ts          # 型定義
├── images/               # ダウンロード画像保存先
└── tests/                # テストファイル
```

## ライセンス

ISC