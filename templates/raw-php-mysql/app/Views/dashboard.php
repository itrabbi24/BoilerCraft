<?php
use App\Config\Auth;
$currentUser = Auth::user();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dashboard — Authenticated Area</title>
    <link rel="stylesheet" href="/css/theme.css">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-8 bg-[var(--color-bg)] text-[var(--color-text)] min-h-screen">
    <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center pb-6 border-b border-[var(--color-border)] mb-8">
            <div>
                <h1 class="text-3xl font-extrabold">Protected Dashboard</h1>
                <p class="text-sm text-[var(--color-text-muted)]">Session Authentication & Role Authorization Active</p>
            </div>
            <div class="flex items-center gap-4">
                <span class="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    Role: <?= htmlspecialchars($currentUser['role']) ?>
                </span>
                <a href="/logout" class="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold hover:bg-rose-500 hover:text-white transition">
                    Logout
                </a>
            </div>
        </div>

        <div class="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl mb-6">
            <h3 class="font-bold text-lg mb-2">Welcome, <?= htmlspecialchars($currentUser['name']) ?>!</h3>
            <p class="text-sm text-[var(--color-text-muted)] mb-4">You are authorized to view this page. Your email is <strong><?= htmlspecialchars($currentUser['email']) ?></strong>.</p>
            
            <div class="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] font-mono text-xs text-emerald-400">
                // Session State<br>
                User ID: <?= $currentUser['id'] ?><br>
                Role: <?= $currentUser['role'] ?><br>
                Guard: Middleware::auth() Passed
            </div>
        </div>

        <?php if ($currentUser['role'] === 'admin'): ?>
        <div class="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <h4 class="font-bold mb-1">👑 Admin Only Area</h4>
            <p class="text-xs">This section is strictly rendered because your account has the 'admin' permission.</p>
        </div>
        <?php endif; ?>
    </div>
</body>
</html>
