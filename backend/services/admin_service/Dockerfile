# Build stage
FROM golang:1.23 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -trimpath -ldflags "-s -w" -o admin_service ./cmd

# Runtime stage
FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/admin_service /admin_service

EXPOSE 8080

ENTRYPOINT ["/admin_service"]
