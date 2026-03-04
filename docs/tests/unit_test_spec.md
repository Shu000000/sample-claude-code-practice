# ユニットテスト仕様書

**作成日:** 2026-03-04

---

## 1. テスト環境

### バックエンド（Go）
- テストフレームワーク: testing（標準ライブラリ）+ testify
- モックライブラリ: gomock
- テスト対象: ハンドラー層、サービス層、バリデーション

### フロントエンド（TypeScript/React）
- テストフレームワーク: Jest + React Testing Library
- テスト対象: コンポーネント、カスタムフック、ユーティリティ関数

---

## 2. バックエンドユニットテスト

### 2.1 認証ハンドラー

#### UNIT-BE-AUTH-01: ログイン成功
```go
func TestLogin_Success(t *testing.T) {
    // 正しいemail/passwordでログインした場合
    // 期待: 200 + JWTトークン + ユーザー情報
}
```

#### UNIT-BE-AUTH-02: ログイン失敗 - メール不一致
```go
func TestLogin_WrongEmail(t *testing.T) {
    // 存在しないemailでログインした場合
    // 期待: 401 + エラーメッセージ
}
```

#### UNIT-BE-AUTH-03: ログイン失敗 - パスワード不一致
```go
func TestLogin_WrongPassword(t *testing.T) {
    // 正しいemail + 誤ったpasswordでログインした場合
    // 期待: 401 + エラーメッセージ
}
```

#### UNIT-BE-AUTH-04: ログイン バリデーション - email空
```go
func TestLogin_EmptyEmail(t *testing.T) {
    // emailが空の場合
    // 期待: 400 + バリデーションエラー
}
```

#### UNIT-BE-AUTH-05: JWT生成・検証
```go
func TestGenerateToken(t *testing.T) {
    // トークン生成が成功し、ペイロードが正しいこと
}

func TestValidateToken(t *testing.T) {
    // 有効なトークンの検証成功
}

func TestValidateToken_Expired(t *testing.T) {
    // 期限切れトークンの検証失敗
}
```

---

### 2.2 従業員ハンドラー

#### UNIT-BE-EMP-01: 従業員一覧取得
```go
func TestGetEmployees_Success(t *testing.T) {
    // 管理者権限で一覧取得成功
    // 期待: 200 + 従業員配列
}

func TestGetEmployees_Forbidden(t *testing.T) {
    // 従業員権限でアクセス
    // 期待: 403
}
```

#### UNIT-BE-EMP-02: 従業員作成
```go
func TestCreateEmployee_Success(t *testing.T) {
    // 正常な入力で従業員作成成功
    // 期待: 201 + 作成した従業員情報
}

func TestCreateEmployee_DuplicateEmail(t *testing.T) {
    // 重複するemailで作成
    // 期待: 409
}

func TestCreateEmployee_InvalidEmail(t *testing.T) {
    // 不正なメール形式
    // 期待: 400
}

func TestCreateEmployee_ShortPassword(t *testing.T) {
    // パスワードが8文字未満
    // 期待: 400
}
```

#### UNIT-BE-EMP-03: 従業員更新
```go
func TestUpdateEmployee_Success(t *testing.T) {
    // 正常な更新
    // 期待: 200 + 更新後データ
}

func TestUpdateEmployee_NotFound(t *testing.T) {
    // 存在しないIDで更新
    // 期待: 404
}
```

#### UNIT-BE-EMP-04: 従業員削除（論理削除）
```go
func TestDeleteEmployee_Success(t *testing.T) {
    // 正常な削除
    // 期待: 204、deleted_atが設定される
}

func TestDeleteEmployee_NotFound(t *testing.T) {
    // 存在しないID
    // 期待: 404
}
```

---

### 2.3 シフトハンドラー

#### UNIT-BE-SHIFT-01: シフト一覧取得
```go
func TestGetShifts_WithYearMonth(t *testing.T) {
    // year=2026&month=3 でフィルタリングされた結果が返る
}

func TestGetShifts_WithEmployeeID(t *testing.T) {
    // employee_id でフィルタリングされた結果が返る
}
```

#### UNIT-BE-SHIFT-02: 自分のシフト取得
```go
func TestGetMyShifts_Success(t *testing.T) {
    // ログイン中従業員のシフトのみ取得
}
```

#### UNIT-BE-SHIFT-03: シフト作成
```go
func TestCreateShift_Success(t *testing.T) {
    // 正常なシフト作成
    // 期待: 201 + シフト情報
}

func TestCreateShift_DuplicateEmployeeDate(t *testing.T) {
    // 同一従業員・同日の重複シフト
    // 期待: 409
}

func TestCreateShift_InvalidTimeRange(t *testing.T) {
    // endTime <= startTime
    // 期待: 400
}
```

#### UNIT-BE-SHIFT-04: シフト確定
```go
func TestConfirmShifts_Success(t *testing.T) {
    // 指定月のシフトを全件確定
    // 期待: 200 + 更新件数
}
```

---

### 2.4 希望シフトハンドラー

#### UNIT-BE-REQ-01: 希望シフト登録
```go
func TestCreateShiftRequest_Success(t *testing.T) {
    // 正常な希望シフト登録
    // 期待: 201
}

func TestCreateShiftRequest_ConfirmedMonth(t *testing.T) {
    // 確定済み月への登録
    // 期待: 422
}

func TestCreateShiftRequest_DuplicateDate(t *testing.T) {
    // 同日の重複登録
    // 期待: 409
}
```

#### UNIT-BE-REQ-02: 希望シフト更新
```go
func TestUpdateShiftRequest_OtherEmployee(t *testing.T) {
    // 他人の希望シフトを更新しようとする
    // 期待: 403
}
```

---

### 2.5 エクスポートハンドラー

#### UNIT-BE-EXPORT-01: CSVエクスポート
```go
func TestExportCSV_Success(t *testing.T) {
    // 正常なCSVエクスポート
    // 期待: Content-Type: text/csv, BOMあり
}

func TestExportCSV_MissingParams(t *testing.T) {
    // yearまたはmonthが欠落
    // 期待: 400
}
```

---

## 3. フロントエンドユニットテスト

### 3.1 LoginForm コンポーネント

#### UNIT-FE-LOGIN-01: レンダリング確認
```typescript
test('LoginFormが正しくレンダリングされる', () => {
    // email入力、password入力、ログインボタンが存在すること
});
```

#### UNIT-FE-LOGIN-02: バリデーション
```typescript
test('email空でエラーが表示される', async () => {
    // emailを空のままログインボタンをクリック
    // 「メールアドレスを入力してください」が表示される
});

test('不正なメール形式でエラーが表示される', async () => {
    // 不正な形式のemailでログインを試みる
    // バリデーションエラーが表示される
});
```

### 3.2 カレンダーコンポーネント

#### UNIT-FE-CAL-01: 月の日付描画
```typescript
test('2026年3月のカレンダーが正しく描画される', () => {
    // 1日が日曜日から始まり、31日で終わること
});
```

#### UNIT-FE-CAL-02: シフトの表示
```typescript
test('シフトデータがカレンダーの正しい日付に表示される', () => {
    // 2026-03-04のシフトが4日のセルに表示される
});
```

### 3.3 ユーティリティ関数

#### UNIT-FE-UTIL-01: 勤務時間計算
```typescript
test('calcWorkHours("09:00", "18:00") === 9', () => {});
test('calcWorkHours("09:30", "18:00") === 8.5', () => {});
```

#### UNIT-FE-UTIL-02: 日付フォーマット
```typescript
test('formatDate("2026-03-04") === "2026/03/04"', () => {});
test('getDayOfWeek("2026-03-04") === "水"', () => {});
```

### 3.4 認証フック（useAuth）

#### UNIT-FE-AUTH-01: 認証状態管理
```typescript
test('ログイン後にユーザー情報が保存される', async () => {
    // login() 呼び出し後、user状態が設定される
});

test('ログアウト後にユーザー情報がクリアされる', async () => {
    // logout() 呼び出し後、user状態がnullになる
    // localStorageのトークンが削除される
});
```
