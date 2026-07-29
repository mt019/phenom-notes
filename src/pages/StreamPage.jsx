import {
  ArticleLayout,
  SiteHeader,
  useFontScale,
} from '@phenomcanvas/ui';
import stream from '../data/generated/stream.json';
import { CANVAS_HOME, CANVAS_INDEX } from '../config.js';
import { postsNav } from './shared.jsx';

export default function StreamPage() {
  const [scale, setScale] = useFontScale();
  return (
    <main
      id="main-content"
      className="reading-grain min-h-screen bg-paper pb-10 text-ink"
      style={{ '--reader-scale': scale }}
    >
      <SiteHeader
        back={CANVAS_HOME}
        backIndexHref={CANVAS_INDEX}
        scale={scale}
        onScaleChange={setScale}
      />
      <ArticleLayout
        title="短記"
        eyebrow="手記"
        summary="一句話一則，說的當下就記下來。每則標的時刻是按下送出的那一刻，所以連跟伺服器收到的那幾秒差距都留著。不成篇，也不修飾。"
        meta={(
          <p className="mt-5 border-y border-line-soft py-3 text-token-xs leading-relaxed text-ink-faint">
            <span className="font-accent tabular-nums">{stream.count}</span> 則，最早一則在{' '}
            <span className="font-accent tabular-nums">{stream.dateRange.from.slice(0, 10)}</span>，
            最近一則在 <span className="font-accent tabular-nums">{stream.dateRange.to.slice(0, 10)}</span>。
          </p>
        )}
        tocLabel="月份"
        tocKey="notes-stream"
        tocLevels={[2]}
        nav={postsNav()}
      >
        {stream.months.map((month) => (
          <section key={month.id} className="mt-12 border-t border-line pt-8 first:mt-0 first:border-0 first:pt-0">
            <h2 id={month.id} className="font-display text-token-lg text-ink">{month.label}</h2>
            {month.days.map((day) => (
              <div key={day.day}>
                <div className="my-6 flex items-center gap-4">
                  <span className="h-px flex-1 bg-line-soft" />
                  <span className="whitespace-nowrap font-accent text-token-xs tabular-nums text-ink-faint">
                    {day.label}
                  </span>
                  <span className="h-px flex-1 bg-line-soft" />
                </div>
                {day.items.map((item) => <Entry key={item.id} item={item} />)}
              </div>
            ))}
          </section>
        ))}
      </ArticleLayout>
    </main>
  );
}

function Entry({ item }) {
  return (
    <div id={item.id} className="flex scroll-mt-28 gap-4 py-2.5">
      <a
        href={`#${item.id}`}
        aria-label={`${item.time} 這一則的連結`}
        className="w-[5ch] shrink-0 whitespace-nowrap pt-[0.2em] font-accent text-token-xs tabular-nums text-ink-faint transition-colors duration-fast hover:text-accent"
      >
        {item.time}
      </a>
      <div className="min-w-0 flex-1">
        {item.paras.map((para, index) => (
          <p key={`${item.id}-${index}`} className="mt-2 whitespace-pre-line text-token-base leading-relaxed text-ink first:mt-0">
            {linkify(para)}
          </p>
        ))}
        {(item.images ?? []).map((image) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            loading="lazy"
            className="mt-3 max-w-full rounded-token-sm"
          />
        ))}
      </div>
    </div>
  );
}

const URL_RE = /(https?:\/\/[^\s，。、）)]+)/g;
function linkify(text) {
  return text.split(URL_RE).map((part, index) => (index % 2 === 1 ? (
    <a
      key={`${part}-${index}`}
      href={part}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline decoration-line underline-offset-2"
    >
      {part}
    </a>
  ) : <span key={`${index}-${part}`}>{part}</span>));
}
