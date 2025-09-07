# Notion 統合機能 実装プロンプト

## 目的

`utils/notion-fetcher`と`utils/notion-converter`の機能を上位ディレクトリから統合的に使用できるようにする。

## 現在の状況

### 既存のディレクトリ構造

```
document-hub/
├── utils/
│   ├── notion-fetcher/     # Notion APIクライアント（実装済み）
│   │   └── src/
│   │       ├── client.ts   # fetchArticleById等を含む
│   │       └── ...
│   └── notion-converter/   # Markdown変換ツール（実装済み）
│       └── src/
│           ├── converter.ts # convertPageToMarkdown等を含む
│           └── ...
```

### 既存の主要機能

- **notion-fetcher**: `NotionFetcher`クラスの`fetchArticleById`メソッドで Notion 記事を取得
- **notion-converter**: `NotionConverter`クラスの`convertPageToMarkdown`メソッドで Markdown 変換

## 実装要件

### 1. 統合モジュールの作成

新しいディレクトリ `utils/notion-processor` または `utils/notion-integration` を作成し、以下の機能を実装：

#### ディレクトリ構造案

```
utils/notion-processor/
├── src/
│   ├── index.ts           # エクスポート用エントリポイント
│   ├── processor.ts       # 統合処理クラス
│   └── types.ts          # 共通型定義
├── package.json
├── tsconfig.json
└── README.md
```

### 2. 統合処理クラスの設計

```typescript
// processor.ts の基本設計
import { NotionFetcher } from "../../notion-fetcher/src/client";
import { NotionConverter } from "../../notion-converter/src/converter";

export class NotionProcessor {
  private fetcher: NotionFetcher;
  private converter: NotionConverter;

  constructor(config: NotionProcessorConfig) {
    // 初期化処理
  }

  // 記事IDから直接Markdownを生成
  async processArticle(articleId: string): Promise<ProcessedArticle> {
    // 1. fetchArticleByIdで記事取得
    // 2. convertPageToMarkdownで変換
    // 3. 画像処理
    // 4. 結果を返す
  }

  // バッチ処理機能
  async processMultipleArticles(
    articleIds: string[]
  ): Promise<ProcessedArticle[]> {
    // 並列処理の実装
  }
}
```

### 3. パッケージ構成の選択

以下のいずれかのアプローチを選択：

#### オプション A: モノレポ構成（推奨）

- Bun のワークスペース機能を使用
- ルートに`package.json`を配置し、各パッケージを管理
- 内部パッケージとして相互参照

```json
// ルートのpackage.json
{
  "workspaces": [
    "utils/notion-fetcher",
    "utils/notion-converter",
    "utils/notion-processor"
  ]
}
```

### 4. エクスポート戦略

```typescript
// utils/notion-processor/src/index.ts
export { NotionProcessor } from "./processor";
export { NotionFetcher } from "../../notion-fetcher/src/client";
export { NotionConverter } from "../../notion-converter/src/converter";
export * from "./types";

// 便利な関数もエクスポート
export { processNotionArticle } from "./helpers";
```

### 5. 使用例

```typescript
// プロジェクトルートまたは他の場所から使用
import { NotionProcessor } from "./utils/notion-processor";

const processor = new NotionProcessor({
  notionApiKey: process.env.NOTION_API_KEY,
  imageDirectory: "./images",
  // その他の設定
});

// 単一記事の処理
const result = await processor.processArticle("article-id-123");
console.log(result.markdown);
console.log(result.images);

// 複数記事の処理
const results = await processor.processMultipleArticles(["id1", "id2", "id3"]);
```

## 実装手順

1. **パッケージ構成の決定**

   - モノレポまたは独立パッケージの選択
   - 依存関係管理方法の決定

2. **統合モジュールの作成**

   - `utils/notion-processor`ディレクトリの作成
   - 基本的なファイル構造のセットアップ
   - package.json と tsconfig.json の設定

3. **NotionProcessor クラスの実装**

   - 既存の fetcher と converter を組み合わせる
   - エラーハンドリングの統一
   - ロギング機能の追加

4. **テストの作成**

   - 統合テストの実装
   - モックを使用した単体テスト

5. **ドキュメントの作成**
   - README の作成
   - API ドキュメントの生成
   - 使用例の追加

## 技術的考慮事項

### 依存関係の管理

- 各パッケージのバージョン管理
- 共通依存パッケージの重複を避ける
- peerDependencies の適切な使用

### TypeScript の設定

- パス解決の設定
- 型定義の共有
- ビルド出力の最適化

### パフォーマンス

- 並列処理の実装
- キャッシュ機能の検討
- メモリ使用量の最適化

### エラーハンドリング

- 統一されたエラークラス
- リトライロジックの実装
- ログ出力の標準化

## 期待される成果

1. **簡潔な API**: 上位ディレクトリから簡単に使用できる統合 API
2. **再利用性**: 既存の fetcher と converter の機能を最大限活用
3. **拡張性**: 将来的な機能追加が容易な設計
4. **保守性**: クリーンなコード構造と適切なドキュメント

## 次のステップ

このプロンプトに基づいて実装を進める際は、以下の順序で作業することを推奨：

1. パッケージ構成方法の決定（モノレポ vs 独立パッケージ）
2. 基本的なディレクトリ構造の作成
3. 最小限の動作する実装（MVP）
4. テストとドキュメントの追加
5. 最適化と機能拡張
