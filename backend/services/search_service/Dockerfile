FROM golang:1.23 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -trimpath -ldflags "-s -w" -o search_service ./cmd

FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/search_service /search_service

EXPOSE 8080

ENTRYPOINT ["/search_service"]

