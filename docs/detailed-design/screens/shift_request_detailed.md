# 希望シフト入力画面 詳細設計書

**画面ID:** SCR-05
**画面名:** 希望シフト入力画面
**作成日:** 2026-03-04

---

## 1. コンポーネント構成

```
ShiftRequestPage
├── Header (共通)
├── MonthNavigator
├── RequestCalendar
│   ├── CalendarHeader (曜日)
│   └── CalendarCell[]
│       └── AvailabilityBadge (○/×/△/未入力)
├── RequestFormModal
│   ├── DateDisplay
│   ├── AvailabilityRadio
│   ├── PreferredTimeInputs (希望ありの場合のみ)
│   │   ├── StartTimeInput
│   │   └── EndTimeInput
│   ├── NoteInput
│   └── ActionButtons
└── SubmitButton
```

---

## 2. 状態管理

```typescript
interface ShiftRequestState {
  currentYear: number;
  currentMonth: number;
  requests: ShiftRequest[];
  selectedDate: string | null;
  isModalOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface ShiftRequest {
  id: number | null;
  date: string; // YYYY-MM-DD
  availability: 'available' | 'unavailable' | 'negotiable';
  preferredStart: string | null; // HH:MM
  preferredEnd: string | null;   // HH:MM
  note: string;
}
```

---

## 3. カレンダー表示ロジック

### 各日付セルの表示
| availability | 表示 | 色 |
|-------------|------|-----|
| available | ○ | 緑 |
| unavailable | × | 赤 |
| negotiable | △ | 黄 |
| 未入力 | （空白） | グレー |

### 日付セルのクリック動作
- 未入力セル: 新規入力モーダルを開く（日付を事前設定）
- 入力済みセル: 編集モーダルを開く（既存データを事前入力）
- 確定済み月: クリック無効（読み取り専用）

---

## 4. 入力モーダル仕様

### バリデーション
| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| availability | 必須 | 「勤務可否を選択してください」 |
| preferredStart | 任意、時刻形式 | 「正しい時刻を入力してください」 |
| preferredEnd | preferredStartより後 | 「終了時刻は開始時刻より後にしてください」 |
| note | 最大200文字 | 「備考は200文字以内で入力してください」 |

### 保存処理
```
保存ボタン押下
  → バリデーション
  → id === null:
      POST /api/shift-requests
  → id !== null:
      PUT /api/shift-requests/:id
  → 成功: モーダルを閉じ、カレンダーを更新
  → 失敗: エラーメッセージ表示
```

---

## 5. 月切り替え制限

- 確定済みのシフトがある月は読み取り専用
- 過去月への遡り修正は不可（当月・翌月のみ入力可能）

---

## 6. API呼び出し仕様

### 希望シフト一覧取得
```
GET /api/shift-requests/my?year={year}&month={month}
Response: ShiftRequest[]
```

### 希望シフト登録
```
POST /api/shift-requests
Body: { date, availability, preferredStart?, preferredEnd?, note? }
Response: ShiftRequest
```

### 希望シフト更新
```
PUT /api/shift-requests/:id
Body: { availability, preferredStart?, preferredEnd?, note? }
Response: ShiftRequest
```

### 希望シフト削除
```
DELETE /api/shift-requests/:id
Response: { message: "削除しました" }
```
