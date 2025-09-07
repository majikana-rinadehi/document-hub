# 技術スタックとコーディング規約

## 技術スタック
- **ランタイム**: Bun (npm/yarn互換)
- **言語**: TypeScript 5.3.3+ (strict mode)
- **パッケージマネージャー**: Bun (npm/yarnでも動作可能)

## 主要依存関係
### notion-fetcher
- `@notionhq/client` - Notion API公式クライアント

### notion-converter  
- `@notionhq/client` - Notion API
- `notion-to-md` - NotionからMarkdown変換

### proxy
- `@octokit/rest` - GitHub API

## 開発ツール
- **リンター**: ESLint (Airbnb設定ベース)
- **フォーマッター**: Prettier
- **自動整形**: lint-staged + husky
- **テスト**: Bunテストランナー

## ESLint設定 (.eslintrc.json)
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

## Prettier設定 (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "all", 
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## TypeScript設定の特徴
- strict mode有効
- ES2022ターゲット
- ESNext modules
- bundler moduleResolution
- declaration files生成

## コーディング規約
- すべてのコメントとドキュメントは日本語
- エラーメッセージも日本語
- セキュリティ重視（URLバリデーション、HTTPS強制）
- エラーハンドリングとリトライ機能必須