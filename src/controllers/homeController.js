import axios from 'axios';

/**
 * Asynchronous function that handles requests related to a user's home on GitLab.
 *
 * Retrieves user activities, groups with projects, and latest commits for those projects.
 *
 * @param {Object} req - Express request object containing user information
 * @param {Object} res - Express response object for sending data back to the client
 * @returns {Promise<void>} - A promise that resolves once the data is fetched and sent back
 */
export const home = async (req, res) => {
  const { accessToken } = req.user;

  try {
    /**
     * Represents the response from the first page of events fetched from the GitLab API.
     * @type {Object}
     */
    const firstPageResponse = await axios.get('https://gitlab.lnu.se/api/v4/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 100 },
    });

    /**
     * Represents the response from making a GET request to the second page of events on the GitLab API.
     * The request is made using Axios with the provided access token for authorization.
     * The response includes the latest event from the second page with a limit of 1 event per page.
     *
     * @type {Object}
     */
    const secondPageResponse = await axios.get('https://gitlab.lnu.se/api/v4/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 1, page: 2 },
    });

    /**
     * Represents a combined list of activities from two different API responses.
     * @type {Array}
     */
    const combinedActivities = [
      ...firstPageResponse.data,
      ...secondPageResponse.data,
    ];

    /**
     * Represents the response object containing information about groups fetched from a specified API endpoint.
     * @typedef {Object} GroupsResponse
     * @property {Object} data - The data object containing the response information from the API.
     * @property {number} status - The HTTP status code returned from the API request.
     * @property {string} statusText - The status text of the response.
     * @property {Object} headers - The headers object containing the response headers.
     */
    const groupsResponse = await axios.get('https://gitlab.lnu.se/api/v4/groups', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 3 },
    });

    /**
     * Represents a list of group objects acquired from a response.
     * @type {Array<object>}
     */
    const groups = groupsResponse.data;
    const groupsWithProjects = await Promise.all(groups.map(async (group) => {
      const projectsResponse = await axios.get(`https://gitlab.lnu.se/api/v4/groups/${group.id}/projects`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { per_page: 5 },
      });

      /**
       * Represents a list of projects retrieved from the response data.
       * @type {Array}
       */
      const projects = projectsResponse.data;
      const projectsWithCommits = await Promise.all(projects.map(async (project) => {
      // eslint-disable-next-line max-len
        const commitsResponse = await axios.get(`https://gitlab.lnu.se/api/v4/projects/${project.id}/repository/commits`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { per_page: 1 },
        });

        return {
          ...project,
          latest_commit: commitsResponse.data[0],
        };
      }));

      return {
        ...group,
        projects: projectsWithCommits,
      };
    }));

    res.json({
      user: req.user.user,
      activities: combinedActivities,
      groups: groupsWithProjects,
    });
  } catch (error) {
    res.status(500).send('Error fetching data from GitLab');
  }
};

/**
 * Logs the user out by removing the token from local storage and redirecting to the home page.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
export const logout = (req, res) => {
  res.send(
    `<html>
      <body>
        <script>
          localStorage.removeItem('token'); 
          window.location.href = '/'; 
        </script>
      </body>
    </html>`,
  );
};
