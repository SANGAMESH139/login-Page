const token = localStorage.getItem('token');

// Redirect to login if not authenticated
if (!token) {
  window.location.href = '/';
}

async function loadProfile() {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token },
    });

    if (!res.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return;
    }

    const data = await res.json();
    const user = data.user;

    // Avatar initials
    const initials = (user.first_name[0] + user.last_name[0]).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;

    // Welcome message
    document.getElementById('welcomeMsg').textContent =
      'Welcome back, ' + user.first_name + ' ' + user.last_name + '!';

    // Info fields
    document.getElementById('infoFirstName').textContent = user.first_name;
    document.getElementById('infoLastName').textContent = user.last_name;
    document.getElementById('infoUsername').textContent = user.username;
    document.getElementById('infoEmail').textContent = user.email;
    document.getElementById('infoPhone').textContent = user.phone || 'Not provided';
    document.getElementById('infoCreated').textContent = new Date(user.created_at).toLocaleDateString();
  } catch (err) {
    document.getElementById('welcomeMsg').textContent = 'Failed to load profile.';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

loadProfile();
