package models

import "time"

type Availability string

const (
	AvailabilityAvailable   Availability = "available"
	AvailabilityUnavailable Availability = "unavailable"
	AvailabilityNegotiable  Availability = "negotiable"
)

type ShiftRequest struct {
	ID             uint         `gorm:"primaryKey;autoIncrement" json:"id"`
	EmployeeID     uint         `gorm:"not null" json:"employeeId"`
	Employee       User         `gorm:"foreignKey:EmployeeID" json:"-"`
	Date           time.Time    `gorm:"type:date;not null" json:"date"`
	Availability   Availability `gorm:"type:enum('available','unavailable','negotiable');not null" json:"availability"`
	PreferredStart *string      `gorm:"type:time" json:"preferredStart"`
	PreferredEnd   *string      `gorm:"type:time" json:"preferredEnd"`
	Note           string       `gorm:"size:200" json:"note"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
}

type ShiftRequestResponse struct {
	ID             uint         `json:"id"`
	EmployeeID     uint         `json:"employeeId"`
	EmployeeName   string       `json:"employeeName"`
	Date           string       `json:"date"`
	Availability   Availability `json:"availability"`
	PreferredStart *string      `json:"preferredStart"`
	PreferredEnd   *string      `json:"preferredEnd"`
	Note           string       `json:"note"`
}

func (sr *ShiftRequest) ToResponse() ShiftRequestResponse {
	return ShiftRequestResponse{
		ID:             sr.ID,
		EmployeeID:     sr.EmployeeID,
		EmployeeName:   sr.Employee.Name,
		Date:           sr.Date.Format("2006-01-02"),
		Availability:   sr.Availability,
		PreferredStart: sr.PreferredStart,
		PreferredEnd:   sr.PreferredEnd,
		Note:           sr.Note,
	}
}
