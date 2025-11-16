const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  AdminInitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const crypto = require("crypto");
const {
  AWS_REGION,
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
} = require("../config/serverConfig");
const { ApiError, sanitizeErrorForLogging } = require("../utils/apiError.util");

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION,
});

// Helper function to generate SECRET_HASH
function generateSecretHash(username) {
  if (!COGNITO_CLIENT_SECRET) {
    return undefined;
  }
  return crypto
    .createHmac("SHA256", COGNITO_CLIENT_SECRET)
    .update(username + COGNITO_CLIENT_ID)
    .digest("base64");
}

// Helper to conditionally add SecretHash to params
function addSecretHashIfAvailable(params, username) {
  const secretHash = generateSecretHash(username);
  if (secretHash) {
    params.SecretHash = secretHash;
  }
  return params;
}

class CognitoService {
  /**
   * Sign up a new user in Cognito
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {object} attributes - Additional user attributes
   * @returns {Promise<object>} Signup result
   */
  async signUp(email, password, attributes = {}) {
    try {
      let params = {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: "email",
            Value: email,
          },
          ...Object.entries(attributes).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        ],
      };

      // Conditionally add SecretHash only if client secret is configured
      params = addSecretHashIfAvailable(params, email);

      const command = new SignUpCommand(params);
      const response = await cognitoClient.send(command);

      return {
        success: true,
        userSub: response.UserSub,
        userConfirmed: response.UserConfirmed || false,
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error) {
      console.error("Cognito SignUp Error:", sanitizeErrorForLogging(error));
      throw new ApiError(
        error.message || "Sign up failed",
        400,
        { errorType: error.name }
      );
    }
  }

  /**
   * Confirm user sign up with verification code
   * @param {string} email - User email
   * @param {string} confirmationCode - Verification code
   * @returns {Promise<object>} Confirmation result
   */
  async confirmSignUp(email, confirmationCode) {
    try {
      let params = {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
      };

      // Conditionally add SecretHash
      params = addSecretHashIfAvailable(params, email);

      const command = new ConfirmSignUpCommand(params);
      await cognitoClient.send(command);

      return {
        success: true,
        message: "User confirmed successfully",
      };
    } catch (error) {
      console.error("Cognito ConfirmSignUp Error:", sanitizeErrorForLogging(error));
      throw new ApiError(
        error.message || "Confirmation failed",
        400,
        { errorType: error.name }
      );
    }
  }

  /**
   * Sign in user and get tokens
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Authentication result with tokens
   */
  async signIn(email, password) {
    try {
      const authParameters = {
        USERNAME: email,
        PASSWORD: password,
      };

      // Conditionally add SECRET_HASH to AuthParameters
      const secretHash = generateSecretHash(email);
      if (secretHash) {
        authParameters.SECRET_HASH = secretHash;
      }

      const params = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: authParameters,
      };

      const command = new InitiateAuthCommand(params);
      const response = await cognitoClient.send(command);

      // Handle challenge flows (MFA, password change, etc.)
      if (response.ChallengeName) {
        return {
          success: true,
          challengeName: response.ChallengeName,
          session: response.Session,
          challengeParameters: response.ChallengeParameters || {},
        };
      }

      // Guard against missing AuthenticationResult
      if (!response.AuthenticationResult) {
        throw new ApiError("Authentication failed - no tokens received", 401);
      }

      return {
        success: true,
        accessToken: response.AuthenticationResult.AccessToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        idToken: response.AuthenticationResult.IdToken,
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
      };
    } catch (error) {
      console.error("Cognito SignIn Error:", sanitizeErrorForLogging(error));
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error.message || "Authentication failed",
        401,
        { errorType: error.name }
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @param {string} email - User email (needed for SECRET_HASH)
   * @returns {Promise<object>} New tokens
   */
  async refreshToken(refreshToken, email) {
    try {
      const authParameters = {
        REFRESH_TOKEN: refreshToken,
      };

      // Conditionally add SECRET_HASH
      const secretHash = generateSecretHash(email);
      if (secretHash) {
        authParameters.SECRET_HASH = secretHash;
      }

      const params = {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: authParameters,
      };

      const command = new InitiateAuthCommand(params);
      const response = await cognitoClient.send(command);

      // Guard against missing AuthenticationResult
      if (!response.AuthenticationResult) {
        throw new ApiError("Token refresh failed - no tokens received", 401);
      }

      return {
        success: true,
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
      };
    } catch (error) {
      console.error("Cognito RefreshToken Error:", sanitizeErrorForLogging(error));
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error.message || "Token refresh failed",
        401,
        { errorType: error.name }
      );
    }
  }

  /**
   * Sign out user globally (invalidate all tokens)
   * @param {string} accessToken - User's access token
   * @returns {Promise<object>} Sign out result
   */
  async signOut(accessToken) {
    try {
      const params = {
        AccessToken: accessToken,
      };

      const command = new GlobalSignOutCommand(params);
      await cognitoClient.send(command);

      return {
        success: true,
        message: "User signed out successfully",
      };
    } catch (error) {
      console.error("Cognito SignOut Error:", sanitizeErrorForLogging(error));
      throw new ApiError(
        error.message || "Sign out failed",
        400,
        { errorType: error.name }
      );
    }
  }

  /**
   * Get user details from access token
   * @param {string} accessToken - User's access token
   * @returns {Promise<object>} User details
   */
  async getUser(accessToken) {
    try {
      const params = {
        AccessToken: accessToken,
      };

      const command = new GetUserCommand(params);
      const response = await cognitoClient.send(command);

      // Guard against missing UserAttributes
      const userAttributes = (response.UserAttributes || []).reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {});

      return {
        success: true,
        username: response.Username,
        userAttributes,
      };
    } catch (error) {
      console.error("Cognito GetUser Error:", sanitizeErrorForLogging(error));
      throw new ApiError(
        error.message || "Failed to get user details",
        401,
        { errorType: error.name }
      );
    }
  }

  /**
   * Initiate forgot password flow
   * @param {string} email - User email
   * @returns {Promise<object>} Forgot password result
   */
  async forgotPassword(email) {
    try {
      let params = {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
      };

      // Conditionally add SecretHash
      params = addSecretHashIfAvailable(params, email);

      const command = new ForgotPasswordCommand(params);
      const response = await cognitoClient.send(command);

      return {
        success: true,
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error) {
      console.error("Cognito ForgotPassword Error:", sanitizeErrorForLogging(error));
      throw new ApiError(
        error.message || "Failed to initiate password reset",
        400,
        { errorType: error.name }
      );
    }
  }

  /**
   * Confirm forgot password with verification code
   * @param {string} email - User email
   * @param {string} confirmationCode - Verification code
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Confirmation result
   */
  async confirmForgotPassword(email, confirmationCode, newPassword) {
    try {
      let params = {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      };

      // Conditionally add SecretHash
      params = addSecretHashIfAvailable(params, email);

      const command = new ConfirmForgotPasswordCommand(params);
      await cognitoClient.send(command);

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Cognito ConfirmForgotPassword Error:", sanitizeErrorForLogging(error));
      throw new ApiError(
        error.message || "Failed to reset password",
        400,
        { errorType: error.name }
      );
    }
  }
}

module.exports = new CognitoService();
