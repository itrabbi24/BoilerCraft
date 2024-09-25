module.exports = (err, req, res, next) => {
  console.error('[Error Logger]:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
