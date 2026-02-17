const API_URL = '/api';

// Check Auth on Load
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('admin_user');
    if (user) {
        showDashboard();
    }
});

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    loadLinks();
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('login-msg');

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('admin_user', data.username);
            showDashboard();
            msg.textContent = '';
        } else {
            msg.textContent = data.error || 'Login failed';
            msg.className = 'error';
        }
    } catch (err) {
        msg.textContent = 'Network error';
        msg.className = 'error';
    }
}

function logout() {
    localStorage.removeItem('admin_user');
    location.reload();
}

async function createLink() {
    const shortCode = document.getElementById('short-code').value;
    const originalUrl = document.getElementById('original-url').value;
    const msg = document.getElementById('create-msg');

    if (!shortCode || !originalUrl) {
        msg.textContent = 'Please fill all fields';
        msg.className = 'error';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shortCode, originalUrl })
        });
        const data = await res.json();

        if (data.success) {
            msg.textContent = `Link created! /${data.link.short_code}`;
            msg.className = 'success';
            document.getElementById('short-code').value = '';
            document.getElementById('original-url').value = '';
            loadLinks();
        } else {
            msg.textContent = data.error || 'Creation failed';
            msg.className = 'error';
        }
    } catch (e) {
        msg.textContent = 'Error creating link';
        msg.className = 'error';
    }
}

async function loadLinks() {
    const tbody = document.querySelector('#links-table tbody');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/links`);
        const links = await res.json();

        tbody.innerHTML = '';
        links.forEach(link => {
            const tr = document.createElement('tr');
            const fullUrl = `${window.location.origin}/${link.short_code}`;
            tr.innerHTML = `
                <td>
                    <span style="color:var(--primary-color); font-weight:bold;">/${link.short_code}</span>
                </td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <a href="${link.original_url}" target="_blank" style="color:#888; text-decoration:none;">${link.original_url}</a>
                </td>
                <td>${link.clickCount || 0}</td>
                <td>
                    <button class="btn-action btn-copy" onclick="copyLink('${fullUrl}')">Copy</button>
                    <button class="btn-action btn-view" onclick="viewDetails('${link.id}', '${link.short_code}')">Details</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4">Failed to load links</td></tr>';
    }
}

// --- New Features ---

function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('Copied: ' + url);
    }).catch(err => {
        console.error('Failed to copy', err);
    });
}

async function viewDetails(linkId, shortCode) {
    const modal = document.getElementById('details-modal');
    const title = document.getElementById('modal-title');
    const tbody = document.querySelector('#visits-table tbody');

    title.textContent = `Details for /${shortCode}`;
    tbody.innerHTML = '<tr><td colspan="6">Loading visits...</td></tr>';
    modal.classList.remove('hidden');

    try {
        const res = await fetch(`${API_URL}/links/${linkId}/stats`);
        const visits = await res.json();

        tbody.innerHTML = '';
        if (visits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No visits yet.</td></tr>';
            return;
        }

        visits.forEach(v => {
            const tr = document.createElement('tr');
            // Format Map Link if lat/lon exists
            let mapLink = '-';
            if (v.latitude && v.longitude) {
                mapLink = `<a href="https://www.google.com/maps?q=${v.latitude},${v.longitude}" target="_blank" style="color:#4CAF50">View Map</a>`;
            }

            tr.innerHTML = `
                <td>${new Date(v.created_at).toLocaleString()}</td>
                <td>${v.ip}</td>
                <td>${v.city || '?'}, ${v.country || '?'} <br><span style="font-size:0.7em; color:#666">${v.isp || ''}</span></td>
                <td>${v.device_type}</td>
                <td>${v.os} / ${v.browser}</td>
                <td>${mapLink}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6">Error loading details</td></tr>';
    }
}

function closeModal() {
    document.getElementById('details-modal').classList.add('hidden');
    // Reload links to update counts
    loadLinks();
}

// Close modal on click outside
window.onclick = function (event) {
    const modal = document.getElementById('details-modal');
    if (event.target == modal) {
        closeModal();
    }
}
