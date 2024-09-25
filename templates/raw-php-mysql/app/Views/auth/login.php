<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login — Access Account</title>
    <link rel="stylesheet" href="/css/theme.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body class="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)] text-[var(--color-text)]">
    <div class="max-w-md w-full p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl">
        <h2 class="text-2xl font-bold mb-1">Welcome Back</h2>
        <p class="text-sm text-[var(--color-text-muted)] mb-6">Sign in to your authenticated account</p>

        <form id="loginForm" class="space-y-4">
            <div>
                <label class="block text-xs font-semibold mb-1">Email Address</label>
                <input type="email" id="email" required class="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
            </div>
            <div>
                <label class="block text-xs font-semibold mb-1">Password</label>
                <input type="password" id="password" required class="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
            </div>

            <div id="loginMsg" class="text-xs font-semibold"></div>

            <button type="submit" id="btnLogin" class="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:opacity-95 transition shadow-lg shadow-[var(--color-primary)]/25">
                Sign In
            </button>
        </form>

        <p class="text-xs text-center mt-6 text-[var(--color-text-muted)]">
            Don't have an account? <a href="/register" class="text-[var(--color-primary)] font-bold">Register</a>
        </p>
    </div>

    <script>
        $('#loginForm').on('submit', function(e) {
            e.preventDefault();
            const btn = $('#btnLogin');
            const msg = $('#loginMsg');
            btn.prop('disabled', true).text('Verifying...');

            $.ajax({
                url: '/api/login',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    email: $('#email').val(),
                    password: $('#password').val()
                }),
                success: function(res) {
                    msg.html('<span class="text-emerald-500">✓ Login successful! Redirecting...</span>');
                    window.location.href = res.redirect || '/dashboard';
                },
                error: function(xhr) {
                    const err = xhr.responseJSON ? xhr.responseJSON.error : 'Invalid credentials';
                    msg.html('<span class="text-rose-500">✗ ' + err + '</span>');
                    btn.prop('disabled', false).text('Sign In');
                }
            });
        });
    </script>
</body>
</html>
