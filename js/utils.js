// Utility helper functions
        function getSignalBars(signal) {
            const strength = signal > -90 ? 4 : signal > -100 ? 3 : signal > -110 ? 2 : 1;
            let bars = '';
            const colorClass = strength >= 3 ? 'active' : strength === 2 ? 'warning' : 'danger';
            for (let i = 1; i <= 4; i++) {
                bars += `<div class="signal-bar ${i <= strength ? colorClass : ''}"></div>`;
            }
            return bars;
        }

        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            toast.className = 'toast show ' + type;
            document.getElementById('toastMessage').textContent = message;
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
