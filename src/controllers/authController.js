import axios from 'axios';
import jwt from 'jsonwebtoken';
import {
  CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, JWT_SECRET,
} from '../config/constants.js';

/**
 * Function for handling login request by redirecting user to GitLab OAuth authorization page.
 * Redirects user to authorization URL with client ID, redirect URI, response type,
 * and scopes specified.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = (req, res) => {
  // eslint-disable-next-line max-len
  const authUrl = `https://gitlab.lnu.se/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=read_user+read_api+read_repository`;
  res.redirect(authUrl);
};

/**
 * Async function that handles the OAuth callback from GitLab authentication.
 * It retrieves the authorization code from the request query parameters,
 *  exchanges it for an access token,
 * fetches user information, generates a JWT token with user data, and stores it in localStorage
 * before redirecting the user.
 *
 * @param {Object} req - The request object containing the authorization code in the query.
 * @param {Object} res - The response object to send back the generated JWT token or error response.
 */
export const callback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    /**
     * Represents the response object received from the token endpoint.
     * This object contains the details of the access token obtained after a POST request.
     *
     * @type {Promise}
     */
    const tokenResponse = await axios.post(
      'https://gitlab.lnu.se/oauth/token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      },
    );

    /**
     * Represents an access token obtained from a token response.
     * The access token is used to authenticate and authorize the user for subsequent API calls.
     * @type {string}
     */
    const accessToken = tokenResponse.data.access_token;

    /**
     * Represents the response object obtained from a GET request to the user endpoint.
     * @type {Promise}
     */
    const userResponse = await axios.get('https://gitlab.lnu.se/api/v4/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    /**
     * Holds the response data for the user retrieved from the server.
     * @type {any}
     */
    const user = userResponse.data;

    /**
     * Variable representing a JSON Web Token (JWT) signed with a secret key,
     * based on the provided user and access token information.
     *
     * @type {string}
     */
    const jwtToken = jwt.sign(
      { user, accessToken },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    res.send(`
      <html>
        <body>
          <script>
            localStorage.setItem('token', '${jwtToken}');
            window.location.href = '/';
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    return res.status(500).send('Error during OAuth flow');
  }
};
