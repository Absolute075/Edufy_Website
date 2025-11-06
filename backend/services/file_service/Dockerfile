## Build stage
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
# Copy only necessary sources explicitly to avoid context issues
COPY cmd ./cmd
COPY internal ./internal
COPY public ./public
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o file_service ./cmd/file_service

## Run stage
FROM alpine:3.19
RUN adduser -D -g '' app
WORKDIR /app
COPY --from=builder /app/file_service /app/file_service
COPY public /app/public
ENV PORT=8080
EXPOSE 8080
USER app
ENTRYPOINT ["/app/file_service"]