# 希望シフトAPI 詳細設計書

**API ID:** API-04
**API名:** 希望シフトAPI
**作成日:** 2026-03-04

---

## 1. データベース設計

```sql
CREATE TABLE shift_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT NOT NULL,
  date            DATE NOT NULL,
  availability    ENUM('available', 'unavailable', 'negotiable') NOT NULL,
  preferred_start TIME DEFAULT NULL,
  preferred_end   TIME DEFAULT NULL,
  note            VARCHAR(200) DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id),
  UNIQUE KEY uk_shift_requests_employee_date (employee_id, date)
);
CREATE INDEX idx_shift_requests_date ON shift_requests(date);
CREATE INDEX idx_shift_requests_employee_id ON shift_requests(employee_id);
```

---

## 2. エンドポイント詳細

### GET /api/shift-requests

**説明:** 全従業員の希望シフト一覧取得（管理者のみ）

**クエリパラメータ**
| パラメータ | 型 | 必須 |
|-----------|-----|------|
| year | int | 任意 |
| month | int | 任意 |
| employee_id | int | 任意 |

**成功レスポンス (200)**
```json
[
  {
    "id": 1,
    "employeeId": 1,
    "employeeName": "田中 太郎",
    "date": "2026-04-01",
    "availability": "available",
    "preferredStart": "09:00",
    "preferredEnd": "18:00",
    "note": "午後は早めに上がれると助かります"
  }
]
```

---

### GET /api/shift-requests/my

**説明:** ログイン中従業員自身の希望シフト取得

**クエリパラメータ**
| パラメータ | 型 | 必須 |
|-----------|-----|------|
| year | int | 任意 |
| month | int | 任意 |

**処理フロー**
```
1. JWTからuserIdを取得
2. WHERE employee_id = userId でフィルタリング
3. 月指定時はYEAR/MONTHでフィルタ
```

**成功レスポンス (200)**
```json
[
  {
    "id": 1,
    "date": "2026-04-01",
    "availability": "available",
    "preferredStart": "09:00",
    "preferredEnd": "18:00",
    "note": ""
  }
]
```

---

### POST /api/shift-requests

**リクエスト**
```json
{
  "date": "2026-04-01",
  "availability": "available",
  "preferredStart": "09:00",
  "preferredEnd": "18:00",
  "note": ""
}
```

**処理フロー**
```
1. JWTからuserIdを取得
2. バリデーション
3. 同日の希望シフト重複チェック
4. 該当月のシフトが確定済みでないか確認
5. shift_requestsテーブルにINSERT
```

**成功レスポンス (201)**
```json
{
  "id": 5,
  "employeeId": 1,
  "date": "2026-04-01",
  "availability": "available",
  "preferredStart": "09:00",
  "preferredEnd": "18:00",
  "note": ""
}
```

**エラーレスポンス (422)**
```json
{
  "error": "このシフトは確定済みのため変更できません"
}
```

---

### PUT /api/shift-requests/:id

**リクエスト**
```json
{
  "availability": "negotiable",
  "preferredStart": null,
  "preferredEnd": null,
  "note": "都合により時間変更希望"
}
```

**処理フロー**
```
1. JWTからuserIdを取得
2. リクエストIDのshift_requestを取得
3. 所有者確認（employee_id === userId）
4. 該当月のシフトが確定済みでないか確認
5. UPDATE実行
```

---

### DELETE /api/shift-requests/:id

**処理フロー**
```
1. JWTからuserIdを取得
2. 所有者確認
3. 確定済みシフトのチェック
4. DELETE実行
5. 204 No Content
```

---

## 3. 確定チェックロジック

```go
// シフト確定チェック
func isMonthConfirmed(year, month, employeeId int) bool {
    // その月のシフトに confirmed のものがあれば true
    count := db.Count("SELECT COUNT(*) FROM shifts WHERE
        employee_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
        AND status = 'confirmed'", employeeId, year, month)
    return count > 0
}
```

---

## 4. バリデーションルール

```go
type CreateShiftRequestRequest struct {
    Date           string  `json:"date" binding:"required"`
    Availability   string  `json:"availability" binding:"required,oneof=available unavailable negotiable"`
    PreferredStart *string `json:"preferredStart"`  // HH:MM or null
    PreferredEnd   *string `json:"preferredEnd"`    // HH:MM or null
    Note           string  `json:"note" binding:"max=200"`
}
```
