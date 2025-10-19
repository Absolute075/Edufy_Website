FROM golang:1.24g

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o gateway_service .

EXPOSE 8082

CMD ["./gateway_service"]