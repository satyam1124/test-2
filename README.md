# MOB Guard - Man Overboard Security System

A professional maritime Man Overboard (MOB) detection and tracking system with real-time simulation.

## Features

- **Dashboard** - Live overview of all crew positions, signal strength, and active alerts
- **Live Map** - Interactive Leaflet map showing real-time crew positions
- **Simulation** - Physics-based MOB simulation with vessel navigation and recovery maneuvers
- **Alerts** - Real-time alert management system
- **Device Management** - Monitor and control tracking devices
- **User Management** - Admin and viewer role management
- **Settings** - System configuration

## Project Structure

```
test-2/
├── index.html          # Main application (dashboard, map, alerts, devices, users, settings)
├── simulation.html     # Interactive maritime MOB simulation
├── css/
│   ├── styles.css      # Main application styles
│   └── simulation.css  # Simulation-specific styles
├── js/
│   ├── config.js       # Application configuration and data
│   ├── utils.js        # Helper functions (formatting, notifications)
│   ├── auth.js         # Authentication and login logic
│   ├── ui.js           # Navigation, modals, sidebar interactions
│   ├── app.js          # Core application logic
│   ├── telemetry.js    # Telemetry system for simulation
│   ├── map-manager.js  # Map management and display logic
│   └── simulation.js   # Simulation entry point
├── README.md
└── .gitignore
```

## Setup

No build step required. Open `index.html` in a modern web browser.

For local development with a simple HTTP server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8080` in your browser.

## Demo Credentials

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin123 | Admin |
| viewer   | viewer123| Viewer|

## External Dependencies

- [Leaflet.js 1.9.4](https://leafletjs.com/) - Interactive maps
- [Font Awesome 6.4.0](https://fontawesome.com/) - Icons

All dependencies are loaded from CDN - no installation required.

## Simulation

The simulation (`simulation.html`) provides:

- Physics-based vessel navigation along the English Channel shipping route
- Realistic crew biometric tracking (heart rate, body temperature)
- MOB (Man Overboard) detection and recovery maneuver simulation
  - Williamson Turn
  - Anderson Turn
  - Scharnow Turn
- Expanding square search pattern (IAMSAR standard)
- Environmental presets (English Channel, Mediterranean, Arctic, Tropical)
- Web Audio API alert sounds
