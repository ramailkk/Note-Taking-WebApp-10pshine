// Plain console-based logger. The Express version used pino/pino-pretty,
// but pino's worker-thread transport is unreliable in serverless cold
// starts, so this keeps the same call shape (logger.info/warn/error) without
// that dependency. All existing call sites (both `logger.info(obj, msg)` and
// `logger.info(msg, val)` styles) work fine with plain console methods.
const logger = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};
module.exports = logger;
