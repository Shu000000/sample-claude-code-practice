# 認証API 詳細設計書

**API ID:** API-01
**API名:** 認証API
**作成日:** 2026-03-04

---

## 1. データベース設計

### usersテーブル（従業員APIと共用）
```sql
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,  -- bcryptハッシュ
  role       ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);
```

---

## 2. エンドポイント詳細

### POST /api/auth/login

**説明:** ユーザーログイン

**リクエスト**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**処理フロー**
```
1. emailでユーザーを取得（deleted_atがNULLのもの）
2. ユーザーが見つからない場合 → 401
3. bcryptでパスワード検証
4. パスワード不一致 → 401
5. JWTトークン生成 (payload: {userId, role, exp: 24h})
6. 200 + トークン・ユーザー情報を返却
```

**成功レスポンス (200)**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "田中 太郎",
    "email": "user@example.com",
    "role": "employee"
  }
}
```

**エラーレスポンス (401)**
```json
{
  "error": "メールアドレスまたはパスワードが正しくありません"
}
```

**バリデーション**
| フィールド | ルール |
|-----------|--------|
| email | 必須、メール形式 |
| password | 必須 |

---

### POST /api/auth/logout

**説明:** ログアウト（クライアント側でトークンを破棄するよう指示）

**ヘッダー**
```
Authorization: Bearer {token}
```

**成功レスポンス (200)**
```json
{
  "message": "ログアウトしました"
}
```

---

### GET /api/auth/me

**説明:** ログイン中ユーザー情報取得

**ヘッダー**
```
Authorization: Bearer {token}
```

**成功レスポンス (200)**
```json
{
  "id": 1,
  "name": "田中 太郎",
  "email": "user@example.com",
  "role": "employee"
}
```

**エラーレスポンス (401)**
```json
{
  "error": "認証が必要です"
}
```

---

## 3. JWT設定

```
アルゴリズム: HS256
有効期限: 24時間
Payload:
  {
    "userId": 1,
    "role": "admin",
    "exp": <unix timestamp>
  }
```

---

## 4. ミドルウェア設計

### AuthMiddleware
```go
// 全認証が必要なエンドポイントに適用
// Authorizationヘッダーからトークンを抽出・検証
// コンテキストにユーザー情報をセット
```

### AdminMiddleware
```go
// AuthMiddlewareの後に適用
// role !== 'admin' の場合 403 を返却
```

---

## 5. セキュリティ仕様

- パスワードはbcryptコスト10でハッシュ化
- JWTシークレットは環境変数で管理
- エラーメッセージは原因を特定できないよう統一
