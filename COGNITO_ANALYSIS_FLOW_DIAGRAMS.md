# Authentication Architecture - Flow Diagrams

## 1. CURRENT SIGN-UP FLOW

```
Client                    Controller              Service              Repository            Database
  |                           |                      |                     |                    |
  |--POST /signup------------>|                      |                     |                    |
  |  (email, password, roleId)|                      |                     |                    |
  |                           |                      |                     |                    |
  |                           |--signUp()----------->|                     |                    |
  |                           |                      |                     |                    |
  |                           |                      |--signUp()---------->|                    |
  |                           |                      |                     |--INSERT User----->|
  |                           |                      |<-user returned------|<--success---------|
  |                           |                      |                     |                    |
  |                           |      createEmailToken()                    |                    |
  |                           |<-----JWT Token-------|                     |                    |
  |                           |                      |                     |                    |
  |                           |--publishMessage to RabbitMQ with email link and token         |
  |                           |                      |                     |                    |
  |<-201 Created-----------  |<--user (id, email)---|                     |                    |
  |  (with user data)         |                      |                     |                    |
  |                           |                      |                     |                    |

Flow:
1. Client submits email, password, roleId
2. Service calls Repository to create user (password hashed with bcrypt)
3. Service creates email verification JWT token (1-hour expiration)
4. Service publishes message to RabbitMQ with verification link
5. Controller returns 201 with user object
6. Email service receives message and sends verification email to user
```

---

## 2. EMAIL VERIFICATION FLOW

```
Client                 Controller              Service              Repository            Database
  |                        |                      |                     |                    |
  |--GET /verify-email---->|                      |                     |                    |
  |  ?token=JWT_EMAIL_TOKEN|                      |                     |                    |
  |                        |                      |                     |                    |
  |                        |--verifyEmail(token)->|                     |                    |
  |                        |                      |--verifyEmailToken()--|                    |
  |                        |                      |  (jwt.verify)        |                    |
  |                        |                      |<--decoded token------|                    |
  |                        |                      |                     |                    |
  |                        |                      |--findByEmail()------>|                    |
  |                        |                      |                     |--SELECT user----->|
  |                        |                      |<--user object--------|<--user data------|
  |                        |                      |                     |                    |
  |                        |                      |--updateStatus()----->|                    |
  |                        |                      |                     |--UPDATE verified->|
  |                        |                      |<--updated user-------|<--success---------|
  |                        |<--user object--------|                     |                    |
  |<-200 OK-----------------|                     |                    |                    |
  |  (user data)            |                     |                    |                    |
```

---

## 3. LOGIN FLOW

```
Client                 Controller              Service              Repository            Database
  |                        |                      |                     |                    |
  |--POST /login---------->|                      |                     |                    |
  |  (email, password)      |                      |                     |                    |
  |                        |                      |                     |                    |
  |                        |--logIn()------------>|                     |                    |
  |                        |                      |                     |                    |
  |                        |                      |--findByEmail()------>|                    |
  |                        |                      |                     |--SELECT user----->|
  |                        |                      |<--user object--------|<--user data------|
  |                        |                      |                     |                    |
  |                        |                      |--checkPassword()-----|                    |
  |                        |                      |  (bcrypt.compare)    |                    |
  |                        |                      |<--true/false---------|                    |
  |                        |                      |                     |                    |
  |                        |      createToken()                        |                    |
  |                        |      JWT {id, email} + JWT_KEY             |                    |
  |                        |      (24-hour expiration)                  |                    |
  |                        |<-----JWT token--------|                     |                    |
  |<-200 OK-----------------|                     |                    |                    |
  |  (token)                |                     |                    |                    |
  |                        |                     |                    |                    |

Token Payload: { id, email, iat, exp }
Key: JWT_KEY (environment variable)
Expiration: 24 hours
```

---

## 4. AUTHENTICATION CHECK FLOW

```
Client                 Controller              Service              Repository            Database
  |                        |                      |                     |                    |
  |--GET /isAuthenticated->|                      |                     |                    |
  |  Header: x-access-token|                      |                     |                    |
  |  Value: JWT_token      |                      |                     |                    |
  |                        |                      |                     |                    |
  |                        |--isAuthenticated()-->|                     |                    |
  |                        |   (token)            |                     |                    |
  |                        |                      |--verifyToken()-------|                    |
  |                        |                      |  (jwt.verify)        |                    |
  |                        |<--decoded payload----|                     |                    |
  |                        |  {id, email, ...}    |                     |                    |
  |                        |                      |--findById()---------->|                    |
  |                        |                      |  (user.id)          |--SELECT user----->|
  |                        |                      |<--user object--------|<--user data------|
  |                        |<--user object--------|                     |                    |
  |<-200 OK with user----->|                     |                    |                    |
  |                        |                     |                    |                    |

If token is invalid:
  - jwt.verify() throws error
  - isAuthenticated() catches and throws "Invalid Token"
  - Controller returns appropriate error response
```

---

## 5. ROLE-BASED ACCESS CONTROL (isAdmin Check)

```
Client                Controller              Service              Repository            Database
  |                       |                      |                     |                    |
  |--GET /verify/isAdmin->|                      |                     |                    |
  |  Body: {userId}       |                      |                     |                    |
  |                       |                      |                     |                    |
  |                       |--isAdmin()---------->|                     |                    |
  |                       |  (userId)            |                     |                    |
  |                       |                      |--isAdmin()---------->|                    |
  |                       |                      |  (userId)           |                    |
  |                       |                      |                     |--SELECT user---->|
  |                       |                      |                     |<--user----------|
  |                       |                      |                     |                    |
  |                       |                      |                     |--SELECT admin----->|
  |                       |                      |                     |  role from Role    |
  |                       |                      |                     |  table            |
  |                       |                      |                     |<--role----------|
  |                       |                      |                     |                    |
  |                       |                      |                     |--Check if user--->|
  |                       |                      |                     |  has admin role   |
  |                       |                      |                     |  via User_Roles   |
  |                       |                      |                     |<--true/false------|
  |                       |                      |<--result-------------|                    |
  |                       |<--boolean value------|                     |                    |
  |<-200 OK with data---->|                     |                    |                    |
  |  {isAdmin: true/false}|                    |                    |                    |

Association Flow:
  User (M) ---> User_Roles (Junction) <--- (1) Role
```

---

## 6. DATABASE RELATIONSHIP DIAGRAM

```
┌─────────────────────────┐
│         Users           │
├─────────────────────────┤
│ id (PK)                 │
│ email (UNIQUE)          │
│ password (hashed)       │
│ verified (BOOLEAN)      │
│ createdAt               │
│ updatedAt               │
└─────────────────────────┘
          │
          │ Many-to-Many
          │ (via User_Roles)
          │
┌─────────────────────────┐
│     User_Roles          │
├─────────────────────────┤
│ userId (FK) (PK)        │
│ roleId (FK) (PK)        │
│ createdAt               │
│ updatedAt               │
└─────────────────────────┘
          │
          │ Many-to-Many
          │
          │
┌─────────────────────────┐
│        Roles            │
├─────────────────────────┤
│ id (PK)                 │
│ name                    │
│ createdAt               │
│ updatedAt               │
└─────────────────────────┘

Example:
  User: { id: 1, email: "user@example.com", ... }
  Role: { id: 1, name: "ADMIN" }
  Role: { id: 2, name: "USER" }
  
  User_Roles:
    - { userId: 1, roleId: 1 }  (User 1 is ADMIN)
    - { userId: 1, roleId: 2 }  (User 1 is USER)
```

---

## 7. MESSAGE QUEUE INTEGRATION (Email Verification)

```
Auth Service            RabbitMQ                Reminder Service        Email Service
     |                      |                         |                      |
     |--publishMessage()     |                         |                      |
     |  EXCHANGE: email      |                         |                      |
     |  BINDING_KEY: verify  |                         |                      |
     |  MESSAGE: {           |                         |                      |
     |    data: {            |                         |                      |
     |      email,           |                         |                      |
     |      verificationLink,|                         |                      |
     |      userId           |                         |                      |
     |    },                 |                         |                      |
     |    service: "CREATE..." |                       |                      |
     |  }                    |                         |                      |
     |                       |                         |                      |
     |                       |--QUEUE message-------->|                       |
     |                       |                         |                       |
     |                       |                         |--consume message--->|
     |                       |                         |                       |
     |                       |                         |--send email-------->|
     |                       |                         |  with link to verify|
     |                       |                         |                      |
     |                       |                         |<--ack message--------|
     |                       |<--acknowledge---------|                       |
     |                       |                         |                       |

Message Format:
{
  data: {
    email: "user@example.com",
    verificationLink: "http://localhost:8001/api/v1/verify-email?token=JWT_TOKEN",
    userId: 1
  },
  service: "CREATE_USER"
}
```

---

## 8. ERROR HANDLING FLOW

```
Request
  |
  v
Validation Middleware
  |
  ├─ Invalid Input ──> 400 BAD_REQUEST
  |
  v
Controller
  |
  ├─ Try Block
  |    |
  |    v
  |    Service
  |      |
  |      ├─ ValidationError (SequelizeValidationError)
  |      |       |
  |      |       v
  |      |    ValidationError thrown
  |      |
  |      ├─ Logic Error (User not found, invalid password)
  |      |       |
  |      |       v
  |      |    ClientError or custom error thrown
  |      |
  |      └─ Unexpected Error
  |              |
  |              v
  |           Generic error thrown
  |
  ├─ Catch Block
  |    |
  |    v
  |    Check error.statusCode
  |      |
  |      ├─ statusCode exists ──> Return with that code
  |      |
  |      └─ No statusCode ──> 500 INTERNAL_SERVER_ERROR
  |
  v
Response
{
  message: error.message,
  success: false,
  data: {},
  error: error.explanation || {}
}
```

---

## 9. REQUEST VALIDATION FLOW

```
POST /signup
  |
  v
Middleware: validateUserAuth
  |
  ├─ Check email ──────┐
  ├─ Check password ───┤──> Valid? ──> Next Middleware
  └─ Check roleId ─────┤
                       |
                       └──> Invalid ──> 400 BAD_REQUEST
                            {
                              message: "Please provide required fields",
                              error: "Email, Password and roleId are required"
                            }

POST /login
  |
  v
Middleware: validateUserLogin
  |
  ├─ Check email ─────┐
  └─ Check password ──┤──> Valid? ──> Next Middleware
                      |
                      └──> Invalid ──> 400 BAD_REQUEST
                           {
                             message: "Please provide required fields",
                             error: "Email and Password are required"
                           }
```

---

## 10. PASSWORD HASHING & VERIFICATION FLOW

```
SignUp Process:
  1. User provides password: "MyPassword123"
  2. bcrypt.genSaltSync(10) ──> generates salt
  3. bcrypt.hashSync(password, salt) ──> hashed_password
  4. Store hashed_password in database
  
  Hash Example (never same twice):
    Input:  "MyPassword123"
    Output: "$2b$10$8Qjc3R5L2...abc123...xyz789"
    Output: "$2b$10$7Xy5Pq2M1...def456...uvw012"

Login Process:
  1. User provides password: "MyPassword123"
  2. Database retrieves stored hashed_password
  3. bcrypt.compare(password, hashedPassword)
  4. Returns true if match, false otherwise
  
  Comparison:
    bcrypt.compare("MyPassword123", "$2b$10$8Qjc3R5L2...") ──> true
    bcrypt.compare("WrongPassword", "$2b$10$8Qjc3R5L2...") ──> false
```

---

## 11. JWT TOKEN STRUCTURE

```
Current JWT Token (Access Token):
┌─────────────────────┬──────────────────────┬────────────────────────┐
│      Header         │       Payload        │       Signature        │
├─────────────────────┼──────────────────────┼────────────────────────┤
│ {                   │ {                    │ HMACSHA256(            │
│   "alg": "HS256",   │   "id": 1,           │   base64UrlEncode(     │
│   "typ": "JWT"      │   "email": "user@... │   header) + "." +      │
│ }                   │   "iat": 1692...     │   base64UrlEncode(     │
│                     │   "exp": 1692...     │   payload),            │
│                     │ }                    │   JWT_KEY              │
│                     │                      │ )                      │
└─────────────────────┴──────────────────────┴────────────────────────┘

JWT String:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjkyMDAwMDAwLCJleHAiOjE2OTIwODY0MDB9.SIGNATURE

When verified with JWT_KEY:
  - iat (issued at): timestamp when token was created
  - exp (expiration): timestamp when token expires (24 hours from now)
  - If current time > exp, token is invalid
```

