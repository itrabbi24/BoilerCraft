<!DOCTYPE html>
<html lang="en" data-theme="{{COLOR_MODE}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($appName) ?></title>
    <link rel="stylesheet" href="/css/theme.css">
    {{STYLESHEET_LINK}}
    <!-- jQuery Support CDN -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body class="p-6">
    <div style="max-width: 900px; margin: 2rem auto; text-align: center;">
        {{LOGO_HTML}}
        <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem;"><?= htmlspecialchars($appName) ?></h1>
        <p style="color: var(--color-text-muted); font-size: 1.1rem;"><?= htmlspecialchars($appDesc) ?></p>
        <p style="font-size: 0.85rem; color: var(--color-primary); font-weight: 700; margin-top: 4px;">Crafted by <?= htmlspecialchars($author) ?></p>

        <!-- AJAX Live Form Demo (jQuery / Vanilla Fetch) -->
        <div style="text-align: left; padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-base); margin-top: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">⚡ Live AJAX + jQuery Demo (No Page Reload)</h3>
                <span style="font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; background: rgba(16, 185, 129, 0.2); color: #10b981; font-weight: bold;">AJAX Ready</span>
            </div>
            
            <p style="color: var(--color-text-muted); font-size: 0.9rem;">
                এই Raw PHP আর্কিটেকচারে আপনি নির্দ্বিধায় <strong>jQuery, Axios, Fetch API, Tailwind CSS</strong> বা <strong>Bootstrap 5</strong> যা ইচ্ছা ব্যবহার করতে পারবেন।
            </p>

            <form id="ajaxUserForm" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; margin-top: 1rem;">
                <input type="text" id="ajaxName" placeholder="Full Name" required style="padding: 10px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text);">
                <input type="email" id="ajaxEmail" placeholder="Email Address" required style="padding: 10px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text);">
                <button type="submit" id="btnSubmit" style="background: var(--color-primary); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    Send via AJAX
                </button>
            </form>
            <div id="ajaxResponse" style="margin-top: 10px; font-size: 0.85rem; font-weight: 600;"></div>
        </div>

        <!-- Dynamic UI Components Section -->
        <div style="text-align: left; padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-base); margin-top: 2rem;">
            <h4>Included Interactive UI Components:</h4>
            {{UI_COMPONENTS}}
        </div>
    </div>

    <!-- Live jQuery AJAX Handling Script -->
    <script>
        $(document).ready(function() {
            $('#ajaxUserForm').on('submit', function(e) {
                e.preventDefault();
                const btn = $('#btnSubmit');
                const resp = $('#ajaxResponse');

                btn.prop('disabled', true).text('Saving...');
                resp.html('<span style="color: var(--color-primary);">Connecting with server...</span>');

                $.ajax({
                    url: '/api/users',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        name: $('#ajaxName').val(),
                        email: $('#ajaxEmail').val()
                    }),
                    success: function(response) {
                        resp.html('<span style="color: #10b981;">✓ ' + response.message + '</span>');
                        $('#ajaxUserForm')[0].reset();
                    },
                    error: function(xhr) {
                        const err = xhr.responseJSON ? xhr.responseJSON.error : 'Submission failed';
                        resp.html('<span style="color: #ef4444;">✗ ' + err + '</span>');
                    },
                    complete: function() {
                        btn.prop('disabled', false).text('Send via AJAX');
                    }
                });
            });
        });
    </script>
    <script src="/js/theme.js"></script>
</body>
</html>
