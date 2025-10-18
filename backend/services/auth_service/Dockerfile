# 1.Используем легкий JDK образ
FROM openjdk:17-jdk-slim

# 2.Устанавливаем рабочую директорию
WORKDIR /app

# 3.Копируем собранный JAR-файл из target/
COPY target/*.jar app.jar

# 4.Указываем порт, который слушает Spring Boot
EXPOSE 8080

# 5.Запускаем приложение
ENTRYPOINT ["java", "-jar", "app.jar"]
