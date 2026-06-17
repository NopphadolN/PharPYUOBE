const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // format: Bearer token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, 'SECRET_KEY');

    req.user = decoded; // { id, role }

    next();

  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
