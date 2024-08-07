package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/psmitsu/itglobal-todos-microservices/fieldvalues/controller"
	"github.com/psmitsu/itglobal-todos-microservices/fieldvalues/model"
	"github.com/psmitsu/itglobal-todos-microservices/fieldvalues/rmq"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var (
  dburl = fmt.Sprintf("postgres://%s:%s@%s:%s/%s",
    os.Getenv("POSTGRES_USER"),
    os.Getenv("POSTGRES_PASSWORD"),
    os.Getenv("POSTGRES_HOST"),
    os.Getenv("POSTGRES_PORT"),
    os.Getenv("POSTGRES_DB"),
    )
  connstring = fmt.Sprintf("amqp://%s:%s",
    os.Getenv("RMQ_HOST"),
    os.Getenv("RMQ_PORT"),
    )
  qname = os.Getenv("QUEUE")
)
// urlExample := "postgres://username:password@localhost:5432/database_name"

func main() {
  fmt.Println("golang server")
  fmt.Println("dburl", dburl)
  fmt.Println("rmq connstr", connstring)
  fmt.Println("rmq qname", qname)

  db, err := sql.Open("pgx", dburl)
  if err != nil {
    log.Fatal("could not open db", err)
  }

  repo := model.MakeFieldValueRepoSql(db)
  repo.Sync()
  cont := controller.MakeFieldValueController(repo)
  server := rmq.MakeRpcServer(cont, "application/json")
  server.Serve(connstring, qname)
}
