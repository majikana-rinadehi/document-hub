@.github/workflows/notion-sync.yml

### Create Pull Request ✅ COMPLETED

- ~~prBodyが想定通りではないので正しくフォーマット~~ ✅ 完了
  - JavaScript template literalで実際の改行を使用するように修正
  - `\n`エスケープシーケンスを削除し、実際の改行文字を使用
  
- ~~PRのテンプレートを用意しておいて、そこに埋め込まれている変数を置き換えて本文生成~~ ✅ 完了
  - `.github/pr-template.md`にテンプレートファイルを作成
  - `{{PAGE_ID}}`と`{{FILES_LIST}}`のプレースホルダーを使用
  - ワークフロー内でテンプレートを読み込み、変数を置換して使用

変更内容:
1. PRテンプレートファイル (`.github/pr-template.md`) を作成
2. ワークフローを修正してテンプレートを使用するように変更
3. コミットメッセージのフォーマットも同様に修正（実際の改行を使用）
4. "Generated with Claude Code"の記述を削除