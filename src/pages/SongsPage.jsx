import { computed, defineComponent } from 'vue';
import {
  AppearanceMenu,
  DashboardLayout,
  Dropdown,
  FilterBar,
  FontSizeControl,
  useFontScale,
  useTabParam,
} from '@phenomcanvas/ui-vue';
import songsData from '../data/generated/songs.json';
import { CANVAS_HOME, CANVAS_INDEX, NOTES_HOME } from '../config.js';

const STATUS_LABEL = { partial: '只有一小段', planned: '還沒' };

// 語言的分類色用設計系統的分類 mark 槽（--mark-1 起，順序照資料層的語言表，
// 固定不重排），配圖例、mark 上不標字；紀律正本在 phenom-ui docs/DESIGN.md。
const catColor = (index) => `var(--mark-${index + 1})`;

export default defineComponent({
  name: 'SongsPage',
  setup() {
    const { languages, songs, stats } = songsData;
    const { scale, setScale } = useFontScale();
    const [language, setLanguage] = useTabParam('language', 'all');
    const [grouping, setGrouping] = useTabParam('group', 'lang');

    const shown = computed(
      () => (language.value === 'all' ? songs : songs.filter((song) => song.language === language.value)));
    const languageIndex = computed(
      () => new Map(languages.map((entry, index) => [entry.id, index])));
    // 依日期的攤平清單：唱過的按第一次唱的日期排，還沒唱的排最後。
    const flat = computed(
      () => [...shown.value].sort((a, b) => (a.dates[0] ?? '9999').localeCompare(b.dates[0] ?? '9999') || a.id.localeCompare(b.id)));
    const groups = computed(
      () => languages
        .map((entry) => ({ ...entry, list: shown.value.filter((song) => song.language === entry.id) }))
        .filter((entry) => entry.list.length > 0));

    // 月帶：一個月一列、一次唱一個點，中間沒有紀錄的月份也留一列，節奏才看得出來。
    const months = computed(() => {
      const byMonth = new Map();
      for (const song of shown.value) {
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
    });

    return () => {
      return (
        <div id="main-content">
          <DashboardLayout
            back={CANVAS_HOME}
            backIndexHref={CANVAS_INDEX}
            scale={scale.value}
            headerRight={(
              <>
                <FontSizeControl scale={scale.value} onChange={setScale} />
                <AppearanceMenu />
              </>
            )}
            eyebrow="手記"
            eyebrowBack={NOTES_HOME}
            title="歌單"
            summary="聲樂課唱過的歌，一首一列：原唱、發行年份、唱的日期。"
            tocLabel="語言"
            refreshKey={`${language.value}-${grouping.value}`}
          >
            <p class="mb-8 border-y border-line-soft py-3 text-token-sm leading-relaxed text-ink-muted">
              <span class="font-accent tabular-nums">{stats.count}</span> 首，唱過{' '}
              <span class="font-accent tabular-nums">{stats.sung}</span> 首
              {stats.dateRange ? (
                <>
                  ，從 <span class="font-accent tabular-nums">{stats.dateRange.from}</span> 到{' '}
                  <span class="font-accent tabular-nums">{stats.dateRange.to}</span>
                </>
              ) : null}
              。
            </p>

            <FilterBar
              label="語言"
              note={language.value === 'all' ? null : `列出 ${shown.value.length} 首，全部共 ${songs.length} 首`}
              class="mb-8"
            >
              <Dropdown
                value={language.value}
                onChange={(value) => setLanguage(value, { scroll: 'preserve' })}
                options={[
                  { value: 'all', label: `全部（${songs.length}）` },
                  ...languages.map((entry) => ({ value: entry.id, label: `${entry.label}（${entry.count}）` })),
                ]}
                panelWidth="w-44"
              />
              {language.value === 'all' ? null : (
                <button
                  type="button"
                  onClick={() => setLanguage('all', { scroll: 'preserve' })}
                  class="text-token-sm text-ink-faint underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent"
                >
                  清除
                </button>
              )}
              <span class="ml-auto inline-flex items-center gap-3 text-token-sm">
                {[['lang', '分語言'], ['date', '依日期']].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGrouping(value, { scroll: 'preserve' })}
                    class={grouping.value === value
                      ? 'text-ink'
                      : 'text-ink-faint underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent'}
                  >
                    {label}
                  </button>
                ))}
              </span>
            </FilterBar>

            {months.value.length > 0 ? (
              <figure class="mb-12">
                <figcaption class="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-token-xs text-ink-muted">
                  <span>每月唱過的歌，一次一點</span>
                  {languages.map((entry, index) => (
                    <span key={entry.id} class="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        class="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: catColor(index) }}
                      />
                      {entry.label}
                    </span>
                  ))}
                </figcaption>
                <div class="border-y border-line-soft py-2">
                  {months.value.map(({ month, list }) => (
                    <div key={month} class="flex items-center gap-4 py-1">
                      <span class="w-[7ch] shrink-0 whitespace-nowrap font-accent text-token-xs tabular-nums text-ink-faint">
                        {month}
                      </span>
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        {languages.map((entry, index) => {
                          const dots = list.filter((event) => event.song.language === entry.id);
                          if (dots.length === 0) return null;
                          return (
                            <span key={entry.id} class="inline-flex items-center gap-1.5">
                              {dots.map((event) => (
                                <span
                                  key={`${event.song.id}-${event.date}`}
                                  title={`${event.date}　${event.song.title}（${entry.label}）`}
                                  class="inline-block h-2.5 w-2.5 rounded-full"
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

            {grouping.value === 'date' ? (
              <div class="mt-2">
                {flat.value.map((song) => (
                  <SongRow key={song.id} song={song} colorIndex={languageIndex.value.get(song.language)} />
                ))}
              </div>
            ) : groups.value.map((group, index) => (
              <section key={group.id} class={index === 0 ? '' : 'mt-12 border-t border-line pt-8'}>
                <h2 id={`language-${group.id}`} class="font-display text-token-lg text-ink">
                  {group.label}
                  <span class="ml-2 font-accent text-token-sm tabular-nums text-ink-faint">{group.list.length}</span>
                </h2>
                <div class="mt-2">
                  {group.list.map((song) => (
                    <SongRow key={song.id} song={song} colorIndex={languageIndex.value.get(song.language)} />
                  ))}
                </div>
              </section>
            ))}

          </DashboardLayout>
        </div>
      );
    };
  },
});

function SongRow({ song, colorIndex }) {
  return (
    <article class="-mx-3 flex gap-4 border-b border-line-soft px-3 py-4 last:border-b-0">
      <span class="flex w-[10ch] shrink-0 flex-col gap-0.5 whitespace-nowrap pt-0.5 font-accent text-token-xs tabular-nums text-ink-faint">
        {song.dates.length > 0 ? song.dates.map((date) => <span key={date}>{date}</span>) : '—'}
      </span>
      <div class="min-w-0">
        <h3 id={`song-${song.id}`} class="font-display text-token-base text-ink">
          <span
            aria-hidden="true"
            class="mr-2 inline-block h-2.5 w-2.5 rounded-[3px] align-baseline"
            style={{ backgroundColor: catColor(colorIndex) }}
          />
          {song.title}
          {STATUS_LABEL[song.status] ? (
            <span class="ml-2 text-token-xs text-ink-faint">{STATUS_LABEL[song.status]}</span>
          ) : null}
        </h3>
        <p class="mt-1 text-token-sm leading-relaxed text-ink-muted">
          {song.artist}
          {song.year ? <span class="ml-2 font-accent text-token-xs tabular-nums">{song.year}</span> : null}
          {song.note ? <span class="ml-2 text-ink-faint">{song.note}</span> : null}
        </p>
      </div>
    </article>
  );
}
