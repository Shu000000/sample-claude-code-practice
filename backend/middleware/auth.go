package middleware

import (
	"net/http"
	"strings"

	"shift-management/utils"

	"github.com/gin-gonic/gin"
)

const (
	UserIDKey   = "userID"
	UserRoleKey = "userRole"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "無効な認証形式です"})
			c.Abort()
			return
		}

		claims, err := utils.ValidateToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "トークンが無効または期限切れです"})
			c.Abort()
			return
		}

		c.Set(UserIDKey, claims.UserID)
		c.Set(UserRoleKey, claims.Role)
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get(UserRoleKey)
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "管理者のみアクセスできます"})
			c.Abort()
			return
		}
		c.Next()
	}
}
