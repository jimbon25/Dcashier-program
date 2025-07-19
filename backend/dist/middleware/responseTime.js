"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTime = void 0;
const responseTime = (req, res, next) => {
    const start = process.hrtime();
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const time = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        if (!res.headersSent) {
            res.set('X-Response-Time', time);
        }
    });
    next();
};
exports.responseTime = responseTime;
