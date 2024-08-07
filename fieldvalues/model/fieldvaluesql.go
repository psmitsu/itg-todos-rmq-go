package model

import (
	"database/sql"
	"fmt"
)

type FieldValueRepoSql struct {
  Db *sql.DB
}

func MakeFieldValueRepoSql(db *sql.DB) *FieldValueRepoSql {
  return &FieldValueRepoSql{Db: db}
}

// Create necessary table
func (r *FieldValueRepoSql) Sync() error {
  _, err := r.Db.Exec(`
    CREATE TABLE IF NOT EXISTS fieldValues (
      projectId INTEGER NOT NULL,
      fieldId INTEGER NOT NULL,
      cardId INTEGER NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (fieldId, cardId)
    );
  `)
  // TODO fieldId, cardId should be primary key (unique)

  if err != nil {
    return err
  }

  return nil
}

// updates field value or inserts new one
func (r *FieldValueRepoSql) Save(p SavePayload) (*FieldValue, error) {
  result, err := r.Db.Exec(`UPDATE fieldValues SET value=$1 WHERE fieldId=$2 AND cardId=$3`, 
    p.Value, p.FieldId, p.CardId,
    )

  if err != nil {
    fmt.Println("Save, UPDATE Error: ", err)
    return nil, err
  }

  naffected, err := result.RowsAffected()
  if err != nil {
    fmt.Println("Save, UPDATE RowsAffected Error: ", err)
    return nil, err
  }

  if naffected == 0 {
    _, err := r.Db.Exec(`
      INSERT INTO fieldValues(projectId, fieldId, cardId, value) 
      VALUES ($1, $2, $3, $4);
      `, p.ProjectId, p.FieldId, p.CardId, p.Value)

    if err != nil {
      fmt.Println("Save, INSERT Error: ", err)
      return nil, err
    }
  }

  return &FieldValue{
    p.ProjectId,
    p.FieldId,
    p.CardId,
    p.Value,
  }, nil
}

func buildQuery(p FindPayload) (string, []interface{}) {
  query := ""
  args := make([]interface{}, 0)

  i := 1
  if p.ProjectId != nil {
    query = fmt.Sprintf("projectId=$%d ", i)
    args = append(args, *p.ProjectId)
    i += 1
  }

  if p.FieldId != nil {
    query = fmt.Sprintf("%sfieldId=$%d ", query, i)
    args = append(args, *p.FieldId)
    i += 1
  }

  if p.CardId != nil {
    query = fmt.Sprintf("%sfieldId=$%d ", query, i)
    args = append(args, *p.CardId)
  }

  return query, args
}

func (r *FieldValueRepoSql) Find(p FindPayload) ([]FieldValue, error) {
  query, args := buildQuery(p);
  if len(args) == 0 {
    return nil, fmt.Errorf("wrong input")
  }
  fmt.Println("query:", query, "args:", args)

  values := make([]FieldValue, 0)

  rows, err := r.Db.Query("SELECT * FROM fieldValues where " + query, args...)
  if err != nil {
    return nil, err
  }
  defer rows.Close()

  for rows.Next() {
    var fv FieldValue
    if err := rows.Scan(&fv.ProjectId, &fv.FieldId, &fv.CardId, &fv.Value); err != nil {
      return nil, err
    }
    values = append(values, fv)
  }

  return values, nil
}

func (r *FieldValueRepoSql) Delete(p FindPayload) error {
  query, args := buildQuery(p);
  if len(args) == 0 {
    return fmt.Errorf("wrong input")
  }

  result, err := r.Db.Exec("DELETE FROM notes WHERE " + query, args...)
  naffected, err := result.RowsAffected()
  if err != nil {
    return err
  }

  if naffected == 0 {
    return fmt.Errorf("not found")
  }
  return nil
}
