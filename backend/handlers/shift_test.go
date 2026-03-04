package handlers

import (
	"net/http"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

var shiftColumns = []string{"id", "employee_id", "date", "start_time", "end_time", "status", "created_at", "updated_at"}
var userJoinColumns = []string{"users.id", "users.name", "users.email", "users.password", "users.role", "users.created_at", "users.updated_at", "users.deleted_at"}

// UNIT-BE-SHIFT-03: endTime <= startTime の場合は400を返す
func TestCreateShift_InvalidTimeRange(t *testing.T) {
	router, w := newTestRouter(CreateShift, "POST", "/shifts",
		withAuth(1, "admin"))
	req := makeRequest("POST", "/shifts", map[string]interface{}{
		"employeeId": 1,
		"date":       "2026-03-10",
		"startTime":  "18:00",
		"endTime":    "09:00",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	body := parseBody(w)
	assert.Contains(t, body["error"], "終了時刻")
}

// UNIT-BE-SHIFT-03: 同一従業員・同日の重複シフトは409を返す
func TestCreateShift_DuplicateEmployeeDate(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	now := time.Now()
	date := time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC)

	existing := sqlmock.NewRows(shiftColumns).
		AddRow(1, 1, date, "09:00", "18:00", "unconfirmed", now, now)
	mock.ExpectQuery("SELECT").WillReturnRows(existing)

	router, w := newTestRouter(CreateShift, "POST", "/shifts",
		withAuth(1, "admin"))
	req := makeRequest("POST", "/shifts", map[string]interface{}{
		"employeeId": 1,
		"date":       "2026-03-10",
		"startTime":  "10:00",
		"endTime":    "15:00",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)
}

// UNIT-BE-SHIFT-03: 正常なシフト作成（201を返す）
func TestCreateShift_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	// 重複チェック: 見つからない
	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows(shiftColumns))

	// INSERT
	mock.ExpectBegin()
	mock.ExpectExec("INSERT").WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	// Preload Employee (SELECT user)
	now := time.Now()
	mock.ExpectQuery("SELECT").WillReturnRows(
		sqlmock.NewRows(append(shiftColumns, "Employee__id", "Employee__name")).
			AddRow(1, 1, time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC), "09:00", "18:00", "unconfirmed", now, now, 1, "Alice"),
	)

	router, w := newTestRouter(CreateShift, "POST", "/shifts",
		withAuth(1, "admin"))
	req := makeRequest("POST", "/shifts", map[string]interface{}{
		"employeeId": 1,
		"date":       "2026-03-10",
		"startTime":  "09:00",
		"endTime":    "18:00",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

// UNIT-BE-SHIFT-04: 指定月のシフト確定（200を返す）
func TestConfirmShifts_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	mock.ExpectBegin()
	mock.ExpectExec("UPDATE").WillReturnResult(sqlmock.NewResult(0, 5))
	mock.ExpectCommit()

	router, w := newTestRouter(ConfirmShifts, "POST", "/shifts/confirm",
		withAuth(1, "admin"))
	req := makeRequest("POST", "/shifts/confirm", map[string]interface{}{
		"year":  2026,
		"month": 3,
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	body := parseBody(w)
	assert.Equal(t, "シフトを確定しました", body["message"])
}

// UNIT-BE-SHIFT-02: ログイン中の従業員のシフトを取得
func TestGetMyShifts_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows(shiftColumns))

	router, w := newTestRouter(GetMyShifts, "GET", "/shifts/my",
		withAuth(2, "employee"))
	req := makeRequest("GET", "/shifts/my", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
