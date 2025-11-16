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
      const params = {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        SecretHash: generateSecretHash(email),
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

      const command = new SignUpCommand(params);
      const response = await cognitoClient.send(command);

      return {
        success: true,
        userSub: response.UserSub,
        userConfirmed: response.UserConfirmed,
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error) {
      console.error("Cognito SignUp Error:", error);
      throw {
        success: false,
        error: error.name,
        message: error.message,
      };
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
      const params = {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
        SecretHash: generateSecretHash(email),
      };

      const command = new ConfirmSignUpCommand(params);
      await cognitoClient.send(command);

      return {
        success: true,
        message: "User confirmed successfully",
      };
    } catch (error) {
      console.error("Cognito ConfirmSignUp Error:", error);
      throw {
        success: false,
        error: error.name,
        message: error.message,
      };
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
      const params = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: generateSecretHash(email),
        },
      };

      const command = new InitiateAuthCommand(params);
      const response = await cognitoClient.send(command);

      if (response.ChallengeName) {
        return {
          success: true,
          challengeName: response.ChallengeName,
          session: response.Session,
          challengeParameters: response.ChallengeParameters,
        };
      }

      return {
        success: true,
        accessToken: response.AuthenticationResult.AccessToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        idToken: response.AuthenticationResult.IdToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
      };
    } catch (error) {
      console.error("Cognito SignIn Error:", error);
      throw {
        success: false,
        error: error.name,
        message: error.message,
      };
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
      const params = {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          SECRET_HASH: generateSecretHash(email),
        },
      };

      const command = new InitiateAuthCommand(params);
      const response = await cognitoClient.send(command);

      return {
        success: true,
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
      };
    } catch (error) {
      console.error("Cognito RefreshToken Error:", error);
      throw {
        success: false,
        error: error.name,
        message: error.message,
      };
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
      console.error("Cognito SignOut Error:", error);
      throw {
        success: false,
        error: error.name,
        message: error.message,
      };
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

      return {
        success: true,
        username: response.Username,
        userAttributes: response.UserAttributes.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error("Cognito GetUser Error:", error);
      throw {
        success: false,
        error: error.name,
        message: error.message,
      };
    }
  }

  /**
   * Initiate forgot password flow
   * @param {string} email - User email
   * @returns {Promise<object>} Forgot password result
   */
  async forgotPassword(email) {
    try {
      const params = {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        SecretHash: generateSecretHash(email),
      };

      const command = new ForgotPasswordCommand(params);
      const response = await cognitoClient.send(command);

      return {
        success: true,
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error) {
      console.error("Cognito ForgotPassword Error:", error);
      throw {
        success: false,
        error: error.name,
        message: error.message,
      };
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
      const params = {
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
        SecretHash: generateSecretHash(email),
      };

      const command = new ConfirmForgotPasswordCommand(params);
      await cognitoClient.send(command);

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Cognito ConfirmForgotPassword Error:", error);
      throw {
        success: false,
        error: error.name,
        message: error.message,
      };
    }
  }
}

module.exports = new CognitoService();
