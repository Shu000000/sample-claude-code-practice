package models

import "time"

type ShiftStatus string

const (
	ShiftStatusConfirmed   ShiftStatus = "confirmed"
	ShiftStatusUnconfirmed ShiftStatus = "unconfirmed"
)

type Shift struct {
	ID         uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	EmployeeID uint        `gorm:"not null" json:"employeeId"`
	Employee   User        `gorm:"foreignKey:EmployeeID" json:"-"`
	Date       time.Time   `gorm:"type:date;not null" json:"date"`
	StartTime  string      `gorm:"type:time;not null" json:"startTime"`
	EndTime    string      `gorm:"type:time;not null" json:"endTime"`
	Status     ShiftStatus `gorm:"type:enum('confirmed','unconfirmed');not null;default:'unconfirmed'" json:"status"`
	CreatedAt  time.Time   `json:"createdAt"`
	UpdatedAt  time.Time   `json:"updatedAt"`
}

type ShiftResponse struct {
	ID           uint        `json:"id"`
	EmployeeID   uint        `json:"employeeId"`
	EmployeeName string      `json:"employeeName"`
	Date         string      `json:"date"`
	StartTime    string      `json:"startTime"`
	EndTime      string      `json:"endTime"`
	Status       ShiftStatus `json:"status"`
}

func (s *Shift) ToResponse() ShiftResponse {
	return ShiftResponse{
		ID:           s.ID,
		EmployeeID:   s.EmployeeID,
		EmployeeName: s.Employee.Name,
		Date:         s.Date.Format("2006-01-02"),
		StartTime:    s.StartTime,
		EndTime:      s.EndTime,
		Status:       s.Status,
	}
}
