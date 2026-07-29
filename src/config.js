export const CANONICAL_BASE = 'https://phenomcanvas.com/notes';
export const CANVAS_HOME = { href: 'https://phenomcanvas.com/', label: '', title: '回 Phenom Canvas' };
export const CANVAS_INDEX = 'https://phenomcanvas.com/all';

export function relatedTarget(href) {
  if (/^https?:\/\//.test(href)) return { href, external: true };
  if (href === '/notes') return { href: '/', external: false };
  if (href.startsWith('/notes/')) return { href: href.slice('/notes'.length), external: false };
  if (href.startsWith('/')) return { href: new URL(href, 'https://phenomcanvas.com').href, external: true };
  return { href, external: false };
}
