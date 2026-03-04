# シフト作成画面 詳細設計書

**画面ID:** SCR-03
**画面名:** シフト作成画面（カレンダー形式）
**作成日:** 2026-03-04

---

## 1. コンポーネント構成

```
ShiftCreationPage
├── Header (共通)
├── ShiftToolbar
│   ├── MonthNavigator (< 2026年3月 >)
│   ├── ViewToggle (月別 | 週別)
│   ├── ConfirmButton (シフト確定)
│   ├── AddShiftButton (新規シフト追加)
│   └── ExportButton (CSVエクスポート)
├── MonthlyCalendarView (月別表示)
│   ├── CalendarHeader (曜日)
│   └── CalendarCell[] (日付 + シフト一覧)
│       └── ShiftChip[] (従業員名 + 時刻)
├── WeeklyCalendarView (週別表示)
│   └── WeekRow[]
└── ShiftFormModal (追加・編集共通)
    ├── EmployeeSelect
    ├── DateInput
    ├── StartTimeInput
    ├── EndTimeInput
    └── ActionButtons
```

---

## 2. 状態管理

```typescript
interface ShiftCreationState {
  currentYear: number;
  currentMonth: number;
  viewMode: 'monthly' | 'weekly';
  shifts: ShiftData[];
  employees: EmployeeOption[];
  selectedShift: ShiftData | null;
  isModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ShiftData {
  id: number | null; // null は新規
  employeeId: number;
  employeeName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: 'confirmed' | 'unconfirmed';
}

interface EmployeeOption {
  id: number;
  name: string;
}
```

---

## 3. カレンダー描画ロジック

### 月別表示
```
1. 対象月の1日の曜日を取得
2. 前月の空白セルを追加
3. 各日付にその日のシフト一覧を表示
4. 1セルに複数シフトある場合はスクロール対応
```

### 週別表示
```
1. 現在週の月曜日を起点に7日分表示
2. 時間軸（縦軸）で勤務時間を可視化
```

---

## 4. シフト追加・編集モーダル

### モーダル表示条件
- カレンダーの空セルクリック → 新規追加（日付を事前設定）
- シフトチップクリック → 編集（既存データを事前設定）

### バリデーション
| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| employeeId | 必須 | 「従業員を選択してください」 |
| date | 必須 | 「日付を入力してください」 |
| startTime | 必須 | 「開始時刻を入力してください」 |
| endTime | 必須、start後 | 「終了時刻は開始時刻より後にしてください」 |

### 重複チェック
- 同一従業員・同日に既存シフトがある場合は警告表示

---

## 5. シフト確定処理

```
「シフト確定」ボタン押下
  → 確認ダイアログ:「{year}年{month}月のシフトを確定しますか？」
  → OK押下
    → PUT /api/shifts/confirm
         body: { year, month }
    → 成功: シフト状態を 'confirmed' に更新し一覧再取得
    → 失敗: エラーメッセージ表示
```

---

## 6. CSVエクスポート処理

```
「CSVエクスポート」ボタン押下
  → GET /api/export/csv?year={year}&month={month}
  → レスポンスをファイルとしてダウンロード
  → ファイル名: shift_{year}{month}.csv
```

---

## 7. API呼び出し仕様

### シフト一覧取得
```
GET /api/shifts?year={year}&month={month}
→ ShiftData[] を取得してカレンダーに反映
```

### シフト作成
```
POST /api/shifts
Body: { employeeId, date, startTime, endTime }
→ 成功: 一覧に追加
→ 失敗: エラーメッセージ表示
```

### シフト更新
```
PUT /api/shifts/:id
Body: { employeeId, date, startTime, endTime }
→ 成功: 該当シフト更新
```

### シフト削除
```
DELETE /api/shifts/:id
→ 確認ダイアログ表示後に実行
→ 成功: 一覧から削除
```
