# シフトAPI 詳細設計書

**API ID:** API-03
**API名:** シフトAPI
**作成日:** 2026-03-04

---

## 1. データベース設計

```sql
CREATE TABLE shifts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT  NOT NULL,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  status      ENUM('confirmed', 'unconfirmed') NOT NULL DEFAULT 'unconfirmed',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id),
  UNIQUE KEY uk_shifts_employee_date (employee_id, date)
);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX idx_shifts_status ON shifts(status);
```

---

## 2. エンドポイント詳細

### GET /api/shifts

**説明:** シフト一覧取得（管理者のみ）

**クエリパラメータ**
| パラメータ | 型 | 必須 | デフォルト |
|-----------|-----|------|---------|
| year | int | 任意 | 現在年 |
| month | int | 任意 | 現在月 |
| employee_id | int | 任意 | - |
| status | string | 任意 | - |

**SQLクエリ（概略）**
```sql
SELECT s.id, s.date, s.start_time, s.end_time, s.status,
       u.id AS employee_id, u.name AS employee_name
FROM shifts s
JOIN users u ON s.employee_id = u.id
WHERE YEAR(s.date) = ? AND MONTH(s.date) = ?
  [AND s.employee_id = ?]
  [AND s.status = ?]
ORDER BY s.date, s.start_time
```

**成功レスポンス (200)**
```json
[
  {
    "id": 1,
    "employeeId": 1,
    "employeeName": "田中 太郎",
    "date": "2026-03-04",
    "startTime": "09:00",
    "endTime": "18:00",
    "status": "confirmed"
  }
]
```

---

### GET /api/shifts/my

**説明:** ログイン中従業員自身のシフト取得

**クエリパラメータ**
| パラメータ | 型 | 必須 |
|-----------|-----|------|
| year | int | 任意 |
| month | int | 任意 |

**処理フロー**
```
1. JWTからuserIdを取得
2. WHERE employee_id = userId でフィルタリング
3. 月指定がある場合はYEAR(date)とMONTH(date)でフィルタ
```

**成功レスポンス (200)**
```json
[
  {
    "id": 1,
    "date": "2026-03-04",
    "startTime": "09:00",
    "endTime": "18:00",
    "status": "confirmed"
  }
]
```

---

### POST /api/shifts

**リクエスト**
```json
{
  "employeeId": 1,
  "date": "2026-03-04",
  "startTime": "09:00",
  "endTime": "18:00"
}
```

**処理フロー**
```
1. バリデーション（必須項目、時刻整合性）
2. 同一従業員・同日の重複チェック
3. shiftsテーブルにINSERT（status = 'unconfirmed'）
4. 作成したシフト情報を返却
```

**成功レスポンス (201)**
```json
{
  "id": 5,
  "employeeId": 1,
  "employeeName": "田中 太郎",
  "date": "2026-03-04",
  "startTime": "09:00",
  "endTime": "18:00",
  "status": "unconfirmed"
}
```

---

### PUT /api/shifts/:id

**リクエスト**
```json
{
  "employeeId": 1,
  "date": "2026-03-04",
  "startTime": "10:00",
  "endTime": "19:00"
}
```

---

### DELETE /api/shifts/:id

**処理フロー**
```
1. シフトの存在確認
2. 確定済みシフトの場合は警告（確定済み削除は管理者のみ許可）
3. DELETE実行
4. 204 No Content
```

---

### PUT /api/shifts/confirm

**説明:** 指定月のシフトを一括確定

**リクエスト**
```json
{
  "year": 2026,
  "month": 3
}
```

**処理フロー**
```
1. 指定年月のshiftsを全件取得
2. status = 'confirmed' に一括UPDATE
3. 更新件数を返却
```

**成功レスポンス (200)**
```json
{
  "message": "2026年3月のシフトを確定しました",
  "updatedCount": 15
}
```

---

## 3. バリデーションルール詳細

```go
type CreateShiftRequest struct {
    EmployeeID int    `json:"employeeId" binding:"required"`
    Date       string `json:"date" binding:"required"`       // YYYY-MM-DD
    StartTime  string `json:"startTime" binding:"required"`  // HH:MM
    EndTime    string `json:"endTime" binding:"required"`    // HH:MM
}

// endTime > startTime の検証はカスタムバリデーションで実装
```
