"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = exports.DatabaseError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(statusCode = 400, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends Error {
    constructor(statusCode = 401, message = 'Authentication failed') {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends Error {
    constructor(statusCode = 403, message = 'Unauthorized access') {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthorizationError';
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}
exports.AuthorizationError = AuthorizationError;
class DatabaseError extends Error {
    constructor(statusCode = 500, message = 'Database operation failed') {
        super(message);
        this.statusCode = statusCode;
        this.name = 'DatabaseError';
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}
exports.DatabaseError = DatabaseError;
class NotFoundError extends Error {
    constructor(statusCode = 404, message = 'Resource not found') {
        super(message);
        this.statusCode = statusCode;
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
