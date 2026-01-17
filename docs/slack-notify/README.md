# PRマージSlack通知の実装計画

## 方針
- 通知はIncoming Webhook方式（`SLACK_WEBHOOK_URL` をGitHub Secretsに保存）で実装する
- PRマージイベント（`pull_request` の `closed` かつ `merged=true`）でトリガーし、Zenn公開PRのみ通知する
- Zenn公開PRの判定は、既存ワークフローが作るPRタイトル接頭辞 `📝 Publish to Zenn:` とブランチ名 `publish-zenn-` を利用する

## 変更対象ファイル
- 新規: `.github/workflows/slack-notify-on-merge.yml`
- 参照: `.github/workflows/publish-to-zenn.yml`（PRタイトル/ブランチ命名規則の確認済み）

## 実装ステップ
1. `pull_request` の `closed` イベント用のWorkflowを作成し、`merged` 判定とZenn判定の条件式を追加する
2. `actions/github-script` もしくはシンプルな `curl` でSlackにPOSTするステップを実装する（Webhook URLはSecretから取得）
3. Slack通知内容は「PRタイトル・URL・マージ者・記事ID（ブランチ名から抽出）」を含める
4. READMEまたは運用メモがある場合は、Webhookの追加手順を追記する（必要なら）

## 具体的なワークフロー概要（案）
- Trigger: `pull_request` `types: [closed]`
- Condition: `github.event.pull_request.merged == true && (startsWith(title, "📝 Publish to Zenn:") || startsWith(head.ref, "publish-zenn-"))`
- Steps: `curl -X POST -H 'Content-type: application/json' --data '{...}' $SLACK_WEBHOOK_URL`

## 参考
- `publish-to-zenn.yml` のPRタイトル生成: `📝 Publish to Zenn: ${title}`
- PRブランチ命名: `publish-zenn-${entity-id}-...`

