package handlers

import (
	"net/http"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

var shiftRequestColumns = []string{"id", "employee_id", "date", "availability", "preferred_start", "preferred_end", "note", "created_at", "updated_at"}

// UNIT-BE-REQ-01: 同日の重複希望シフト登録は409を返す
func TestCreateShiftRequest_DuplicateDate(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	date := time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC)
	now := time.Now()

	// isMonthConfirmed: 確定シフトなし
	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	// 重複チェック: 既に存在
	existing := sqlmock.NewRows(shiftRequestColumns).
		AddRow(1, 2, date, "available", nil, nil, "", now, now)
	mock.ExpectQuery("SELECT").WillReturnRows(existing)

	router, w := newTestRouter(CreateShiftRequestHandler, "POST", "/shift-requests",
		withAuth(2, "employee"))
	req := makeRequest("POST", "/shift-requests", map[string]interface{}{
		"date":         "2026-03-15",
		"availability": "available",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)
}

// UNIT-BE-REQ-01: 確定済み月への希望シフト登録は422を返す
func TestCreateShiftRequest_ConfirmedMonth(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	// isMonthConfirmed: 確定シフトあり（count > 0）
	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))

	router, w := newTestRouter(CreateShiftRequestHandler, "POST", "/shift-requests",
		withAuth(2, "employee"))
	req := makeRequest("POST", "/shift-requests", map[string]interface{}{
		"date":         "2026-03-15",
		"availability": "available",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

// UNIT-BE-REQ-01: 正常な希望シフト登録（201を返す）
func TestCreateShiftRequest_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	date := time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC)
	now := time.Now()

	// isMonthConfirmed: 確定シフトなし
	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	// 重複チェック: 見つからない
	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows(shiftRequestColumns))

	// INSERT
	mock.ExpectBegin()
	mock.ExpectExec("INSERT").WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	// Preload Employee
	mock.ExpectQuery("SELECT").WillReturnRows(
		sqlmock.NewRows(append(shiftRequestColumns, "Employee__id", "Employee__name")).
			AddRow(1, 2, date, "available", nil, nil, "", now, now, 2, "Bob"),
	)

	router, w := newTestRouter(CreateShiftRequestHandler, "POST", "/shift-requests",
		withAuth(2, "employee"))
	req := makeRequest("POST", "/shift-requests", map[string]interface{}{
		"date":         "2026-03-20",
		"availability": "available",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

// UNIT-BE-REQ-02: 他人の希望シフトを更新しようとすると403を返す
func TestUpdateShiftRequest_OtherEmployee(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	date := time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC)
	now := time.Now()

	// 他の従業員のリクエスト（employee_id=3）を取得
	rows := sqlmock.NewRows(shiftRequestColumns).
		AddRow(1, 3, date, "available", nil, nil, "", now, now)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	// ログインユーザーはID=2
	router, w := newTestRouter(UpdateShiftRequest, "PUT", "/shift-requests/:id",
		withAuth(2, "employee"))
	req := makeRequest("PUT", "/shift-requests/1", map[string]interface{}{
		"date":         "2026-03-15",
		"availability": "unavailable",
	})
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}
