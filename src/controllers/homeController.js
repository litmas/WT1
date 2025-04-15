let loginBtn;
let logoutBtn;
let userDataSection;
let userInfo;
let activities;
let groups;

document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  checkAuthentication();
  setupEventListeners();
});

/**
 * Initializes elements by obtaining references to specific elements in the DOM.
 *
 * @return {void}
 */
function initializeElements() {
  loginBtn = document.getElementById('login-btn');
  logoutBtn = document.getElementById('logout-btn');
  userDataSection = document.getElementById('user-data');
  userInfo = document.getElementById('user-info');
  activities = document.getElementById('activities');
  groups = document.getElementById('groups');
}

/**
 * Toggles the display of a specified section based on its ID.
 *
 * @param {string} sectionId - The ID of the section to toggle.
 * @return {void} - This function does not return anything.
 */
// eslint-disable-next-line no-unused-vars
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
  } else {
    section.style.display = 'none';
  }
}

/**
 * Check if user is authenticated by verifying the token stored in localStorage.
 * If the token exists, it calls verifyTokenAndFetchUserData function,
 * otherwise it displays the unauthenticated UI by calling showUnauthenticatedUI function.
 * @return {void} - This method does not return any value.
 */
function checkAuthentication() {
  const token = localStorage.getItem('token');
  if (token) {
    verifyTokenAndFetchUserData();
  } else {
    showUnauthenticatedUI();
  }
}

/**
 * Sets up event listeners for the login and logout buttons, extracts token value from URL parameters.
 * When the login button is clicked, redirects to the login page.
 * When the logout button is clicked, calls the logoutUser function.
 * Retrieves token value from URL parameters if present and stores it in localStorage.
 *
 * @return {void}
 */
function setupEventListeners() {
  loginBtn.addEventListener('click', () => {
    window.location.href = '/login';
  });

  logoutBtn.addEventListener('click', () => {
    logoutUser();
  });

  /**
   * Represents the URL query parameters extracted from the current window's URL.
   * @type {URLSearchParams}
   */
  const urlParams = new URLSearchParams(window.location.search);
  /**
   * Retrieves the token value from the URL parameters.
   *
   * @param {URLSearchParams} urlParams - The URLSearchParams object containing the URL parameters
   * @returns {string} The token value extracted from the URL parameters
   */
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    localStorage.setItem('token', tokenFromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
    showAuthenticatedUI();
    fetchUserData();
  }
}

/**
 * Verifies the user token and fetches user data from the server.
 *
 * This function sends a request to the server to verify the user's token.
 * If the response is successful, it shows the authenticated UI and fetches user data.
 * If the response is not successful, it removes the token from the local storage and shows the unauthenticated UI.
 *
 * @return {void}
 */
async function verifyTokenAndFetchUserData() {
  try {
    const response = await fetch('/home/auth', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (response.ok) {
      showAuthenticatedUI();
      fetchUserData();
    } else {
      localStorage.removeItem('token');
      showUnauthenticatedUI();
    }
  } catch (error) {
    localStorage.removeItem('token');
    showUnauthenticatedUI();
  }
}

/**
 * Performs a logout operation for the current user.
 * This function makes an asynchronous request to the '/home/logout' endpoint with a GET method.
 * If the request is successful (status code 200), the user's token is removed from local storage,
 * the UI is updated to show unauthenticated state, and the page is redirected to the home page.
 * If the request fails, an error is thrown.
 *
 * @return {void}
 */
async function logoutUser() {
  try {
    const response = await fetch('/home/logout', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (response.ok) {
      localStorage.removeItem('token');
      showUnauthenticatedUI();
      window.location.href = '/';
    } else {
      throw new Error('Logout failed');
    }
  } catch (error) {
    alert('Error during logout. Please try again.');
  }
}

/**
 * Fetches user data from the server.
 *
 * @returns {Promise<void>} A Promise that resolves successfully if the user data is fetched
 * and displayed, or rejects with an error message if fetching fails.
 */
async function fetchUserData() {
  try {
    const response = await fetch('/home/auth', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    /**
     * Retrieves the JSON data from the response object.
     * @param {Object} response - The response object containing the JSON data.
     * @returns {Promise<Object>} A Promise that resolves to the JSON data extracted from the response.
     */
    const data = await response.json();
    displayUserData(data);
  } catch (error) {
    alert('Error fetching user data. Please try again.');
  }
}

/**
 * Updates the HTML content to display user data and related activities and groups.
 *
 * @param {Object} data - The data object containing user, activities, and groups information.
 */
function displayUserData(data) {
  /**
   * Represents the inner HTML content of the userInfo element.
   */
  userInfo.innerHTML = `
    <div>
      <img src="${data.user.avatar_url}" alt="Avatar">
      <h3>${data.user.name} (@${data.user.username})</h3>
      <p><strong>ID:</strong> ${data.user.id}</p>
      <p><strong>Email:</strong> ${data.user.email || 'N/A'}</p>
      <p><strong>Last Activity:</strong> ${new Date(data.user.last_activity_on).toLocaleString()}</p>
      <a href="${data.user.web_url}" target="_blank">View GitLab Profile</a>
    </div>
  `;

  /**
   * Represents the inner HTML content of the 'activities' element.
   */
  activities.innerHTML = `
    <div>
      ${data.activities.map((activity) => `
        <div>
          <img src="${activity.author.avatar_url}" alt="Avatar">
          <strong>${activity.author.name}</strong> ${activity.action_name}
          <br>
          <small> Target title: ${activity.target_title || 'N/A'} </small>
          <small> Target type: (${activity.target_type || 'N/A'}) </small>
          <br>
          <small>${new Date(activity.created_at).toLocaleString()}</small>
        </div>
      `).join('')}
    </div>
  `;

  /**
 * Counts the number of activities rendered in the activities element.
 * @param {string} activitiesHTML - The inner HTML string of the activities element
 * @returns {number} The count of activities
 */
  function countActivities(activitiesHTML) {
  // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = activitiesHTML;

    // Count the number of activity divs (each activity is wrapped in a div)
    const activityDivs = tempDiv.querySelectorAll('div > div');
    return activityDivs.length;
  }

  // Usage example:
  const activityCount = countActivities(activities.innerHTML);
  console.log(`Number of activities: ${activityCount}`);

  /**
   * Retrieves the element in the HTML document with the id "groups",
   * where groups is the id of a HTML element.
   *
   * @returns {Element} The HTML element with the id "groups"
   */
  groups.innerHTML = `
    <div>
      ${data.groups.map((group) => `
        <div>
          <a href="${group.web_url}" target="_blank">${group.name}</a>
          <br>
          ${group.avatar_url ? `<img src="${group.avatar_url}" alt="Avatar">` : ''}
          <br>
          <small>Visibility: ${group.visibility}</small>
          <br>
          <small>Projects: ${group.projects.length}</small>
          <br>
          <small>Created: ${new Date(group.created_at).toLocaleDateString()}</small>
          <br>
          ${group.description ? `<p>${group.description}</p>` : ''}

          ${group.projects.map((project) => `
            <div>
              <a href="${project.web_url}" target="_blank"><strong>${project.name}</strong></a>
              ${project.avatar_url ? `<br><img src="${project.avatar_url}" alt="Project Avatar">` : ''}
              <br>
              ${project.description ? `<p>${project.description}</p>` : ''}
              <small>Visibility: ${project.visibility}</small>

              ${project.latest_commit ? `
                <p><strong>Latest Commit:</strong> <a href="${project.latest_commit.web_url}" 
                target="_blank">${project.latest_commit.short_id}</a></p>
                <p><strong>Message:</strong> ${project.latest_commit.message}</p>
                <p><strong>By:</strong> 
                  ${project.latest_commit.author_name}</p>
                <p><strong>Committed:</strong> ${timeAgo(new Date(project.latest_commit.committed_date))}</p>
              ` : '<p>No commits available</p>'}

              ${project.ci_status ? `
                <p><strong>Latest Pipeline:</strong> ${project.ci_status} (${project.ci_url
  ? `<a href="${project.ci_url}" target="_blank">View</a>` : ''})</p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Calculates the time difference between the given date and the current date
 * to determine the time elapsed in human-readable format.
 *
 * @param {Date} date The date to calculate the time difference from.
 * @return {string} A string representing the time elapsed in a human-readable format,
 *  such as 'X seconds ago', 'Y minutes ago', 'Z hours ago', or 'W days ago'.
 */
function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

/**
 * Displays the authenticated user interface by hiding the login button,
 * showing the logout button, and displaying the user data section.
 *
 * @return {void}
 */
function showAuthenticatedUI() {
  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'block';
  userDataSection.style.display = 'block';
}

/**
 * Display the user interface for unauthenticated users.
 *
 * @return {void}
 */
function showUnauthenticatedUI() {
  loginBtn.style.display = 'block';
  logoutBtn.style.display = 'none';
  userDataSection.style.display = 'none';
  userInfo.textContent = '';
  activities.textContent = '';
  groups.textContent = '';
}
