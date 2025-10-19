FROM openjdk:17-jdk


WORKDIR /app


COPY target/auth_service-1.0.0.jar app.jar


EXPOSE 8080


ENTRYPOINT ["java", "-jar", "app.jar", "--server.port=8081"]