// Telemetry system for simulation
        // ==========================================
        // REALISTIC MARITIME SIMULATION SYSTEM
        // ==========================================
        
        const TelemetrySystem = {
            vessel: null,
            crew: [],
            alerts: [],
            isRunning: false,
            simulationInterval: null,
            speedMultiplier: 1,
            audioContext: null,
            dataPoints: 0,
            mobVictim: null,
            recoveryMode: false,
            recoveryPhase: 0,
            recoveryStartTime: null,
            originalHeading: null,
            trailHistory: [],
            sarPatternActive: false,
            
            PHYSICS: {
                DRIFT_FACTOR: 0.02,
                LEEWAY_COEFF: 0.03,
                SEARCH_SPEED: 8,
                HEART_RATE_BASE: 72,
                HEART_RATE_STRESS: 140,
                BODY_TEMP_NORMAL: 37.0,
                BODY_TEMP_DROP: 0.5,
                NM_TO_DEG: 1/60,
                KNOTS_TO_DEG_PER_SEC: 1/3600/60
            },

            // Fixed shipping route - all points in water
            SHIPPING_ROUTE: [
                {lat: 51.1200, lon: 1.3500, name: "Dover Strait Entrance"},
                {lat: 51.0800, lon: 1.2000, name: "Off Folkestone"},
                {lat: 51.0200, lon: 0.9500, name: "Mid Channel"},
                {lat: 50.9500, lon: 0.7500, name: "South of Varne Bank"},
                {lat: 50.9000, lon: 0.5500, name: "Channel Central"},
                {lat: 50.8500, lon: 0.3500, name: "Approaching Casquets"},
                {lat: 50.8200, lon: 0.1500, name: "Off Beachy Head"},
                {lat: 50.7800, lon: -0.1500, name: "Royal Sovereign"},
                {lat: 50.7500, lon: -0.4500, name: "Eastbourne Area"},
                {lat: 50.7200, lon: -0.7500, name: "Off Hastings"},
                {lat: 50.7000, lon: -1.0500, name: "Rye Bay"},
                {lat: 50.6800, lon: -1.2500, name: "Dungeness South"},
                {lat: 50.6500, lon: -1.4500, name: "Folkestone South"},
                {lat: 50.6200, lon: -1.6500, name: "Off Hythe"},
                {lat: 50.6000, lon: -1.8500, name: "Southampton Approach"},
                {lat: 50.5800, lon: -2.0500, name: "Needles Channel"},
                {lat: 50.5500, lon: -2.2500, name: "Off The Needles"},
                {lat: 50.5200, lon: -2.4500, name: "Poole Bay South"},
                {lat: 50.4800, lon: -2.6500, name: "St Albans Head"},
                {lat: 50.4500, lon: -2.8500, name: "Anvil Point"},
                {lat: 50.4200, lon: -3.0500, name: "Weymouth Bay"},
                {lat: 50.3800, lon: -3.2500, name: "Portland Bill South"},
                {lat: 50.3500, lon: -3.4500, name: "Lyme Bay Entrance"},
                {lat: 50.3000, lon: -3.6500, name: "Off Torquay"},
                {lat: 50.2500, lon: -3.8500, name: "Start Point South"},
                {lat: 50.2000, lon: -4.0500, name: "Plymouth Approach"},
                {lat: 50.1500, lon: -4.2500, name: "Eddystone South"},
                {lat: 50.1000, lon: -4.4500, name: "Lizard Point East"},
                {lat: 50.0500, lon: -4.6500, name: "Off Falmouth"},
                {lat: 50.0000, lon: -4.8500, name: "Land's End Approach"},
                {lat: 49.9000, lon: -5.2000, name: "Celtic Sea Entrance"},
                {lat: 49.7500, lon: -5.5000, name: "Atlantic Westbound"}
            ],

            ENVIRONMENT_PRESETS: {
                channel: { 
                    windSpeed: 15, windDir: 315, currentSpeed: 2.3, currentDir: 240, 
                    waveHeight: 2.1, waterTemp: 12.5, visibility: 8,
                    currentName: "English Channel"
                },
                med: { 
                    windSpeed: 10, windDir: 180, currentSpeed: 1.2, currentDir: 90, 
                    waveHeight: 0.8, waterTemp: 22.0, visibility: 12,
                    currentName: "Mediterranean"
                },
                arctic: { 
                    windSpeed: 25, windDir: 45, currentSpeed: 3.5, currentDir: 200, 
                    waveHeight: 4.2, waterTemp: 2.0, visibility: 5,
                    currentName: "Arctic"
                },
                tropical: { 
                    windSpeed: 8, windDir: 120, currentSpeed: 1.5, currentDir: 60, 
                    waveHeight: 1.2, waterTemp: 28.0, visibility: 15,
                    currentName: "Tropical"
                }
            },

            init() {
                console.log('Initializing Maritime Simulation...');
                this.initAudio();
                this.initializeScenario();
                
                setTimeout(() => {
                    MapManager.init();
                    this.drawShippingRoute();
                    this.startSimulation();
                    this.updateUI();
                    this.updateRecoveryButton();
                }, 100);
                
                setInterval(() => {
                    const now = new Date();
                    const timeEl = document.getElementById('utc-time');
                    if (timeEl) timeEl.textContent = now.toISOString().split('T')[1].split('.')[0];
                }, 1000);
            },

            initAudio() {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                } catch(e) {
                    console.warn('Audio not supported');
                }
            },

            initializeScenario() {
                const startPos = this.SHIPPING_ROUTE[0];
                
                this.vessel = {
                    name: "M/V ATLANTIC GUARDIAN",
                    type: "Container Ship",
                    imo: "9876543",
                    position: { ...startPos },
                    heading: 260,
                    speed: 18.5,
                    draft: 12.5,
                    course: 260,
                    waypointIndex: 0,
                    turning: false
                };

                this.environment = { ...this.ENVIRONMENT_PRESETS.channel };
                this.trailHistory = [{...startPos}];

                this.crew = [
                    {
                        id: 'C001', name: 'John Smith', role: 'Chief Officer', age: 34,
                        weight: 85, height: 180, swimmingAbility: 'excellent',
                        clothing: 'immersion_suit', deviceBattery: 98,
                        position: { lat: startPos.lat, lon: startPos.lon },
                        status: 'safe',
                        biometrics: { heartRate: 72, bodyTemp: 37.0, oxygenSat: 98 },
                        history: []
                    },
                    {
                        id: 'C002', name: 'Maria Garcia', role: 'Second Engineer', age: 29,
                        weight: 65, height: 165, swimmingAbility: 'good',
                        clothing: 'work_uniform', deviceBattery: 87,
                        position: { lat: startPos.lat, lon: startPos.lon },
                        status: 'safe',
                        biometrics: { heartRate: 68, bodyTemp: 36.8, oxygenSat: 99 },
                        history: []
                    },
                    {
                        id: 'C003', name: 'Chen Wei', role: 'Able Seaman', age: 42,
                        weight: 75, height: 172, swimmingAbility: 'moderate',
                        clothing: 'safety_vest', deviceBattery: 92,
                        position: { lat: startPos.lat, lon: startPos.lon },
                        status: 'safe',
                        biometrics: { heartRate: 75, bodyTemp: 37.1, oxygenSat: 97 },
                        history: []
                    },
                    {
                        id: 'C004', name: 'Sarah Johnson', role: 'Deck Cadet', age: 23,
                        weight: 60, height: 168, swimmingAbility: 'basic',
                        clothing: 'regular_clothes', deviceBattery: 45,
                        position: { lat: startPos.lat, lon: startPos.lon },
                        status: 'safe',
                        biometrics: { heartRate: 80, bodyTemp: 37.0, oxygenSat: 98 },
                        history: []
                    }
                ];

                this.logEvent('SYSTEM', 'Simulation initialized - English Channel TSS');
                this.logEvent('NAV', `Starting at: ${startPos.name}`);
            },

            drawShippingRoute() {
                if (!MapManager.map) return;
                
                const routePoints = this.SHIPPING_ROUTE.map(p => [p.lat, p.lon]);
                
                L.polyline(routePoints, {
                    color: '#00d4ff',
                    weight: 4,
                    dashArray: '20, 10',
                    opacity: 0.7
                }).addTo(MapManager.map).bindPopup('IMO Traffic Separation Scheme - Westbound Lane');
                
                this.SHIPPING_ROUTE.forEach((wp, index) => {
                    if (index % 5 === 0 || index === this.SHIPPING_ROUTE.length - 1) {
                        L.circleMarker([wp.lat, wp.lon], {
                            radius: 4,
                            fillColor: '#00d4ff',
                            color: '#fff',
                            weight: 1,
                            fillOpacity: 0.8
                        }).addTo(MapManager.map).bindPopup(`Waypoint: ${wp.name}`);
                    }
                });
            },

            startSimulation() {
                if (this.isRunning) return;
                this.isRunning = true;
                this.simulationInterval = setInterval(() => {
                    this.simulationStep();
                }, 1000 / this.speedMultiplier);
            },

            simulationStep() {
                try {
                    if (this.recoveryMode) {
                        this.executeRecoveryStep();
                    } else {
                        this.updateVesselPosition();
                    }
                    
                    this.updateCrewPositions();
                    this.updateBiometrics();
                    this.checkAlerts();
                    this.updateTrail();
                    this.updateUI();
                    this.dataPoints++;
                } catch (e) {
                    console.error('Simulation step error:', e);
                }
            },

            updateVesselPosition() {
                if (this.vessel.turning) return;

                const route = this.SHIPPING_ROUTE;
                let currentWP = route[this.vessel.waypointIndex];
                let nextWP = route[this.vessel.waypointIndex + 1];
                
                if (!nextWP) {
                    this.vessel.waypointIndex = 0;
                    currentWP = route[0];
                    nextWP = route[1];
                    this.logEvent('NAV', 'Route completed - Restarting from Dover Strait');
                }

                const desiredHeading = this.calculateHeading(currentWP, nextWP);
                const headingDiff = this.normalizeAngle(desiredHeading - this.vessel.heading);
                const maxTurn = 0.8 * this.speedMultiplier;
                const turn = Math.max(-maxTurn, Math.min(maxTurn, headingDiff));
                
                this.vessel.heading += turn;
                this.vessel.heading = (this.vessel.heading + 360) % 360;
                this.vessel.course = desiredHeading;

                const speedDegPerSec = (this.vessel.speed * this.PHYSICS.KNOTS_TO_DEG_PER_SEC);
                const headingRad = (this.vessel.heading * Math.PI) / 180;
                
                const dLat = speedDegPerSec * Math.cos(headingRad) * this.speedMultiplier;
                const dLon = (speedDegPerSec * Math.sin(headingRad)) / 
                    Math.cos(this.vessel.position.lat * Math.PI / 180) * this.speedMultiplier;
                
                this.vessel.position.lat += dLat;
                this.vessel.position.lon += dLon;

                const distToNext = this.calculateDistance(this.vessel.position, nextWP);
                if (distToNext < 0.3) {
                    this.vessel.waypointIndex++;
                    this.logEvent('NAV', `Passed waypoint: ${nextWP.name}`);
                }

                if (this.dataPoints % 10 === 0) {
                    this.trailHistory.push({
                        lat: this.vessel.position.lat,
                        lon: this.vessel.position.lon
                    });
                    if (this.trailHistory.length > 300) this.trailHistory.shift();
                }

                if (MapManager.map && MapManager.markers.vessel) {
                    MapManager.updateVesselPosition(
                        this.vessel.position.lat, 
                        this.vessel.position.lon, 
                        this.vessel.heading
                    );
                }
                
                const coordsEl = document.getElementById('vessel-coords');
                if (coordsEl) coordsEl.textContent = 
                    `Vessel: ${this.formatCoords(this.vessel.position.lat, this.vessel.position.lon)}`;
                
                const speedEl = document.getElementById('vessel-speed');
                if (speedEl) speedEl.textContent = this.vessel.speed.toFixed(1);
                
                const laneEl = document.getElementById('lane-info');
                if (laneEl) {
                    const nextName = nextWP ? nextWP.name : 'Route end';
                    laneEl.innerHTML = `<i class="fas fa-info-circle"></i> Next: ${nextName} (${distToNext.toFixed(1)} NM)`;
                }
            },

            calculateHeading(from, to) {
                const dLon = (to.lon - from.lon) * Math.PI / 180;
                const lat1 = from.lat * Math.PI / 180;
                const lat2 = to.lat * Math.PI / 180;
                
                const y = Math.sin(dLon) * Math.cos(lat2);
                const x = Math.cos(lat1) * Math.sin(lat2) - 
                          Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
                
                let heading = Math.atan2(y, x) * 180 / Math.PI;
                return (heading + 360) % 360;
            },

            calculateDistance(p1, p2) {
                const R = 3440;
                const dLat = (p2.lat - p1.lat) * Math.PI / 180;
                const dLon = (p2.lon - p1.lon) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c;
            },

            normalizeAngle(angle) {
                while (angle > 180) angle -= 360;
                while (angle < -180) angle += 360;
                return angle;
            },

            // FIXED: Recovery button now properly starts the turn
            startRecovery() {
                if (!this.mobVictim) {
                    this.logEvent('WARN', 'No active MOB to recover');
                    return;
                }
                
                if (this.recoveryMode) {
                    this.logEvent('WARN', 'Recovery already in progress');
                    return;
                }
                
                this.recoveryMode = true;
                this.recoveryPhase = 0;
                this.recoveryStartTime = Date.now();
                this.originalHeading = this.vessel.heading;
                
                const maneuver = document.getElementById('maneuver-type').value;
                this.logEvent('RECOVERY', `Initiating ${maneuver.toUpperCase()} turn for MOB recovery`);
                
                const indicator = document.getElementById('maneuver-indicator');
                if (indicator) {
                    indicator.style.display = 'block';
                    indicator.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> EXECUTING ${maneuver.toUpperCase()} TURN`;
                }
                
                this.updateRecoveryButton();
            },

            executeRecoveryStep() {
                const maneuver = document.getElementById('maneuver-type').value;
                
                if (maneuver === 'williamson') {
                    this.executeWilliamsonTurn();
                } else if (maneuver === 'anderson') {
                    this.executeAndersonTurn();
                } else if (maneuver === 'scharnow') {
                    this.executeScharnowTurn();
                }
            },

            executeWilliamsonTurn() {
                const mobBearing = this.calculateBearingToMOB();
                const turnSide = mobBearing > this.vessel.heading ? 1 : -1;
                
                if (this.recoveryPhase === 0) {
                    // Phase 1: Turn 60° toward casualty side
                    const targetChange = 60 * turnSide;
                    const currentChange = this.normalizeAngle(this.vessel.heading - this.originalHeading);
                    
                    if (Math.abs(currentChange) < Math.abs(targetChange)) {
                        this.vessel.heading += turnSide * 2 * this.speedMultiplier;
                        this.vessel.heading = (this.vessel.heading + 360) % 360;
                    } else {
                        this.recoveryPhase = 1;
                        this.logEvent('RECOVERY', 'Williamson: Rudder hard over to opposite side');
                    }
                } else if (this.recoveryPhase === 1) {
                    // Phase 2: Turn opposite direction to reciprocal
                    const reciprocal = (this.originalHeading + 180) % 360;
                    const target = reciprocal + (20 * -turnSide);
                    let diff = this.normalizeAngle(target - this.vessel.heading);
                    
                    if (Math.abs(diff) > 5) {
                        this.vessel.heading += -turnSide * 2 * this.speedMultiplier;
                        this.vessel.heading = (this.vessel.heading + 360) % 360;
                    } else {
                        this.recoveryPhase = 2;
                        this.logEvent('RECOVERY', 'Williamson: Approaching reciprocal course');
                    }
                } else {
                    // Phase 3: Slow down and complete
                    this.vessel.speed = Math.max(5, this.vessel.speed - 0.5 * this.speedMultiplier);
                    
                    if (this.vessel.speed <= 5) {
                        this.recoveryMode = false;
                        this.logEvent('RECOVERY', 'Williamson turn complete - commencing search');
                        
                        const indicator = document.getElementById('maneuver-indicator');
                        if (indicator) indicator.style.display = 'none';
                        
                        this.initiateSearchPattern();
                    }
                }
                
                this.moveVesselDuringTurn();
            },

            executeAndersonTurn() {
                const mobBearing = this.calculateBearingToMOB();
                const turnSide = mobBearing > this.vessel.heading ? 1 : -1;
                
                const targetChange = 250 * turnSide;
                const currentChange = this.normalizeAngle(this.vessel.heading - this.originalHeading);
                
                if (Math.abs(currentChange) < Math.abs(targetChange)) {
                    this.vessel.heading += turnSide * 3 * this.speedMultiplier;
                    this.vessel.heading = (this.vessel.heading + 360) % 360;
                } else {
                    this.vessel.speed = Math.max(5, this.vessel.speed - 1 * this.speedMultiplier);
                    if (this.vessel.speed <= 5) {
                        this.recoveryMode = false;
                        this.logEvent('RECOVERY', 'Anderson turn complete');
                        
                        const indicator = document.getElementById('maneuver-indicator');
                        if (indicator) indicator.style.display = 'none';
                        
                        this.initiateSearchPattern();
                    }
                }
                
                this.moveVesselDuringTurn();
            },

            executeScharnowTurn() {
                const mobBearing = this.calculateBearingToMOB();
                const turnSide = mobBearing > this.vessel.heading ? 1 : -1;
                
                const targetChange = 240 * turnSide;
                const currentChange = this.normalizeAngle(this.vessel.heading - this.originalHeading);
                
                if (Math.abs(currentChange) < Math.abs(targetChange)) {
                    this.vessel.heading += turnSide * 2.5 * this.speedMultiplier;
                    this.vessel.heading = (this.vessel.heading + 360) % 360;
                } else {
                    const reciprocal = (this.originalHeading + 180) % 360;
                    const diff = this.normalizeAngle(reciprocal - this.vessel.heading);
                    if (Math.abs(diff) > 3) {
                        this.vessel.heading += (diff > 0 ? 1 : -1) * this.speedMultiplier;
                        this.vessel.heading = (this.vessel.heading + 360) % 360;
                    } else {
                        this.recoveryMode = false;
                        this.vessel.speed = 5;
                        this.logEvent('RECOVERY', 'Scharnow turn complete');
                        
                        const indicator = document.getElementById('maneuver-indicator');
                        if (indicator) indicator.style.display = 'none';
                        
                        this.initiateSearchPattern();
                    }
                }
                
                this.moveVesselDuringTurn();
            },

            moveVesselDuringTurn() {
                const speedDegPerSec = (this.vessel.speed * this.PHYSICS.KNOTS_TO_DEG_PER_SEC);
                const headingRad = (this.vessel.heading * Math.PI) / 180;
                
                this.vessel.position.lat += speedDegPerSec * Math.cos(headingRad) * this.speedMultiplier;
                this.vessel.position.lon += (speedDegPerSec * Math.sin(headingRad)) / 
                    Math.cos(this.vessel.position.lat * Math.PI / 180) * this.speedMultiplier;
                
                if (MapManager.map && MapManager.markers.vessel) {
                    MapManager.updateVesselPosition(
                        this.vessel.position.lat, 
                        this.vessel.position.lon, 
                        this.vessel.heading
                    );
                }
            },

            calculateBearingToMOB() {
                if (!this.mobVictim) return this.vessel.heading;
                return this.calculateHeading(this.vessel.position, this.mobVictim.position);
            },

            updateCrewPositions() {
                this.crew.forEach(member => {
                    if (member.status === 'mob') {
                        const drift = this.calculateDrift(member);
                        member.position.lat += drift.dLat;
                        member.position.lon += drift.dLon;
                        member.deviceBattery -= 0.02 * this.speedMultiplier;
                        if (member.deviceBattery < 0) member.deviceBattery = 0;
                        
                        if (this.dataPoints % 5 === 0) {
                            member.history.push({
                                lat: member.position.lat,
                                lon: member.position.lon,
                                time: Date.now(),
                                temp: member.biometrics.bodyTemp
                            });
                            if (member.history.length > 100) member.history.shift();
                        }
                        
                        if (MapManager.map && member.history.length > 1) {
                            this.updateMOBTrail(member);
                        }
                    } else {
                        // Crew stays on vessel - very small random movement
                        member.position.lat = this.vessel.position.lat + (Math.random() - 0.5) * 0.00002;
                        member.position.lon = this.vessel.position.lon + (Math.random() - 0.5) * 0.00002;
                    }
                    
                    if (MapManager.map) {
                        MapManager.updateCrewMarker(member);
                    }
                });
            },

            calculateDrift(person) {
                const windRad = (this.environment.windDir * Math.PI) / 180;
                const currentRad = (this.environment.currentDir * Math.PI) / 180;
                
                const currentSpeedDeg = (this.environment.currentSpeed * this.PHYSICS.KNOTS_TO_DEG_PER_SEC);
                const currentLat = currentSpeedDeg * Math.cos(currentRad) * this.speedMultiplier;
                const currentLon = (currentSpeedDeg * Math.sin(currentRad)) / 
                    Math.cos(person.position.lat * Math.PI / 180) * this.speedMultiplier;
                
                let leewayFactor = 0.03;
                if (person.clothing === 'immersion_suit') leewayFactor = 0.05;
                else if (person.clothing === 'safety_vest') leewayFactor = 0.04;
                else if (person.clothing === 'regular_clothes') leewayFactor = 0.035;
                
                const leewaySpeed = (this.environment.windSpeed * leewayFactor * this.PHYSICS.KNOTS_TO_DEG_PER_SEC);
                const leewayLat = leewaySpeed * Math.cos(windRad) * this.speedMultiplier;
                const leewayLon = (leewaySpeed * Math.sin(windRad)) / 
                    Math.cos(person.position.lat * Math.PI / 180) * this.speedMultiplier;
                
                const stokesSpeed = (this.environment.waveHeight * 0.1 * this.PHYSICS.KNOTS_TO_DEG_PER_SEC);
                const stokesLat = stokesSpeed * Math.cos(windRad) * this.speedMultiplier;
                const stokesLon = (stokesSpeed * Math.sin(windRad)) / 
                    Math.cos(person.position.lat * Math.PI / 180) * this.speedMultiplier;
                
                let swimLat = 0, swimLon = 0;
                if (person.biometrics.bodyTemp > 35 && person.conscious !== false && 
                    person.swimmingAbility !== 'none') {
                    const swimSpeed = person.swimmingAbility === 'excellent' ? 0.5 : 
                                     person.swimmingAbility === 'good' ? 0.3 : 0.1;
                    const swimSpeedDeg = (swimSpeed * this.PHYSICS.KNOTS_TO_DEG_PER_SEC);
                    swimLat = swimSpeedDeg * Math.cos(currentRad) * this.speedMultiplier * 0.3;
                    swimLon = (swimSpeedDeg * Math.sin(currentRad)) / 
                        Math.cos(person.position.lat * Math.PI / 180) * this.speedMultiplier * 0.3;
                }
                
                return {
                    dLat: currentLat + leewayLat + stokesLat + swimLat,
                    dLon: currentLon + leewayLon + stokesLon + swimLon,
                    totalSpeed: Math.sqrt(Math.pow(currentLat + leewayLat, 2) + 
                                         Math.pow(currentLon + leewayLon, 2)) * 3600 * 60
                };
            },

            updateMOBTrail(member) {
                if (!MapManager.map) return;
                
                const points = member.history.map(h => [h.lat, h.lon]);
                
                if (member.trailLine) {
                    MapManager.map.removeLayer(member.trailLine);
                }
                
                member.trailLine = L.polyline(points, {
                    color: '#ff3333',
                    weight: 3,
                    dashArray: '5, 5',
                    opacity: 0.8
                }).addTo(MapManager.map);
            },

            updateBiometrics() {
                this.crew.forEach(member => {
                    if (member.status === 'mob') {
                        const timeInWater = (Date.now() - member.mobTime) / 1000;
                        const hoursInWater = timeInWater / 3600;
                        
                        let insulationFactor = 1.0;
                        if (member.clothing === 'immersion_suit') insulationFactor = 0.2;
                        else if (member.clothing === 'safety_vest') insulationFactor = 0.7;
                        else if (member.clothing === 'work_uniform') insulationFactor = 0.85;
                        
                        if (hoursInWater < 0.05) {
                            member.biometrics.heartRate = Math.min(180, 160 + Math.random() * 20);
                        } else {
                            const tempDrop = this.PHYSICS.BODY_TEMP_DROP * hoursInWater * insulationFactor;
                            member.biometrics.bodyTemp = Math.max(30, this.PHYSICS.BODY_TEMP_NORMAL - tempDrop);
                            
                            if (hoursInWater < 0.5) {
                                member.biometrics.heartRate = Math.min(160, 140 + Math.random() * 15);
                            } else if (hoursInWater < 2) {
                                member.biometrics.heartRate = 120 + Math.random() * 20;
                            } else {
                                member.biometrics.heartRate = Math.max(40, 90 - (hoursInWater * 15));
                            }
                        }
                        
                        if (member.biometrics.bodyTemp < 33) {
                            member.conscious = false;
                            member.biometrics.heartRate *= 0.8;
                        }
                        
                        if (member.biometrics.bodyTemp < 28) {
                            member.biometrics.heartRate = 0;
                        }
                    }
                });
            },

            checkAlerts() {
                this.crew.forEach(member => {
                    if (member.deviceBattery < 20 && !member.lowBatteryAlert) {
                        this.triggerAlert('warning', `Low battery: ${member.name} (${member.deviceBattery.toFixed(1)}%)`);
                        member.lowBatteryAlert = true;
                    }
                    
                    if (member.status === 'mob') {
                        if (member.biometrics.bodyTemp < 32 && !member.hypothermiaAlert) {
                            this.triggerAlert('critical', `Severe hypothermia: ${member.name} (${member.biometrics.bodyTemp.toFixed(1)}°C)`);
                            member.hypothermiaAlert = true;
                        }
                        
                        if (member.biometrics.bodyTemp < 28 && !member.deathAlert) {
                            this.triggerAlert('critical', `CRITICAL: ${member.name} - Cardiac arrest likely`);
                            member.deathAlert = true;
                        }
                    }
                });
            },

            triggerAlert(severity, message) {
                const alert = {
                    id: Date.now(),
                    severity,
                    message,
                    timestamp: new Date()
                };
                
                this.alerts.push(alert);
                if (this.alerts.length > 50) this.alerts.shift();
                
                if (severity === 'critical' || severity === 'mob') {
                    this.playAlertSound();
                }
                
                this.logEvent(severity.toUpperCase(), message);
                this.updateUI();
            },

            playAlertSound() {
                if (!this.audioContext) return;
                
                const now = this.audioContext.currentTime;
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.type = 'square';
                osc.frequency.setValueAtTime(1300, now);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                
                osc.start(now);
                osc.stop(now + 0.5);
                
                setTimeout(() => {
                    if (!this.audioContext) return;
                    const osc2 = this.audioContext.createOscillator();
                    const gain2 = this.audioContext.createGain();
                    osc2.connect(gain2);
                    gain2.connect(this.audioContext.destination);
                    osc2.type = 'square';
                    osc2.frequency.setValueAtTime(1300, this.audioContext.currentTime);
                    gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    osc2.start();
                    osc2.stop(this.audioContext.currentTime + 0.5);
                }, 700);
            },

            // FIXED: MOB position now correctly calculated relative to vessel
            simulateMOB() {
                const victim = this.crew[Math.floor(Math.random() * this.crew.length)];
                
                // FIXED: Proper fall calculation - person falls from vessel position with small offset
                // No random large offsets that put them on land
                const fallDistance = 0.0001 + (Math.random() * 0.0001); // 10-20 meters from ship
                const fallAngle = Math.random() * Math.PI * 2; // Random direction
                
                // Calculate fall position based on vessel heading and fall direction
                const fallOffsetLat = Math.cos(fallAngle) * fallDistance;
                const fallOffsetLon = Math.sin(fallAngle) * fallDistance / Math.cos(this.vessel.position.lat * Math.PI / 180);
                
                victim.status = 'mob';
                victim.mobTime = Date.now();
                
                // FIXED: Position is exactly at vessel position plus small fall offset
                victim.position = { 
                    lat: this.vessel.position.lat + fallOffsetLat,
                    lon: this.vessel.position.lon + fallOffsetLon
                };
                
                victim.biometrics.heartRate = 160;
                victim.conscious = true;
                victim.hypothermiaAlert = false;
                victim.deathAlert = false;
                victim.history = [{
                    lat: victim.position.lat,
                    lon: victim.position.lon,
                    time: Date.now(),
                    temp: 37.0
                }];
                
                this.mobVictim = victim;
                this.mobGPSPosition = {...victim.position};
                
                this.triggerAlert('mob', `MAN OVERBOARD: ${victim.name} (${victim.role})`);
                this.showMOBModal(victim);
                
                if (MapManager.map) {
                    MapManager.map.setView([victim.position.lat, victim.position.lon], 16);
                    MapManager.addMOBMarker(victim);
                }
                
                this.logEvent('MOB', `Person in water: ${victim.name}`);
                this.logEvent('MOB', `Position: ${this.formatCoords(victim.position.lat, victim.position.lon)}`);
                this.updateRecoveryButton();
            },

            showMOBModal(victim) {
                const modal = document.getElementById('mob-modal');
                const details = document.getElementById('mob-details');
                
                if (!modal || !details) return;
                
                const drift = this.calculateDrift(victim);
                const survival = this.calculateSurvivalTime(victim);
                const distance = this.calculateDistance(this.vessel.position, victim.position);
                
                details.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div><strong style="color: #ff8888;">CREW:</strong><br>${victim.name}<br><span style="color: #888; font-size: 0.8rem;">${victim.role}</span></div>
                        <div><strong style="color: #ff8888;">CLOTHING:</strong><br>${victim.clothing.replace('_', ' ')}</div>
                        <div><strong style="color: #ff8888;">MOB POSITION:</strong><br>${this.formatCoords(victim.position.lat, victim.position.lon)}</div>
                        <div><strong style="color: #ff8888;">DRIFT:</strong><br>${(drift.totalSpeed * 3600).toFixed(1)} kt</div>
                        <div><strong style="color: #ff8888;">HEART RATE:</strong><br>${Math.round(victim.biometrics.heartRate)} bpm</div>
                        <div><strong style="color: #ff8888;">CORE TEMP:</strong><br>${victim.biometrics.bodyTemp.toFixed(1)}°C</div>
                        <div style="grid-column: 1 / -1;"><strong style="color: #ff8888;">VESSEL DISTANCE:</strong> ${distance.toFixed(2)} NM</div>
                    </div>
                `;
                
                const survivalPercent = Math.min(100, (survival / 120) * 100);
                const bar = document.getElementById('survival-bar');
                if (bar) {
                    bar.style.width = survivalPercent + '%';
                    if (survivalPercent > 70) {
                        bar.style.background = 'linear-gradient(90deg, #00ff88, #00ff88)';
                    } else if (survivalPercent > 30) {
                        bar.style.background = 'linear-gradient(90deg, #ffaa00, #ffaa00)';
                    } else {
                        bar.style.background = 'linear-gradient(90deg, #ff3333, #ff3333)';
                    }
                }
                
                modal.style.display = 'flex';
            },

            acknowledgeMOB() {
                const modal = document.getElementById('mob-modal');
                if (modal) modal.style.display = 'none';
                this.logEvent('ACK', 'MOB alert acknowledged');
            },

            // FIXED: SAR pattern now properly draws from modal button
            initiateSearchPattern() {
                if (!this.mobVictim) {
                    this.logEvent('WARN', 'No MOB position for search pattern');
                    return;
                }
                
                // Close modal if open
                const modal = document.getElementById('mob-modal');
                if (modal) modal.style.display = 'none';
                
                const mob = this.mobVictim;
                
                // Calculate search datum with drift
                const searchTime = 0.25; // 15 minutes to return
                const drift = this.calculateDrift(mob);
                
                // FIXED: Proper datum calculation
                const datum = {
                    lat: mob.position.lat + (drift.dLat * searchTime * 3600 / this.speedMultiplier),
                    lon: mob.position.lon + (drift.dLon * searchTime * 3600 / this.speedMultiplier)
                };
                
                if (MapManager.map) {
                    MapManager.drawExpandingSquareSearch(datum, this.environment.windDir);
                }
                
                this.sarPatternActive = true;
                this.logEvent('SAR', `Expanding square search initiated at datum`);
                this.logEvent('SAR', `Datum: ${this.formatCoords(datum.lat, datum.lon)}`);
            },

            calculateSurvivalTime(person) {
                const waterTemp = this.environment.waterTemp;
                let baseTime;
                
                if (waterTemp >= 15) baseTime = 360;
                else if (waterTemp >= 10) baseTime = 180;
                else if (waterTemp >= 5) baseTime = 90;
                else baseTime = 45;
                
                if (person.clothing === 'immersion_suit') baseTime *= 3;
                else if (person.clothing === 'safety_vest') baseTime *= 1.2;
                
                const massFactor = person.weight / 70;
                baseTime *= Math.sqrt(massFactor);
                
                const elapsed = (this.PHYSICS.BODY_TEMP_NORMAL - person.biometrics.bodyTemp) / this.PHYSICS.BODY_TEMP_DROP;
                return Math.max(0, Math.round(baseTime - (elapsed * 60)));
            },

            setSimulationSpeed(speed) {
                this.speedMultiplier = parseInt(speed);
                const display = document.getElementById('speed-display');
                if (display) display.textContent = speed + 'x';
                
                clearInterval(this.simulationInterval);
                this.simulationInterval = setInterval(() => this.simulationStep(), 1000 / this.speedMultiplier);
            },

            setEnvironment(preset) {
                this.environment = { ...this.ENVIRONMENT_PRESETS[preset] };
                const windEl = document.getElementById('wind-data');
                if (windEl) windEl.textContent = 
                    `Wind: ${this.environment.windSpeed}kt ${this.getCardinalDir(this.environment.windDir)}`;
                this.logEvent('ENV', `Environment: ${this.environment.currentName}`);
            },

            resetSimulation() {
                this.mobVictim = null;
                this.recoveryMode = false;
                this.sarPatternActive = false;
                
                const indicator = document.getElementById('maneuver-indicator');
                if (indicator) indicator.style.display = 'none';
                
                this.crew.forEach(c => {
                    c.status = 'safe';
                    c.position = { ...this.vessel.position };
                    c.biometrics = { heartRate: 72, bodyTemp: 37.0, oxygenSat: 98 };
                    c.history = [];
                    c.conscious = true;
                    c.hypothermiaAlert = false;
                    c.deathAlert = false;
                    c.lowBatteryAlert = false;
                    c.popupOpened = false;
                    if (c.trailLine && MapManager.map) {
                        MapManager.map.removeLayer(c.trailLine);
                    }
                });
                
                this.alerts = [];
                this.vessel.waypointIndex = 0;
                this.vessel.position = { ...this.SHIPPING_ROUTE[0] };
                this.vessel.heading = 260;
                this.vessel.speed = 18.5;
                
                if (MapManager.map) {
                    MapManager.clearSearchPattern();
                    MapManager.clearMOBMarker();
                    MapManager.updateVesselPosition(this.vessel.position.lat, this.vessel.position.lon, this.vessel.heading);
                }
                
                this.logEvent('SYSTEM', 'Simulation reset');
                this.updateUI();
                this.updateRecoveryButton();
            },

            updateTrail() {
                if (!MapManager.map || this.trailHistory.length < 2) return;
                
                if (this.vesselTrail) {
                    MapManager.map.removeLayer(this.vesselTrail);
                }
                
                const points = this.trailHistory.map(p => [p.lat, p.lon]);
                this.vesselTrail = L.polyline(points, {
                    color: '#00d4ff',
                    weight: 2,
                    opacity: 0.5
                }).addTo(MapManager.map);
            },

            updateUI() {
                const recordsEl = document.getElementById('stat-records');
                if (recordsEl) recordsEl.textContent = this.dataPoints.toLocaleString();
                
                const counts = {
                    safe: this.crew.filter(c => c.status === 'safe').length,
                    warning: this.crew.filter(c => c.status === 'warning').length,
                    alert: this.crew.filter(c => c.status === 'alert').length,
                    mob: this.crew.filter(c => c.status === 'mob').length
                };
                
                const safeEl = document.getElementById('count-safe');
                const warnEl = document.getElementById('count-warning');
                const alertEl = document.getElementById('count-alert');
                const mobEl = document.getElementById('count-mob');
                
                if (safeEl) safeEl.textContent = counts.safe;
                if (warnEl) warnEl.textContent = counts.warning;
                if (alertEl) alertEl.textContent = counts.alert;
                if (mobEl) mobEl.textContent = counts.mob;
                
                const activeAlerts = this.alerts.filter(a => a.severity === 'mob' || a.severity === 'critical').length;
                const statAlerts = document.getElementById('stat-alerts');
                if (statAlerts) statAlerts.textContent = activeAlerts;
                
                const mobDistEl = document.getElementById('mob-distance');
                if (mobDistEl) {
                    if (this.mobVictim) {
                        const dist = this.calculateDistance(this.vessel.position, this.mobVictim.position);
                        mobDistEl.textContent = dist.toFixed(2);
                    } else {
                        mobDistEl.textContent = '--';
                    }
                }
                
                const crewList = document.getElementById('crew-list');
                if (crewList) {
                    crewList.innerHTML = this.crew.map(c => {
                        const statusColor = c.status === 'mob' ? '#ff00ff' : c.status === 'safe' ? '#00ff88' : '#ffaa00';
                        const temp = c.biometrics.bodyTemp.toFixed(1);
                        const tempColor = temp < 35 ? '#ff3333' : temp < 37 ? '#ffaa00' : '#00ff88';
                        
                        return `
                        <div style="padding: 10px; background: rgba(255,255,255,0.05); margin-bottom: 8px; border-radius: 5px; border-left: 3px solid ${statusColor};">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong>${c.name}</strong>
                                <span style="font-size: 0.7rem; color: #666;">${c.id}</span>
                            </div>
                            <div style="color: ${statusColor}; font-size: 0.8rem; margin-top: 4px;">
                                ${c.status === 'mob' ? '⚠️ MAN OVERBOARD' : c.status.toUpperCase()}
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 0.75rem; color: #aaa;">
                                <span>❤️ ${Math.round(c.biometrics.heartRate)} bpm</span>
                                <span style="color: ${tempColor}">🌡️ ${temp}°C</span>
                                <span>🔋 ${Math.round(c.deviceBattery)}%</span>
                            </div>
                        </div>
                    `}).join('');
                }
                
                const vesselStatus = document.getElementById('vessel-status');
                if (vesselStatus) {
                    if (this.recoveryMode) {
                        vesselStatus.innerHTML = `<span style="color: var(--alert-red);"><i class="fas fa-exclamation-triangle"></i> RECOVERY MANEUVER</span>`;
                    } else if (this.mobVictim) {
                        vesselStatus.innerHTML = `<span style="color: var(--alert-red);">MOB ALERT - ${this.mobVictim.name}</span>`;
                    } else {
                        const nextWP = this.SHIPPING_ROUTE[this.vessel.waypointIndex + 1];
                        vesselStatus.innerHTML = `Route: ${nextWP ? nextWP.name : 'End of route'}`;
                    }
                }
            },

            // FIXED: Update recovery button state
            updateRecoveryButton() {
                const btn = document.getElementById('recovery-btn');
                if (!btn) return;
                
                if (this.mobVictim && !this.recoveryMode) {
                    btn.disabled = false;
                    btn.classList.remove('btn-disabled');
                    btn.innerHTML = '<i class="fas fa-life-ring"></i> Execute Recovery Turn';
                } else if (this.recoveryMode) {
                    btn.disabled = true;
                    btn.classList.add('btn-disabled');
                    btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Recovery in Progress...';
                } else {
                    btn.disabled = true;
                    btn.classList.add('btn-disabled');
                    btn.innerHTML = '<i class="fas fa-life-ring"></i> Execute Recovery Turn';
                }
            },

            logEvent(type, message) {
                const log = document.getElementById('alert-log');
                if (!log) return;
                
                const entry = document.createElement('div');
                entry.className = `log-entry ${type === 'MOB' || type === 'CRITICAL' ? 'critical' : type === 'RECOVERY' || type === 'SAR' ? 'mob' : ''}`;
                
                const now = new Date();
                const timeStr = now.toTimeString().split(' ')[0];
                
                entry.innerHTML = `
                    <div class="log-time">${timeStr} - ${type}</div>
                    <div>${message}</div>
                `;
                
                log.insertBefore(entry, log.firstChild);
                if (log.children.length > 20) log.removeChild(log.lastChild);
            },

            formatCoords(lat, lon) {
                const latDeg = Math.floor(Math.abs(lat));
                const latMin = ((Math.abs(lat) - latDeg) * 60).toFixed(3);
                const latDir = lat >= 0 ? 'N' : 'S';
                
                const lonDeg = Math.floor(Math.abs(lon));
                const lonMin = ((Math.abs(lon) - lonDeg) * 60).toFixed(3);
                const lonDir = lon >= 0 ? 'E' : 'W';
                
                return `${latDir} ${latDeg}° ${latMin}' ${lonDir} ${lonDeg}° ${lonMin}'`;
            },

            getCardinalDir(degrees) {
                const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
                return directions[Math.round(degrees / 22.5) % 16];
            }
        };
