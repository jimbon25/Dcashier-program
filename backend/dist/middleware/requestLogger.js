"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = __importDefault(require("../logger"));
// Custom token untuk response time dalam ms
morgan_1.default.token('response-time-ms', (_req, res) => {
    return res.get('X-Response-Time') || '0';
});
// Custom token untuk request body
morgan_1.default.token('request-body', (req) => {
    const body = Object.assign({}, req.body);
    // Hapus sensitive data
    if (body.password)
        body.password = '***';
    if (body.token)
        body.token = '***';
    if (body.refreshToken)
        body.refreshToken = '***';
    return JSON.stringify(body);
});
// Format untuk development
const developmentFormat = ':method :url :status :response-time-ms ms - :request-body';
// Format untuk production
const productionFormat = JSON.stringify({
    method: ':method',
    url: ':url',
    status: ':status',
    responseTime: ':response-time-ms',
    timestamp: ':date[iso]',
    ip: ':remote-addr'
});
const skipSuccessfulHealthChecks = (req, res) => {
    return req.path === '/health' && res.statusCode === 200;
};
// Stream untuk menulis log ke Winston
const stream = {
    write: (message) => {
        const data = message.trim();
        if (process.env.NODE_ENV === 'production') {
            try {
                const logData = JSON.parse(data);
                logger_1.default.info('API Request', logData);
            }
            catch (e) {
                logger_1.default.info(data);
            }
        }
        else {
            logger_1.default.info(data);
        }
    }
};
exports.requestLogger = (0, morgan_1.default)(process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat, {
    stream,
    skip: skipSuccessfulHealthChecks
});
