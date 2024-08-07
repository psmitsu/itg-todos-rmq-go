package controller

import (
	"github.com/psmitsu/itglobal-todos-microservices/fieldvalues/model"
)

type Controller struct {
  repo model.IFieldValueRepository
}

func MakeController(repo model.IFieldValueRepository) *Controller {
  return &Controller{repo}
}
