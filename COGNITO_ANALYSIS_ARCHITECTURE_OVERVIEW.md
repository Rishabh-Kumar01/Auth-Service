# Authentication Service Architecture Overview

## Project Information
- **Service Name**: Auth Service (flightsandserach - microservice)
- **Type**: Express.js-based microservice for handling authentication and user management
- **Database**: MySQL with Sequelize ORM
- **Architecture**: Layered architecture (Controller → Service → Repository → Model)

---

## 1. CURRENT AUTHENTICATION IMPLEMENTATION

### 1.1 Authentication Methods
The system currently implements:
- **Username/Email + Password authentication**
- **JWT (JSON Web Token) based session management**
- **Email verification workflow**
- **Role-based access control (RBAC)**

### 1.2 Controllers (/src/controllers)

**File**: `user.controller.js`

**Key Methods**:
- `signUp(email, password, roleId)` - Creates a new user with assigned role
  - Sends email verification token via message queue
  - Returns user object with id and email
  
- `verifyEmail(token)` - Verifies user's email using email token
  - Updates user verified status
  - Accepts token from query parameters
  
- `logIn(email, password)` - Authenticates user and returns JWT token
  - Validates email and password
  - Returns JWT token on success
  - Token expires in 24 hours
  
- `isAuthenticated(token)` - Validates JWT token and returns user data
  - Reads token from `x-access-token` header
  - Verifies token signature
  - Returns authenticated user data
  
- `isAdmin(userId)` - Checks if user has ADMIN role
  
- CRUD operations: `findAll()`, `findById()`, `update()`, `destroy()`

### 1.3 Services (/src/services)

**File**: `user.service.js`

**Key Methods**:
- `#createToken(user)` - Private method to create JWT tokens
  - Algorithm: HS256
  - Expiration: 24 hours
  - Key: `JWT_KEY` from environment
  
- `#createEmailToken(user)` - Creates email verification token
  - Expiration: 1 hour
  - Key: `EMAIL_VERIFY_KEY` from environment
  
- `#checkPassword(password, hashedPassword)` - Validates password using bcrypt
  
- `#verifyToken(token)` - Verifies JWT token validity
  
- `#verifyEmailToken(token)` - Verifies email verification token
  
- **Business Logic Implementations**:
  - `signUp()` - Accepts email, password, roleId
  - `verifyEmail()` - Verifies email with token validation
  - `logIn()` - Authenticates and returns token
  - `isAuthenticated()` - Validates and returns user
  - User CRUD operations

### 1.4 Repository Layer (/src/repository)

**File**: `user.repository.js`

**Database Operations**:
- `signUp(data)` - Creates user with bcrypt-hashed password
- `findByEmail(email)` - Retrieves user by email
- `findById(userId)` - Retrieves user by ID
- `updateStatus(userId)` - Updates verified status
- `isAdmin(userId)` - Checks if user has ADMIN role
- CRUD operations for users

### 1.5 Token Handling Mechanism

**Current Token Strategy**:
1. **Access Token (JWT)**
   - Type: Stateless JWT
   - Key: `JWT_KEY` environment variable
   - Algorithm: HS256
   - Expiration: 24 hours
   - Payload: `{ id, email }`
   - Storage: Client-side (returned in response)
   - Transmission: Via `x-access-token` header

2. **Email Verification Token**
   - Type: JWT
   - Key: `EMAIL_VERIFY_KEY`
   - Expiration: 1 hour
   - Usage: Sent via email link for account verification
   - Format: `http://localhost:8001/api/v1/verify-email?token={token}`

3. **Token Verification Process**:
   ```
   isAuthenticated() {
     token → verifyToken() → jwt.verify(token, JWT_KEY)
     → findById(user.id) → return user data
   }
   ```

---

## 2. PROJECT STRUCTURE

```
/home/user/Auth-Service/
├── src/
│   ├── config/
│   │   ├── serverConfig.js        (Environment variables loading)
│   │   ├── nodemailer.config.js   (Email configuration)
│   │   └── index.config.js        (Config exports)
│   │
│   ├── controllers/
│   │   ├── user.controller.js     (HTTP request handlers)
│   │   └── index.controller.js    (Exports)
│   │
│   ├── services/
│   │   ├── user.service.js        (Business logic)
│   │   └── index.service.js       (Exports)
│   │
│   ├── repository/
│   │   ├── user.repository.js     (Database operations)
│   │   └── index.repository.js    (Exports)
│   │
│   ├── models/
│   │   ├── user.js                (Sequelize User model)
│   │   ├── role.js                (Sequelize Role model)
│   │   └── index.js               (Sequelize initialization)
│   │
│   ├── routes/
│   │   ├── index.route.js         (Main router)
│   │   └── v1/
│   │       └── index.js           (V1 API routes)
│   │
│   ├── middlewares/
│   │   ├── auth.validator.middleware.js   (Auth validation)
│   │   ├── validator.middleware.js        (General validation)
│   │   └── index.middleware.js            (Exports)
│   │
│   ├── utils/
│   │   ├── imports.util.js        (Centralized imports)
│   │   ├── index.util.js          (Utils exports)
│   │   ├── errorHandler.util.js   (Custom error class)
│   │   ├── clientError.util.js    (Client error class)
│   │   ├── validationError.util.js (Validation error)
│   │   ├── messageQueue.util.js   (RabbitMQ integration)
│   │   └── responseCodes.util.js  (HTTP status codes)
│   │
│   ├── migrations/
│   │   └── *-create-*.js          (Database migrations)
│   │
│   ├── seeders/
│   │   └── *-add-*.js             (Database seeders)
│   │
│   └── server.js                  (Express app setup)
│
├── package.json
├── package-lock.json
├── .sequelizerc
├── .gitignore
└── README.md
```

---

## 3. ENVIRONMENT VARIABLES IN USE

**File**: `src/config/serverConfig.js`

Current environment variables required:
```
PORT=3000                           # Server port
JWT_KEY=your_jwt_secret_key        # JWT signing key (24h expiry)
EMAIL_VERIFY_KEY=your_email_key    # Email verification key (1h expiry)
USER=email_user                    # Nodemailer email user
PASS=email_password                # Nodemailer email password
SERVICE=gmail/outlook              # Email service provider
CLIENT_ID=google_client_id         # Google OAuth (if used)
CLIENT_SECRET=google_client_secret # Google OAuth (if used)
REDIRECT_URI=callback_url          # OAuth redirect URI
REFRESH_TOKEN=refresh_token_value  # OAuth refresh token
DB_SYNC=true/false                 # Enable/disable DB auto-sync
MESSAGE_BROKER_URL=amqp://...      # RabbitMQ connection string
REMINDER_BINDING_KEY=binding_key   # RabbitMQ binding key
EXCHANGE_NAME=exchange_name        # RabbitMQ exchange name
```

---

## 4. EXISTING AWS & AUTHENTICATION LIBRARIES

### 4.1 Authentication Libraries Currently Used:
- **jsonwebtoken** (^9.0.2) - JWT token creation and verification
- **bcrypt** (^5.1.1) - Password hashing and comparison
- **nodemailer** (^6.9.14) - Email sending for verification
- **googleapis** (^140.0.1) - Google API integration (for OAuth refresh)
- **axios** (^1.7.2) - HTTP client

### 4.2 Database:
- **sequelize** (^6.37.3) - ORM for MySQL
- **mysql2** (^3.10.1) - MySQL driver
- **sequelize-cli** (^6.6.2) - CLI tools

### 4.3 Infrastructure:
- **amqplib** (^0.10.4) - RabbitMQ message queue
- **express** (^4.18.2) - Web framework
- **morgan** (^1.10.0) - Request logging
- **helmet** (^7.0.0) - Security headers
- **cors** (^2.8.5) - CORS handling
- **compression** (^1.7.4) - Response compression

### 4.4 AWS Libraries Currently Missing:
- **No AWS SDK** present
- **No AWS Cognito** integration
- **No AWS services** libraries

---

## 5. CURRENT TOKEN HANDLING MECHANISM

### 5.1 Token Creation Flow:
```
SignUp Request
    ↓
User.create() → Password hashed with bcrypt → User stored
    ↓
createEmailToken() → JWT with email + EMAIL_VERIFY_KEY
    ↓
Message published to RabbitMQ with verification link
```

### 5.2 Token Validation Flow:
```
Login Request (email + password)
    ↓
findByEmail() + checkPassword()
    ↓
createToken() → JWT { id, email } + JWT_KEY
    ↓
Return token to client
```

### 5.3 Authentication Check Flow:
```
Request with x-access-token header
    ↓
isAuthenticated()
    ↓
verifyToken() → jwt.verify(token, JWT_KEY)
    ↓
findById(user.id)
    ↓
Return user object
```

### 5.4 Current Limitations:
- **No refresh token** mechanism
- **No token revocation** system
- **No multi-device** session management
- **Hardcoded 24-hour** expiration
- **No token rotation**
- **Local database** for user management only

---

## 6. API ROUTES

**Base URL**: `/api/v1`

### Authentication Endpoints:
| Method | Route | Handler | Notes |
|--------|-------|---------|-------|
| POST | `/signup` | `UserController.signUp` | Validates email, password, roleId |
| POST | `/login` | `UserController.logIn` | Returns JWT token |
| GET | `/verify-email` | `UserController.verifyEmail` | Query param: token |
| GET | `/isAuthenticated` | `UserController.isAuthenticated` | Header: x-access-token |
| GET | `/verify/isAdmin` | `UserController.isAdmin` | Checks admin role |

### User Management Endpoints:
| Method | Route | Handler |
|--------|-------|---------|
| GET | `/users` | `UserController.findAll` |
| GET | `/users/:userId` | `UserController.findById` |
| PUT | `/users/:userId` | `UserController.update` |
| DELETE | `/users/:userId` | `UserController.destroy` |

---

## 7. DATABASE MODELS

### User Model:
```javascript
{
  id: INTEGER (PK, auto-increment),
  email: STRING (unique, required, validated as email),
  password: STRING (required, min 6 chars, bcrypt hashed),
  verified: BOOLEAN (default: false),
  createdAt: DATETIME,
  updatedAt: DATETIME
}
```

**Associations**: Many-to-Many with Role (via User_Roles junction table)

### Role Model:
```javascript
{
  id: INTEGER (PK),
  name: STRING (required),
  createdAt: DATETIME,
  updatedAt: DATETIME
}
```

**Associations**: Many-to-Many with User

### User_Roles Junction Table:
```javascript
{
  userId: INTEGER (FK),
  roleId: INTEGER (FK),
  createdAt: DATETIME,
  updatedAt: DATETIME
}
```

---

## 8. MIDDLEWARE & VALIDATION

### Auth Validation Middleware:
- `validateUserAuth` - Requires email, password, roleId
- `validateUserLogin` - Requires email, password
- `validateIsAdmin` - Requires userId

---

## 9. ERROR HANDLING

Custom error classes:
- **ErrorHandler** - Base error class with statusCode, explanation
- **ValidationError** - For Sequelize validation errors
- **ClientError** - For user-facing errors

---

## SUMMARY FOR AWS COGNITO INTEGRATION

### Key Changes Needed:

1. **Dependency Management**:
   - Add AWS SDK: `aws-sdk` or `@aws-sdk/client-cognito-identity-provider`
   - Add AWS Cognito packages

2. **Configuration Updates**:
   - New environment variables for AWS Cognito:
     - `AWS_REGION`
     - `COGNITO_USER_POOL_ID`
     - `COGNITO_CLIENT_ID`
     - `COGNITO_CLIENT_SECRET` (if using web app)
     - `COGNITO_DOMAIN`
     - `COGNITO_REDIRECT_URI`

3. **Service Layer Changes** (`user.service.js`):
   - Create AWS Cognito service instance
   - Replace `#createToken()` with Cognito auth
   - Replace password validation with Cognito SignUp/InitiateAuth
   - Add Cognito token management

4. **Repository Changes** (`user.repository.js`):
   - Keep local user table for app metadata
   - Add fields for Cognito user mapping (e.g., `cognitoUserId`)
   - Sync with Cognito user pool

5. **Controller Changes**:
   - Update signUp to use Cognito SignUp
   - Update logIn to use Cognito InitiateAuth
   - Handle MFA/2FA if enabled in Cognito

6. **Token Strategy**:
   - Use Cognito IdToken, AccessToken, RefreshToken
   - Implement token refresh mechanism
   - Add token revocation support

7. **Routes & Middleware**:
   - Add new routes for Cognito callbacks (OAuth)
   - Add logout endpoint with token revocation
   - Update authentication middleware for Cognito tokens

8. **Database**:
   - Add migration to add `cognitoUserId` column to Users table
   - Possibly add `cognitoAttributes` column for user metadata

