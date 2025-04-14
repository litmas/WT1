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
    // First request: get 100 events (max per_page)
    const firstPageResponse = await axios.get('https://gitlab.lnu.se/api/v4/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 100 },
    });

    // Second request: get 1 more event (using page=2 to get the next set)
    const secondPageResponse = await axios.get('https://gitlab.lnu.se/api/v4/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 1, page: 2 },
    });

    // Combine the results from both requests
    const combinedActivities = [
      ...firstPageResponse.data,
      ...secondPageResponse.data,
    ];

    const groupsResponse = await axios.get('https://gitlab.lnu.se/api/v4/groups', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 3 },
    });

    const groups = groupsResponse.data;
    const groupsWithProjects = await Promise.all(groups.map(async (group) => {
      const projectsResponse = await axios.get(`https://gitlab.lnu.se/api/v4/groups/${group.id}/projects`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { per_page: 5 },
      });

      const projects = projectsResponse.data;
      const projectsWithCommits = await Promise.all(projects.map(async (project) => {
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
