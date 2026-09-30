<script setup>
defineProps({
    laravelVersion: String,
    database: String,
});
</script>

<template>
    <div style="max-width: 900px; margin: 3rem auto; padding: 1rem; text-align: center;">
        <h1 style="font-size: 2.5rem; font-weight: 800;">{{APP_TITLE}}</h1>
        <p style="color: var(--color-text-muted);">{{APP_DESC}}</p>

        <div style="margin-top: 2rem; padding: 1.5rem; background: var(--color-surface); border-radius: 1rem; text-align: left; border: 1px solid var(--color-border);">
            <h3>Configured Architecture:</h3>
            <ul>
                <li><strong>Framework:</strong> Laravel {{ laravelVersion }} + Vue 3 (Inertia)</li>
                <li><strong>Database connection:</strong> {{ database }}</li>
                <li><strong>Styling:</strong> {{STYLING}}</li>
                <li><strong>Theme:</strong> {{THEME}}</li>
            </ul>
        </div>
    </div>
</template>
