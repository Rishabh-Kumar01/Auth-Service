/**
 * Custom API Error class for standardized error handling
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Create an API Error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {object|null} explanation - Additional error details
   */
  constructor(message, statusCode = 500, explanation = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.explanation = explanation;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Convert error to JSON response format
   * @returns {object} Formatted error response
   */
  toJSON() {
    return {
      message: this.message,
      success: false,
      data: {},
      error: this.explanation || {},
    };
  }
}

/**
 * Sanitize error for logging - removes sensitive data
 * @param {Error} error - Error object to sanitize
 * @returns {object} Sanitized error object safe for logging
 */
function sanitizeErrorForLogging(error) {
  const sanitized = {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode || 500,
  };

  // Never log tokens, secrets, or passwords
  if (error.stack && process.env.NODE_ENV !== 'production') {
    sanitized.stack = error.stack;
  }

  return sanitized;
}

module.exports = {
  ApiError,
  sanitizeErrorForLogging,
};
