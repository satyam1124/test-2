// Core application logic
        // Dashboard
        function initDashboard() {
            renderPositionsTable();
            renderDashboardAlerts();
        }

        function renderPositionsTable() {
            const container = document.getElementById('positionsTable');
            const times = ['7:13:48 AM', '7:12:48 AM', '7:11:48 AM', '7:10:48 AM'];
            const statuses = ['critical', 'alert', 'alert', 'safe'];
            const statusTexts = ['MAN OVERBOARD', 'Alert', 'Alert', 'Safe'];
            
            container.innerHTML = devices.map((d, i) => `
                <div class="table-row">
                    <div class="device-name">
                        ${d.id}
                        <span>${d.name}</span>
                    </div>
                    <div class="position">${d.lat.toFixed(4)},<br>${d.lng.toFixed(4)}</div>
                    <div>
                        <div class="signal-bars">
                            ${getSignalBars(d.signal)}
                        </div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${d.signal.toFixed(1)} dBm</div>
                    </div>
                    <div>
                        <span class="status-badge ${statuses[i]}">${statusTexts[i]}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary);">
                        <i class="far fa-clock" style="margin-right: 4px;"></i>${times[i]}
                    </div>
                </div>
            `).join('');
        }

        function renderDashboardAlerts() {
            const container = document.getElementById('dashboardAlerts');
            container.innerHTML = alerts.slice(0, 3).map(a => `
                <div class="alert-card ${a.severity === 'High' ? 'warning' : a.severity === 'Medium' ? 'info' : ''}">
                    <div class="alert-icon">
                        <i class="fas ${a.icon}"></i>
                    </div>
                    <div class="alert-content">
                        <h4>
                            ${a.type}
                            <span class="alert-badge ${a.severity === 'High' ? 'warning' : a.severity === 'Medium' ? 'info' : ''}">${a.severity}</span>
                        </h4>
                        <p>${a.message}</p>
                        <div class="alert-meta">
                            <span><i class="far fa-clock"></i> ${a.time}</span>
                            <span><i class="fas fa-broadcast-tower"></i> ${a.device}</span>
                        </div>
                    </div>
                    <button class="btn-resolve" onclick="resolveAlert(${a.id})">
                        <i class="fas fa-check"></i> Resolve
                    </button>
                </div>
            `).join('');
        }

        // Map
        function initMap() {
            if (map) {
                map.invalidateSize();
                return;
            }
            
            map = L.map('map', {
                center: [25.77, -80.18],
                zoom: 13,
                zoomControl: false
            });
            
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            
            mapLayers.satellite.addTo(map);
            
            devices.forEach(d => {
                const color = d.alert ? '#ef4444' : d.status === 'offline' ? '#6b7280' : '#10b981';
                
                const marker = L.circleMarker([d.lat, d.lng], {
                    radius: d.alert ? 20 : 12,
                    fillColor: color,
                    color: '#fff',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.9
                }).addTo(map);
                
                if (d.alert) {
                    const pulse = L.circleMarker([d.lat, d.lng], {
                        radius: 35,
                        fillColor: color,
                        color: color,
                        weight: 0,
                        fillOpacity: 0.4,
                        interactive: false,
                        bubblingMouseEvents: false
                    }).addTo(map);
                    
                    let growing = true;
                    setInterval(() => {
                        const currentRadius = pulse.getRadius();
                        if (growing) {
                            pulse.setRadius(currentRadius + 2);
                            if (currentRadius >= 45) growing = false;
                        } else {
                            pulse.setRadius(currentRadius - 2);
                            if (currentRadius <= 35) growing = true;
                        }
                    }, 100);
                }
                
                marker.bindPopup(`
                    <div style="min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                        <div style="background: ${color}; color: white; padding: 10px; margin: -15px -15px 10px -15px; border-radius: 8px 8px 0 0; font-weight: 600;">
                            ${d.id}
                        </div>
                        <div style="padding: 5px 0;">
                            <strong style="color: #374151;">${d.name}</strong><br>
                            <span style="color: #6b7280; font-size: 13px;">${d.role}</span>
                        </div>
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span>Status:</span>
                                <span style="color: ${color}; font-weight: 600;">${d.alert ? 'MAN OVERBOARD' : d.status}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span>Signal:</span>
                                <span>${d.signal} dBm</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Updated:</span>
                                <span>${d.lastSeen}</span>
                            </div>
                        </div>
                    </div>
                `, {
                    closeButton: true,
                    className: 'custom-popup'
                });
            });
            
            renderMapDeviceList();
        }

        function switchMapLayer(layerName) {
            if (layerName === currentLayer) return;
            
            if (currentLayer === 'satellite') {
                map.removeLayer(mapLayers.satellite);
            } else {
                map.removeLayer(mapLayers[currentLayer]);
            }
            
            if (layerName === 'satellite') {
                mapLayers.satellite.addTo(map);
            } else {
                mapLayers[layerName].addTo(map);
            }
            
            currentLayer = layerName;
            
            document.querySelectorAll('.map-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById('btn-' + layerName).classList.add('active');
        }

        function renderMapDeviceList() {
            const container = document.getElementById('mapDeviceList');
            container.innerHTML = devices.map(d => `
                <div class="device-card">
                    <div class="device-header">
                        <div class="device-title ${d.status}">
                            <div class="device-icon">
                                <i class="fas fa-broadcast-tower"></i>
                            </div>
                            <div>
                                <h4>${d.id}</h4>
                                <p>${d.name}</p>
                            </div>
                        </div>
                    </div>
                    <div class="device-details">
                        <div class="detail-item">
                            <label>Latitude</label>
                            <value>${d.lat.toFixed(5)}</value>
                        </div>
                        <div class="detail-item">
                            <label>Longitude</label>
                            <value>${d.lng.toFixed(5)}</value>
                        </div>
                        <div class="detail-item">
                            <label>Last Seen</label>
                            <value>${d.lastSeen}</value>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // History
        function renderHistory() {
            const container = document.getElementById('historyTable');
            const historyData = [];
            
            devices.forEach((d, i) => {
                for (let j = 0; j < 5; j++) {
                    const time = new Date(Date.now() - j * 60000 * (i + 1));
                    historyData.push({
                        device: d.id,
                        time: time.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }),
                        lat: d.lat + (Math.random() - 0.5) * 0.01,
                        lng: d.lng + (Math.random() - 0.5) * 0.01,
                        signal: d.signal + (Math.random() - 0.5) * 10,
                        status: j === 0 && d.alert ? 'MAN OVERBOARD' : d.status === 'offline' ? 'No Fix' : 'Safe',
                        sats: Math.floor(Math.random() * 6) + 6,
                        details: j === 0 && d.alert ? 'GPS lost + Low RSSI' : d.signal < -110 ? 'RSSI below threshold' : '-'
                    });
                }
            });
            
            container.innerHTML = historyData.map(h => `
                <div class="table-row" style="grid-template-columns: 0.8fr 1.2fr 1fr 0.8fr 1fr 1.2fr;">
                    <div class="device-name">${h.device}</div>
                    <div style="font-size: 12px;">${h.time}</div>
                    <div class="position" style="font-size: 11px;">${h.lat.toFixed(4)},<br>${h.lng.toFixed(4)}</div>
                    <div>
                        <div class="signal-bars">
                            ${getSignalBars(h.signal)}
                        </div>
                    </div>
                    <div>
                        ${h.status === 'MAN OVERBOARD' ? '<span style="color: var(--accent-red); font-weight: 600; font-size: 11px;">MAN OVERBOARD</span>' : 
                          h.status === 'No Fix' ? '<span style="color: var(--accent-orange); font-size: 11px;">No Fix</span>' :
                          '<span style="color: var(--accent-green); font-size: 11px;">● Safe</span>'}
                        <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">${h.sats} sats</div>
                    </div>
                    <div style="font-size: 11px; color: var(--text-secondary);">${h.details}</div>
                </div>
            `).join('');
        }

        // Alerts
        function renderAlerts() {
            const container = document.getElementById('alertsList');
            container.innerHTML = alerts.map(a => `
                <div class="alert-card ${a.severity === 'High' ? 'warning' : a.severity === 'Medium' ? 'info' : ''}">
                    <div class="alert-icon">
                        <i class="fas ${a.icon}"></i>
                    </div>
                    <div class="alert-content">
                        <h4>
                            ${a.type}
                            <span class="alert-badge ${a.severity === 'High' ? 'warning' : a.severity === 'Medium' ? 'info' : ''}">${a.severity}</span>
                        </h4>
                        <p>${a.message}</p>
                        <div class="alert-meta">
                            <span><i class="far fa-clock"></i> ${a.time}</span>
                            <span><i class="fas fa-broadcast-tower"></i> ${a.device}</span>
                        </div>
                    </div>
                    <button class="btn-resolve" onclick="resolveAlert(${a.id})">
                        <i class="fas fa-check"></i> Resolve
                    </button>
                </div>
            `).join('');
        }

        function resolveAlert(id) {
            showToast('Alert resolved successfully', 'success');
            event.target.closest('.alert-card').style.opacity = '0.5';
        }

        // Devices
        function renderDevices() {
            const container = document.getElementById('devicesList');
            container.innerHTML = devices.map(d => `
                <div class="device-card">
                    <div class="device-header">
                        <div class="device-title ${d.status}">
                            <div class="device-icon">
                                <i class="fas fa-broadcast-tower"></i>
                            </div>
                            <div>
                                <h4>${d.id}</h4>
                                <p>
                                    <i class="far fa-user"></i> ${d.name} 
                                    <span style="color: var(--text-secondary);">(${d.role})</span>
                                </p>
                            </div>
                        </div>
                        <div class="device-status">
                            <span class="status-badge ${d.status}">${d.status}</span>
                            <div class="device-toggle ${d.status === 'offline' ? 'off' : ''}" onclick="toggleDevice(this, '${d.id}')"></div>
                            <div class="device-actions">
                                <button><i class="fas fa-edit"></i></button>
                                <button><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="signal-info">
                        <div class="signal-bars">
                            ${getSignalBars(d.signal)}
                        </div>
                        <span>${d.signal.toFixed(1)} dBm</span>
                    </div>
                    <div class="device-details">
                        <div class="detail-item">
                            <label>Latitude</label>
                            <value>${d.lat.toFixed(5)}</value>
                        </div>
                        <div class="detail-item">
                            <label>Longitude</label>
                            <value>${d.lng.toFixed(5)}</value>
                        </div>
                        <div class="detail-item">
                            <label>Last Seen</label>
                            <value>${d.lastSeen}</value>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function toggleDevice(el, id) {
            el.classList.toggle('off');
            const isOff = el.classList.contains('off');
            showToast(`Device ${id} ${isOff ? 'disabled' : 'enabled'}`, 'success');
        }

        // ==========================================
        // ENHANCED USER MANAGEMENT
        // ==========================================

        function renderUsers() {
            const container = document.getElementById('usersList');
            document.getElementById('totalUsers').textContent = users.length;
            
            container.innerHTML = users.map(u => `
                <div class="user-card" data-user-id="${u.id}">
                    <div class="user-info-card">
                        <div class="user-avatar-large" style="color: ${u.role === 'admin' ? 'var(--accent-cyan)' : '#6b7280'};">
                            <i class="fas ${u.role === 'admin' ? 'fa-shield-alt' : 'fa-user'}"></i>
                        </div>
                        <div>
                            <h4>${u.username}</h4>
                            <p>${u.email}</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span class="role-badge ${u.role}">${u.role}</span>
                        <div class="user-actions">
                            <button onclick="openEditUserModal(${u.id})" title="Edit User">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete" onclick="deleteUser(${u.id})" title="Delete User">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Add User Modal
        function openAddUserModal() {
            document.getElementById('addUserModal').classList.add('active');
            // Clear fields
            document.getElementById('newUsername').value = '';
            document.getElementById('newEmail').value = '';
            document.getElementById('newRole').value = 'viewer';
            document.getElementById('newPassword').value = '';
        }

        function closeAddUserModal() {
            document.getElementById('addUserModal').classList.remove('active');
        }

        function saveNewUser() {
            const username = document.getElementById('newUsername').value.trim();
            const email = document.getElementById('newEmail').value.trim();
            const role = document.getElementById('newRole').value;
            const password = document.getElementById('newPassword').value;

            if (!username || !email || !password) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            if (users.find(u => u.username === username)) {
                showToast('Username already exists', 'error');
                return;
            }

            const newUser = {
                id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
                username,
                email,
                role,
                password
            };

            users.push(newUser);
            renderUsers();
            closeAddUserModal();
            showToast(`User ${username} created successfully`, 'success');
        }

        // Edit User Modal
        function openEditUserModal(userId) {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            editTarget = userId;
            document.getElementById('editUsername').value = user.username;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editRole').value = user.role;
            document.getElementById('editPassword').value = '';
            
            document.getElementById('editUserModal').classList.add('active');
        }

        function closeEditModal() {
            document.getElementById('editUserModal').classList.remove('active');
            editTarget = null;
        }

        function saveUserEdit() {
            if (!editTarget) return;

            const user = users.find(u => u.id === editTarget);
            if (!user) return;

            const newUsername = document.getElementById('editUsername').value.trim();
            const newEmail = document.getElementById('editEmail').value.trim();
            const newRole = document.getElementById('editRole').value;
            const newPassword = document.getElementById('editPassword').value;

            if (!newUsername || !newEmail) {
                showToast('Username and email are required', 'error');
                return;
            }

            // Check for duplicate username (excluding current user)
            if (newUsername !== user.username && users.find(u => u.username === newUsername)) {
                showToast('Username already exists', 'error');
                return;
            }

            // Update user
            user.username = newUsername;
            user.email = newEmail;
            user.role = newRole;
            if (newPassword) {
                user.password = newPassword;
            }

            renderUsers();
            closeEditModal();
            showToast(`User ${newUsername} updated successfully`, 'success');

            // Update current user display if editing self
            if (currentUser && currentUser.username === newUsername) {
                document.getElementById('currentUser').textContent = newUsername;
                currentUser.role = newRole.toUpperCase();
            }
        }

        // Delete User
        function deleteUser(userId) {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            // Prevent deleting yourself
            if (currentUser && currentUser.username === user.username) {
                showToast('Cannot delete your own account', 'error');
                return;
            }

            // Prevent deleting last admin
            if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
                showToast('Cannot delete the last admin user', 'error');
                return;
            }

            deleteTarget = userId;
            document.getElementById('deleteModal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('deleteModal').classList.remove('active');
            deleteTarget = null;
        }

        function confirmDelete() {
            if (deleteTarget) {
                const user = users.find(u => u.id === deleteTarget);
                users = users.filter(u => u.id !== deleteTarget);
                renderUsers();
                showToast(`User ${user.username} deleted`, 'success');
                closeModal();
            }
        }

        // Settings
        function saveSettings() {
            showToast('Settings saved successfully', 'success');
        }
