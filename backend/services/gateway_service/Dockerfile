
FROM golang:1.23 AS builder


WORKDIR /app


COPY go.mod go.sum ./


RUN go mod download


COPY . .


ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -trimpath -ldflags "-s -w" -o gateway_service ./cmd


FROM gcr.io/distroless/base-debian12

WORKDIR /app


COPY --from=builder /app/gateway_service /gateway_service


EXPOSE 8080


USER 65532:65532
ENTRYPOINT ["/gateway_service"]
