/**
 * Auth UI — Shared JavaScript
 * Handles API calls, token storage, form validation, and page routing
 * for the Multi-Tenant buildmyonlineweb auth flow.
 */

// ── Config ──────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api/v1';

// ── Storage ──────────────────────────────────────────────────────────────
const Auth = {
    saveTokens(tokens, user) {
        localStorage.setItem('be_access_token',  tokens.accessToken);
        localStorage.setItem('be_refresh_token', tokens.refreshToken);
        localStorage.setItem('be_user',          JSON.stringify(user));
    },
    clearTokens() {
        localStorage.removeItem('be_access_token');
        localStorage.removeItem('be_refresh_token');
        localStorage.removeItem('be_user');
    },
    getAccessToken()  { return localStorage.getItem('be_access_token'); },
    getUser()         { return JSON.parse(localStorage.getItem('be_user') || 'null'); },
    isLoggedIn()      { return !!this.getAccessToken(); },
};

// ── API Helpers ──────────────────────────────────────────────────────────
async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        const msg = data.errors?.[0]?.message || 'Something went wrong';
        throw new Error(msg);
    }
    return data;
}

// ── UI Helpers ──────────────────────────────────────────────────────────
function showAlert(containerId, message, type = 'error') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.className = `alert alert-${type} visible`;
    el.querySelector('.alert-msg').textContent = message;
}

function hideAlert(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.classList.remove('visible');
}

function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.classList.toggle('loading', loading);
}

function fieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
    input.style.borderColor = 'var(--danger)';
    if (message) {
        const err = document.createElement('p');
        err.className = 'field-error';
        err.textContent = message;
        input.parentNode.insertAdjacentElement('afterend', err);
    }
}

function clearErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.field-error').forEach(e => e.remove());
    form.querySelectorAll('.form-input').forEach(i => {
        i.style.borderColor = '';
    });
}

// ── Password Toggle ─────────────────────────────────────────────────────
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isText = input.type === 'text';
        input.type = isText ? 'password' : 'text';
        btn.querySelector('.icon-eye').style.display     = isText ? 'block' : 'none';
        btn.querySelector('.icon-eye-off').style.display = isText ? 'none'  : 'block';
    });
});

// ── Password Strength ───────────────────────────────────────────────────
function assessPasswordStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0-4
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthClasses = ['', 'active-weak', 'active-fair', 'active-good', 'active-strong'];

function updateStrengthIndicator(password) {
    const bars     = document.querySelectorAll('.strength-bar');
    const textEl   = document.querySelector('.strength-text');
    if (!bars.length || !textEl) return;

    const score = assessPasswordStrength(password);
    bars.forEach((bar, i) => {
        bar.className = 'strength-bar';
        if (i < score) bar.classList.add(strengthClasses[score]);
    });
    textEl.textContent = password ? `Strength: ${strengthLabels[score]}` : '';
}

const pwdInput = document.getElementById('password');
if (pwdInput) {
    pwdInput.addEventListener('input', () => updateStrengthIndicator(pwdInput.value));
}

// ── Show / Hide views ───────────────────────────────────────────────────
function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
}

// ══════════════════════════════════════════════════════════════════════════
// REGISTER FORM
// ══════════════════════════════════════════════════════════════════════════
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    // Auto-generate subdomain from business name
    const businessNameInput = document.getElementById('businessName');
    const subdomainInput    = document.getElementById('subdomain');

    if (businessNameInput && subdomainInput) {
        businessNameInput.addEventListener('input', () => {
            if (!subdomainInput.dataset.manual) {
                subdomainInput.value = businessNameInput.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .substring(0, 63);
            }
        });
        subdomainInput.addEventListener('input', () => {
            subdomainInput.dataset.manual = 'true';
        });
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors('registerForm');
        hideAlert('registerAlert');
        const btn = document.getElementById('registerBtn');
        setLoading(btn, true);

        try {
            const data = await apiPost('/auth/register', {
                email:        document.getElementById('email').value.trim(),
                password:     document.getElementById('password').value,
                fullName:     document.getElementById('fullName').value.trim(),
                businessName: document.getElementById('businessName').value.trim(),
                businessType: document.getElementById('businessType').value,
                subdomain:    document.getElementById('subdomain').value.trim(),
            });

            Auth.saveTokens(data.data.tokens, data.data.user);
            showView('registerSuccess');
            document.getElementById('successName').textContent = data.data.user.fullName || 'there';
            document.getElementById('successBiz').textContent  = data.data.tenant?.businessName || '';
        } catch (err) {
            showAlert('registerAlert', err.message, 'error');
        } finally {
            setLoading(btn, false);
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════
// LOGIN FORM
// ══════════════════════════════════════════════════════════════════════════
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors('loginForm');
        hideAlert('loginAlert');
        const btn = document.getElementById('loginBtn');
        setLoading(btn, true);

        try {
            const data = await apiPost('/auth/login', {
                email:    document.getElementById('loginEmail').value.trim(),
                password: document.getElementById('loginPassword').value,
            });

            Auth.saveTokens(data.data.tokens, data.data.user);
            showView('loginSuccess');
            const user = data.data.user;
            document.getElementById('loginSuccessName').textContent = user.fullName || user.email;
            document.getElementById('loginSuccessRole').textContent = user.role;
        } catch (err) {
            showAlert('loginAlert', err.message, 'error');
        } finally {
            setLoading(btn, false);
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD FORM
// ══════════════════════════════════════════════════════════════════════════
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert('forgotAlert');
        const btn = document.getElementById('forgotBtn');
        setLoading(btn, true);

        try {
            await apiPost('/auth/forgot-password', {
                email: document.getElementById('forgotEmail').value.trim(),
            });
            showView('forgotSuccess');
        } catch (err) {
            showAlert('forgotAlert', err.message, 'error');
        } finally {
            setLoading(btn, false);
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════
// RESET PASSWORD FORM
// ══════════════════════════════════════════════════════════════════════════
const resetForm = document.getElementById('resetForm');
if (resetForm) {
    // Pre-fill token from URL query param
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const tokenInput = document.getElementById('resetToken');

    if (!token) {
        showAlert('resetAlert', 'Invalid or missing reset token. Please request a new password reset link.', 'error');
        document.getElementById('resetBtn').disabled = true;
    } else if (tokenInput) {
        tokenInput.value = token;
    }

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors('resetForm');
        hideAlert('resetAlert');

        const newPwd     = document.getElementById('newPassword').value;
        const confirmPwd = document.getElementById('confirmPassword').value;

        if (newPwd !== confirmPwd) {
            showAlert('resetAlert', 'Passwords do not match.', 'error');
            return;
        }

        const btn = document.getElementById('resetBtn');
        setLoading(btn, true);

        try {
            await apiPost('/auth/reset-password', {
                token:       tokenInput.value,
                newPassword: newPwd,
            });
            showView('resetSuccess');
        } catch (err) {
            showAlert('resetAlert', err.message, 'error');
        } finally {
            setLoading(btn, false);
        }
    });
}
