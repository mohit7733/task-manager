function notFound(_req, res) {
  res.status(404).json({ message: "Route not found" });
}

function errorHandler(error, _req, res, _next) {
  const status =
    error.name === "MulterError" || /allowed|file/i.test(error.message || "")
      ? 400
      : res.statusCode && res.statusCode !== 200
        ? res.statusCode
        : 500;
  res.status(status).json({ message: error.message || "Server error" });
}

module.exports = { notFound, errorHandler };
