export class ValidationError extends Error {
  constructor(
    public statusCode: number = 400,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends Error {
  constructor(
    public statusCode: number = 401,
    message: string = 'Authentication failed'
  ) {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends Error {
  constructor(
    public statusCode: number = 403,
    message: string = 'Unauthorized access'
  ) {
    super(message);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class DatabaseError extends Error {
  constructor(
    public statusCode: number = 500,
    message: string = 'Database operation failed'
  ) {
    super(message);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class NotFoundError extends Error {
  constructor(
    public statusCode: number = 404,
    message: string = 'Resource not found'
  ) {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
