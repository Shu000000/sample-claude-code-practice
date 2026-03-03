# CLAUDE.md

# ドキュメント作成ワークフロー

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

## 環境
Dockerのコンテナ技術を使用する