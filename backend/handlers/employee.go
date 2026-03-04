package handlers

import (
	"net/http"

	"shift-management/db"
	"shift-management/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type CreateEmployeeRequest struct {
	Name     string      `json:"name" binding:"required,max=50"`
	Email    string      `json:"email" binding:"required,email"`
	Password string      `json:"password" binding:"required,min=8"`
	Role     models.Role `json:"role" binding:"required,oneof=admin employee"`
}

type UpdateEmployeeRequest struct {
	Name  string      `json:"name" binding:"required,max=50"`
	Email string      `json:"email" binding:"required,email"`
	Role  models.Role `json:"role" binding:"required,oneof=admin employee"`
}

func GetEmployees(c *gin.Context) {
	var users []models.User
	if err := db.DB.Where("deleted_at IS NULL").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "従業員一覧の取得に失敗しました"})
		return
	}

	responses := make([]models.UserResponse, len(users))
	for i, u := range users {
		responses[i] = u.ToResponse()
	}
	c.JSON(http.StatusOK, responses)
}

func GetEmployee(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := db.DB.Where("deleted_at IS NULL").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "従業員が見つかりません"})
		return
	}
	c.JSON(http.StatusOK, user.ToResponse())
}

func CreateEmployee(c *gin.Context) {
	var req CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "入力内容を確認してください"})
		return
	}

	var existing models.User
	if err := db.DB.Where("email = ? AND deleted_at IS NULL", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "このメールアドレスは既に登録されています"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "パスワードの処理に失敗しました"})
		return
	}

	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     req.Role,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "従業員の登録に失敗しました"})
		return
	}

	c.JSON(http.StatusCreated, user.ToResponse())
}

func UpdateEmployee(c *gin.Context) {
	id := c.Param("id")
	var req UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "入力内容を確認してください"})
		return
	}

	var user models.User
	if err := db.DB.Where("deleted_at IS NULL").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "従業員が見つかりません"})
		return
	}

	if req.Email != user.Email {
		var existing models.User
		if err := db.DB.Where("email = ? AND deleted_at IS NULL AND id != ?", req.Email, id).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "このメールアドレスは既に登録されています"})
			return
		}
	}

	user.Name = req.Name
	user.Email = req.Email
	user.Role = req.Role

	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "従業員情報の更新に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, user.ToResponse())
}

func DeleteEmployee(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := db.DB.Where("deleted_at IS NULL").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "従業員が見つかりません"})
		return
	}

	if err := db.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "従業員の削除に失敗しました"})
		return
	}

	c.Status(http.StatusNoContent)
}
