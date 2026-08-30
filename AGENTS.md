# AI 作業ルール

## Notion 同期ワークフロー

次の実装を変更するときは、同じ変更で [`docs/notion-sync-flow.drawio.svg`](docs/notion-sync-flow.drawio.svg) も更新すること。

- `proxy/api/webhooks.js`
- `.github/workflows/notion-sync.yml`
- `.github/workflows/publish-to-zenn.yml`
- Notion の取得・変換・`output/` 保存・Zenn 公開に関係するコード

図は実装と矛盾しないよう、少なくともトリガー、条件分岐、保存先、コミット先、Zenn 公開用 PR 作成までを反映すること。ワークフローに影響しない変更では、図の更新は不要。
