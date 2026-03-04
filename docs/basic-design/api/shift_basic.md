# シフトAPI 基本設計書

**API ID:** API-03
**API名:** シフトAPI
**作成日:** 2026-03-04

---

## 1. 概要

シフトのCRUD操作および確定状態管理を行うAPI。

---

## 2. エンドポイント一覧

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | /api/shifts | シフト一覧取得（クエリパラメータで絞り込み） | admin |
| GET | /api/shifts/my | 自分のシフト取得 | employee |
| GET | /api/shifts/:id | シフト詳細取得 | admin |
| POST | /api/shifts | シフト新規作成 | admin |
| PUT | /api/shifts/:id | シフト更新 | admin |
| DELETE | /api/shifts/:id | シフト削除 | admin |
| PUT | /api/shifts/confirm | 月単位でシフト確定 | admin |

---

## 3. クエリパラメータ（GET /api/shifts）

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| year | int | 対象年 |
| month | int | 対象月 |
| employee_id | int | 従業員IDで絞り込み |
| status | string | confirmed / unconfirmed |

---

## 4. データモデル

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | int | シフトID（自動採番） |
| employee_id | int | 従業員ID（FK） |
| date | date | 勤務日 |
| start_time | time | 開始時刻 |
| end_time | time | 終了時刻 |
| status | enum | confirmed / unconfirmed |
| created_at | datetime | 作成日時 |
| updated_at | datetime | 更新日時 |

---

## 5. バリデーション

| フィールド | ルール |
|-----------|--------|
| employee_id | 必須、存在する従業員ID |
| date | 必須、日付形式 |
| start_time | 必須、時刻形式 |
| end_time | 必須、start_timeより後 |

---

## 6. エラーコード

| コード | 説明 |
|--------|------|
| 400 | バリデーションエラー |
| 403 | 権限不足 |
| 404 | シフトが見つからない |
| 409 | 同一従業員の同日シフト重複 |
