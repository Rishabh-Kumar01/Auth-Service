# Welcome to Auth Service

## GitHub repository links for the other services in this microservice architecture and API Gateway:

- Airline API Gateway -
  [Github Repository Link](https://github.com/Rishabh-Kumar01/Airline-API-Gateway)
- Flight and Search Service -
  [GitHub Repository Link](https://github.com/Rishabh-Kumar01/FlightsAndSerachService)
- Reminder Service -
  [GitHub Repository Link](https://github.com/Rishabh-Kumar01/Reminder-Service)
- Booking Service -
  [GitHub Repository Link](https://github.com/Rishabh-Kumar01/BookingService)

## Project Setup

- Clone the project on your local
- Execute `npm install` on the same path as of your root directory of the
  downlaoded project
- Create a `.env` file in the root directory and add the following environment
  variable
  - `PORT=3000`
- Inside the `src/config` folder create a new file `config.json` and then add
  the following piece of json

```
{
  "development": {
    "username": "YOUR_DB_LOGIN_NAME",
    "password": "YOUR_DB_PASSWORD",
    "database": "AUTH_DB_DEV",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

- Once you've added your db config as listed above, go to the src folder from
  you terminal and execute `npx sequelize db:create`

## DB Design

- User Table
- Role Table

- A User can have multiple roles and a role can be assigned to multiple users.

## Tables

### Users -> id, email, password, createdAt, updatedAt

```
npx sequelize model:generate --name User --attributes name:String,password:String
```

### Roles -> id, name, createdAt, updatedAt

```
npx sequelize model:generate --Role City --attributes name:String
```

- To map user roles, we need to create a new User_Roles table. To achieve this,
  we synchronize the `Users` and `Roles` tables, as they have a many-to-many
  relationship using Sequelize.

### User_Roles -> RoleId, UserId , createdAt, updatedAt

```
await db.sequelize.sync({ alter: true }); // Inside the server.js file
```

## AWS Cognito Integration

This service now supports AWS Cognito for authentication with token management via HTTP-only cookies.

### Features

- User registration with email verification
- Secure authentication with AWS Cognito
- Access tokens and refresh tokens stored in HTTP-only cookies
- Automatic token refresh
- Password reset functionality
- Global sign-out capability

### AWS Cognito Setup

#### 1. Create a Cognito User Pool

1. Log in to AWS Console and navigate to Amazon Cognito
2. Click "Create user pool"
3. Configure sign-in experience:
   - Select "Email" as the sign-in option
   - Choose "User name" options as needed
4. Configure security requirements:
   - Set password policy (minimum length, character requirements)
   - Enable MFA if desired (optional)
5. Configure sign-up experience:
   - Choose "Allow Cognito to automatically send messages to verify and confirm"
   - Select "Send email message, verify email address"
6. Configure message delivery:
   - Choose "Send email with Cognito" (for testing) or configure SES
7. Integrate your app:
   - Enter a User Pool name (e.g., "AuthServiceUserPool")
   - Configure app client:
     - App client name (e.g., "auth-service-client")
     - **IMPORTANT**: Enable "ALLOW_USER_PASSWORD_AUTH" in Authentication flows
     - **IMPORTANT**: Enable "ALLOW_REFRESH_TOKEN_AUTH" in Authentication flows
     - Generate a client secret (required for this implementation)
8. Review and create

#### 2. Configure App Client

After creating the user pool:

1. Go to your User Pool → App integration → App clients
2. Select your app client
3. Under "Authentication flows", ensure these are enabled:
   - `ALLOW_USER_PASSWORD_AUTH`
   - `ALLOW_REFRESH_TOKEN_AUTH`
   - `ALLOW_CUSTOM_AUTH` (optional)
4. Note down:
   - User Pool ID (found in User Pool → General settings)
   - App Client ID
   - App Client Secret (if generated)
   - AWS Region

#### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your AWS Cognito credentials:

```bash
# AWS Cognito Configuration
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-app-client-id
COGNITO_CLIENT_SECRET=your-app-client-secret

# Cookie Configuration
COOKIE_SECRET=your-secure-random-string-for-signing-cookies
COOKIE_MAX_AGE=604800000
CORS_ORIGIN=http://localhost:3000
```

### API Endpoints

#### Cognito Authentication Endpoints

All Cognito endpoints are prefixed with `/api/v1/cognito`

##### 1. Sign Up
```http
POST /api/v1/cognito/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

##### 2. Confirm Sign Up
```http
POST /api/v1/cognito/confirm-signup
Content-Type: application/json

{
  "email": "user@example.com",
  "confirmationCode": "123456"
}
```

##### 3. Login
```http
POST /api/v1/cognito/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
**Response**: Sets HTTP-only cookies with access token, refresh token, and ID token.

##### 4. Refresh Token
```http
POST /api/v1/cognito/refresh-token
```
**Note**: Uses refresh token from cookies automatically.

##### 5. Logout
```http
POST /api/v1/cognito/logout
```
**Response**: Clears all authentication cookies.

##### 6. Check Authentication
```http
GET /api/v1/cognito/isAuthenticated
```
**Note**: Uses access token from cookies automatically.

##### 7. Forgot Password
```http
POST /api/v1/cognito/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

##### 8. Confirm Forgot Password
```http
POST /api/v1/cognito/confirm-forgot-password
Content-Type: application/json

{
  "email": "user@example.com",
  "confirmationCode": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

### Cookie-Based Authentication

The service uses HTTP-only cookies for storing tokens, which provides better security compared to storing tokens in localStorage:

**Security Benefits:**
- HTTP-only cookies cannot be accessed by JavaScript (XSS protection)
- Secure flag ensures cookies are only sent over HTTPS in production
- SameSite=strict prevents CSRF attacks
- Automatic token management (no manual header setting required)

**Cookies Set:**
- `accessToken`: Short-lived token for API authentication (default: 7 days)
- `refreshToken`: Long-lived token for refreshing access tokens (30 days)
- `idToken`: Contains user claims
- `userEmail`: User's email (needed for refresh token flow)

### Testing the Integration

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in your AWS Cognito credentials

3. **Run the server**:
   ```bash
   npm start
   ```

4. **Test the endpoints**:
   - Use Postman or curl to test the API endpoints
   - Ensure cookies are enabled in your HTTP client
   - For CORS requests from frontend, set `CORS_ORIGIN` to your frontend URL

### Migration from JWT to Cognito

Both authentication systems (legacy JWT and Cognito) are available:

- **Legacy endpoints**: `/api/v1/signup`, `/api/v1/login` (JWT-based)
- **Cognito endpoints**: `/api/v1/cognito/signup`, `/api/v1/cognito/login` (Cognito-based)

You can migrate gradually by:
1. Testing Cognito endpoints with new users
2. Updating frontend to use new endpoints
3. Migrating existing users (if needed)
4. Deprecating old endpoints when ready

### Troubleshooting

**Issue**: "User is not confirmed" error during login
- **Solution**: Make sure to call the confirm-signup endpoint with the verification code sent to the user's email

**Issue**: "Invalid refresh token" error
- **Solution**: User needs to log in again; refresh token may have expired (default: 30 days)

**Issue**: CORS errors from frontend
- **Solution**: Set `CORS_ORIGIN` in `.env` to your frontend URL and ensure `credentials: true` in your frontend fetch/axios configuration

**Issue**: Cookies not being set
- **Solution**: In production, ensure you're using HTTPS; in development, cookies should work with HTTP localhost
