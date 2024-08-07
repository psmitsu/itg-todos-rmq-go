package controller

import "encoding/json"

type INestController interface {
  HandleMessage(raw []byte) []byte
}

func NestErrResp(msg string) []byte {
  errMsg := struct{
    Error bool        `json:"error"`
    Message string    `json:"message"`
  }{ true, msg }

  encodedErrMsg, _ := json.Marshal(errMsg)
  return encodedErrMsg
}

func NestOkResp(payload interface{}) []byte {
  okMsg := struct{
    Error bool            `json:"error"`
    Message interface{}   `json:"message"`
  }{ false, payload }

  bytes, _ := json.Marshal(okMsg)
  return bytes
}

type NestMsgPattern struct {
  Cmd string `json:"cmd"`
}
type NestMsg struct{
  Pattern NestMsgPattern `json:"pattern"`
  Data interface{} `json:"data"`
}

func ParseNestMsg(raw []byte) (*NestMsg, error) {
  var msg NestMsg 
  if err := json.Unmarshal(raw, &msg); err != nil {
    return nil, err
  }
  return &msg, nil
}

func (m NestMsg) ExtractData(out interface{}) error {
  bytes, err := json.Marshal(m.Data)
  if err != nil {
    return err
  }
  if err := json.Unmarshal(bytes, out); err != nil {
    return err
  }
  return nil
}
