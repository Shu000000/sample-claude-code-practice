# 従業員一覧画面 詳細設計書

**画面ID:** SCR-04
**画面名:** 従業員一覧画面
**作成日:** 2026-03-04

---

## 1. コンポーネント構成

```
EmployeeListPage
├── Header (共通)
├── PageTitle ("従業員一覧")
├── AddEmployeeButton
├── EmployeeTable
│   ├── TableHeader
│   └── EmployeeRow[]
│       ├── Name
│       ├── Email
│       ├── RoleBadge
│       ├── EditButton
│       └── DeleteButton
├── EmployeeFormModal (追加・編集共通)
│   ├── NameInput
│   ├── EmailInput
│   ├── PasswordInput (新規のみ)
│   ├── RoleSelect
│   └── ActionButtons
└── DeleteConfirmDialog
```

---

## 2. 状態管理

```typescript
interface EmployeeListState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  isModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  createdAt: string;
}
```

---

## 3. 従業員一覧表示

### 初期表示
```
マウント時:
  GET /api/employees
  → Employee[] を取得して一覧表示
```

### テーブル仕様
| カラム | フィールド | フォーマット |
|--------|-----------|------------|
| 名前 | name | テキスト |
| メールアドレス | email | テキスト |
| 役割 | role | バッジ（管理者: 青 / 従業員: 緑） |
| 操作 | - | 編集・削除ボタン |

---

## 4. 従業員追加・編集モーダル

### 新規追加時
- タイトル: 「従業員追加」
- パスワードフィールドを表示

### 編集時
- タイトル: 「従業員編集」
- パスワードフィールドを非表示（変更不可）
- 既存データを事前入力

### バリデーション仕様
| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| name | 必須 | 「名前を入力してください」 |
| name | 最大50文字 | 「名前は50文字以内で入力してください」 |
| email | 必須 | 「メールアドレスを入力してください」 |
| email | メール形式 | 「有効なメールアドレスを入力してください」 |
| password | 必須（新規） | 「パスワードを入力してください」 |
| password | 最低8文字 | 「パスワードは8文字以上で入力してください」 |
| role | 必須 | 「役割を選択してください」 |

---

## 5. 削除処理

```
削除ボタン押下
  → 確認ダイアログ:「{名前}を削除しますか？この操作は取り消せません。」
  → OK押下
    → DELETE /api/employees/:id
    → 成功: 一覧から削除
    → 失敗: エラーメッセージ表示
```

### 論理削除
- DBのdeleted_atに現在時刻をセット
- 一覧からは非表示になる
- 関連するシフトデータは保持（表示時は「削除済み従業員」として表示）

---

## 6. API呼び出し仕様

### 従業員一覧取得
```
GET /api/employees
Response: Employee[]
```

### 従業員新規登録
```
POST /api/employees
Body: { name, email, password, role }
Response: Employee
```

### 従業員情報更新
```
PUT /api/employees/:id
Body: { name, email, role }
Response: Employee
```

### 従業員削除
```
DELETE /api/employees/:id
Response: { message: "削除しました" }
```
