# Используем Go 1.23+
FROM golang:1.25.3

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем go.mod и go.sum и скачиваем зависимости
COPY go.mod go.sum ./
RUN go mod download

# Копируем остальные файлы проекта
COPY . .

# Собираем бинарник из cmd/main.go
RUN go build -o gateway_service ./cmd

# Пробрасываем порт
EXPOSE 8082

# Запуск приложения
CMD ["./gateway_service"]