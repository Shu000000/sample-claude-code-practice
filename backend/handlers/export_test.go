package handlers

import (
	"net/http"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

// UNIT-BE-EXPORT-01: yearまたはmonthが欠落した場合は400を返す
func TestExportCSV_MissingParams(t *testing.T) {
	router, w := newTestRouter(ExportCSV, "GET", "/export/csv",
		withAuth(1, "admin"))
	req := makeRequest("GET", "/export/csv?year=2026", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestExportCSV_MissingYear(t *testing.T) {
	router, w := newTestRouter(ExportCSV, "GET", "/export/csv",
		withAuth(1, "admin"))
	req := makeRequest("GET", "/export/csv?month=3", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// UNIT-BE-EXPORT-01: 正常なCSVエクスポート（Content-Type: text/csv + BOMあり）
func TestExportCSV_Success(t *testing.T) {
	mock, teardown := setupMockDB()
	defer teardown()

	mock.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows(shiftColumns))

	router, w := newTestRouter(ExportCSV, "GET", "/export/csv",
		withAuth(1, "admin"))
	req := makeRequest("GET", "/export/csv?year=2026&month=3", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Header().Get("Content-Type"), "text/csv")
	// BOMの確認
	assert.Equal(t, byte(0xEF), w.Body.Bytes()[0])
	assert.Equal(t, byte(0xBB), w.Body.Bytes()[1])
	assert.Equal(t, byte(0xBF), w.Body.Bytes()[2])
}
