/* Restore the explicit choice before styles paint; device preferences never override it. */
(() => {
  const key = 'scorefut.theme';
  const root = document.documentElement;
  let theme = 'dark';
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch { /* Private browsing can block storage. */ }

  const apply = () => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101513' : '#f4f5f6');
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const label = theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(theme === 'dark'));
  };
  apply();

  const bind = () => {
    apply();
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      apply();
      try { localStorage.setItem(key, JSON.stringify(theme)); } catch { /* The switch still works without saving. */ }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();
