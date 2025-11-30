export async function initSidebar({ session, hostId = 'sidebar-host', onLogout } = {}) {
    const templateUrl = new URL('../components/sidebar.html', import.meta.url);
    const res = await fetch(templateUrl);
    if (!res.ok) throw new Error(`Failed to load sidebar template: ${res.status}`);
    const html = await res.text();

    const host = document.getElementById(hostId);
    if (!host) throw new Error(`Sidebar host element not found: #${hostId}`);

    host.innerHTML = html;

    // Populate user info
    if (session) {
        const nameEl = document.getElementById('userNameDisplay');
        const roleEl = document.getElementById('userRoleDisplay');
        if (nameEl) nameEl.textContent = session.displayName || session.email || 'Usuario';
        if (roleEl && session.role) {
            roleEl.textContent = `${session.role.charAt(0).toUpperCase()}${session.role.slice(1)}`;
        }
    }

    // Provide logout handler
    if (typeof onLogout === 'function') {
        window.logout = onLogout;
    }

    // Close menu on link click (mobile)
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                sidebar?.classList.remove('active');
            }
        });
    });
}