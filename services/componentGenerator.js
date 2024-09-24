/**
 * Generates ready-to-use modern UI component snippets:
 * - Skeleton Loader
 * - Spinner Loader
 * - Action Modal
 * - Offcanvas Drawer
 * - SweetAlert2 (swalfire) Alert Popups
 * - Toastr / Sonner Notifications
 */

function getSkeletonComponent(framework = 'tailwind') {
  if (framework === 'bootstrap') {
    return `
<!-- Skeleton Loader Component (Bootstrap 5) -->
<div class="card placeholder-glow p-3 border-0 shadow-sm" style="background: var(--color-surface); border-radius: var(--radius-base);">
  <div class="d-flex align-items-center mb-3">
    <div class="placeholder rounded-circle" style="width: 48px; height: 48px; background: var(--color-surface-hover);"></div>
    <div class="ms-3 w-75">
      <div class="placeholder col-7 rounded mb-1" style="height: 16px;"></div>
      <div class="placeholder col-4 rounded" style="height: 12px;"></div>
    </div>
  </div>
  <div class="placeholder col-12 rounded mb-2" style="height: 14px;"></div>
  <div class="placeholder col-10 rounded mb-2" style="height: 14px;"></div>
  <div class="placeholder col-6 rounded" style="height: 14px;"></div>
</div>
`;
  }
  return `
<!-- Skeleton Loader Component (Tailwind CSS) -->
<div class="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm animate-pulse space-y-4">
  <div class="flex items-center space-x-4">
    <div class="w-12 h-12 rounded-full bg-[var(--color-surface-hover)]"></div>
    <div class="space-y-2 flex-1">
      <div class="h-4 bg-[var(--color-surface-hover)] rounded w-1/3"></div>
      <div class="h-3 bg-[var(--color-surface-hover)] rounded w-1/4"></div>
    </div>
  </div>
  <div class="space-y-2">
    <div class="h-3 bg-[var(--color-surface-hover)] rounded"></div>
    <div class="h-3 bg-[var(--color-surface-hover)] rounded w-5/6"></div>
    <div class="h-3 bg-[var(--color-surface-hover)] rounded w-2/3"></div>
  </div>
</div>
`;
}

function getSpinnerComponent(framework = 'tailwind') {
  if (framework === 'bootstrap') {
    return `
<!-- Spinner Loader Component (Bootstrap 5) -->
<div class="d-flex align-items-center justify-content-center p-4">
  <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem; color: var(--color-primary) !important;">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>
`;
  }
  return `
<!-- Spinner Loader Component (Tailwind CSS) -->
<div class="flex items-center justify-center p-6">
  <div class="relative w-12 h-12">
    <div class="w-12 h-12 rounded-full border-4 border-t-transparent border-[var(--color-primary)] animate-spin"></div>
    <div class="absolute inset-0 rounded-full border-4 border-[var(--color-border)] opacity-20"></div>
  </div>
</div>
`;
}

function getModalComponent(framework = 'tailwind') {
  if (framework === 'bootstrap') {
    return `
<!-- Modal Dialog Component (Bootstrap 5) -->
<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg" style="background: var(--color-surface); color: var(--color-text); border-radius: 1rem;">
      <div class="modal-header border-bottom-0 pb-0">
        <h5 class="modal-title font-weight-bold" id="exampleModalLabel">Action Dialog</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body py-4">
        <p class="text-muted">Accessible modal configured with backdrop blur.</p>
      </div>
      <div class="modal-footer border-top-0 pt-0">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" style="background: var(--color-primary); border-color: var(--color-primary);">Confirm</button>
      </div>
    </div>
  </div>
</div>
`;
  }
  return `
<!-- Modal Dialog Component (Tailwind CSS) -->
<div id="appModal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl w-full max-w-lg p-6 shadow-2xl transform scale-95 transition-transform duration-300">
    <div class="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
      <h3 class="text-lg font-bold">Action Dialog</h3>
      <button onclick="document.getElementById('appModal').classList.add('hidden')" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">&times;</button>
    </div>
    <div class="py-4">
      <p class="text-sm text-[var(--color-text-muted)]">This modern modal has blur backdrop, ESC key listener, and seamless theming.</p>
    </div>
    <div class="flex justify-end space-x-3 pt-4 border-t border-[var(--color-border)]">
      <button onclick="document.getElementById('appModal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]">Cancel</button>
      <button class="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90">Confirm</button>
    </div>
  </div>
</div>
`;
}

function getOffcanvasComponent(framework = 'tailwind') {
  if (framework === 'bootstrap') {
    return `
<!-- Offcanvas Drawer (Bootstrap 5) -->
<div class="offcanvas offcanvas-start" tabindex="-1" id="appOffcanvas" aria-labelledby="appOffcanvasLabel" style="background: var(--color-surface); color: var(--color-text);">
  <div class="offcanvas-header border-bottom" style="border-color: var(--color-border) !important;">
    <h5 class="offcanvas-title" id="appOffcanvasLabel">Navigation Drawer</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body">
    <p class="text-muted">Offcanvas sliding menu with dynamic themes and active links.</p>
  </div>
</div>
`;
  }
  return `
<!-- Offcanvas Drawer (Tailwind CSS) -->
<div id="appDrawerBackdrop" class="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs hidden" onclick="toggleDrawer()"></div>
<div id="appDrawer" class="fixed top-0 left-0 bottom-0 z-50 w-72 bg-[var(--color-surface)] border-r border-[var(--color-border)] transform -translate-x-full transition-transform duration-300 ease-in-out p-6 shadow-2xl">
  <div class="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
    <h4 class="font-bold text-base">Navigation Drawer</h4>
    <button onclick="toggleDrawer()" class="text-xl leading-none">&times;</button>
  </div>
  <div class="py-6 space-y-3">
    <a href="#" class="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--color-surface-hover)]">Dashboard</a>
    <a href="#" class="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--color-surface-hover)]">Analytics</a>
    <a href="#" class="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--color-surface-hover)]">Settings</a>
  </div>
</div>
`;
}

/**
 * SweetAlert2 (Swal.fire) Integration Component Snippet
 */
function getSwalFireComponent() {
  return `
<!-- SweetAlert2 (Swal.fire) Trigger Demo -->
<div class="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-wrap items-center justify-between gap-3">
  <div>
    <div class="font-bold text-sm">🔥 SweetAlert2 (Swal.fire)</div>
    <div class="text-xs text-[var(--color-text-muted)]">Interactive animated confirmation dialogs & modals</div>
  </div>
  <div class="flex gap-2">
    <button type="button" onclick="Swal.fire({ title: 'Success!', text: 'Action completed successfully.', icon: 'success', confirmButtonColor: 'var(--color-primary)' })" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:opacity-90">
      Test Success Alert
    </button>
    <button type="button" onclick="Swal.fire({ title: 'Are you sure?', text: 'You can revert this anytime!', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Yes, delete it!' })" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white hover:opacity-90">
      Test Confirm Modal
    </button>
  </div>
</div>
`;
}

/**
 * Toastr & Sonner Style Modern Notifications Component Snippet
 */
function getToastrSonnerComponent() {
  return `
<!-- Toastr / Sonner Modern Notification Demo -->
<div class="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-wrap items-center justify-between gap-3">
  <div>
    <div class="font-bold text-sm">🔔 Toastr / Sonner Notifications</div>
    <div class="text-xs text-[var(--color-text-muted)]">Smooth non-blocking toast alerts with sound & progress</div>
  </div>
  <div class="flex gap-2">
    <button type="button" onclick="showToast('Operation successful! Event logged.', 'success')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white hover:opacity-90">
      Show Toast
    </button>
  </div>
</div>
`;
}

module.exports = {
  getSkeletonComponent,
  getSpinnerComponent,
  getModalComponent,
  getOffcanvasComponent,
  getSwalFireComponent,
  getToastrSonnerComponent
};
