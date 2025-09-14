@.github/workflows/notion-sync.yml

### Process Notion update

下記追加、actions-scriptを使いjsで実装

- github.event.client_payload.entity.id に、更新対象のページIDが入ってくる
- github.event.client_payload.entity.type が pageであれば
  - @package.json の fetch スクリプトを実行
    - bun run fetch {ページID}

### Create Update Article Pull Request

新規ジョブとして追加、actions-scriptを使いjsで実装

- output配下に、Process Notion update の出力結果が新しく追加されていれば、それらをフィーチャーブランチでコミット・PRを作成
