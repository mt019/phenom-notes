// 條目索引。流式版面：左欄按分類列出全部條目，正文順著分類往下走，右欄目次是分類。
// 分類只在這一頁分組，不進網址——條目換了分類，它自己的網址不動。
import { Link } from 'react-router-dom';
import { ArticleLayout, SiteHeader, useFontScale } from '@phenomcanvas/ui';
import kb from '../data/generated/kb.json';
import { CANVAS_HOME, CANVAS_INDEX, NOTES_HOME } from '../config.js';
import { kbNav } from './shared.jsx';

export default function KbIndexPage() {
  const { site, entries = [], categories = [] } = kb;
  const [scale, setScale] = useFontScale();
  const used = categories.filter((item) => item.count > 0);

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
        title={site.title}
        eyebrow="手記"
        eyebrowBack={NOTES_HOME}
        summary={site.intro}
        meta={(
          <p className="mt-5 border-y border-line-soft py-3 text-token-xs leading-relaxed text-ink-faint">
            <span className="font-accent tabular-nums">{entries.length}</span> 則，分在{' '}
            <span className="font-accent tabular-nums">{used.length}</span> 個分類底下。
          </p>
        )}
        tocLabel="分類"
        tocKey="notes-kb"
        tocLevels={[2]}
        nav={kbNav()}
      >
        {used.map((category, index) => (
          <section
            key={category.label}
            className={index === 0 ? '' : 'mt-12 border-t border-line pt-8'}
          >
            <h2 id={`c-${category.label}`} className="font-display text-token-lg text-ink">
              {category.label}
            </h2>
            <ul className="mt-1">
              {entries.filter((entry) => entry.category === category.label).map((entry) => (
                <li key={entry.slug}>
                  <Link
                    to={entry.route}
                    className="group -mx-3 block rounded-token-md px-3 py-5 transition-colors duration-fast hover:bg-surface"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="shrink-0 whitespace-nowrap font-accent text-token-xs tabular-nums text-ink-faint">
                        {entry.id}
                      </span>
                      <h3 className="font-display text-token-md text-ink transition-colors duration-fast group-hover:text-accent">
                        {entry.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-token-sm leading-relaxed text-ink-muted">{entry.question}</p>
                    <p className="mt-2 font-accent text-token-xs tabular-nums text-ink-faint">
                      建立 {entry.createdAt}
                      {entry.updatedAt !== entry.createdAt ? `　更新 ${entry.updatedAt}` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {entries.length === 0 ? (
          <p className="py-10 text-token-sm text-ink-faint">還沒有條目。</p>
        ) : null}
      </ArticleLayout>
    </main>
  );
}
