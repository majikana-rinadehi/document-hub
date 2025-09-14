# テスト実行ガイド

## ユニットテスト

ユニットテストは環境変数なしで実行できます：

```bash
bun test tests/unit.test.ts
```

## 統合テスト

統合テストを実行するには、以下の環境変数を設定してください：

### 必須の環境変数

```bash
export NOTION_API_KEY="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export NOTION_TEST_PAGE_ID="12345678-1234-1234-1234-123456789abc"
```

### オプションの環境変数

```bash
export NOTION_TEST_PAGE_WITH_IMAGES_ID="12345678-1234-1234-1234-123456789abc"
```

### 統合テストの実行

```bash
bun test tests/integration.test.ts
```

## 全テストの実行

```bash
bun test
```

## 環境変数の取得方法

### Notion APIキーの取得

1. [Notion Developers](https://developers.notion.com/) にアクセス
2. "My integrations" → "New integration" をクリック
3. Integration名を設定して作成
4. "Internal Integration Token" をコピー

### テスト用ページIDの取得

1. Notionでテスト用のページを作成
2. ページのURLからIDを取得
   - URL: `https://notion.so/My-Test-Page-12345678123412341234123456789abc`
   - Page ID: `12345678-1234-1234-1234-123456789abc` (ハイフンを追加)

### Integration権限の設定

1. テスト用ページで "Share" をクリック
2. 作成したIntegrationを追加
3. "Can edit" 権限を付与

## テスト環境の例

`.env.test` ファイルを作成：

```bash
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_TEST_PAGE_ID=12345678-1234-1234-1234-123456789abc
NOTION_TEST_PAGE_WITH_IMAGES_ID=87654321-4321-4321-4321-210987654321
NOTION_IMAGE_DIR=./test-images
NOTION_IMAGE_PREFIX=/test-images
```

環境変数を読み込んで実行：

```bash
source .env.test
bun test
```

## トラブルシューティング

### "API token is invalid" エラー

- APIキーが正しいか確認
- Integrationがページに追加されているか確認

### "Could not find page" エラー

- ページIDが正しいか確認
- IntegrationにページのRead権限があるか確認

### タイムアウトエラー

- ネットワーク接続を確認
- Notion APIの状態を確認: https://status.notion.so/