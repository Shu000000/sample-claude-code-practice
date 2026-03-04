package handlers

import (
	"net/http"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

var userColumns = []string{"id", "name", "email", "password", "role", "created_at", "updated_at", "deleted_at"}

// UNIT-BE-EMP-01: 管理者権限で従業員一覧取得成功
func TestGetEmployees_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	now := time.Now()
	rows := sqlmock.NewRows(userColumns).
		AddRow(1, "Alice", "alice@example.com", "hashed", "employee", now, now, nil).
		AddRow(2, "Bob", "bob@example.com", "hashed", "admin", now, now, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	router, w := newTestRouter(GetEmployees, "GET", "/employees",
		withAuth(1, "admin"))
	req := makeRequest("GET", "/employees", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// UNIT-BE-EMP-02: 不正なメール形式では400を返す
func TestCreateEmployee_InvalidEmail(t *testing.T) {
	router, w := newTestRouter(CreateEmployee, "POST", "/employees",
		withAuth(1, "admin"))
	req := makeRequest("POST", "/employees", map[string]string{
		"name":     "Test",
		"email":    "not-an-email",
		"password": "password123",
		"role":     "employee",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// UNIT-BE-EMP-02: パスワードが8文字未満では400を返す
func TestCreateEmployee_ShortPassword(t *testing.T) {
	router, w := newTestRouter(CreateEmployee, "POST", "/employees",
		withAuth(1, "admin"))
	req := makeRequest("POST", "/employees", map[string]string{
		"name":     "Test",
		"email":    "test@example.com",
		"password": "short",
		"role":     "employee",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// UNIT-BE-EMP-02: 重複するemailでは409を返す
func TestCreateEmployee_DuplicateEmail(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	now := time.Now()
	existingRows := sqlmock.NewRows(userColumns).
		AddRow(1, "Existing", "test@example.com", "hashed", "employee", now, now, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(existingRows)

	router, w := newTestRouter(CreateEmployee, "POST", "/employees",
		withAuth(1, "admin"))
	req := makeRequest("POST", "/employees", map[string]interface{}{
		"name":     "New User",
		"email":    "test@example.com",
		"password": "password123",
		"role":     "employee",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)
}

// UNIT-BE-EMP-02: 正常な入力で従業員作成成功（201を返す）
func TestCreateEmployee_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	// 重複チェック: 見つからない
	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows(userColumns))

	// INSERT
	mock.ExpectBegin()
	mock.ExpectExec("INSERT").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	router, w := newTestRouter(CreateEmployee, "POST", "/employees",
		withAuth(1, "admin"))
	req := makeRequest("POST", "/employees", map[string]interface{}{
		"name":     "New User",
		"email":    "newuser@example.com",
		"password": "password123",
		"role":     "employee",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

// UNIT-BE-EMP-03: 存在しないIDで更新した場合は404を返す
func TestUpdateEmployee_NotFound(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows(userColumns))

	router, w := newTestRouter(UpdateEmployee, "PUT", "/employees/:id",
		withAuth(1, "admin"))
	req := makeRequest("PUT", "/employees/999", map[string]interface{}{
		"name":  "Updated",
		"email": "updated@example.com",
		"role":  "employee",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// UNIT-BE-EMP-03: 正常な更新
func TestUpdateEmployee_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	now := time.Now()
	existingRows := sqlmock.NewRows(userColumns).
		AddRow(2, "Original", "original@example.com", "hashed", "employee", now, now, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(existingRows)

	// メール重複チェック: 見つからない
	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows(userColumns))

	// UPDATE
	mock.ExpectBegin()
	mock.ExpectExec("UPDATE").WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	router, w := newTestRouter(UpdateEmployee, "PUT", "/employees/:id",
		withAuth(1, "admin"))
	req := makeRequest("PUT", "/employees/2", map[string]interface{}{
		"name":  "Updated Name",
		"email": "updated@example.com",
		"role":  "employee",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// UNIT-BE-EMP-04: 存在しないIDで削除した場合は404を返す
func TestDeleteEmployee_NotFound(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows(userColumns))

	router, w := newTestRouter(DeleteEmployee, "DELETE", "/employees/:id",
		withAuth(1, "admin"))
	req := makeRequest("DELETE", "/employees/999", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// UNIT-BE-EMP-04: 正常な削除（204を返す）
func TestDeleteEmployee_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	now := time.Now()
	rows := sqlmock.NewRows(userColumns).
		AddRow(2, "User", "user@example.com", "hashed", "employee", now, now, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	// 論理削除 (soft delete): UPDATE deleted_at
	mock.ExpectBegin()
	mock.ExpectExec("UPDATE").WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	router, w := newTestRouter(DeleteEmployee, "DELETE", "/employees/:id",
		withAuth(1, "admin"))
	req := makeRequest("DELETE", "/employees/2", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
}
