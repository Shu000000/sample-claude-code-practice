# 希望シフトAPI 基本設計書

**API ID:** API-04
**API名:** 希望シフトAPI
**作成日:** 2026-03-04

---

## 1. 概要

従業員が希望シフトを登録・閲覧・修正するAPI。管理者は全員の希望シフトを閲覧できる。

---

## 2. エンドポイント一覧

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /api/shift-requests | 希望シフト一覧取得 | admin |
| GET | /api/shift-requests/my | 自分の希望シフト取得 | employee |
| POST | /api/shift-requests | 希望シフト登録 | employee |
| PUT | /api/shift-requests/:id | 希望シフト更新（確定前のみ） | employee |
| DELETE | /api/shift-requests/:id | 希望シフト削除（確定前のみ） | employee |

---

## 3. クエリパラメータ（GET /api/shift-requests）

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| year | int | 対象年 |
| month | int | 対象月 |
| employee_id | int | 従業員IDで絞り込み |

---

## 4. データモデル

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | int | 希望シフトID（自動採番） |
| employee_id | int | 従業員ID（FK） |
| date | date | 希望日 |
| availability | enum | available / unavailable / negotiable |
| preferred_start | time | 希望開始時刻（任意） |
| preferred_end | time | 希望終了時刻（任意） |
| note | string | 備考（最大200文字） |
| created_at | datetime | 作成日時 |
| updated_at | datetime | 更新日時 |

---

## 5. バリデーション

| フィールド | ルール |
|-----------|--------|
| date | 必須、日付形式 |
| availability | 必須、available / unavailable / negotiable |
| preferred_start | 任意、時刻形式 |
| preferred_end | 任意、preferred_startより後 |
| note | 最大200文字 |

---

## 6. 制約

- シフトが確定済みの場合、希望シフトの更新・削除は不可
- 同一従業員の同日希望シフトは1件のみ

---

## 7. エラーコード

| コード | 説明 |
|--------|------|
| 400 | バリデーションエラー |
| 403 | 他人の希望シフトへのアクセス |
| 404 | 希望シフトが見つからない |
| 409 | 同日の希望シフト重複 |
| 422 | 確定済みシフトへの変更不可 |
