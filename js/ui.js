// UI interactions - navigation, modals, sidebar
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('active');
        }

        function navigateTo(page) {
            document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            document.getElementById(page + 'Page').classList.add('active');
            
            const navItems = document.querySelectorAll('.nav-item');
            const pageIndex = ['dashboard', 'livemap', 'history', 'alerts', 'devices', 'users', 'settings'].indexOf(page);
            if (pageIndex >= 0) navItems[pageIndex].classList.add('active');
            
            const titles = {
                dashboard: { title: 'Dashboard', subtitle: 'Real-time vessel monitoring overview' },
                livemap: { title: 'Live Map', subtitle: 'Real-time vessel tracking and positioning' },
                history: { title: 'History', subtitle: 'Telemetry records and event logs' },
                alerts: { title: 'Alerts', subtitle: 'Manage and respond to security alerts' },
                devices: { title: 'Devices', subtitle: 'Manage MOB tracking devices' },
                users: { title: 'Users', subtitle: 'Manage system users and permissions' },
                settings: { title: 'Settings', subtitle: 'System configuration and preferences' }
            };
            
            document.getElementById('pageTitle').textContent = titles[page].title;
            document.getElementById('pageSubtitle').textContent = titles[page].subtitle;
            
            toggleSidebar();
            
            if (page === 'livemap') setTimeout(initMap, 100);
            if (page === 'history') renderHistory();
            if (page === 'alerts') renderAlerts();
            if (page === 'devices') renderDevices();
            if (page === 'users') renderUsers();
        }

        function closeEmergency() {
            document.getElementById('emergencyBanner').style.display = 'none';
            document.getElementById('mainContent').classList.remove('with-emergency');
        }

        function selectOption(el, value) {
            el.parentElement.parentElement.querySelector('input').value = value;
            el.parentElement.querySelectorAll('.select-option').forEach(o => o.classList.remove('selected'));
            el.classList.add('selected');
        }

        // Update emergency time
        setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' });
            const [time, ampm] = timeStr.split(' ');
            document.getElementById('emergencyTime').textContent = time;
        }, 1000);

        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.custom-select')) {
                document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('active'));
            }
        });

        // Close modals on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
                closeEditModal();
                closeAddUserModal();
            }
        });
