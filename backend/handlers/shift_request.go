package handlers

import (
	"net/http"
	"time"

	"shift-management/db"
	"shift-management/middleware"
	"shift-management/models"

	"github.com/gin-gonic/gin"
)

type ShiftRequestInput struct {
	Date           string               `json:"date" binding:"required"`
	Availability   models.Availability  `json:"availability" binding:"required,oneof=available unavailable negotiable"`
	PreferredStart *string              `json:"preferredStart"`
	PreferredEnd   *string              `json:"preferredEnd"`
	Note           string               `json:"note" binding:"max=200"`
}

func GetShiftRequests(c *gin.Context) {
	query := db.DB.Preload("Employee")

	if year := c.Query("year"); year != "" {
		if month := c.Query("month"); month != "" {
			query = query.Where("YEAR(date) = ? AND MONTH(date) = ?", year, month)
		}
	}

	if employeeID := c.Query("employee_id"); employeeID != "" {
		query = query.Where("employee_id = ?", employeeID)
	}

	var requests []models.ShiftRequest
	if err := query.Order("date, employee_id").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "希望シフト一覧の取得に失敗しました"})
		return
	}

	responses := make([]models.ShiftRequestResponse, len(requests))
	for i, r := range requests {
		responses[i] = r.ToResponse()
	}
	c.JSON(http.StatusOK, responses)
}

func GetMyShiftRequests(c *gin.Context) {
	userID, _ := c.Get(middleware.UserIDKey)
	query := db.DB.Preload("Employee").Where("employee_id = ?", userID)

	if year := c.Query("year"); year != "" {
		if month := c.Query("month"); month != "" {
			query = query.Where("YEAR(date) = ? AND MONTH(date) = ?", year, month)
		}
	}

	var requests []models.ShiftRequest
	if err := query.Order("date").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "希望シフトの取得に失敗しました"})
		return
	}

	responses := make([]models.ShiftRequestResponse, len(requests))
	for i, r := range requests {
		responses[i] = r.ToResponse()
	}
	c.JSON(http.StatusOK, responses)
}

func CreateShiftRequestHandler(c *gin.Context) {
	userID, _ := c.Get(middleware.UserIDKey)
	var req ShiftRequestInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "入力内容を確認してください"})
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "日付の形式が正しくありません（YYYY-MM-DD）"})
		return
	}

	if isMonthConfirmed(userID.(uint), date.Year(), int(date.Month())) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "このシフトは確定済みのため変更できません"})
		return
	}

	var existing models.ShiftRequest
	if err := db.DB.Where("employee_id = ? AND date = ?", userID, date).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "同日の希望シフトは既に登録されています"})
		return
	}

	shiftReq := models.ShiftRequest{
		EmployeeID:     userID.(uint),
		Date:           date,
		Availability:   req.Availability,
		PreferredStart: req.PreferredStart,
		PreferredEnd:   req.PreferredEnd,
		Note:           req.Note,
	}

	if err := db.DB.Create(&shiftReq).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "希望シフトの登録に失敗しました"})
		return
	}

	db.DB.Preload("Employee").First(&shiftReq, shiftReq.ID)
	c.JSON(http.StatusCreated, shiftReq.ToResponse())
}

func UpdateShiftRequest(c *gin.Context) {
	userID, _ := c.Get(middleware.UserIDKey)
	id := c.Param("id")

	var shiftReq models.ShiftRequest
	if err := db.DB.First(&shiftReq, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "希望シフトが見つかりません"})
		return
	}

	if shiftReq.EmployeeID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "他のユーザーの希望シフトは変更できません"})
		return
	}

	if isMonthConfirmed(userID.(uint), shiftReq.Date.Year(), int(shiftReq.Date.Month())) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "このシフトは確定済みのため変更できません"})
		return
	}

	var req ShiftRequestInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "入力内容を確認してください"})
		return
	}

	shiftReq.Availability = req.Availability
	shiftReq.PreferredStart = req.PreferredStart
	shiftReq.PreferredEnd = req.PreferredEnd
	shiftReq.Note = req.Note

	if err := db.DB.Save(&shiftReq).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "希望シフトの更新に失敗しました"})
		return
	}

	db.DB.Preload("Employee").First(&shiftReq, shiftReq.ID)
	c.JSON(http.StatusOK, shiftReq.ToResponse())
}

func DeleteShiftRequest(c *gin.Context) {
	userID, _ := c.Get(middleware.UserIDKey)
	id := c.Param("id")

	var shiftReq models.ShiftRequest
	if err := db.DB.First(&shiftReq, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "希望シフトが見つかりません"})
		return
	}

	if shiftReq.EmployeeID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "他のユーザーの希望シフトは削除できません"})
		return
	}

	if isMonthConfirmed(userID.(uint), shiftReq.Date.Year(), int(shiftReq.Date.Month())) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "このシフトは確定済みのため削除できません"})
		return
	}

	if err := db.DB.Delete(&shiftReq).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "希望シフトの削除に失敗しました"})
		return
	}

	c.Status(http.StatusNoContent)
}

func isMonthConfirmed(employeeID uint, year, month int) bool {
	var count int64
	db.DB.Model(&models.Shift{}).
		Where("employee_id = ? AND YEAR(date) = ? AND MONTH(date) = ? AND status = ?",
			employeeID, year, month, models.ShiftStatusConfirmed).
		Count(&count)
	return count > 0
}
