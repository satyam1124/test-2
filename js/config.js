// Application configuration and initial data
        let devices = [
            { id: 'MOB-001', name: 'Captain Smith', role: 'Captain', lat: 25.76934, lng: -80.17591, signal: -110.14, status: 'online', lastSeen: '7:11:50 AM' },
            { id: 'MOB-002', name: 'John Doe', role: 'Deck Hand', lat: 25.75043, lng: -80.18594, signal: -110.16, status: 'online', lastSeen: '6:56:44 AM', alert: true },
            { id: 'MOB-003', name: 'Jane Wilson', role: 'Deck Hand', lat: 25.76066, lng: -80.17218, signal: -113.33, status: 'offline', lastSeen: '6:55:44 AM' },
            { id: 'MOB-004', name: 'Mike Johnson', role: 'Engineer', lat: 25.75581, lng: -80.17028, signal: -74.16, status: 'online', lastSeen: '6:54:44 AM' }
        ];

        let alerts = [
            { id: 1, type: 'MAN OVERBOARD', device: 'MOB-002', severity: 'Critical', time: '7:10:35 AM', message: 'Device MOB-002 at 25.7592, -80.1934', icon: 'fa-user-slash' },
            { id: 2, type: 'RSSI LOW', device: 'MOB-003', severity: 'High', time: '7:12:48 AM', message: 'Critical signal strength (-115 dBm) for device MOB-003', icon: 'fa-signal' },
            { id: 3, type: 'GPS LOST', device: 'MOB-001', severity: 'Medium', time: '7:11:48 AM', message: 'GPS fix lost for device MOB-001', icon: 'fa-satellite-dish' }
        ];

        // ENHANCED: User data with edit capability
        let users = [
            { id: 1, username: 'admin', email: 'admin@mob.local', role: 'admin', password: 'admin123' },
            { id: 2, username: 'viewer', email: 'viewer@mob.local', role: 'viewer', password: 'viewer123' }
        ];

        let currentUser = null;
        let map = null;
        let currentLayer = 'satellite';
        let deleteTarget = null;
        let editTarget = null;

        // Layer definitions for colorful maps
        const mapLayers = {
            satellite: L.layerGroup([
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri',
                    maxZoom: 19
                }),
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap &copy; CARTO',
                    subdomains: 'abcd',
                    maxZoom: 20
                })
            ]),
            standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19
            }),
            dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            })
        };
