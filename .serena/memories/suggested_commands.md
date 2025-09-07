# 推奨コマンド

## 開発コマンド
### notion-fetcher/notion-converterプロジェクト
```bash
# 開発実行
bun run dev

# ビルド
bun run build

# テスト実行
bun test

# リント
bun run lint
bun run lint:fix

# フォーマット
bun run format

# 型チェック
bun run type-check

# 依存関係インストール
bun install
```

## システムコマンド (macOS)
```bash
# ファイル一覧
ls -la

# ディレクトリ変更
cd path/to/directory

# ファイル検索
find . -name "*.ts"

# 内容検索  
grep -r "pattern" .

# Git操作
git status
git add .
git commit -m "message"
git push
```

## プロジェクト固有
### 環境変数設定
```bash
export NOTION_API_KEY="your-notion-api-key"
```

### Huskyセットアップ (必要時)
```bash
npx husky install
```

## 推奨ワークフロー
1. 作業前: `bun run type-check` で型エラーチェック
2. 開発: `bun run dev` で動作確認
3. コミット前: `bun run lint:fix && bun run format` で整形
4. テスト: `bun test` で動作検証