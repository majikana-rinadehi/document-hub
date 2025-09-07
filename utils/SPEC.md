# Utils プロジェクト詳細仕様書

## 概要
このドキュメントは、`utils`ディレクトリ配下に作成する2つのBunプロジェクトの詳細仕様を定義します。
すべての成果物は日本語で作成し、シンプルで保守性の高い実装を目指します。

## 共通要件

### 技術スタック
- **ランタイム**: Bun
- **言語**: TypeScript (strict mode)
- **リンター**: ESLint (Airbnb設定ベース)
- **フォーマッター**: Prettier
- **自動整形**: lint-staged + husky

### ディレクトリ構造
```
utils/
├── notion-fetcher/
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   └── types.ts
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .eslintrc.json
│   └── .prettierrc
└── notion-converter/
    ├── src/
    │   ├── index.ts
    │   ├── converter.ts
    │   ├── image-handler.ts
    │   └── types.ts
    ├── tests/
    ├── images/  # 変換された画像の保存先
    ├── package.json
    ├── tsconfig.json
    ├── .eslintrc.json
    └── .prettierrc
```

## プロジェクト1: notion-fetcher

### 目的
Notion APIを使用して記事データを取得するクライアントライブラリ

### 主要機能
1. **Notion APIクライアントの初期化**
   - `@notionhq/client`を使用
   - 環境変数からAPIキーを読み込み
   - エラーハンドリングとリトライ機能

2. **記事取得機能**
   - ID指定による単一記事の取得
   - ページプロパティの取得
   - ブロック階層の取得
   - メタデータ（作成日時、更新日時、タイトル等）の取得

### 実装詳細

#### 依存パッケージ
```json
{
  "dependencies": {
    "@notionhq/client": "latest"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-airbnb-base": "^15.0.0",
    "eslint-config-airbnb-typescript": "^17.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  }
}
```

#### 主要インターフェース
```typescript
interface NotionFetcherConfig {
  apiKey: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface ArticleMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  properties: Record<string, any>;
}

interface FetchArticleResponse {
  metadata: ArticleMetadata;
  blocks: Block[];
}

class NotionFetcher {
  constructor(config: NotionFetcherConfig);
  async fetchArticleById(id: string): Promise<FetchArticleResponse>;
  async fetchPageProperties(id: string): Promise<Record<string, any>>;
  async fetchPageBlocks(id: string): Promise<Block[]>;
}
```

## プロジェクト2: notion-converter

### 目的
Notion記事をMarkdown形式に変換し、画像を適切に処理するコンバーターライブラリ

### 主要機能
1. **Markdown変換**
   - `notion-to-md`を使用した変換
   - カスタムブロックタイプのサポート
   - ネストされたブロックの適切な処理

2. **画像処理**
   - Notion内の画像URLを検出
   - 画像をローカルにダウンロード
   - リポジトリ内の適切なパスに保存
   - Markdown内の画像参照を相対パスに更新

### 実装詳細

#### 依存パッケージ
```json
{
  "dependencies": {
    "notion-to-md": "latest",
    "@notionhq/client": "latest"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-airbnb-base": "^15.0.0",
    "eslint-config-airbnb-typescript": "^17.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  }
}
```

#### 主要インターフェース
```typescript
interface ConversionConfig {
  imageDirectory?: string;  // デフォルト: './images'
  imageUrlPrefix?: string;  // Markdown内での画像パスプレフィックス
  customTransformers?: Map<string, BlockTransformer>;
}

interface ConversionResult {
  markdown: string;
  images: ImageInfo[];
}

interface ImageInfo {
  originalUrl: string;
  localPath: string;
  markdownPath: string;
}

class NotionConverter {
  constructor(notionClient: Client, config?: ConversionConfig);
  async convertToMarkdown(blocks: Block[]): Promise<ConversionResult>;
  async downloadImage(url: string, filename: string): Promise<string>;
  private processImages(markdown: string): Promise<ConversionResult>;
}
```

## 共通設定ファイル

### ESLint設定 (.eslintrc.json)
```json
{
  "extends": [
    "airbnb-base",
    "airbnb-typescript/base",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "import/prefer-default-export": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Prettier設定 (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### TypeScript設定 (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## スクリプト設定

### package.json scripts
```json
{
  "scripts": {
    "dev": "bun run src/index.ts",
    "build": "bun build src/index.ts --outdir dist",
    "test": "bun test",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  }
}
```

### lint-staged設定
```json
{
  "*.ts": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

## エラーハンドリング

### 共通エラークラス
```typescript
export class NotionFetcherError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: any) {
    super(message);
    this.name = 'NotionFetcherError';
  }
}

export class NotionConverterError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: any) {
    super(message);
    this.name = 'NotionConverterError';
  }
}
```

## テスト方針
- Bunの組み込みテストランナーを使用
- 単体テストとE2Eテストの両方を実装
- モックを使用したAPIテスト
- テストカバレッジ80%以上を目標

## セキュリティ考慮事項
- APIキーは環境変数で管理
- 画像ダウンロード時のURLバリデーション
- ファイルシステムアクセスの制限
- エラーメッセージでの機密情報の非表示化

## パフォーマンス要件
- 並列処理による画像ダウンロードの高速化
- 大規模記事に対する段階的な処理
- メモリ効率的なストリーム処理
- キャッシュ機能の実装（オプション）

## 実装順序
1. notion-fetcherの基本実装
2. notion-converterの基本実装
3. 画像ハンドリング機能の追加
4. エラーハンドリングとリトライ機能
5. テストの作成
6. ドキュメントの整備