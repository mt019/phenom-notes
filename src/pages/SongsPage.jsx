import { useMemo } from 'react';
import {
  AppearanceMenu,
  DashboardLayout,
  Dropdown,
  FilterBar,
  FontSizeControl,
  useFontScale,
  useTabParam,
} from '@phenomcanvas/ui';
import songsData from '../data/generated/songs.json';
import { CANVAS_HOME, CANVAS_INDEX, NOTES_HOME } from '../config.js';

const STATUS_LABEL = { partial: '只有一小段', planned: '還沒' };

// 語言的分類色用設計系統的資料 mark 槽（--viz-1 起，順序照資料層的語言表，固定不重排）。
// badge 的 --cat 灰調不給點陣用——點沒有標籤可靠，規則寫在 tokens.css 的 Layer 1c 註解。
const catColor = (index) => `var(--viz-${index + 1})`;

export default function SongsPage() {
  const { languages, songs, stats } = songsData;
  const [scale, setScale] = useFontScale();
  const [language, setLanguage] = useTabParam('language', 'all');
  const [view, setView] = useTabParam('view', 'lang');

  const shown = useMemo(
    () => (language === 'all' ? songs : songs.filter((song) => song.language === language)),
    [songs, language],
  );
  const groups = useMemo(
    () => languages
      .map((entry) => ({ ...entry, list: shown.filter((song) => song.language === entry.id) }))
      .filter((entry) => entry.list.length > 0),
    [languages, shown],
  );

  // 月帶：一個月一列、一次唱一個點，中間沒有紀錄的月份也留一列，節奏才看得出來。
  const months = useMemo(() => {
    const byMonth = new Map();
    for (const song of shown) {
      for (const date of song.dates) {
        const month = date.slice(0, 7);
        if (!byMonth.has(month)) byMonth.set(month, []);
        byMonth.get(month).push({ date, song });
      }
    }
    const keys = [...byMonth.keys()].sort();
    if (keys.length === 0) return [];
    const out = [];
    let cursor = keys[0];
    while (cursor <= keys.at(-1)) {
      const list = (byMonth.get(cursor) ?? []).sort((a, b) => a.date.localeCompare(b.date));
      out.push({ month: cursor, list });
      const [year, month] = cursor.split('-').map(Number);
      cursor = month === 12
        ? `${year + 1}-01`
        : `${year}-${String(month + 1).padStart(2, '0')}`;
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
        title="歌單"
        summary="聲樂課唱過的歌，一首一列：原唱、發行年份、唱的日期。"
        tocLabel="語言"
        refreshKey={language}
      >
        <p className="mb-8 border-y border-line-soft py-3 text-token-sm leading-relaxed text-ink-muted">
          <span className="font-accent tabular-nums">{stats.count}</span> 首，唱過{' '}
          <span className="font-accent tabular-nums">{stats.sung}</span> 首
          {stats.dateRange ? (
            <>
              ，從 <span className="font-accent tabular-nums">{stats.dateRange.from}</span> 到{' '}
              <span className="font-accent tabular-nums">{stats.dateRange.to}</span>
            </>
          ) : null}
          。
        </p>

        <FilterBar
          label="語言"
          note={language === 'all' ? null : `列出 ${shown.length} 首，全部共 ${songs.length} 首`}
          className="mb-8"
        >
          <Dropdown
            value={language}
            onChange={(value) => setLanguage(value, { scroll: 'preserve' })}
            options={[
              { value: 'all', label: `全部（${songs.length}）` },
              ...languages.map((entry) => ({ value: entry.id, label: `${entry.label}（${entry.count}）` })),
            ]}
            panelWidth="w-44"
          />
          {language === 'all' ? null : (
            <button
              type="button"
              onClick={() => setLanguage('all', { scroll: 'preserve' })}
              className="text-token-sm text-ink-faint underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent"
            >
              清除
            </button>
          )}
        </FilterBar>

        {months.length > 0 ? (
          <figure className="mb-12">
            <figcaption className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-token-xs text-ink-muted">
              <span>每月唱過的歌，一次一點</span>
              {languages.map((entry, index) => (
                <span key={entry.id} className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: catColor(index) }}
                  />
                  {entry.label}
                </span>
              ))}
              <span className="ml-auto inline-flex items-center gap-3">
                {[['lang', '分語言'], ['time', '時間序']].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setView(value, { scroll: 'preserve' })}
                    className={view === value
                      ? 'text-ink'
                      : 'text-ink-faint underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent'}
                  >
                    {label}
                  </button>
                ))}
              </span>
            </figcaption>
            <div className="border-y border-line-soft py-2">
              {months.map(({ month, list }) => (
                <div key={month} className="flex items-center gap-4 py-1">
                  <span className="w-[7ch] shrink-0 whitespace-nowrap font-accent text-token-xs tabular-nums text-ink-faint">
                    {month}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {view === 'time' ? (
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {list.map((event) => {
                          const index = languages.findIndex((entry) => entry.id === event.song.language);
                          return (
                            <span
                              key={`${event.song.id}-${event.date}`}
                              title={`${event.date}　${event.song.title}（${languages[index].label}）`}
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: catColor(index) }}
                            />
                          );
                        })}
                      </span>
                    ) : languages.map((entry, index) => {
                      const dots = list.filter((event) => event.song.language === entry.id);
                      if (dots.length === 0) return null;
                      return (
                        <span key={entry.id} className="inline-flex items-center gap-1.5">
                          {dots.map((event) => (
                            <span
                              key={`${event.song.id}-${event.date}`}
                              title={`${event.date}　${event.song.title}（${entry.label}）`}
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: catColor(index) }}
                            />
                          ))}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </figure>
        ) : null}

        {groups.map((group, index) => (
          <section key={group.id} className={index === 0 ? '' : 'mt-12 border-t border-line pt-8'}>
            <h2 id={`language-${group.id}`} className="font-display text-token-lg text-ink">
              {group.label}
              <span className="ml-2 font-accent text-token-sm tabular-nums text-ink-faint">{group.list.length}</span>
            </h2>
            <div className="mt-2">
              {group.list.map((song) => <SongRow key={song.id} song={song} />)}
            </div>
          </section>
        ))}

      </DashboardLayout>
    </div>
  );
}

function SongRow({ song }) {
  return (
    <article className="-mx-3 flex gap-4 border-b border-line-soft px-3 py-4 last:border-b-0">
      <span className="flex w-[10ch] shrink-0 flex-col gap-0.5 whitespace-nowrap pt-0.5 font-accent text-token-xs tabular-nums text-ink-faint">
        {song.dates.length > 0 ? song.dates.map((date) => <span key={date}>{date}</span>) : '—'}
      </span>
      <div className="min-w-0">
        <h3 id={`song-${song.id}`} className="font-display text-token-base text-ink">
          {song.title}
          {STATUS_LABEL[song.status] ? (
            <span className="ml-2 text-token-xs text-ink-faint">{STATUS_LABEL[song.status]}</span>
          ) : null}
        </h3>
        <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">
          {song.artist}
          {song.year ? <span className="ml-2 font-accent text-token-xs tabular-nums">{song.year}</span> : null}
          {song.note ? <span className="ml-2 text-ink-faint">{song.note}</span> : null}
        </p>
      </div>
    </article>
  );
}
