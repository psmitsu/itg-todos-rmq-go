package controller

import (
	"fmt"
	"log"

	"github.com/psmitsu/itglobal-todos-microservices/fieldvalues/model"
)

type FieldValueController Controller

func MakeFieldValueController(repo model.IFieldValueRepository) *FieldValueController {
  return &FieldValueController{repo}
}

func (c* FieldValueController) HandleMessage(raw []byte) []byte {
  fmt.Println("recieved message:", string(raw))
  msg, err := ParseNestMsg(raw)
  if err != nil {
    return NestErrResp("malformed input")
  }

  switch msg.Pattern.Cmd {
  case "save":
    var p model.SavePayload
    if err := msg.ExtractData(&p); err != nil {
      return NestErrResp("malformed input")
    }
    return c.save(p)
  case "find":
    var p model.FindPayload
    if err := msg.ExtractData(&p); err != nil {
      return NestErrResp("malformed input")
    }
    return c.find(p)
  case "delete":
    var p model.FindPayload 
    if err := msg.ExtractData(&p); err != nil {
      return NestErrResp("malformed input")
    }
    return c.delete(p)
  }

  log.Print("unrecognized command")
  return NestErrResp("unrecognized command")
}

//

func (c *FieldValueController) save(p model.SavePayload) []byte {
  obj, err := c.repo.Save(p)
  if err != nil {
    // return NestErrResp("fail saving fieldValue")
    return NestErrResp(fmt.Sprintf("fail saving: %+v", err))
  }
  return NestOkResp(obj)
}

func (c *FieldValueController) find(p model.FindPayload) []byte {
  obj, err := c.repo.Find(p)
  if err != nil {
    return NestErrResp("fail finding:")
  }

  return NestOkResp(obj)
}

func (c *FieldValueController) delete(p model.FindPayload) []byte {
  err := c.repo.Delete(p);
  if err != nil {
    return NestErrResp("fail deleting fieldValue")
  }

  return NestOkResp(struct{
    n_deleted bool
  }{ true })
}
