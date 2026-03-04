# 管理者ダッシュボード 詳細設計書

**画面ID:** SCR-02
**画面名:** 管理者ダッシュボード
**作成日:** 2026-03-04

---

## 1. コンポーネント構成

```
AdminDashboardPage
├── Header
│   ├── Logo
│   ├── NavigationMenu
│   └── UserInfo (名前 + ログアウトボタン)
├── SummaryCards
│   ├── ConfirmedShiftCard
│   ├── UnconfirmedShiftCard
│   └── EmployeeCountCard
├── QuickActions
│   ├── CreateShiftButton
│   ├── AddEmployeeButton
│   └── ViewShiftRequestsButton
└── RecentShiftsTable
    ├── ShiftTableHeader
    └── ShiftTableRow[]
```

---

## 2. 状態管理

```typescript
interface DashboardState {
  summary: {
    confirmedShifts: number;
    unconfirmedShifts: number;
    employeeCount: number;
  };
  recentShifts: Shift[];
  isLoading: boolean;
  error: string | null;
}

interface Shift {
  id: number;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'unconfirmed';
}
```

---

## 3. データ取得仕様

### 初期データ取得
```
マウント時に並行して以下を実行:
1. GET /api/shifts?year={year}&month={month} → 今月のシフト一覧
2. GET /api/employees → 従業員数取得

取得後:
- confirmedShifts = shifts.filter(status === 'confirmed').length
- unconfirmedShifts = shifts.filter(status === 'unconfirmed').length
- recentShifts = 今週のシフト（直近7日間）
```

---

## 4. ログアウト処理

```
ログアウトボタン押下
  → POST /api/auth/logout
  → localStorageからトークン削除
  → /login へリダイレクト
```

---

## 5. サマリーカード表示

| カード | 表示内容 | 取得元 |
|--------|---------|--------|
| 確定済み | 今月の確定済みシフト件数 | シフトAPI |
| 未確定 | 今月の未確定シフト件数 | シフトAPI |
| 従業員数 | 登録中の従業員総数 | 従業員API |

---

## 6. 直近シフト一覧テーブル

### 表示カラム
| カラム名 | データ | フォーマット |
|---------|--------|------------|
| 日付 | date | YYYY/MM/DD (曜日) |
| 従業員名 | employeeName | テキスト |
| 開始時刻 | startTime | HH:MM |
| 終了時刻 | endTime | HH:MM |
| 状態 | status | 確定済み / 未確定（バッジ表示） |

### ソート
- 日付昇順で表示
- 最大10件表示

---

## 7. アクセス制御

- ページ表示時にJWTトークンを検証
- role !== 'admin' の場合は /shifts へリダイレクト
