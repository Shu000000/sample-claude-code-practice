package routes

import (
	"shift-management/handlers"
	"shift-management/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")

	// 認証（認証不要）
	auth := api.Group("/auth")
	{
		auth.POST("/login", handlers.Login)
	}

	// 認証必要なルート
	authorized := api.Group("")
	authorized.Use(middleware.AuthMiddleware())
	{
		// 認証
		authorized.POST("/auth/logout", handlers.Logout)
		authorized.GET("/auth/me", handlers.GetMe)

		// 従業員（管理者のみ）
		employees := authorized.Group("/employees")
		employees.Use(middleware.AdminMiddleware())
		{
			employees.GET("", handlers.GetEmployees)
			employees.GET("/:id", handlers.GetEmployee)
			employees.POST("", handlers.CreateEmployee)
			employees.PUT("/:id", handlers.UpdateEmployee)
			employees.DELETE("/:id", handlers.DeleteEmployee)
		}

		// シフト（従業員: 自分のシフト）
		authorized.GET("/shifts/my", handlers.GetMyShifts)

		// シフト（管理者のみ）
		adminShifts := authorized.Group("/shifts")
		adminShifts.Use(middleware.AdminMiddleware())
		{
			adminShifts.GET("", handlers.GetShifts)
			adminShifts.GET("/:id", handlers.GetShift)
			adminShifts.POST("", handlers.CreateShift)
			adminShifts.PUT("/confirm", handlers.ConfirmShifts)
			adminShifts.PUT("/:id", handlers.UpdateShift)
			adminShifts.DELETE("/:id", handlers.DeleteShift)
		}

		// 希望シフト
		shiftRequests := authorized.Group("/shift-requests")
		{
			// 自分の希望シフト（従業員）
			shiftRequests.GET("/my", handlers.GetMyShiftRequests)
			shiftRequests.POST("", handlers.CreateShiftRequestHandler)
			shiftRequests.PUT("/:id", handlers.UpdateShiftRequest)
			shiftRequests.DELETE("/:id", handlers.DeleteShiftRequest)

			// 全員の希望シフト（管理者のみ）
			shiftRequests.GET("", middleware.AdminMiddleware(), handlers.GetShiftRequests)
		}

		// エクスポート（管理者のみ）
		export := authorized.Group("/export")
		export.Use(middleware.AdminMiddleware())
		{
			export.GET("/csv", handlers.ExportCSV)
			export.GET("/excel", handlers.ExportExcel)
		}
	}
}
