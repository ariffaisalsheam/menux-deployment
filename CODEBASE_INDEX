# Menu.X Backend Codebase Index

This document provides a comprehensive analysis and index of the Menu.X backend codebase. It is intended to help developers and AI agents quickly understand the project's architecture, key components, and overall structure.

---

## 1. High-Level Architecture

The Menu.X backend follows a standard layered architecture, a common design pattern for modern Spring Boot applications. This separation of concerns makes the codebase organized, scalable, and easier to maintain. The request-response flow typically moves from `Controller` -> `Service` -> `Repository` -> `Database`, and back.

The key packages are:

- **`com.menux.menu_x_backend.controller`**: This is the API layer. Controllers are responsible for handling incoming HTTP requests, validating the input (often using DTOs), and invoking the appropriate service methods to handle the business logic. They then format the response and send it back to the client.

- **`com.menux.menu_x_backend.service`**: This is the core business logic layer. Services contain the main application logic, orchestrating data and operations from various sources (like repositories). They are responsible for implementing the business rules and transactions.

- **`com.menux.menu_x_backend.repository`**: This is the data access layer. Repositories are interfaces (using Spring Data JPA) that define the methods for interacting with the database. They provide a high-level abstraction for CRUD (Create, Read, Update, Delete) operations on the entities.

- **`com.menux.menu_x_backend.entity`**: This package contains the JPA (Java Persistence API) entities. These are plain Java objects (POJOs) that are directly mapped to tables in the PostgreSQL database. Each instance of an entity corresponds to a row in the table.

- **`com.menux.menu_x_backend.dto`**: Data Transfer Objects (DTOs) are used to shape the data that is sent to or received from the API layer. They help to decouple the internal database entities from the external API contract, providing flexibility and preventing the exposure of internal data structures.

- **`com.menux.menu_x_backend.security`**: This package handles all security-related concerns. It includes JWT (JSON Web Token) generation, validation, and the main Spring Security configuration that protects the application's endpoints.

- **`com.menux.menu_x_backend.config`**: Contains application-wide configuration classes. This can include security configurations, CORS (Cross-Origin Resource Sharing) policies, beans for external services, and other application setup.

- **`com.menux.menu_x_backend.exception`**: Defines custom exceptions for the application and includes a global exception handler. This handler catches exceptions thrown from any layer and formats them into a consistent error response for the client.

- **`com.menux.menu_x_backend.util`**: A collection of utility classes and helper methods that can be used across the application to perform common tasks.

- **`com.menux.menu_x_backend.validation`**: Contains custom validation logic and constraints that can be applied to DTOs to ensure the integrity of incoming data.

---

## 2. Detailed Module and File Analysis

This section provides a detailed breakdown of each package and its files.

### 2.1. `controller` Package

The `controller` package is the entry point for all API requests. Each controller is responsible for a specific domain of the application.

- **`AIConfigController.java`**: Manages the configuration of AI providers. All endpoints in this controller are restricted to `SUPER_ADMIN` users. It handles creating, reading, updating, deleting, and testing AI provider configurations, as well as setting a primary provider.

- **`AIController.java`**: Exposes AI-powered services to `RESTAURANT_OWNER` users. This includes endpoints for generating menu item descriptions and analyzing customer feedback. Access to these features is further restricted to users with a "PRO" subscription plan.

- **`AdminConsistencyController.java`**: A utility controller for `SUPER_ADMIN` users to manage data integrity. It provides endpoints to report and repair inconsistencies, such as `RESTAURANT_OWNER` users who do not have an associated restaurant record.

- **`AdminController.java`**: Provides core administrative functionalities for `SUPER_ADMIN` users. This includes user management (listing, viewing details, updating subscription plans, deleting, activating/deactivating) and restaurant management (listing, viewing details), as well as an endpoint to retrieve platform-wide analytics.

- **`AnalyticsController.java`**: Provides endpoints for retrieving analytics data. `RESTAURANT_OWNER` users can get various analytics for their own restaurant (detailed, basic, feedback, recent activity). `SUPER_ADMIN` users can retrieve the same analytics for any restaurant by providing a restaurant ID.

- **`AuthController.java`**: Handles user authentication and registration. It provides two public endpoints: `/api/auth/register` to create a new user account (for either a `RESTAURANT_OWNER` or a `SUPER_ADMIN`) and `/api/auth/login` to authenticate a user and receive a JWT for accessing protected endpoints.

- **`DebugController.java`**: A controller intended for development and debugging purposes. It contains simple endpoints to test if the application is receiving and processing requests correctly. This controller should likely be disabled in a production environment.

- **`HealthController.java`**: Exposes a rich set of endpoints for monitoring the application's health. It provides basic and detailed health checks, including the status of the database and external services. It also offers endpoints for application metrics and Kubernetes liveness/readiness probes, crucial for running in a containerized environment.

- **`MediaController.java`**: Handles all media-related operations, primarily for uploading menu item images. It provides an endpoint for file uploads and includes proxy endpoints to stream media content and generate signed URLs. This approach abstracts the underlying file storage service (e.g., Supabase Storage) from the client.

- **`MenuController.java`**: Manages all aspects of a restaurant's menu. It includes a public endpoint for diners to view the menu of a specific restaurant. For authenticated `RESTAURANT_OWNER` users, it provides a full suite of CRUD operations (Create, Read, Update, Delete) for their menu items, plus functionality to reorder items.

- **`OrderController.java`**: Manages all order-related operations. It has a public endpoint for customers to place an order at a restaurant. For authenticated `RESTAURANT_OWNER` users, it provides endpoints to view their orders and update an order's fulfillment status (e.g., "pending", "completed") and payment status. `SUPER_ADMIN` users can also view orders for any restaurant.

- **`PlatformConfigController.java` / `PublicSettingController.java`**: This file contains two controllers for managing application settings.
    - `PlatformConfigController`: Restricted to `SUPER_ADMIN` users, this controller provides full CRUD functionality for managing global platform settings.
    - `PublicSettingController`: This controller provides public, read-only access to settings that are explicitly marked as "public", allowing clients to fetch non-sensitive configuration data.

- **`PublicMenuController.java`**: A large controller that handles all publicly accessible, unauthenticated interactions for a restaurant's menu page (e.g., the page a diner sees after scanning a QR code). It is responsible for fetching menu and restaurant info, submitting feedback, and placing orders for "PRO" restaurants.

- **`QRCodeController.java`**: Restricted to `RESTAURANT_OWNER` users, this controller is responsible for generating and customizing QR codes for their restaurant. It allows generating codes with custom branding and downloading them in various formats.

- **`RestaurantController.java`**: Allows an authenticated `RESTAURANT_OWNER` to manage their own restaurant's information. It provides endpoints to get the details of the current user's restaurant and to update its information (name, address, etc.).

- **`TableController.java`**: Provides comprehensive management of tables within a restaurant for `RESTAURANT_OWNER` users. It includes full CRUD operations for tables, bulk creation, status updates, and generating QR codes for specific tables or a sheet of multiple tables.

- **`TestController.java`**: A controller for development and testing purposes. It provides endpoints to check the application's health, list configured AI providers, and test AI functionality. It should likely be disabled in production.

- **`UserController.java`**: Provides information about the currently authenticated user. Its `/api/user/profile` endpoint returns a summary of the user's profile, including their associated restaurant details if they are a `RESTAURANT_OWNER`.

### 2.2. `service` Package

The `service` package contains the core business logic of the application. Services are responsible for orchestrating data from repositories and implementing the main application functionalities.

- **`AIConfigService.java`**: Manages the business logic for AI provider configurations. It handles the CRUD operations for providers, encrypts and decrypts API keys for storage and use, provides functionality to test a given provider's configuration, and manages which provider is set as the primary one for the platform.

- **`AIProviderService.java`**: This service acts as a crucial facade for interacting with various external AI providers (e.g., Google Gemini, OpenAI, OpenRouter). It selects the appropriate provider for a given task (like generating a menu description), constructs the correct API request, calls the external API (with resilience patterns like circuit breakers), and parses the response.

- **`AIProviderTestService.java`**: This service is dedicated to testing the validity of different AI provider configurations. For each provider type, it makes a simple, standardized test call to the provider's API to verify that the credentials and endpoint are working correctly. It is used by the `AIConfigService` to provide the testing functionality.
