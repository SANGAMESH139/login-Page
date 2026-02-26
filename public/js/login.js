// Redirect if already logged in
if (localStorage.getItem('token')) {
  window.location.href = '/dashboard';
}

const form = document.getElementById('loginForm');
const alert = document.getElementById('alert');
const submitBtn = document.getElementById('submitBtn');

function showAlert(message, type) {
  alert.textContent = message;
  alert.className = 'alert ' + type;
}

function hideAlert() {
  alert.className = 'alert';
  alert.textContent = '';
}

function togglePassword() {
  const input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function validateField(input) {
  const group = input.closest('.form-group');
  if (!input.value.trim()) {
    group.classList.add('error');
    return false;
  }
  group.classList.remove('error');
  return true;
}

// Real-time validation
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', () => {
    validateField(input);
    hideAlert();
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const loginInput = document.getElementById('login');
  const passwordInput = document.getElementById('password');

  let valid = true;
  valid = validateField(loginInput) && valid;
  valid = validateField(passwordInput) && valid;

  if (!valid) return;

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: loginInput.value.trim(),
        password: passwordInput.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Login failed', 'error');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showAlert('Login successful! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  } catch (err) {
    showAlert('Network error. Please try again.', 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});
