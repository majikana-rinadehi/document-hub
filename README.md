# Document Hub

Notionからマークダウン記事を連携して、ブログ投稿用に保管・管理するシステムです。

## 📋 概要

Document Hubは、Notionで管理している記事を自動的にMarkdown形式に変換し、GitHubリポジトリに保存するシステムです。Notionページの更新を検知すると、自動的に記事を取得・変換し、必要に応じてZennなどのブログプラットフォーム向けに公開用のPull Requestを作成します。

## ✨ 主な機能

- **自動同期**: Notionページの更新をWebhookで検知し、自動的に記事を同期
- **Markdown変換**: NotionのリッチコンテンツをMarkdown形式に変換
- **画像管理**: 記事内の画像を自動的にダウンロードし、リポジトリ内で管理
- **メタデータ管理**: 記事のタイトル、ステータス、プラットフォーム情報などをJSON形式で保存
- **ステータス管理**: Preview/Publishedステータスの記事のみを処理
- **Zenn連携**: PlatformsプロパティにZennが含まれる記事を自動的にZenn公開用に準備
- **自動PR作成**: Zenn公開用の記事を準備し、Pull Requestを自動作成

## 🏗️ アーキテクチャ

### システム構成

```
Notion → Webhook → Proxy API → GitHub Actions → 記事処理 → Zenn公開
```

### 主要コンポーネント

- **Proxy API** (`proxy/api/webhooks.js`): Notion Webhookを受信し、GitHub ActionsをトリガーするAPI（Vercelにデプロイ・ホスティングが必要）
- **CLI Tool** (`src/cli.ts`): 記事取得・変換処理のエントリーポイント
- **Notion Fetcher** (`utils/notion-fetcher`): Notion APIを使用して記事を取得
- **Notion Converter** (`utils/notion-converter`): NotionコンテンツをMarkdownに変換
- **Notion Processor** (`utils/notion-processor`): 記事の統合処理（取得・変換・画像処理）
- **GitHub Actions**: 自動化ワークフロー
  - `notion-sync.yml`: Notion記事の同期処理
  - `publish-to-zenn.yml`: Zenn公開用のPR作成

詳細な処理フローについては、[docs/processing-flow.md](./docs/processing-flow.md)を参照してください。

## 📦 プロジェクト構造

```
document-hub/
├── src/
│   └── cli.ts                 # CLIエントリーポイント
├── utils/
│   ├── notion-fetcher/        # Notion APIクライアント
│   ├── notion-converter/      # Markdown変換ロジック
│   └── notion-processor/      # 統合処理ロジック
├── proxy/                     # Proxy API（Vercelにデプロイ）
│   └── api/
│       └── webhooks.js        # Notion Webhook受信エンドポイント
├── output/                    # 変換された記事の保存先
│   ├── *.md                   # Markdownファイル
│   ├── *.json                 # メタデータファイル
│   └── images/                # 画像ファイル
├── articles/                  # Zenn公開用記事
├── images/                    # Zenn公開用画像
├── docs/                      # ドキュメント
│   ├── README.md
│   └── processing-flow.md
└── .github/
    └── workflows/             # GitHub Actionsワークフロー
        ├── notion-sync.yml
        └── publish-to-zenn.yml
```

## 🚀 セットアップ

### 前提条件

- [Bun](https://bun.sh/) (最新版)
- Node.js 20+ (GitHub Actions用)
- [Vercel](https://vercel.com/) アカウント（Proxy APIのホスティング用）
- Notion API キー
- GitHub App (自動コミット・PR作成用)
- GitHub Personal Access Token（Proxy API用）

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd document-hub

# 依存関係をインストール
bun install
```

### Proxy APIのデプロイ

Proxy APIはVercelにデプロイ・ホスティングする必要があります。Proxy APIはNotion Webhookを受信し、GitHub Actionsの`repository_dispatch`イベントをトリガーする役割を担います。

#### Vercelへのデプロイ手順

1. **Vercelアカウントの準備**
   - [Vercel](https://vercel.com/)にアカウントを作成
   - GitHubアカウントと連携

2. **プロジェクトのインポート**
   ```bash
   # proxyディレクトリに移動
   cd proxy
   
   # Vercel CLIでデプロイ（またはVercelダッシュボードからインポート）
   vercel
   ```

3. **環境変数の設定**
   
   VercelダッシュボードまたはCLIで以下の環境変数を設定：
   
   ```bash
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_OWNER=your_github_username_or_org
   GITHUB_REPO=document-hub
   ```
   
   - `GITHUB_TOKEN`: GitHub Personal Access Token（`repo`スコープが必要）
   - `GITHUB_OWNER`: GitHubのユーザー名または組織名
   - `GITHUB_REPO`: リポジトリ名

4. **Webhook URLの取得**
   
   デプロイ後、Vercelから提供されるURL（例: `https://your-project.vercel.app/api/webhooks`）をNotionのWebhook設定に登録します。

#### ローカル開発

Proxy APIをローカルでテストする場合：

```bash
cd proxy
npm install
vercel dev
```

### 環境変数

#### メインプロジェクト

`.env`ファイルを作成し、以下の環境変数を設定してください：

```bash
NOTION_API_KEY=your_notion_api_key
```

#### Proxy API（Vercel）

Vercelダッシュボードで以下の環境変数を設定：

```bash
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=document-hub
```

## 💻 使用方法

### ローカルでの記事処理

```bash
# 記事IDを指定して処理
bun run fetch <article-id>
```

例：
```bash
bun run fetch 260354cfb4ef80beb1d5c7323178a8a1
```

処理が成功すると、以下のファイルが`output/`ディレクトリに作成されます：

- `<article-id>.md`: Markdown形式の記事
- `<article-id>.json`: メタデータ（タイトル、ステータス、プロパティなど）
- `images/`: 記事内の画像ファイル

### ビルド

```bash
# すべてのユーティリティをビルド
bun run build

# 個別にビルド
bun run build:fetcher
bun run build:converter
bun run build:processor
```

### テスト

```bash
# すべてのテストを実行
bun run test

# 個別にテスト
bun run test:fetcher
bun run test:converter
bun run test:processor
```

## 🔄 ワークフロー

### Notion記事の自動同期

1. **Notionページ更新**: Notionでページが更新される
2. **Webhook発火**: NotionからWebhookが送信される（VercelにデプロイされたProxy APIへ）
3. **Proxy API**: Vercel上で動作するProxy APIがWebhookを受信し、GitHubの`repository_dispatch`イベントを発火
4. **GitHub Actions**: `notion-sync.yml`ワークフローが実行される
5. **記事処理**: 
   - Notionから記事を取得
   - ステータスがPreview/Publishedの場合のみ処理
   - Markdownに変換
   - 画像をダウンロード
   - `output/`に保存
6. **変更検出**: 変更がある場合、mainブランチにコミット・プッシュ

### Zenn公開フロー

1. **プラットフォーム確認**: メタデータの`Platforms`プロパティにZennが含まれるか確認
2. **記事準備**: 
   - Zenn用のfrontmatterを追加
   - `articles/`ディレクトリに記事をコピー
   - 画像を`images/`ディレクトリにコピー
3. **Pull Request作成**: Zenn公開用のブランチを作成し、PRを作成

## 📝 記事のメタデータ

各記事のメタデータ（`output/<article-id>.json`）には以下の情報が含まれます：

- `title`: 記事タイトル
- `properties`: Notionページのプロパティ
  - `Status`: 記事のステータス（Preview/Publishedなど）
  - `Platforms`: 公開先プラットフォーム（Zennなど）
  - `Title`: タイトルプロパティ
- `processedAt`: 処理日時
- `processingTime`: 処理時間（ミリ秒）
- `images`: ダウンロードされた画像のリスト

## 🔧 開発

### ワークスペース構成

このプロジェクトはBunのワークスペース機能を使用しています：

- `utils/notion-fetcher`: Notion APIクライアントライブラリ
- `utils/notion-converter`: Markdown変換ライブラリ
- `utils/notion-processor`: 統合処理ライブラリ

各ワークスペースは独立したパッケージとして管理されており、個別にビルド・テストが可能です。

### コーディング規約

- TypeScriptを使用
- ESLintとPrettierでコードフォーマット
- 各ユーティリティパッケージにテストを追加

## 📚 ドキュメント

- [処理フロー図](./docs/processing-flow.md): システム全体の処理フローを図示
- [仕様書](./SPEC.md): プロジェクトの仕様

## 🤝 コントリビューション

1. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
2. 変更をコミット (`git commit -m 'Add some amazing feature'`)
3. ブランチにプッシュ (`git push origin feature/amazing-feature`)
4. Pull Requestを作成

## 📄 ライセンス

MIT License

## 🔗 関連リンク

- [Notion API Documentation](https://developers.notion.com/)
- [Zenn CLI Documentation](https://zenn.dev/zenn/articles/zenn-cli-guide)
- [Bun Documentation](https://bun.sh/docs)
- [Vercel Documentation](https://vercel.com/docs)
