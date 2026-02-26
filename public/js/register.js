// Redirect if already logged in
if (localStorage.getItem('token')) {
  window.location.href = '/dashboard';
}

const form = document.getElementById('registerForm');
const alertEl = document.getElementById('alert');
const submitBtn = document.getElementById('submitBtn');

function showAlert(message, type) {
  alertEl.textContent = message;
  alertEl.className = 'alert ' + type;
}

function hideAlert() {
  alertEl.className = 'alert';
  alertEl.textContent = '';
}

function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

function validateField(input) {
  const group = input.closest('.form-group');
  const id = input.id;
  let isValid = true;

  if (id === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    isValid = emailRegex.test(input.value.trim());
  } else if (id === 'password') {
    isValid = input.value.length >= 6;
  } else if (id === 'confirm_password') {
    isValid = input.value === document.getElementById('password').value && input.value.length > 0;
  } else if (id !== 'phone') {
    isValid = input.value.trim().length > 0;
  }

  if (!isValid && id !== 'phone') {
    group.classList.add('error');
  } else {
    group.classList.remove('error');
  }

  return isValid;
}

// Real-time validation
document.querySelectorAll('input[required]').forEach(input => {
  input.addEventListener('input', () => {
    validateField(input);
    hideAlert();
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const fields = ['first_name', 'last_name', 'username', 'email', 'password', 'confirm_password'];
  let valid = true;

  fields.forEach(id => {
    const input = document.getElementById(id);
    if (!validateField(input)) valid = false;
  });

  if (!valid) return;

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: document.getElementById('first_name').value.trim(),
        last_name: document.getElementById('last_name').value.trim(),
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Registration failed', 'error');
      return;
    }

    showAlert('Account created successfully! Redirecting to login...', 'success');
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  } catch (err) {
    showAlert('Network error. Please try again.', 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});
