package model

type FieldValue struct {
  ProjectId int64 `json:"projectId"`
  FieldId int64   `json:"fieldId"`
  CardId int64    `json:"cardId"`
  Value string    `json:"value"`
}

type IFieldValueRepository interface {
  Save(p SavePayload) (*FieldValue, error)
  Find(p FindPayload) ([]FieldValue, error)
  Delete(p FindPayload) error
}

type SavePayload struct {
  ProjectId int64
  FieldId int64
  CardId int64
  Value string
}

type FindPayload struct {
  ProjectId *int64
  FieldId *int64
  CardId *int64
}
