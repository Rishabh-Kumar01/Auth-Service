# AWS Cognito Integration - Implementation Roadmap

## EXECUTIVE SUMMARY

The Auth Service currently implements a **self-managed JWT authentication** system with local database storage. For AWS Cognito integration, we need to transition from managing passwords and tokens locally to leveraging AWS Cognito's managed authentication service while maintaining backward compatibility with the existing layered architecture (Controller → Service → Repository → Model).

---

## CRITICAL IMPLEMENTATION POINTS FOR COGNITO INTEGRATION

### 1. KEY ARCHITECTURAL CHANGES NEEDED

#### Current State:
- Local JWT token creation and validation
- Password hashing with bcrypt in application
- Role management in local database
- Email verification via custom JWT tokens

#### With Cognito:
- Cognito manages user pool and token generation
- Passwords stored and managed by Cognito
- Cognito user attributes for custom data
- Cognito built-in email verification
- Cognito JWT tokens (with public keys for validation)

---

## 2. FILE-BY-FILE CHANGES

### A. Configuration Changes (`src/config/serverConfig.js`)

**Current:**
```javascript
JWT_KEY: process.env.JWT_KEY,
EMAIL_VERIFY_KEY: process.env.EMAIL_VERIFY_KEY,
```

**Will Need to Add:**
```javascript
AWS_REGION: process.env.AWS_REGION,
COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET, // Web app only
COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
COGNITO_REDIRECT_URI: process.env.COGNITO_REDIRECT_URI,
```

**Impact**: Medium
- Update environment variable loading
- Keep existing JWT_KEY for backward compatibility during migration phase

---

### B. Service Layer (`src/services/user.service.js`)

**Methods to Replace/Add:**

```javascript
// REMOVE or DEPRECATE:
- #createToken()          // Replace with Cognito token flow
- #createEmailToken()     // Cognito handles email verification
- #checkPassword()        // Move to Cognito SignUp/InitiateAuth
- #verifyToken()         // Replace with Cognito JWT verification
- #verifyEmailToken()    // Cognito handles this

// NEW METHODS TO ADD:
- async signUpWithCognito(email, password, roleId)
  // Calls AWS Cognito AdminCreateUser or SignUp API
  // Maps custom attributes (roleId) to Cognito user attributes
  // Creates local user record with cognitoUserId for sync
  
- async logInWithCognito(email, password)
  // Calls AWS Cognito AdminInitiateAuth or InitiateAuth
  // Returns Cognito tokens (IdToken, AccessToken, RefreshToken)
  
- async refreshAccessToken(refreshToken)
  // NEW: Implements token refresh mechanism
  // Calls Cognito InitiateAuth with REFRESH_TOKEN_AUTH flow
  
- async signOutUser(accessToken)
  // NEW: Implements logout with token revocation
  // Calls Cognito AdminUserGlobalSignOut or GlobalSignOut
  
- async verifyIdToken(idToken)
  // NEW: Validates Cognito IdToken
  // Fetches Cognito public keys and verifies signature
  // Returns decoded token payload
  
- async isAuthenticatedWithCognito(accessToken)
  // Replaces current isAuthenticated()
  // Verifies Cognito AccessToken
  // Fetches user data from Cognito and syncs with local database
  
- async handleCognitoCallback(authorizationCode)
  // NEW: For OAuth 2.0 authorization code flow
  // Exchanges code for tokens
  // Creates/updates local user record
```

**Impact**: High
- Core authentication logic changes significantly
- Need to maintain local user table for app-specific data
- Should implement gradual migration (dual-mode support)

---

### C. Repository Layer (`src/repository/user.repository.js`)

**New Database Fields Needed:**

```javascript
// Add to User model migration:
{
  cognitoUserId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true  // Maps to Cognito user
  },
  
  cognitoAttributes: {
    type: DataTypes.JSON,
    allowNull: true  // Store Cognito attributes
  },
  
  lastSyncedWithCognito: {
    type: DataTypes.DATE,
    allowNull: true
  }
}
```

**New Methods to Add:**

```javascript
- async findByCognitoId(cognitoUserId)
  // Retrieve local user by Cognito user ID
  
- async syncWithCognito(cognitoUserId, cognitoUserData)
  // Create or update local user with Cognito data
  // Called after successful Cognito authentication
  
- async updateCognitoAttributes(userId, attributes)
  // Store Cognito attributes in local database for quick access
  
- async getCognitoUserId(localUserId)
  // Retrieve Cognito user ID for local user
```

**Impact**: Medium
- New columns in Users table (migration required)
- New repository methods for Cognito sync
- Existing methods remain compatible

---

### D. Controller Layer (`src/controllers/user.controller.js`)

**Methods to Modify:**

```javascript
// Current implementation:
async signUp(req, res) {
  const user = await userService.signUp({...})
}

// Change to:
async signUp(req, res) {
  // Try Cognito first, fallback to local if Cognito unavailable
  const user = await userService.signUpWithCognito({...})
  // Creates user in Cognito
  // Creates sync record in local database
  // Cognito sends verification email automatically
}

// Current implementation:
async logIn(req, res) {
  const token = await userService.logIn(email, password)
}

// Change to:
async logIn(req, res) {
  // Uses Cognito authentication
  const tokens = await userService.logInWithCognito(email, password)
  // Returns { idToken, accessToken, refreshToken }
  // Also sync user to local database
}

// NEW ENDPOINTS NEEDED:
async refreshToken(req, res)
  // POST /refresh-token
  // Body: { refreshToken }
  // Returns new accessToken and idToken
  
async logOut(req, res)
  // POST /logout
  // Header: x-access-token
  // Calls Cognito GlobalSignOut
  // Invalidates all user sessions

// MODIFY:
async isAuthenticated(req, res) {
  // Change to verify Cognito token instead of custom JWT
  // Still returns user data from local database
}
```

**Impact**: High
- Multiple endpoint changes
- New logout endpoint required
- New refresh token endpoint required
- Response format may change to include all three tokens

---

### E. Routes (`src/routes/v1/index.js`)

**New Routes Needed:**

```javascript
// OAuth Callback Routes
router.get('/oauth/callback', UserController.handleOAuthCallback)

// Token Management
router.post('/refresh-token', UserController.refreshToken)
router.post('/logout', UserController.logOut)

// Keep existing routes but update implementations:
router.post('/signup', AuthRequestValidator.validateUserAuth, UserController.signUp)
router.post('/login', AuthRequestValidator.validateUserLogin, UserController.logIn)
router.get('/isAuthenticated', UserController.isAuthenticated)
```

**Impact**: Low-Medium
- New routes for token refresh and logout
- Existing routes change implementation but maintain endpoints

---

### F. Middleware (`src/middlewares/auth.validator.middleware.js`)

**New Validators Needed:**

```javascript
// New validator for refresh token
const validateTokenRefresh = (req, res, next) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Refresh token required",
      error: "refreshToken field is required"
    })
  }
  next()
}

// New validator for logout
const validateLogout = (req, res, next) => {
  const token = req.headers['x-access-token']
  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Access token required for logout",
      error: "x-access-token header is required"
    })
  }
  next()
}

// Modify to support Cognito attribute validation
const validateUserAuth = (req, res, next) => {
  const { email, password, roleId } = req.body
  // Cognito has built-in email format validation
  // Keep roleId validation for local role management
  if (!email || !password || !roleId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please provide required fields",
      error: "Email, Password and roleId are required"
    })
  }
  next()
}
```

**Impact**: Low
- Add new validators for new endpoints
- Modify existing validators minimally

---

## 3. TOKEN MANAGEMENT STRATEGY

### Current vs. Cognito Token Structure

**Current (Self-Managed JWT):**
```
Single Token: { id, email, iat, exp }
Validation: Local verification with JWT_KEY
Refresh: Not implemented (24-hour fixed expiration)
Revocation: Not implemented
```

**With Cognito:**
```
Three Token System:
  1. IdToken: User identity claims ({ sub, email, cognito:username, custom:roleId })
     - Used for user identification
     - Expires in 1 hour (configurable)
  
  2. AccessToken: Authorization for API calls ({ sub, username, scope })
     - Used for authentication to protected APIs
     - Expires in 1 hour (configurable)
  
  3. RefreshToken: Long-lived token for getting new tokens ({ sub, token_use })
     - Used to get new IdToken and AccessToken
     - Expires in 30 days (configurable)

Validation: Using Cognito public keys (JWKS endpoint)
Refresh: Implemented via /refresh-token endpoint
Revocation: Cognito GlobalSignOut invalidates all tokens
```

### Implementation Approach

```javascript
// Token Response Format:
{
  success: true,
  message: "Login successful",
  data: {
    idToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    expiresIn: 3600,  // Seconds
    tokenType: "Bearer"
  }
}

// Token Transmission:
// 1. Store IdToken and AccessToken in memory/localStorage
// 2. Store RefreshToken in secure httpOnly cookie (recommended)
// 3. Send AccessToken in Authorization header: "Authorization: Bearer {accessToken}"
// 4. Keep x-access-token header for backward compatibility during migration
```

---

## 4. MIGRATION STRATEGY (DUAL-MODE)

### Phase 1: Parallel System (Weeks 1-2)
```
- Add Cognito libraries to package.json
- Create new CognitoAuthService class
- Keep existing UserService intact
- Add feature flags:
  if (USE_COGNITO) {
    // Use Cognito flow
  } else {
    // Use existing JWT flow
  }
- Test both flows independently
```

### Phase 2: Route Modifications (Week 3)
```
- Update controllers to support both auth systems
- Add new token refresh endpoint
- Add logout endpoint with Cognito support
- Implement local user sync from Cognito
- Maintain backward compatibility with existing clients
```

### Phase 3: Database Migration (Week 4)
```
- Create migration to add cognitoUserId columns
- Populate cognitoUserId for existing users (optional during migration)
- Update repository to handle both types of users
```

### Phase 4: Gradual Rollout (Weeks 5-8)
```
- Roll out Cognito to 10% of users
- Monitor and fix issues
- Gradually increase to 100%
- Deprecate old JWT system after all users migrated
```

---

## 5. DATABASE MIGRATION SCRIPT EXAMPLE

```javascript
// src/migrations/[timestamp]-add-cognito-fields.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'cognitoUserId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
    
    await queryInterface.addColumn('Users', 'cognitoAttributes', {
      type: Sequelize.JSON,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'lastSyncedWithCognito', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'cognitoUserId');
    await queryInterface.removeColumn('Users', 'cognitoAttributes');
    await queryInterface.removeColumn('Users', 'lastSyncedWithCognito');
  }
};
```

---

## 6. ENVIRONMENT VARIABLES NEEDED

```bash
# AWS Cognito Configuration
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_abcdef123
COGNITO_CLIENT_ID=7abcdefghijklmnopqrstu
COGNITO_CLIENT_SECRET=your_client_secret_if_web_app
COGNITO_DOMAIN=your-domain-name

# OAuth Redirect
COGNITO_REDIRECT_URI=http://localhost:3000/api/v1/oauth/callback

# Feature Flags
USE_COGNITO=true
COGNITO_FALLBACK_TO_LOCAL=false  # After migration, set to false

# Keep existing for backward compatibility
JWT_KEY=your_existing_jwt_key
```

---

## 7. ERROR HANDLING UPDATES

### New Error Scenarios with Cognito:

```javascript
// Cognito-specific error handling
const handleCognitoError = (error) => {
  switch(error.code) {
    case 'UserAlreadyExistsException':
      return {
        statusCode: StatusCodes.CONFLICT,
        message: 'Email already registered'
      }
    
    case 'NotAuthorizedException':
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Invalid email or password'
      }
    
    case 'UserNotConfirmedException':
      return {
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Please verify your email first'
      }
    
    case 'InvalidPasswordException':
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Password does not meet requirements'
      }
    
    case 'TokenExpiredException':
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Token has expired, please refresh'
      }
    
    case 'NotAuthorizedException':
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Invalid or expired token'
      }
    
    default:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'Authentication service error'
      }
  }
}
```

---

## 8. SECURITY CONSIDERATIONS

### Changes in Security Model:

```
Current (Self-Managed):
  - Password hashing: bcrypt (synchronous)
  - Key storage: Environment variables (exposed to app)
  - Token validation: Local verification
  - Compromise risk: High (full auth system in app)

With Cognito:
  - Password management: AWS-managed (PBKDF2, Argon2)
  - Key storage: AWS KMS-managed
  - Token validation: Cognito public keys (downloadable)
  - Compromise risk: Low (serverless auth system)
```

### Required Security Updates:

```javascript
1. Token Validation (New):
   - Download Cognito public keys from JWKS endpoint
   - Cache and refresh periodically
   - Verify RS256 signature (not HS256)

2. Refresh Token Handling:
   - Store in httpOnly cookie (not localStorage)
   - Include SameSite=Strict attribute
   - Implement token rotation

3. MFA Support:
   - Cognito handles TOTP/SMS
   - Adapt service layer for MFA flow
   - Add MFA verification endpoint

4. Compliance:
   - Cognito complies with HIPAA, PCI DSS, SOC 2
   - Audit logging via CloudTrail
   - Data residency by region
```

---

## 9. TESTING STRATEGY

### Unit Tests to Update:
```
- userService.signUp() → signUpWithCognito()
- userService.logIn() → logInWithCognito()
- userService.isAuthenticated() → new token verification
- Add tests for token refresh
- Add tests for logout/revocation
- Add tests for Cognito error handling
```

### Integration Tests to Add:
```
- Full OAuth flow with Cognito
- Token refresh mechanism
- Multi-device session management
- Concurrent login handling
- Token expiration handling
- Cognito to local database sync
```

### E2E Tests to Update:
```
- Sign up → email verification → login flow
- Forgot password flow (Cognito)
- Change password flow (Cognito)
- Multi-device logout (Cognito GlobalSignOut)
```

---

## 10. COST CONSIDERATIONS

### AWS Cognito Pricing:
```
- Monthly Active Users (MAU): $0.015 per MAU
- Advanced Security Features: $0.05 per MAU
- SMS/OTP: Additional charges

Example for 10,000 MAU: $150/month
```

### Benefits vs. Self-Managed:
```
Cognito Provides:
  - 99.9% SLA
  - Automatic security patches
  - Built-in compliance (HIPAA, PCI)
  - Built-in MFA/2FA
  - Password strength enforcement
  - Account recovery flows
  - User activity logging
  - No operational overhead
```

---

## SUMMARY OF KEY FILES TO MODIFY

| File | Changes | Priority | Effort |
|------|---------|----------|--------|
| package.json | Add @aws-sdk/client-cognito | High | Low |
| serverConfig.js | Add Cognito env vars | High | Low |
| user.service.js | Add Cognito methods | High | High |
| user.repository.js | Add cognitoUserId, sync methods | High | Medium |
| user.controller.js | Update auth methods, add refresh/logout | High | High |
| auth.validator.middleware.js | Add new validators | Medium | Low |
| routes/v1/index.js | Add new endpoints | Medium | Low |
| user.js model | Add cognitoUserId, cognitoAttributes | Medium | Low |
| New migration | Add Cognito columns | High | Low |

---

## ESTIMATED TIMELINE

- **Phase 1 (Setup)**: 2-3 days
- **Phase 2 (Implementation)**: 5-7 days
- **Phase 3 (Testing)**: 3-5 days
- **Phase 4 (Deployment)**: 7-14 days
- **Total**: 3-4 weeks

