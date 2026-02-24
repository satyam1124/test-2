// Simulation entry point and global functions
        // Global functions
        function confirmExit() {
            if (TelemetrySystem.mobVictim) {
                return confirm('MOB incident in progress! Are you sure you want to leave?');
            }
            return true;
        }

        // FIXED: Toggle overlay minimize/maximize
        let overlayMinimized = false;
        function toggleOverlay() {
            const overlay = document.getElementById('map-overlay');
            const icon = document.getElementById('minimize-icon');
            
            if (!overlay) return;
            
            overlayMinimized = !overlayMinimized;
            
            if (overlayMinimized) {
                overlay.classList.add('minimized');
                if (icon) icon.className = 'fas fa-plus';
            } else {
                overlay.classList.remove('minimized');
                if (icon) icon.className = 'fas fa-minus';
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            TelemetrySystem.init();
        });
