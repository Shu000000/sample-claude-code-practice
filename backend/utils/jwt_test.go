package utils

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestGenerateToken(t *testing.T) {
	token, err := GenerateToken(1, "admin")
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestValidateToken_Success(t *testing.T) {
	token, err := GenerateToken(1, "employee")
	assert.NoError(t, err)

	claims, err := ValidateToken(token)
	assert.NoError(t, err)
	assert.Equal(t, uint(1), claims.UserID)
	assert.Equal(t, "employee", claims.Role)
}

func TestValidateToken_InvalidToken(t *testing.T) {
	_, err := ValidateToken("invalid.token.here")
	assert.Error(t, err)
}

func TestValidateToken_TamperedToken(t *testing.T) {
	_, err := ValidateToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiJ9.tampered_signature")
	assert.Error(t, err)
}

func TestGenerateToken_ContainsCorrectClaims(t *testing.T) {
	token, _ := GenerateToken(42, "admin")
	claims, err := ValidateToken(token)
	assert.NoError(t, err)
	assert.Equal(t, uint(42), claims.UserID)
	assert.Equal(t, "admin", claims.Role)
	assert.True(t, claims.ExpiresAt.After(time.Now()))
}
