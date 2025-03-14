import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';

/**
 * Checks whether the user making the request is authenticated.
 * If authenticated, decodes and verifies the JSON Web Token using the provided secret key,
 * then attaches the decoded user information to the request object.
 * If not authenticated or token verification fails, sends a 401 Unauthorized response.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
// eslint-disable-next-line import/prefer-default-export, consistent-return
export const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    /**
     * Verifies a JSON Web Token using a given secret.
     * @param {string} token - The token to be verified.
     * @param {string} secret - The secret key used to sign the token.
     * @returns {*} The decoded information from the JWT token
     * if verification is successful, otherwise an error is thrown.
     */
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
