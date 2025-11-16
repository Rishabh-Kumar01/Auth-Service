# Auth Service Codebase Exploration - Executive Summary

## Quick Overview

The Auth Service is a **microservice** built with **Express.js + Sequelize + MySQL** that currently implements **self-managed JWT authentication**. The service is ready for AWS Cognito integration but requires significant changes to the authentication layer while maintaining the existing layered architecture (Controller → Service → Repository → Model).

---

## Critical Facts About Current Authentication

### What Works Now
- User registration with email verification
- Password-based login returning JWT tokens (24-hour expiration)
- Token validation via custom JWT verification
- Role-based access control (RBAC) with User-Role many-to-many relationships
- Message queue integration (RabbitMQ) for sending verification emails
- Password hashing with bcrypt

### What's Missing
- Token refresh mechanism
- Token revocation/logout functionality
- Multi-device session management
- MFA/2FA support
- Account recovery flows
- AWS integration

---

## Current Architecture at a Glance

```
HTTP Request
    ↓
Routes (src/routes/v1/index.js)
    ↓
Controllers (src/controllers/user.controller.js)
    ↓
Services (src/services/user.service.js)
    ↓
Repository (src/repository/user.repository.js)
    ↓
Sequelize Models (src/models/)
    ↓
MySQL Database
```

### Current Authentication Flow

```
Sign Up → Repository.signUp() → Password hashed with bcrypt
                ↓
       Service.createEmailToken() → JWT (1-hour expiry)
                ↓
       RabbitMQ → Email verification sent
                ↓
              Response with user object

Login → Service.logIn() → Email & password validated
              ↓
       Service.createToken() → JWT (24-hour expiry)
              ↓
           Response with token

Authenticate → Service.isAuthenticated() → jwt.verify(token)
                    ↓
         Repository.findById() → Return user
```

---

## Key Files & Their Roles

| File | Purpose | Key Methods | Critical? |
|------|---------|-------------|-----------|
| `user.controller.js` | HTTP handlers | signUp, logIn, isAuthenticated, verifyEmail | YES |
| `user.service.js` | Business logic | #createToken, logIn, signUp, isAuthenticated | YES |
| `user.repository.js` | Database ops | signUp, findByEmail, updateStatus | YES |
| `serverConfig.js` | Config/env vars | Loads JWT_KEY, EMAIL_VERIFY_KEY | YES |
| `auth.validator.middleware.js` | Input validation | validateUserAuth, validateUserLogin | NO |
| `messageQueue.util.js` | RabbitMQ integration | publishMessage, subscribeMessage | NO |
| `user.js` (model) | Database schema | User fields, password hashing hook | YES |

---

## Current Dependencies & Libraries

### Authentication & Security
- **jsonwebtoken** (^9.0.2) - JWT creation/verification
- **bcrypt** (^5.1.1) - Password hashing
- **nodemailer** (^6.9.14) - Email sending

### Database
- **sequelize** (^6.37.3) - ORM
- **mysql2** (^3.10.1) - MySQL driver

### Infrastructure
- **express** (^4.18.2) - Web framework
- **amqplib** (^0.10.4) - RabbitMQ client
- **helmet** (^7.0.0) - Security headers
- **cors** (^2.8.5) - CORS handling

### Missing for AWS Cognito
- **@aws-sdk/client-cognito-identity-provider** - NOT installed

---

## Environment Variables Currently Used

```bash
PORT                        # Server port
JWT_KEY                     # JWT signing key
EMAIL_VERIFY_KEY           # Email token signing key
USER, PASS, SERVICE        # Nodemailer config
CLIENT_ID, CLIENT_SECRET   # Google OAuth (unused)
REDIRECT_URI, REFRESH_TOKEN # OAuth config (unused)
DB_SYNC                    # Auto DB sync flag
MESSAGE_BROKER_URL         # RabbitMQ connection
REMINDER_BINDING_KEY       # RabbitMQ binding
EXCHANGE_NAME              # RabbitMQ exchange
```

---

## Critical Implementation Details

### Token Handling
- **Type**: Single JWT token
- **Algorithm**: HS256 (symmetric)
- **Key**: Stored in environment variable (potential security risk)
- **Expiration**: Hardcoded 24 hours
- **Payload**: `{ id, email, iat, exp }`
- **Transmission**: Via `x-access-token` header

### Password Management
- **Hashing**: bcrypt with salt factor 10
- **Storage**: Salted hash in MySQL
- **Validation**: bcrypt.compare() on each login

### User Model
```javascript
{
  id: INTEGER (auto-increment, PK)
  email: STRING (unique, validated)
  password: STRING (bcrypt hashed)
  verified: BOOLEAN (email verification status)
  createdAt, updatedAt: DATETIME
}
```

### Relationships
```
User (many) ←→ (many) Role
         via
    User_Roles (junction table)
```

---

## What Changes When Integrating AWS Cognito

### Authentication Flow Changes
```
CURRENT:                          WITH COGNITO:
User → App JWT → Verify locally   User → Cognito → OAuth2 tokens
      ↓                                  ↓
  Local verify                    Remote verify (Cognito)
      ↓                                  ↓
Return user data             Return IdToken + AccessToken + RefreshToken
```

### Service Layer (Biggest Changes)
- Replace `#createToken()` with Cognito SignUp/InitiateAuth
- Remove `#checkPassword()` (Cognito handles this)
- Add `logInWithCognito()`, `refreshAccessToken()`, `signOutUser()`
- Add token verification with Cognito public keys
- Implement local user sync from Cognito

### Repository Layer (Medium Changes)
- Add `cognitoUserId`, `cognitoAttributes`, `lastSyncedWithCognito` columns
- Add `syncWithCognito()` method
- Keep existing methods for local user management

### Controller Layer (Medium Changes)
- Update signUp() to use Cognito
- Update logIn() to use Cognito
- Add refreshToken() endpoint
- Add logOut() endpoint

### New Infrastructure Needed
- AWS SDK for Cognito
- Token refresh mechanism
- Logout/token revocation
- Cognito public key validation
- OAuth2 callback handling

---

## Files That MUST Be Changed for Cognito

1. **CRITICAL (Do First)**:
   - `serverConfig.js` - Add Cognito config vars
   - `user.service.js` - Implement Cognito methods
   - `user.controller.js` - Update endpoints
   - `package.json` - Add AWS SDK

2. **HIGH PRIORITY**:
   - `user.repository.js` - Add Cognito sync
   - Create new migration for cognitoUserId
   - `routes/v1/index.js` - Add refresh/logout routes

3. **MEDIUM PRIORITY**:
   - `auth.validator.middleware.js` - New validators
   - `user.js` model - Add new fields
   - Error handling (new Cognito error types)

4. **LOW PRIORITY**:
   - Docs/tests - Update for new flows
   - Config files - AWS credentials setup

---

## Migration Strategy Recommendation

### Phase 1: Setup (Days 1-3)
- Add `@aws-sdk/client-cognito-identity-provider` to package.json
- Create CognitoAuthService class (parallel to UserService)
- Add Cognito config variables to serverConfig.js
- Keep existing JWT system operational

### Phase 2: Implementation (Days 4-10)
- Update UserService with Cognito methods
- Add new controller methods (refresh, logout)
- Create migration for cognitoUserId column
- Implement feature flag (USE_COGNITO) for gradual rollout

### Phase 3: Testing (Days 11-15)
- Unit tests for Cognito flows
- Integration tests with actual Cognito pool
- Load testing with refresh tokens
- Error scenario testing

### Phase 4: Gradual Rollout (Days 16-30)
- Start with 10% of traffic using Cognito
- Monitor errors and performance
- Gradually increase Cognito usage
- Deprecate old JWT system once 100% migrated

---

## Cognito Token Structure (What Will Change)

### Current (Single Token)
```
Header:   { alg: "HS256", typ: "JWT" }
Payload:  { id, email, iat, exp }
Signature: HMACSHA256(header.payload, JWT_KEY)
```

### With Cognito (Three Tokens)
```
IdToken:     { sub, email, cognito:username, aud, token_use, auth_time, iss, ... }
AccessToken: { sub, username, scope, auth_time, iss, exp, iat, ... }
RefreshToken: { token_use: "refresh_token", sub, iat, exp, ... }

Algorithm: RS256 (asymmetric) - more secure
Keys: AWS KMS managed
Signature verification: Using public keys from Cognito JWKS endpoint
```

---

## Database Changes Required

### New Columns for Users Table
```sql
ALTER TABLE Users ADD COLUMN cognitoUserId VARCHAR(255) UNIQUE;
ALTER TABLE Users ADD COLUMN cognitoAttributes JSON;
ALTER TABLE Users ADD COLUMN lastSyncedWithCognito DATETIME;
```

### New Indexes
```sql
CREATE UNIQUE INDEX idx_cognito_user_id ON Users(cognitoUserId);
```

---

## New API Endpoints Needed

```
POST /refresh-token
  Body: { refreshToken: "..." }
  Response: { idToken, accessToken, expiresIn }

POST /logout
  Header: x-access-token: "..."
  Response: { success: true }

GET /oauth/callback
  Query: { code: "authorization_code" }
  Response: { idToken, accessToken, refreshToken }
```

---

## Security Improvements with Cognito

| Aspect | Current | With Cognito |
|--------|---------|--------------|
| Password Management | App manages (bcrypt) | AWS manages (PBKDF2/Argon2) |
| Key Storage | Environment variables | AWS KMS |
| Token Validation | Local verification | Cognito public keys |
| Token Refresh | Not implemented | Built-in support |
| MFA/2FA | Not supported | Built-in support |
| Account Recovery | Manual | Automated flows |
| Compliance | Manual compliance | HIPAA/PCI DSS compliant |
| Compromise Risk | HIGH | LOW |

---

## Cost Impact

**Current**: Free (self-managed)
**With Cognito**: ~$0.015 per Monthly Active User
- 1,000 MAU = $15/month
- 10,000 MAU = $150/month
- 100,000 MAU = $1,500/month

**Benefits**: 99.9% SLA, no operational overhead, automatic security patches

---

## Key Recommendations

1. **Keep Local User Table**: Don't remove it - use for app-specific metadata
2. **Implement Dual-Mode**: Feature flags allow gradual migration
3. **Use httpOnly Cookies**: Store refresh tokens securely
4. **Implement Token Rotation**: For better security
5. **Add MFA Support**: Easy to implement with Cognito
6. **Monitor Cognito Logs**: Use CloudTrail for audit trails
7. **Plan for Regional Failover**: Cognito is highly available but test failover

---

## Estimated Timeline to Complete

- **Planning & Setup**: 2-3 days
- **Core Implementation**: 5-7 days
- **Testing & QA**: 3-5 days
- **Gradual Rollout**: 1-2 weeks
- **Total**: 3-4 weeks (aggressive) to 6-8 weeks (conservative)

---

## Next Steps

1. Review AWS Cognito documentation
2. Create AWS Cognito User Pool
3. Get AWS credentials ready
4. Create new branch for Cognito changes
5. Start with Phase 1 setup
6. Set up feature flags and configuration
7. Implement Cognito service layer
8. Write comprehensive tests
9. Deploy to staging for testing
10. Plan gradual rollout to production

