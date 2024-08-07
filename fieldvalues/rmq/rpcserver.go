package rmq

import (
	"context"
	"log"
	"time"

	"github.com/psmitsu/itglobal-todos-microservices/fieldvalues/controller"
	amqp "github.com/rabbitmq/amqp091-go"
)

// amqp RPC server that answers to each message
type RpcServer struct {
  handleMessage func(msg []byte) ([]byte)
  contentType string
}

// create an rpc server that answers every message
// callback argument takes recieved message's body
// returns response that should be sent back
// contentType determines what ContentType does the server send
func MakeRpcServer(c controller.INestController, contentType string) (*RpcServer) {
  return &RpcServer{c.HandleMessage, contentType}
}

// Connect to AMQP and serve rpc message queue
func (s *RpcServer) Serve(connstr string, qname string) error {
  // setup connection
	conn, err := amqp.Dial(connstr) // e.g. "amqp://rmq:5672/"
  if err != nil {
    return err
  }
	defer conn.Close()

  // setup channel
	ch, err := conn.Channel()
  if err != nil {
    return err
  }
	defer ch.Close()

	q, err := ch.QueueDeclare(
		qname, // name
		false,       // durable
		false,       // delete when unused
		false,       // exclusive
		false,       // no-wait
		nil,         // arguments
	)
  if err != nil {
    return err // TODO: maybe add message "Failed to declare queue"
  }

	err = ch.Qos(
		1,     // prefetch count
		0,     // prefetch size
		false, // global
	)
  if err != nil {
    return err // TODO: maybe add message "Failed to set QoS"
  }

  // wait for messages
	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
  if err != nil {
    return err // TODO: maybe add message "Failed to register a consumer"
  }

	var forever chan struct{}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		for d := range msgs {
      resp := s.handleMessage(d.Body)
      if err != nil {
        log.Printf("error handling message: %s\n", err)
        d.Nack(false, true)
        continue
      }

      err = ch.PublishWithContext(ctx,
        "",        // exchange
        d.ReplyTo, // routing key
        false,     // mandatory
        false,     // immediate
        amqp.Publishing{
          ContentType:   s.contentType,
          CorrelationId: d.CorrelationId,
          Body:          []byte(resp),
        })

      if err != nil {
        log.Printf("error publishing message: %s", err)
        d.Nack(false, true)
        continue
      }

      d.Ack(false)
		}
	}()

	log.Printf(" [*] Awwaiting RPC requests")
	<-forever

  return nil
}
