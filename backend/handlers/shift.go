package handlers

import (
	"net/http"
	"strconv"
	"time"

	"shift-management/db"
	"shift-management/middleware"
	"shift-management/models"

	"github.com/gin-gonic/gin"
)

type CreateShiftRequest struct {
	EmployeeID uint   `json:"employeeId" binding:"required"`
	Date       string `json:"date" binding:"required"`
	StartTime  string `json:"startTime" binding:"required"`
	EndTime    string `json:"endTime" binding:"required"`
}

type ConfirmShiftsRequest struct {
	Year  int `json:"year" binding:"required"`
	Month int `json:"month" binding:"required,min=1,max=12"`
}

func GetShifts(c *gin.Context) {
	query := db.DB.Preload("Employee")

	if year := c.Query("year"); year != "" {
		if month := c.Query("month"); month != "" {
			query = query.Where("YEAR(date) = ? AND MONTH(date) = ?", year, month)
		} else {
			query = query.Where("YEAR(date) = ?", year)
		}
	}

	if employeeID := c.Query("employee_id"); employeeID != "" {
		query = query.Where("employee_id = ?", employeeID)
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var shifts []models.Shift
	if err := query.Order("date, start_time").Find(&shifts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "シフト一覧の取得に失敗しました"})
		return
	}

	responses := make([]models.ShiftResponse, len(shifts))
	for i, s := range shifts {
		responses[i] = s.ToResponse()
	}
	c.JSON(http.StatusOK, responses)
}

func GetMyShifts(c *gin.Context) {
	userID, _ := c.Get(middleware.UserIDKey)
	query := db.DB.Preload("Employee").Where("employee_id = ?", userID)

	if year := c.Query("year"); year != "" {
		if month := c.Query("month"); month != "" {
			query = query.Where("YEAR(date) = ? AND MONTH(date) = ?", year, month)
		}
	}

	var shifts []models.Shift
	if err := query.Order("date, start_time").Find(&shifts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "シフトの取得に失敗しました"})
		return
	}

	responses := make([]models.ShiftResponse, len(shifts))
	for i, s := range shifts {
		responses[i] = s.ToResponse()
	}
	c.JSON(http.StatusOK, responses)
}

func GetShift(c *gin.Context) {
	id := c.Param("id")
	var shift models.Shift
	if err := db.DB.Preload("Employee").First(&shift, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "シフトが見つかりません"})
		return
	}
	c.JSON(http.StatusOK, shift.ToResponse())
}

func CreateShift(c *gin.Context) {
	var req CreateShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "入力内容を確認してください"})
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "日付の形式が正しくありません（YYYY-MM-DD）"})
		return
	}

	if req.StartTime >= req.EndTime {
		c.JSON(http.StatusBadRequest, gin.H{"error": "終了時刻は開始時刻より後にしてください"})
		return
	}

	var existing models.Shift
	if err := db.DB.Where("employee_id = ? AND date = ?", req.EmployeeID, date).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "同日に既にシフトが登録されています"})
		return
	}

	shift := models.Shift{
		EmployeeID: req.EmployeeID,
		Date:       date,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		Status:     models.ShiftStatusUnconfirmed,
	}

	if err := db.DB.Create(&shift).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "シフトの作成に失敗しました"})
		return
	}

	db.DB.Preload("Employee").First(&shift, shift.ID)
	c.JSON(http.StatusCreated, shift.ToResponse())
}

func UpdateShift(c *gin.Context) {
	id := c.Param("id")
	var req CreateShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "入力内容を確認してください"})
		return
	}

	var shift models.Shift
	if err := db.DB.First(&shift, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "シフトが見つかりません"})
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "日付の形式が正しくありません"})
		return
	}

	if req.StartTime >= req.EndTime {
		c.JSON(http.StatusBadRequest, gin.H{"error": "終了時刻は開始時刻より後にしてください"})
		return
	}

	idUint, _ := strconv.ParseUint(id, 10, 64)
	var existing models.Shift
	if err := db.DB.Where("employee_id = ? AND date = ? AND id != ?", req.EmployeeID, date, idUint).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "同日に既にシフトが登録されています"})
		return
	}

	shift.EmployeeID = req.EmployeeID
	shift.Date = date
	shift.StartTime = req.StartTime
	shift.EndTime = req.EndTime

	if err := db.DB.Save(&shift).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "シフトの更新に失敗しました"})
		return
	}

	db.DB.Preload("Employee").First(&shift, shift.ID)
	c.JSON(http.StatusOK, shift.ToResponse())
}

func DeleteShift(c *gin.Context) {
	id := c.Param("id")
	var shift models.Shift
	if err := db.DB.First(&shift, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "シフトが見つかりません"})
		return
	}

	if err := db.DB.Delete(&shift).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "シフトの削除に失敗しました"})
		return
	}

	c.Status(http.StatusNoContent)
}

func ConfirmShifts(c *gin.Context) {
	var req ConfirmShiftsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "入力内容を確認してください"})
		return
	}

	result := db.DB.Model(&models.Shift{}).
		Where("YEAR(date) = ? AND MONTH(date) = ?", req.Year, req.Month).
		Update("status", models.ShiftStatusConfirmed)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "シフトの確定に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "シフトを確定しました",
		"updatedCount": result.RowsAffected,
	})
}
