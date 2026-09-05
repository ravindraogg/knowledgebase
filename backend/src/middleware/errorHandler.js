export function errorHandler(err, req, res, next) {
  console.error('❌ Server Error:', err);

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
