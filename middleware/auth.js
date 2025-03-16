const jwt = require("jsonwebtoken");
const config = process.env;

const verifyToken = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send(
      {
        status: false,
        message: "A token is required for authentication"
      });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send({
      status: false,
      message: "Invalid Token"
    });
  }
  return next();
};

module.exports = verifyToken;

