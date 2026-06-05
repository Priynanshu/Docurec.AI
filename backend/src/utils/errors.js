class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class AIError extends AppError {
  constructor(message = 'AI processing failed') {
    super(message, 503, 'AI_ERROR');
  }
}

class OCRError extends AppError {
  constructor(message = 'OCR processing failed') {
    super(message, 422, 'OCR_ERROR');
  }
}

class StorageError extends AppError {
  constructor(message = 'File storage failed') {
    super(message, 500, 'STORAGE_ERROR');
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  AIError,
  OCRError,
  StorageError,
};
