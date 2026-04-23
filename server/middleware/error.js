const notFound = (req, res, next) => {
  const error = new Error(`Not Found: ${req.originalUrl}`);
  error.statusCode = 404; // Explicitly set the error's status code
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode || 500;
  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack, // Hide stack in production
  });
};

module.exports = {
  notFound,
  errorHandler,
};
