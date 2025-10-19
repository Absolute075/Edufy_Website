
FROM golang:1.25 AS builder


WORKDIR /app


COPY go.mod go.sum ./


RUN go mod download


COPY . .


RUN go build -o gateway_service ./cmd


FROM debian:bookworm-slim

WORKDIR /app


COPY --from=builder /app/gateway_service .


EXPOSE 8080


CMD ["./gateway_service"]
