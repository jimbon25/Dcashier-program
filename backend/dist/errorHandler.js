"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = exports.errorHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("./logger"));
class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        // Operational, trusted error: send message to client
        logger_1.default.error(`[${req.method}] ${req.path} >> StatusCode:: ${err.statusCode}, Message:: ${err.message}`);
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }
    // Programming or other unknown error: don't leak error details
    logger_1.default.error('ERROR 💥', err);
    return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server.'
    });
};
exports.errorHandler = errorHandler;
// Middleware untuk menangani async errors
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
