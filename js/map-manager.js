// Map management and display logic
        // ==========================================
        // MAP MANAGER
        // ==========================================
        
        const MapManager = {
            map: null,
            layers: {},
            markers: {},
            searchPattern: null,
            mobMarker: null,

            init() {
                const mapContainer = document.getElementById('map');
                if (!mapContainer) return;
                
                this.map = L.map('map', { 
                    zoomControl: false,
                    center: [50.6, -1.5],
                    zoom: 9
                });

                this.layers = {
                    satellite: L.layerGroup([
                        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                            attribution: 'Esri',
                            maxZoom: 19
                        }),
                        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
                            attribution: '&copy; CARTO',
                            subdomains: 'abcd',
                            maxZoom: 20
                        })
                    ]),
                    standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap',
                        maxZoom: 19
                    }),
                    nautical: L.layerGroup([
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
                        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
                            attribution: 'OpenSeaMap'
                        })
                    ])
                };

                this.layers.satellite.addTo(this.map);
                L.control.zoom({ position: 'bottomright' }).addTo(this.map);
                
                const vesselIcon = L.divIcon({
                    className: 'vessel-icon',
                    html: '<i class="fas fa-ship" style="font-size: 28px; color: #00d4ff; filter: drop-shadow(0 0 10px rgba(0,212,255,0.8));"></i>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });

                const startPos = TelemetrySystem.SHIPPING_ROUTE[0];
                this.markers.vessel = L.marker([startPos.lat, startPos.lon], { 
                    icon: vesselIcon, 
                    zIndexOffset: 1000 
                }).addTo(this.map);
                
                this.markers.vessel.bindPopup(`
                    <b>M/V ATLANTIC GUARDIAN</b><br>
                    IMO: 9876543<br>
                    Type: Container Ship<br>
                    Following TSS Westbound
                `);
                
                TelemetrySystem.crew.forEach(c => this.updateCrewMarker(c));
            },

            changeTheme(theme) {
                if (!this.map) return;
                
                Object.values(this.layers).forEach(layer => {
                    if (this.map.hasLayer(layer)) this.map.removeLayer(layer);
                });
                
                this.layers[theme].addTo(this.map);
            },

            updateVesselPosition(lat, lon, heading) {
                if (!this.map || !this.markers.vessel) return;
                
                this.markers.vessel.setLatLng([lat, lon]);
                
                const iconElement = this.markers.vessel.getElement();
                if (iconElement) {
                    const icon = iconElement.querySelector('i');
                    if (icon) {
                        icon.style.transform = `rotate(${heading}deg)`;
                        icon.style.transition = 'transform 0.3s ease';
                    }
                }
            },

            updateCrewMarker(member) {
                if (!this.map) return;
                
                const colors = {
                    safe: '#00ff88',
                    warning: '#ffaa00',
                    alert: '#ff3333',
                    mob: '#ff00ff'
                };

                const isMob = member.status === 'mob';
                const size = isMob ? 24 : 12;
                
                let iconHtml;
                if (isMob) {
                    iconHtml = `
                        <div style="
                            width: 24px; 
                            height: 24px; 
                            background: radial-gradient(circle, #ff3333 30%, #ff0000 100%);
                            border-radius: 50%; 
                            border: 3px solid white; 
                            box-shadow: 0 0 30px rgba(255,51,51,1);
                            animation: mob-pulse 1s infinite;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="fas fa-user" style="color: white; font-size: 10px;"></i>
                        </div>
                    `;
                } else {
                    iconHtml = `
                        <div style="
                            background: ${colors[member.status]}; 
                            width: ${size}px; 
                            height: ${size}px; 
                            border-radius: 50%; 
                            border: 2px solid white; 
                            box-shadow: 0 0 10px ${colors[member.status]};
                        "></div>
                    `;
                }

                const icon = L.divIcon({
                    className: isMob ? 'mob-icon-map' : 'crew-icon',
                    html: iconHtml,
                    iconSize: [size, size],
                    iconAnchor: [size/2, size/2]
                });

                if (this.markers[member.id]) {
                    this.markers[member.id].setLatLng([member.position.lat, member.position.lon]);
                    this.markers[member.id].setIcon(icon);
                } else {
                    this.markers[member.id] = L.marker([member.position.lat, member.position.lon], { 
                        icon,
                        zIndexOffset: isMob ? 1000 : 100
                    }).addTo(this.map);
                }

                const popupContent = isMob ? `
                    <div style="min-width: 200px;">
                        <div style="background: #ff3333; color: white; padding: 8px; margin: -14px -20px 10px -20px; border-radius: 12px 12px 0 0; text-align: center; font-weight: bold;">
                            <i class="fas fa-exclamation-triangle"></i> MAN OVERBOARD
                        </div>
                        <b>${member.name}</b> (${member.id})<br>
                        <span style="color: #ff3333; font-weight: bold;">${member.role}</span><br>
                        <hr style="border-color: #333; margin: 8px 0;">
                        <table style="width: 100%; font-size: 0.85rem;">
                            <tr><td>Heart Rate:</td><td style="text-align: right; color: ${member.biometrics.heartRate > 140 ? '#ff3333' : '#00ff88'};">${Math.round(member.biometrics.heartRate)} bpm</td></tr>
                            <tr><td>Core Temp:</td><td style="text-align: right; color: ${member.biometrics.bodyTemp < 35 ? '#ff3333' : '#00ff88'};">${member.biometrics.bodyTemp.toFixed(1)}°C</td></tr>
                            <tr><td>Battery:</td><td style="text-align: right; color: ${member.deviceBattery < 20 ? '#ff3333' : '#00ff88'};">${member.deviceBattery.toFixed(0)}%</td></tr>
                        </table>
                    </div>
                ` : `
                    <b>${member.name}</b> (${member.id})<br>
                    ${member.role}<br>
                    Status: <span style="color: ${colors[member.status]}; font-weight: bold;">${member.status.toUpperCase()}</span>
                `;

                this.markers[member.id].bindPopup(popupContent);
                
                if (isMob && !member.popupOpened) {
                    this.markers[member.id].openPopup();
                    member.popupOpened = true;
                }
            },

            addMOBMarker(member) {
                if (this.mobMarker) {
                    this.map.removeLayer(this.mobMarker);
                }
                
                this.mobMarker = L.circle([member.position.lat, member.position.lon], {
                    color: '#ff3333',
                    fillColor: '#ff3333',
                    fillOpacity: 0.1,
                    radius: 200, // Start smaller
                    weight: 2,
                    dashArray: '5, 5'
                }).addTo(this.map);
                
                let radius = 200;
                const expandCircle = () => {
                    if (!this.mobMarker || member.status !== 'mob') return;
                    radius += 5; // Slower expansion
                    this.mobMarker.setRadius(radius);
                    setTimeout(expandCircle, 1000);
                };
                expandCircle();
            },

            clearMOBMarker() {
                if (this.mobMarker) {
                    this.map.removeLayer(this.mobMarker);
                    this.mobMarker = null;
                }
            },

            drawExpandingSquareSearch(datum, windDir) {
                if (!this.map) return;
                if (this.searchPattern) this.map.removeLayer(this.searchPattern);
                
                const searchSpeed = 8;
                const legTime = 0.083;
                const legs = 12; // Reduced for visibility
                
                const points = [[datum.lat, datum.lon]];
                let currentPos = {...datum};
                let legLength = searchSpeed * legTime;
                
                const latFactor = 1/60;
                const lonFactor = 1/(60 * Math.cos(datum.lat * Math.PI/180));
                
                let currentDir = (windDir + 180) % 360;
                
                for (let i = 0; i < legs; i++) {
                    if (i % 2 === 1) {
                        currentDir = (currentDir + 90) % 360;
                    }
                    
                    if (i > 0 && i % 2 === 0) {
                        legLength += searchSpeed * legTime;
                    }
                    
                    const rad = currentDir * Math.PI / 180;
                    currentPos.lat += legLength * Math.cos(rad) * latFactor;
                    currentPos.lon += legLength * Math.sin(rad) * lonFactor;
                    
                    points.push([currentPos.lat, currentPos.lon]);
                }

                this.searchPattern = L.polyline(points, {
                    color: '#ffaa00',
                    weight: 3,
                    dashArray: '10, 5',
                    opacity: 0.9
                }).addTo(this.map);
                
                L.circleMarker([datum.lat, datum.lon], {
                    radius: 8,
                    fillColor: '#ffaa00',
                    color: '#fff',
                    weight: 2,
                    fillOpacity: 1
                }).addTo(this.map).bindPopup('Search Datum');
                
                // Fit map to show search pattern
                this.map.fitBounds(this.searchPattern.getBounds().pad(0.2));
            },

            clearSearchPattern() {
                if (this.searchPattern && this.map) {
                    this.map.removeLayer(this.searchPattern);
                    this.searchPattern = null;
                }
            }
        };
