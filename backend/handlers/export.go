package handlers

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"shift-management/db"
	"shift-management/models"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

type ShiftExportData struct {
	Date         string
	DayOfWeek    string
	EmployeeName string
	StartTime    string
	EndTime      string
	WorkHours    string
	Status       string
}

func ExportCSV(c *gin.Context) {
	year := c.Query("year")
	month := c.Query("month")

	if year == "" || month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "year と month は必須です"})
		return
	}

	data, err := fetchExportData(year, month, c.Query("employee_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データの取得に失敗しました"})
		return
	}

	var buf bytes.Buffer
	// UTF-8 BOM
	buf.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(&buf)
	writer.Write([]string{"日付", "曜日", "従業員名", "開始時刻", "終了時刻", "勤務時間(時間)", "状態"})

	for _, d := range data {
		writer.Write([]string{d.Date, d.DayOfWeek, d.EmployeeName, d.StartTime, d.EndTime, d.WorkHours, d.Status})
	}
	writer.Flush()

	filename := fmt.Sprintf("shift_%s%s.csv", year, fmt.Sprintf("%02s", month))
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Data(http.StatusOK, "text/csv; charset=utf-8", buf.Bytes())
}

func ExportExcel(c *gin.Context) {
	year := c.Query("year")
	month := c.Query("month")

	if year == "" || month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "year と month は必須です"})
		return
	}

	data, err := fetchExportData(year, month, c.Query("employee_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データの取得に失敗しました"})
		return
	}

	f := excelize.NewFile()
	sheetName := fmt.Sprintf("%s年%s月シフト", year, month)
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"日付", "曜日", "従業員名", "開始時刻", "終了時刻", "勤務時間(時間)", "状態"}
	for i, h := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, h)
	}

	for i, d := range data {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), d.Date)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), d.DayOfWeek)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), d.EmployeeName)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), d.StartTime)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), d.EndTime)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), d.WorkHours)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), d.Status)
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Excelファイルの生成に失敗しました"})
		return
	}

	filename := fmt.Sprintf("shift_%s%s.xlsx", year, fmt.Sprintf("%02s", month))
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func fetchExportData(year, month, employeeID string) ([]ShiftExportData, error) {
	query := db.DB.Preload("Employee").
		Where("YEAR(date) = ? AND MONTH(date) = ?", year, month)

	if employeeID != "" {
		query = query.Where("employee_id = ?", employeeID)
	}

	var shifts []models.Shift
	if err := query.Order("date, employee_id").Find(&shifts).Error; err != nil {
		return nil, err
	}

	weekdays := []string{"日", "月", "火", "水", "木", "金", "土"}
	statusMap := map[models.ShiftStatus]string{
		models.ShiftStatusConfirmed:   "確定済み",
		models.ShiftStatusUnconfirmed: "未確定",
	}

	data := make([]ShiftExportData, len(shifts))
	for i, s := range shifts {
		workHours := calcWorkHoursStr(s.StartTime, s.EndTime)
		data[i] = ShiftExportData{
			Date:         s.Date.Format("2006-01-02"),
			DayOfWeek:    weekdays[s.Date.Weekday()],
			EmployeeName: s.Employee.Name,
			StartTime:    s.StartTime,
			EndTime:      s.EndTime,
			WorkHours:    workHours,
			Status:       statusMap[s.Status],
		}
	}
	return data, nil
}

func calcWorkHoursStr(startTime, endTime string) string {
	start, err1 := time.Parse("15:04", startTime)
	end, err2 := time.Parse("15:04", endTime)
	if err1 != nil || err2 != nil {
		return "0.0"
	}
	diff := end.Sub(start)
	hours := diff.Hours()
	return fmt.Sprintf("%.1f", hours)
}
