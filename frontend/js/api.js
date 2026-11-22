
const API_URL = 'http://localhost:5000/api';

// ==========================================
// LOGIN
// ==========================================

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        const loginButton = document.getElementById('loginButton');

        errorMessage.textContent = '';
        loginButton.disabled = true;
        loginButton.textContent = 'Signing in...';

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.user.role === 'ADMIN') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'student.html';
            }

        } catch (error) {
            errorMessage.textContent = error.message;
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Sign In';
        }
    });
}

// ==========================================
// REGISTRATION
// ==========================================

const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const registerButton = document.getElementById('registerButton');

        errorMessage.textContent = '';
        successMessage.textContent = '';

        registerButton.disabled = true;
        registerButton.textContent = 'Creating account...';

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            successMessage.textContent =
                'Account created successfully! Redirecting to login...';

            registerForm.reset();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            errorMessage.textContent = error.message;
        } finally {
            registerButton.disabled = false;
            registerButton.textContent = 'Create Account';
        }
    });
}
