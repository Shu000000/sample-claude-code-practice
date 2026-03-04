# シフト確認画面 詳細設計書

**画面ID:** SCR-06
**画面名:** シフト確認画面
**作成日:** 2026-03-04

---

## 1. コンポーネント構成

```
ShiftConfirmPage
├── Header (共通)
├── MonthNavigator
├── ViewToggle (月別 | 週別)
├── ShiftCalendar
│   ├── MonthlyView
│   │   ├── CalendarHeader (曜日)
│   │   └── CalendarCell[]
│   │       └── ShiftInfo (時刻表示)
│   └── WeeklyView
│       └── DayColumn[]
│           └── ShiftBlock (時間軸)
└── MonthlySummary
    ├── WorkingDaysCount
    └── TotalWorkingHours
```

---

## 2. 状態管理

```typescript
interface ShiftConfirmState {
  currentYear: number;
  currentMonth: number;
  viewMode: 'monthly' | 'weekly';
  myShifts: MyShift[];
  summary: {
    workingDays: number;
    totalHours: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface MyShift {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: 'confirmed' | 'unconfirmed';
}
```

---

## 3. データ取得仕様

### 自分のシフト取得
```
GET /api/shifts/my?year={year}&month={month}
→ 確定済み・未確定両方を取得
→ 表示は確定済みのみ（status === 'confirmed'）
→ 未確定シフトは「確定待ち」バッジで表示
```

---

## 4. サマリー計算ロジック

```typescript
// 勤務日数
workingDays = myShifts.filter(s => s.status === 'confirmed').length;

// 合計勤務時間
totalHours = myShifts
  .filter(s => s.status === 'confirmed')
  .reduce((sum, shift) => {
    const start = parseTime(shift.startTime);
    const end = parseTime(shift.endTime);
    return sum + (end - start) / 60; // 分 → 時間
  }, 0);
```

---

## 5. カレンダー表示仕様

### 月別表示
| 要素 | 内容 |
|------|------|
| 勤務あり日 | 開始〜終了時刻を緑色で表示 |
| 確定待ち日 | 「確定待ち」を黄色バッジで表示 |
| 勤務なし日 | 空白 |

### 週別表示
- 横軸: 月〜日
- 縦軸: 時刻（6:00〜22:00）
- 勤務ブロック: 開始〜終了時刻を緑色ブロックで表示

---

## 6. レスポンシブ対応

### PC表示（768px以上）
- 月別カレンダー: 7列グリッド
- 週別カレンダー: 時間軸グリッド

### スマートフォン表示（768px未満）
- 月別カレンダー: コンパクト表示
- 週別カレンダー: 横スクロール対応
- ナビゲーション: ハンバーガーメニュー

---

## 7. API呼び出し仕様

### 自分のシフト取得
```
GET /api/shifts/my?year={year}&month={month}
Response: MyShift[]
```
