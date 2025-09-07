# Document Hub プロジェクト概要

## 目的
NotionからMarkdown記事を連携して、ブログ投稿用に保管するシステム。

## プロジェクト構成
- **メインディレクトリ**: `/Users/nakajimahidenari/src/github.com/majikana-rinadehi/document-hub`
- **主要コンポーネント**:
  - `utils/notion-fetcher/` - Notion APIクライアントライブラリ
  - `utils/notion-converter/` - NotionからMarkdownへの変換ライブラリ
  - `proxy/` - Notion webhookをGitHubに中継するプロキシ
  - `.github/workflows/notion-sync.yml` - GitHub Actions連携

## 技術スタック
- **ランタイム**: Bun
- **言語**: TypeScript (strict mode)
- **主要ライブラリ**: 
  - `@notionhq/client` - Notion API
  - `notion-to-md` - Markdown変換
  - `@octokit/rest` - GitHub API
- **開発ツール**: ESLint (Airbnb), Prettier, Husky, lint-staged

## ワークフロー
1. Notionページが更新される
2. Webhookがproxyに通知
3. GitHub ActionsでNotion記事を取得・変換
4. Markdownファイルとしてリポジトリに保存

## 現在の実装状況
- notion-fetcher: 完成 ✅
- notion-converter: 完成 ✅  
- proxy: 基本構造のみ
- GitHub Actions: 基本ワークフロー設定済み