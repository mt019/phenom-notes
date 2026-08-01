import {
  ArticleLayout,
  SiteHeader,
  useFontScale,
} from '@phenomcanvas/ui';
import archive from '../data/generated/archive.json';
import content from '../data/generated/content.json';
import { CANVAS_HOME, CANVAS_INDEX, NOTES_HOME } from '../config.js';
import { HtmlProse, postsNav } from './shared.jsx';

export default function ArchivePage() {
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
        title="舊帖"
        eyebrow="手記"
        eyebrowBack={NOTES_HOME}
        summary={`${archive.dateRange.from.slice(0, 4)} 到 ${archive.dateRange.to.slice(0, 4)} 年寫在 Matters 與一個已經關掉的個人站上的短記，多半只有一兩行，最短的一則六個字。它們短到撐不起自己的一頁，所以收在這裡，按年份排，從最早的一則讀下來。正文與當年一字不改。`}
        meta={(
          <p className="mt-5 border-y border-line-soft py-3 text-token-xs leading-relaxed text-ink-faint">
            <span className="font-accent tabular-nums">{archive.count}</span> 則，
            <span className="font-accent tabular-nums">{archive.dateRange.from}</span> 至{' '}
            <span className="font-accent tabular-nums">{archive.dateRange.to}</span>
            {archive.years.map((year) => (
              <span key={year.year}>
                ；{year.year} 年 <span className="font-accent tabular-nums">{year.count}</span> 則
              </span>
            ))}
            。
          </p>
        )}
        tocLabel="年份"
        tocKey="notes-archive"
        tocLevels={[2]}
        nav={postsNav()}
      >
        <HtmlProse html={content.archive} />
      </ArticleLayout>
    </main>
  );
}
