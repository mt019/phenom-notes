(() => {
  const root = document.documentElement;
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('notes-theme', next);
  });

  const scales = [0.85, 0.925, 1, 1.1, 1.25, 1.4, 1.6];
  const output = document.querySelector('[data-scale-output]');
  const renderScale = () => {
    const current = Number(getComputedStyle(root).getPropertyValue('--reader-scale')) || 1;
    if (output) output.textContent = `${Math.round(current * 100)}%`;
    document.querySelectorAll('[data-scale]').forEach((button) => {
      const index = scales.reduce((best, value, i) => Math.abs(value - current) < Math.abs(scales[best] - current) ? i : best, 0);
      button.disabled = Number(button.dataset.scale) < 0 ? index === 0 : index === scales.length - 1;
    });
  };
  document.querySelectorAll('[data-scale]').forEach((button) => {
    button.addEventListener('click', () => {
      const current = Number(getComputedStyle(root).getPropertyValue('--reader-scale')) || 1;
      const nearest = scales.reduce((best, value, i) => Math.abs(value - current) < Math.abs(scales[best] - current) ? i : best, 0);
      const nextIndex = Math.min(scales.length - 1, Math.max(0, nearest + (Number(button.dataset.scale) < 0 ? -1 : 1)));
      const next = scales[nextIndex];
      root.style.setProperty('--reader-scale', String(next));
      localStorage.setItem('notes-scale', String(next));
      renderScale();
    });
  });
  renderScale();

  const filter = document.querySelector('[data-tag-filter]');
  if (!filter) return;
  const params = new URLSearchParams(location.search);
  const initial = params.get('tag');
  if (initial && [...filter.options].some((option) => option.value === initial)) filter.value = initial;

  const apply = () => {
    const selected = filter.value;
    let shown = 0;
    document.querySelectorAll('[data-post]').forEach((post) => {
      const visible = selected === 'all' || post.dataset.tags.split('\u001f').includes(selected);
      post.hidden = !visible;
      if (visible) shown += 1;
    });
    document.querySelectorAll('[data-year]').forEach((group) => {
      group.hidden = !group.querySelector('[data-post]:not([hidden])');
    });
    const result = document.querySelector('[data-filter-result]');
    if (result) result.textContent = selected === 'all' ? '' : `列出 ${shown} 篇`;
    const url = new URL(location.href);
    if (selected === 'all') url.searchParams.delete('tag');
    else url.searchParams.set('tag', selected);
    history.replaceState(null, '', url);
  };
  filter.addEventListener('change', apply);
  apply();
})();
