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
     * Represents the response object returned by the GET request
     *  to retrieve activity events from 'https://gitlab.lnu.se/api/v4/events'.
     * This object contains information about activities fetched
     *  based on the provided access token and query parameters.
     * @typedef {object} activitiesResponse
     */
    const activitiesResponse = await axios.get('https://gitlab.lnu.se/api/v4/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 102 },
    });

    /**
     * Represents the response object containing information
     *  about groups fetched from the specified URL.
     * The data is retrieved using the axios library with a GET request.
     *
     * @type {Promise<AxiosResponse<any>>}
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
      activities: activitiesResponse.data,
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
