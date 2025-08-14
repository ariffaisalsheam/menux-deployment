# Use a base image with Java 17, which matches your pom.xml
FROM eclipse-temurin:17-jdk-jammy

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven wrapper and the pom.xml file to download dependencies
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Download the dependencies
RUN ./mvnw dependency:go-offline

# Copy the rest of your application's source code
COPY src ./src

# Build the application and package it into a JAR file
# This will also skip running tests during the build
RUN ./mvnw package -DskipTests

# Expose the port your Spring Boot application runs on (default is 8080)
EXPOSE 8080

# The command to run your application
ENTRYPOINT ["java", "-jar", "target/menu-x-backend-0.0.1-SNAPSHOT.jar"]