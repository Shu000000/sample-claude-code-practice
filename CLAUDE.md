# CLAUDE.md

# ドキュメント作成ワークフロー
"実装を開始してください"のような入力があったら、以下をすべて遂行する

## 仕様書作成の手順
1. `specifications/specifications.md` を読み込み、プロジェクトの要件を理解する
2. 以下の順序でドキュメントを作成する：
   - 要件定義書 → `specifications/requirements.md`
   - 基本設計書
   - 詳細設計書

## 重要なルール
- 新しいドキュメント作成前に必ず `@specifications/specifications.md` を参照すること
- 各設計書は前段階のドキュメントと整合性を保つこと

# 設計書ルール

## 基本設計書
- 画面単位: `docs/basic-design/screens/` に配置
- API単位: `docs/basic-design/api/` に配置

## 詳細設計書
- 画面単位: `docs/detailed-design/screens/` に配置
- API単位: `docs/detailed-design/api/` に配置

## 命名規則
- 画面: `{画面名}_basic.md`, `{画面名}_detailed.md`
- API: `{API名}_basic.md`, `{API名}_detailed.md`

## テスト仕様書を作成する
- e2eテストの内容を作成する
- unitテストの内容を作成する

# 検証
- 作成したすべての仕様書で抜け漏れがないかを確認
- 抜け漏れがある場合は、追記

# 実装
- 作成した仕様書をもとに実装を開始
- 使用言語について
  - front: typescript(React)
  - backend: go(Gin)
- 環境
  - コンテナ: Docker
  - DB: MySQL

# 再検証
- 仕様書に対して実装に抜け漏れがないか確認
- 抜け漏れがある場合は追加の実装を行う
- テスト仕様書に沿ったテストを実行
- テストで検知されたバグの修正を実施
- 修正内容を反映すべき仕様書全てに反映する
- 再テストを実施
- テストで問題ないことが確認できたことをコンソール画面に表示
- 今の仕様と実装で不足していることをexpect.mdを作成し、記述する