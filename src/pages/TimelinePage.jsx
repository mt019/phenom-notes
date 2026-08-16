import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AppearanceMenu,
  DashboardLayout,
  Dropdown,
  FilterBar,
  FontSizeControl,
  useFontScale,
  useTabParam,
} from '@phenomcanvas/ui';
import timeline from '../data/generated/timeline.json';
import inventory from '../data/generated/inventory.json';
import { CANVAS_HOME, CANVAS_INDEX, NOTES_HOME } from '../config.js';

const ITEM_NAME = new Map(
  inventory.items.map((item) => [item.id, `${item.maker ? `${item.maker} ` : ''}${item.name}`]),
);

// 年份已經是小標，所以列上只印年以下的部分。日期精度不同的三種各自有長相，
// 寬度固定成最長的那一種（5 個字），免得切換篩選時右邊的標題跟著跳。
function dayLabel(date) {
  const parts = date.split('-');
  if (parts.length === 3) return `${parts[1]}-${parts[2]}`;
  if (parts.length === 2) return parts[1];
  return '—';
}

export default function TimelinePage() {
  const { kinds, events, stats } = timeline;
  const [scale, setScale] = useFontScale();
  const [kind, setKind] = useTabParam('kind', 'all');

  const shown = useMemo(
    () => (kind === 'all' ? events : events.filter((event) => event.kind === kind)),
    [events, kind],
  );
  const years = useMemo(() => {
    const out = [];
    for (const event of shown) {
      const year = event.date.slice(0, 4);
      const last = out.at(-1);
      if (last?.year === year) last.list.push(event);
      else out.push({ year, list: [event] });
    }
    return out;
  }, [shown]);

  return (
    <div id="main-content">
      <DashboardLayout
        back={CANVAS_HOME}
        backIndexHref={CANVAS_INDEX}
        scale={scale}
        headerRight={(
          <>
            <FontSizeControl scale={scale} onChange={setScale} />
            <AppearanceMenu />
          </>
        )}
        eyebrow="手記"
        eyebrowBack={NOTES_HOME}
        title="年表"
        summary="按日期排的事件：買了什麼、考了什麼、寫了什麼、決定了什麼。"
        tocLabel="年份"
        refreshKey={kind}
      >
        <p className="mb-8 border-y border-line-soft py-3 text-token-sm leading-relaxed text-ink-muted">
          <span className="font-accent tabular-nums">{stats.count}</span> 則，
          從 <span className="font-accent tabular-nums">{stats.dateRange?.from}</span> 到{' '}
          <span className="font-accent tabular-nums">{stats.dateRange?.to}</span>。
        </p>

        <FilterBar
          label="類型"
          note={kind === 'all' ? null : `列出 ${shown.length} 則，全部共 ${events.length} 則`}
          className="mb-10"
        >
          <Dropdown
            value={kind}
            onChange={(value) => setKind(value, { scroll: 'preserve' })}
            options={[
              { value: 'all', label: `全部（${events.length}）` },
              ...kinds.map((entry) => ({ value: entry.id, label: `${entry.label}（${entry.count}）` })),
            ]}
            panelWidth="w-48"
          />
          {kind === 'all' ? null : (
            <button
              type="button"
              onClick={() => setKind('all', { scroll: 'preserve' })}
              className="text-token-sm text-ink-faint underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent"
            >
              清除
            </button>
          )}
        </FilterBar>

        {years.map((group, index) => (
          <section key={group.year} className={index === 0 ? '' : 'mt-12 border-t border-line pt-8'}>
            <h2 id={`year-${group.year}`} className="font-display text-token-lg text-ink">{group.year}</h2>
            <div className="mt-2">
              {group.list.map((event) => <EventRow key={event.id} event={event} />)}
            </div>
          </section>
        ))}

        {shown.length === 0 ? (
          <p className="py-10 text-token-sm text-ink-faint">這個類型目前沒有事件。</p>
        ) : null}

      </DashboardLayout>
    </div>
  );
}

function EventRow({ event }) {
  const items = (event.items ?? []).map((id) => ITEM_NAME.get(id)).filter(Boolean);
  return (
    <article className="-mx-3 flex gap-4 border-b border-line-soft px-3 py-4 last:border-b-0">
      <span className="w-[5ch] shrink-0 whitespace-nowrap pt-0.5 font-accent text-token-xs tabular-nums text-ink-faint">
        {dayLabel(event.date)}
      </span>
      <div className="min-w-0">
        <h3 id={`event-${event.id}`} className="font-display text-token-base text-ink">
          {event.posts.length === 1 && event.derived ? (
            <Link to={`/${event.posts[0]}`} className="transition-colors duration-fast hover:text-accent">
              {event.title}
            </Link>
          ) : event.title}
        </h3>
        {event.summary ? <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">{event.summary}</p> : null}
        {items.length > 0 || event.links.length > 0 ? (
          <p className="mt-2 text-token-sm text-ink-muted">
            {items.length > 0 ? <span>{items.join('、')}</span> : null}
            {event.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="ml-3 underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent"
              >
                {link.label}
              </a>
            ))}
          </p>
        ) : null}
      </div>
    </article>
  );
}
