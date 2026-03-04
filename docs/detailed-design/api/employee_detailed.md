# 従業員API 詳細設計書

**API ID:** API-02
**API名:** 従業員API
**作成日:** 2026-03-04

---

## 1. データベース設計

```sql
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

---

## 2. エンドポイント詳細

### GET /api/employees

**説明:** 従業員一覧取得（管理者のみ）

**クエリパラメータ:** なし

**処理フロー**
```
1. AdminMiddleware で管理者権限確認
2. deleted_at IS NULL の全ユーザーを取得
3. 配列で返却
```

**成功レスポンス (200)**
```json
[
  {
    "id": 1,
    "name": "田中 太郎",
    "email": "tanaka@example.com",
    "role": "employee",
    "createdAt": "2026-03-01T00:00:00Z"
  }
]
```

---

### GET /api/employees/:id

**説明:** 従業員詳細取得

**成功レスポンス (200)**
```json
{
  "id": 1,
  "name": "田中 太郎",
  "email": "tanaka@example.com",
  "role": "employee",
  "createdAt": "2026-03-01T00:00:00Z"
}
```

**エラーレスポンス (404)**
```json
{ "error": "従業員が見つかりません" }
```

---

### POST /api/employees

**説明:** 従業員新規登録

**リクエスト**
```json
{
  "name": "田中 太郎",
  "email": "tanaka@example.com",
  "password": "password123",
  "role": "employee"
}
```

**処理フロー**
```
1. バリデーション
2. emailの重複確認（deleted_at IS NULL）
3. パスワードをbcryptでハッシュ化
4. usersテーブルにINSERT
5. 作成したユーザー情報を返却（パスワード除く）
```

**成功レスポンス (201)**
```json
{
  "id": 2,
  "name": "田中 太郎",
  "email": "tanaka@example.com",
  "role": "employee",
  "createdAt": "2026-03-04T10:00:00Z"
}
```

**エラーレスポンス (409)**
```json
{ "error": "このメールアドレスは既に登録されています" }
```

---

### PUT /api/employees/:id

**説明:** 従業員情報更新

**リクエスト**
```json
{
  "name": "田中 次郎",
  "email": "tanaka2@example.com",
  "role": "admin"
}
```

**処理フロー**
```
1. バリデーション
2. 対象ユーザーの存在確認
3. email変更時は重複確認
4. UPDATE実行
5. 更新後のユーザー情報を返却
```

**成功レスポンス (200)**
```json
{
  "id": 1,
  "name": "田中 次郎",
  "email": "tanaka2@example.com",
  "role": "admin",
  "updatedAt": "2026-03-04T11:00:00Z"
}
```

---

### DELETE /api/employees/:id

**説明:** 従業員削除（論理削除）

**処理フロー**
```
1. 対象ユーザーの存在確認
2. deleted_at = CURRENT_TIMESTAMP でUPDATE（論理削除）
3. 204 No Content を返却
```

**成功レスポンス (204)**
```
（ボディなし）
```

---

## 3. バリデーションルール詳細

```go
type CreateEmployeeRequest struct {
    Name     string `json:"name" binding:"required,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
    Role     string `json:"role" binding:"required,oneof=admin employee"`
}

type UpdateEmployeeRequest struct {
    Name  string `json:"name" binding:"required,max=50"`
    Email string `json:"email" binding:"required,email"`
    Role  string `json:"role" binding:"required,oneof=admin employee"`
}
```
