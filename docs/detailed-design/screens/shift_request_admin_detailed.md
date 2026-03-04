# 希望シフト確認画面（管理者用） 詳細設計書

**画面ID:** SCR-07
**画面名:** 希望シフト確認画面（管理者用）
**作成日:** 2026-03-04

---

## 1. コンポーネント構成

```
ShiftRequestAdminPage
├── Header (共通)
├── PageTitle ("希望シフト確認")
├── Toolbar
│   ├── MonthNavigator (< 2026年4月 >)
│   └── EmployeeFilter (ドロップダウン)
├── ShiftRequestTable
│   ├── TableHeader
│   └── ShiftRequestRow[]
│       ├── EmployeeName
│       ├── Date (曜日付き)
│       ├── AvailabilityBadge
│       ├── PreferredTimeRange
│       └── Note
└── EmptyState ("希望シフトはまだ提出されていません")
```

---

## 2. 状態管理

```typescript
interface ShiftRequestAdminState {
  currentYear: number;
  currentMonth: number;
  selectedEmployeeId: number | null;
  shiftRequests: AdminShiftRequest[];
  employees: EmployeeOption[];
  isLoading: boolean;
  error: string | null;
}

interface AdminShiftRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 月〜日
  availability: 'available' | 'unavailable' | 'negotiable';
  preferredStart: string | null;
  preferredEnd: string | null;
  note: string;
}

interface EmployeeOption {
  id: number;
  name: string;
}
```

---

## 3. データ取得仕様

### 初期表示
```
1. GET /api/employees → 従業員一覧（フィルター用）
2. GET /api/shift-requests?year={year}&month={month} → 希望シフト一覧

取得後:
- shiftRequests に格納
- 日付昇順、従業員名昇順でソート
```

### フィルター適用
```
従業員フィルター変更時:
  GET /api/shift-requests?year={year}&month={month}&employee_id={id}
  → 絞り込み結果を表示
```

---

## 4. テーブル表示仕様

### ソート順
- 第1キー: date 昇順
- 第2キー: employeeName 昇順

### availability の表示

| 値 | 表示テキスト | バッジ色 |
|----|------------|---------|
| available | 希望あり | 緑 |
| unavailable | 不可 | 赤 |
| negotiable | 相談可 | 黄 |

### 希望時間の表示
- preferredStart と preferredEnd が両方ある場合: 「HH:MM〜HH:MM」
- どちらかがnullの場合: 「-」

### 日付の表示フォーマット
- 「4/1 (月)」形式

---

## 5. 空状態の表示

```
希望シフトが0件の場合:
  「{year}年{month}月の希望シフトはまだ提出されていません」
  を中央に表示
```

---

## 6. API呼び出し仕様

### 全従業員の希望シフト取得
```
GET /api/shift-requests?year={year}&month={month}[&employee_id={id}]
Response: AdminShiftRequest[]
```

### 従業員一覧取得（フィルター用）
```
GET /api/employees
Response: EmployeeOption[]
```
