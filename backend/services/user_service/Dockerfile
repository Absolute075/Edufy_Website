# =========================
# Build stage
# =========================
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom first for better Docker layer caching
COPY pom.xml ./
# Download dependencies (optional but speeds up subsequent builds)
RUN mvn -B -q -e -DskipTests dependency:go-offline || true

# Copy sources and build
COPY src ./src
RUN mvn -B -q -DskipTests clean package

# =========================
# Runtime stage
# =========================
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy fat jar
COPY --from=build /app/target/user_service-0.0.1-SNAPSHOT.jar /app/app.jar

# Runtime configuration
EXPOSE 8080
ENV JAVA_OPTS=""

# Note: DB creds and other Spring configs are provided via env in docker-compose
ENTRYPOINT ["/bin/sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
