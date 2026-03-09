# Stage 1: Build the JAR
FROM maven:3.9.12-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom first (dependency caching)
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copy the source and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run JAR with a smaller JRE
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]