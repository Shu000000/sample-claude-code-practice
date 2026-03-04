package handlers

import (
	"net/http"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
)

// UNIT-BE-AUTH-04: emailが空の場合は400を返す
func TestLogin_EmptyEmail(t *testing.T) {
	gin, w := newTestRouter(Login, "POST", "/login")

	req := makeRequest("POST", "/login", map[string]string{
		"email":    "",
		"password": "password123",
	})
	gin.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// UNIT-BE-AUTH-02: 存在しないemailでログインした場合は401を返す
func TestLogin_WrongEmail(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	mock.ExpectQuery("SELECT").
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	router, w := newTestRouter(Login, "POST", "/login")
	req := makeRequest("POST", "/login", map[string]string{
		"email":    "notfound@example.com",
		"password": "password123",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// UNIT-BE-AUTH-03: 正しいemail + 誤ったpasswordの場合は401を返す
func TestLogin_WrongPassword(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	correctHash, _ := bcrypt.GenerateFromPassword([]byte("correctpassword"), bcrypt.DefaultCost)
	now := time.Now()

	rows := sqlmock.NewRows([]string{"id", "name", "email", "password", "role", "created_at", "updated_at", "deleted_at"}).
		AddRow(1, "Test User", "test@example.com", string(correctHash), "employee", now, now, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	router, w := newTestRouter(Login, "POST", "/login")
	req := makeRequest("POST", "/login", map[string]string{
		"email":    "test@example.com",
		"password": "wrongpassword",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// UNIT-BE-AUTH-01: 正しいemail/passwordでログインした場合は200 + JWTトークンを返す
func TestLogin_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	password := "password123"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	now := time.Now()

	rows := sqlmock.NewRows([]string{"id", "name", "email", "password", "role", "created_at", "updated_at", "deleted_at"}).
		AddRow(1, "Test User", "test@example.com", string(hash), "employee", now, now, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	router, w := newTestRouter(Login, "POST", "/login")
	req := makeRequest("POST", "/login", map[string]string{
		"email":    "test@example.com",
		"password": password,
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	body := parseBody(w)
	assert.NotEmpty(t, body["token"])
	assert.NotNil(t, body["user"])
}
