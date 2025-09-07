# notion-processor ESLint設定実装プロンプト

## 実装タスク
notion-processorパッケージにESLint設定を追加する

## 要件
1. **ESLint設定**
   - Airbnbスタイルガイドをベースとする
   - strictモードで設定
   - TypeScript対応

## 実装手順

### 1. 必要なパッケージのインストール
以下のdevDependenciesを追加:
- eslint
- @typescript-eslint/parser
- @typescript-eslint/eslint-plugin
- eslint-config-airbnb-base
- eslint-config-airbnb-typescript
- eslint-plugin-import

### 2. ESLint設定ファイルの作成
`.eslintrc.json`または`.eslintrc.js`を作成し、以下の設定を含める:
- Airbnb設定の継承
- TypeScriptパーサーの設定
- strictルールの有効化
- プロジェクト固有のルール調整

### 3. package.jsonへのスクリプト追加
- `lint`: ESLintの実行
- `lint:fix`: 自動修正付きESLintの実行

### 4. 既存コードのリント
- 既存のTypeScriptコードに対してESLintを実行
- 必要に応じて自動修正を適用
- 自動修正できない問題は手動で修正

## 注意事項
- notion-processorの既存の機能を壊さないよう注意
- TypeScriptの型定義との整合性を保つ
- 他のutilsパッケージ（notion-fetcher、notion-converter）との一貫性を考慮

## 期待される成果物
1. ESLint設定ファイル（.eslintrc.json または .eslintrc.js）
2. 更新されたpackage.json（devDependenciesとscripts）
3. ESLintルールに準拠したクリーンなコード