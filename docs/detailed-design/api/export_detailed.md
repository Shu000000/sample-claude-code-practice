# エクスポートAPI 詳細設計書

**API ID:** API-05
**API名:** エクスポートAPI
**作成日:** 2026-03-04

---

## 1. エンドポイント詳細

### GET /api/export/csv

**説明:** 指定月のシフトをCSV形式でエクスポート（管理者のみ）

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| year | int | 必須 | 対象年 |
| month | int | 必須 | 対象月 |
| employee_id | int | 任意 | 特定従業員のみ出力 |

---

## 2. 処理フロー

```
1. AdminMiddlewareで管理者権限確認
2. クエリパラメータのバリデーション（year, month必須）
3. DBからシフトデータを取得
   SELECT s.date, u.name, s.start_time, s.end_time, s.status
   FROM shifts s
   JOIN users u ON s.employee_id = u.id
   WHERE YEAR(s.date) = ? AND MONTH(s.date) = ?
   [AND s.employee_id = ?]
   ORDER BY s.date, u.name
4. CSVデータ生成
5. レスポンスヘッダー設定
6. CSVストリーム送信
```

---

## 3. レスポンス仕様

**ヘッダー**
```
HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="shift_202603.csv"
```

**CSVフォーマット**
```
日付,曜日,従業員名,開始時刻,終了時刻,勤務時間(時間),状態
2026-03-04,水,田中 太郎,09:00,18:00,8.0,確定済み
2026-03-04,水,鈴木 花子,10:00,17:00,7.0,確定済み
2026-03-05,木,田中 太郎,09:00,18:00,8.0,未確定
```

**フィールド仕様**
| フィールド | 内容 | フォーマット |
|-----------|------|------------|
| 日付 | 勤務日 | YYYY-MM-DD |
| 曜日 | 曜日名 | 月〜日 |
| 従業員名 | 従業員の氏名 | テキスト |
| 開始時刻 | 勤務開始時刻 | HH:MM |
| 終了時刻 | 勤務終了時刻 | HH:MM |
| 勤務時間 | 終了 - 開始（時間単位） | 小数点1桁 |
| 状態 | シフト状態 | 確定済み / 未確定 |

---

## 4. 勤務時間計算

```go
// 勤務時間（時間）の計算
func calcWorkHours(start, end string) float64 {
    startMin := parseTimeToMinutes(start)
    endMin := parseTimeToMinutes(end)
    return float64(endMin-startMin) / 60.0
}
```

---

## 5. エラーレスポンス

**400 Bad Request** (パラメータ不正)
```json
{
  "error": "year と month は必須です"
}
```

**403 Forbidden** (権限不足)
```json
{
  "error": "管理者のみアクセスできます"
}
```

---

## 6. 文字エンコーディング

- CSVファイルはUTF-8 with BOMで出力
- Excelでの文字化けを防ぐためBOM（0xEF, 0xBB, 0xBF）を先頭に付加

---

## 7. Excelエクスポート（GET /api/export/excel）

**説明:** 指定月のシフトをExcel（xlsx）形式でエクスポート

**クエリパラメータ:** CSVと同一

**処理フロー**
```
1. AdminMiddlewareで管理者権限確認
2. バリデーション
3. DBからシフトデータを取得（CSVと同一クエリ）
4. github.com/xuri/excelize/v2 ライブラリでxlsxファイル生成
5. レスポンスヘッダー設定
6. xlsxファイルを送信
```

**レスポンスヘッダー**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="shift_202603.xlsx"
```

**Excelシート構成**
- シート名: 「{year}年{month}月シフト」
- 列: 日付、曜日、従業員名、開始時刻、終了時刻、勤務時間、状態
- 1行目: ヘッダー行（太字・背景色付き）
- データ行: CSVと同一内容
- 列幅: コンテンツに合わせて自動調整
