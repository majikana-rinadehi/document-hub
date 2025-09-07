# コードベース構造

## ディレクトリ構成
```
document-hub/
├── README.md                     # プロジェクト概要 (日本語)
├── .gitignore
├── .github/workflows/
│   └── notion-sync.yml          # GitHub Actions自動同期
├── proxy/                       # Webhook中継プロキシ
│   ├── package.json
│   ├── .env.example
│   └── api/
└── utils/                       # メインライブラリ群
    ├── SPEC.md                  # 詳細仕様書
    ├── IMPLEMENTATION_STATUS.md  # 実装状況
    ├── notion-fetcher/          # Notion API クライアント
    │   ├── src/
    │   │   ├── index.ts         # エクスポート定義
    │   │   ├── client.ts        # NotionFetcherクラス
    │   │   └── types.ts         # 型定義
    │   ├── tests/
    │   │   ├── client.test.ts
    │   │   └── types.test.ts
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── .eslintrc.json
    │   └── .prettierrc
    └── notion-converter/         # Markdown変換ライブラリ
        ├── src/
        │   ├── index.ts          # エクスポート定義
        │   ├── converter.ts      # NotionConverterクラス
        │   ├── image-handler.ts  # 画像処理クラス
        │   └── types.ts          # 型定義
        ├── tests/
        │   ├── converter.test.ts
        │   └── image-handler.test.ts
        ├── images/               # 変換済み画像保存先
        ├── package.json
        ├── tsconfig.json  
        ├── .eslintrc.json
        └── .prettierrc
```

## 主要クラス・インターフェース

### notion-fetcher
- `NotionFetcher` - メインクライアントクラス
- `NotionFetcherConfig` - 設定インターフェース
- `ArticleMetadata` - 記事メタデータ
- `FetchArticleResponse` - API応答型

### notion-converter
- `NotionConverter` - メイン変換クラス
- `ImageHandler` - 画像処理クラス
- `ConversionConfig` - 変換設定
- `ConversionResult` - 変換結果型