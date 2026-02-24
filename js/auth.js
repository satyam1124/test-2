// Authentication and login logic
        function togglePassword() {
            const input = document.getElementById('password');
            input.type = input.type === 'password' ? 'text' : 'password';
        }

        function showApp() {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('appContainer').classList.add('active');
            initDashboard();
        }

        function logout() {
            localStorage.removeItem('mob_logged_in');
            localStorage.removeItem('mob_user');
            localStorage.removeItem('mob_role');
            location.reload();
        }

    // Check if already logged in
    if (localStorage.getItem('mob_logged_in') === 'true') {
        const savedUser = localStorage.getItem('mob_user');
        const savedRole = localStorage.getItem('mob_role');
        if (savedUser) {
            currentUser = { username: savedUser, role: savedRole || 'ADMIN' };
            document.getElementById('currentUser').textContent = savedUser;
            showApp();
        }
    }

        // Login
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const btn = document.getElementById('loginBtn');
            btn.innerHTML = '<span class="loading"></span> Signing in...';
            
            setTimeout(() => {
                const user = users.find(u => u.username === username && u.password === password);
                if (user) {
                    currentUser = { username: user.username, role: user.role.toUpperCase() };
                    document.getElementById('currentUser').textContent = username;
                    // Save login state
                    localStorage.setItem('mob_logged_in', 'true');
                    localStorage.setItem('mob_user', username);
                    localStorage.setItem('mob_role', user.role.toUpperCase());
                    showApp();
                    showToast('Welcome back, ' + username + '!', 'success');
                } else {
                    btn.innerHTML = 'Sign In';
                    showToast('Invalid credentials', 'error');
                }
            }, 1000);
        });
