# ログイン画面 詳細設計書

**画面ID:** SCR-01
**画面名:** ログイン画面
**作成日:** 2026-03-04

---

## 1. コンポーネント構成

```
LoginPage
├── LoginForm
│   ├── EmailInput
│   ├── PasswordInput
│   ├── SubmitButton
│   └── ErrorMessage
```

---

## 2. コンポーネント詳細

### LoginPage
- パス: `/login`
- ログイン済みの場合はロールに応じたページへリダイレクト

### LoginForm
- フォームのstate管理（email, password, error, loading）
- バリデーション処理
- API呼び出し処理

---

## 3. 状態管理

```typescript
interface LoginFormState {
  email: string;
  password: string;
  error: string | null;
  isLoading: boolean;
}
```

---

## 4. バリデーション仕様

| 項目 | ルール | エラーメッセージ |
|------|--------|----------------|
| email | 必須 | 「メールアドレスを入力してください」 |
| email | メール形式 | 「有効なメールアドレスを入力してください」 |
| password | 必須 | 「パスワードを入力してください」 |
| password | 最低6文字 | 「パスワードは6文字以上で入力してください」 |

---

## 5. API通信仕様

### ログインAPI呼び出し

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
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

---

## 6. 画面遷移ロジック

```
ログインボタン押下
  → バリデーション実行
    → エラーあり: エラーメッセージ表示
    → エラーなし: API呼び出し
      → 成功:
        → JWTトークンをlocalStorageに保存
        → role === "admin" → /admin/dashboard へリダイレクト
        → role === "employee" → /shifts へリダイレクト
      → 失敗: エラーメッセージ表示
```

---

## 7. UIコンポーネント仕様

### EmailInput
- type: email
- placeholder: "メールアドレス"
- autocomplete: email

### PasswordInput
- type: password
- placeholder: "パスワード"
- autocomplete: current-password

### SubmitButton
- テキスト: "ログイン"
- disabled: isLoading === true
- loading時: スピナー表示

### ErrorMessage
- エラー発生時のみ表示
- スタイル: 赤色テキスト、エラーアイコン

---

## 8. セキュリティ考慮事項

- パスワード入力はマスキング（type="password"）
- ログイン失敗時は具体的な原因（メール不一致かパスワード不一致か）を表示しない
- 連続ログイン失敗時の制限は将来の検討事項
