# 従業員API 基本設計書

**API ID:** API-02
**API名:** 従業員API
**作成日:** 2026-03-04

---

## 1. 概要

従業員のCRUD操作を行うAPI。管理者のみがアクセス可能。

---

## 2. エンドポイント一覧

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /api/employees | 従業員一覧取得 | admin |
| GET | /api/employees/:id | 従業員詳細取得 | admin |
| POST | /api/employees | 従業員新規登録 | admin |
| PUT | /api/employees/:id | 従業員情報更新 | admin |
| DELETE | /api/employees/:id | 従業員削除（論理削除） | admin |

---

## 3. データモデル

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | int | 従業員ID（自動採番） |
| name | string | 氏名 |
| email | string | メールアドレス（ユニーク） |
| password | string | ハッシュ化パスワード |
| role | enum | admin / employee |
| created_at | datetime | 登録日時 |
| updated_at | datetime | 更新日時 |
| deleted_at | datetime | 削除日時（論理削除） |

---

## 4. バリデーション

| フィールド | ルール |
|-----------|--------|
| name | 必須、最大50文字 |
| email | 必須、メール形式、重複不可 |
| password | 必須（新規のみ）、最低8文字 |
| role | admin または employee |

---

## 5. エラーコード

| コード | 説明 |
|--------|------|
| 400 | バリデーションエラー |
| 403 | 管理者以外のアクセス |
| 404 | 従業員が見つからない |
| 409 | メールアドレス重複 |
