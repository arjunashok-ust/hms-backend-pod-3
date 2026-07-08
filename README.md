# Hospital Management System (HMS) - Backend

This is the backend server for the Hospital Management System (HMS), a comprehensive application designed to streamline hospital operations. Built with Node.js and Express, this project provides a secure RESTful API, manages the database, and handles all core business logic.

---

## Project Maintainer

- **Aswin A S**
  - GitHub: [AswinAS-308247](https://github.com/AswinAS-308247)
  - Email: [Aswin.AS2@ust.com](mailto:Aswin.AS2@ust.com)

---

## Table of Contents

1.  [About The Project](#about-the-project)
    - [Key Features](#key-features)
    - [Tech Stack](#tech-stack)
2.  [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation & Setup](#installation--setup)
    - [Running the Application](#running-the-application)
3.  [Backend Architecture](#backend-architecture)
4.  [API Request Flow](#api-request-flow)
5.  [Running Tests](#-running-tests)

---

## About The Project

---

This project serves as the data and logic layer for the HMS ecosystem. It communicates with client applications (like `HMS-FRONTEND`) by exposing a secure and comprehensive RESTful API, handling data persistence, business logic, and security.

### Key Features

- **Secure RESTful API**: A complete set of endpoints for all hospital management operations.
- **Authentication & Authorization**: Secure, token-based authentication using JSON Web Tokens (JWT) with a refresh token strategy.
- **Role-Based Access Control (RBAC)**: Granular permission system to control access for different user roles (Admin, Doctor, Patient, etc.).
- **User & Profile Management**: Full CRUD for patient and employee records, including admin approval workflows and self-registration.
- **Appointment Scheduling**: Logic for creating, viewing, and managing appointments, including doctor availability and slot checking.
- **Medical Records**: Secure creation and management of patient medical records with permission-based access.
- **Dynamic Menu System**: API-driven UI configuration to render navigation menus based on user roles.
- **Transactional Emails**: Integrated email service (Brevo) for account verification, password resets, and notifications.
- **Dashboard Analytics**: Endpoints to provide aggregated system statistics for the admin dashboard.

### Tech Stack

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web application framework for building the REST API.
- **MongoDB**: NoSQL database for data storage.
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB.
- **JSON Web Tokens (JWT)**: For handling secure authentication tokens.
- **`bcryptjs`**: For hashing passwords securely.
- **`express-validator`**: For validating incoming API request data.
- **Brevo (Sendinblue)**: For sending transactional emails.
- **Jest**: For running automated tests.

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following software installed on your system:

- Node.js (v14.x or higher recommended)
- npm (usually comes with Node.js)
- MongoDB
- Git

### Installation & Setup

1.  **Clone the repository**

    ```sh
    git clone <YOUR_REPOSITORY_URL>
    cd HMS-BACKEND
    ```

2.  **Install NPM packages**

    ```sh
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and populate it with your configuration variables. Use the following as a template:

    ```env
    # Server Configuration
    PORT=5000
    NODE_ENV=development
    FRONTEND_URL=http://localhost:4200 # URL of the frontend client

    # Database
    MONGO_URI=mongodb://localhost:27017/hms-db # Your MongoDB connection string

    # JWT Secrets
    JWT_SECRET=your_super_secret_key_for_access_tokens
    JWT_EXPIRES_IN=1d
    REFRESH_TOKEN_SECRET=your_super_secret_key_for_refresh_tokens
    REFRESH_TOKEN_EXPIRES_IN=7d

    # Email Service (Brevo / Sendinblue)
    BREVO_API_KEY=your_brevo_api_key
    EMAIL_USER=your_sending_email@example.com
    ADMIN_EMAIL=admin_email_for_notifications@example.com # For receiving system notifications

    # Application URL (for email links)
    APP_URL=http://localhost:5000 # Base URL of this backend server
    ```

### Running the Application

---

- **Run in Development Mode:**
  This command starts the server with `nodemon`, which automatically restarts on file changes.

  ```sh
  npm run dev
  ```

- **Run in Production Mode:**
  ```sh
  npm start
  ```

The server will be accessible at `http://localhost:5000` (or the `PORT` specified in your `.env` file).

---

## API Documentation

The backend now includes an OpenAPI/Swagger documentation page.

- Swagger UI: http://localhost:5000/docs-hms
- OpenAPI spec file: [openapi.yaml](openapi.yaml)

After starting the server, open the Swagger UI URL in your browser to explore the available endpoints and test them interactively.

---

## Backend Architecture

The backend is built on a modern, modular architecture to ensure scalability and maintainability.

- **`config`**: Contains configuration files, such as the database connection logic (`db.js`).
- **`controllers`**: Holds the core business logic. Each controller is responsible for handling the logic of a specific feature (e.g., `authController`, `appointmentController`).
- **`middlewares`**: Contains custom Express middleware for tasks like authentication (`authMiddleware`), error handling (`errorMiddleware`), and input validation (`validate.js`).
- **`models`**: Defines the Mongoose schemas for all database collections (e.g., `Users`, `Appointments`, `Patients`). This is the data layer of the application.
- **`routes`**: Defines the API endpoints. Each file maps HTTP routes (e.g., `/api/auth/login`) to the corresponding controller functions.
- **`utils`**: A collection of helper functions and classes for shared tasks like generating unique IDs (`generateID.js`), sending emails (`sendMail.js`), and creating standardized errors (`errors.utils.js`).
- **`validations`**: Contains validation rules using `express-validator` to ensure incoming request data is well-formed before it reaches the controllers.

---

## API Request Flow

A typical authenticated API request follows this pipeline:

1.  **HTTP Request**: A client sends a request to an API endpoint (e.g., `POST /api/appointments/create`).
2.  **Routing**: Express matches the endpoint in the appropriate file in the `routes` directory (e.g., `appointmentRoutes.js`).
3.  **Middleware Chain**: The request passes through a series of middleware functions defined for that route:
    - `authenticateToken`: Verifies the JWT in the `Authorization` header and attaches the user payload to the request (`req.user`).
    - `requirePermission`: Checks if the user's role and permissions (from `req.user`) are sufficient to access the endpoint.
    - **Validation (`express-validator`)**: If present, checks and sanitizes the request body or query parameters.
    - `validate`: A custom middleware that catches any validation errors and sends a `422` response.
4.  **Controller Logic**: If all middleware passes, the request is handed to the controller function (e.g., `appointmentController.addAppointment`). The controller executes the core business logic.
5.  **Database Interaction**: The controller uses Mongoose **Models** to interact with the MongoDB database (e.g., creating a new appointment document).
6.  **Response**: The controller sends a JSON response back to the client with a status code (e.g., `201 Created`).
7.  **Error Handling**: If any error is thrown within an `asyncHandler`-wrapped controller, it is caught and passed to the global `errorMiddleware`, which formats and sends a standardized error response.

---
