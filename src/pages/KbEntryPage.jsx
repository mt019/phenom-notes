// 單則條目。版型與文章共用同一個殼，差別在眉標印編號、日期印建立與更新兩個、
// 正文底下多一段出處。
import { useParams } from 'react-router-dom';
import {
  ArticleLayout,
  SiteHeader,
  useFontScale,
} from '@phenomcanvas/ui';
import kb from '../data/generated/kb.json';
import content from '../data/generated/content.json';
import { CANVAS_HOME, CANVAS_INDEX, KB_HOME } from '../config.js';
import { ContentLink, HtmlProse, kbNav } from './shared.jsx';
import NotFoundPage from './NotFoundPage.jsx';

export default function KbEntryPage() {
  const { slug } = useParams();
  const [scale, setScale] = useFontScale();
  const entry = (kb.entries ?? []).find((item) => item.slug === slug);
  const body = content.kb?.[slug];

  if (!entry || !body?.html) {
    return <NotFoundPage />;
  }

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
        title={entry.title}
        eyebrow="條目"
        eyebrowBack={KB_HOME}
        summary={entry.question}
        meta={(
          <p className="mt-5 border-y border-line-soft py-3 font-accent text-token-xs leading-relaxed text-ink-faint">
            <span className="tabular-nums">{entry.id}</span>
            <span className="mx-2">·</span>
            {entry.category}
            <span className="mx-2">·</span>
            <span className="tabular-nums">建立 {entry.createdAt}</span>
            <span className="mx-2">·</span>
            <span className="tabular-nums">更新 {entry.updatedAt}</span>
            <span className="mx-2">·</span>
            <span className="tabular-nums">{entry.readingMinutes} 分鐘</span>
          </p>
        )}
        tocLabel="本頁目次"
        tocKey={`kb-${slug}`}
        hideToc={!entry.hasSections}
        keepReadingWidth
        nav={kbNav(slug)}
      >
        <HtmlProse html={body.html} notes={body.notes} />

        {/* 正文掛得出註標的條目，出處已經隨註腳清單印在正文末尾（同一組資料，見
            scripts/render-markdown.mjs）。這一節只留給還沒逐句掛註的條目，兩份都印會讓
            讀者以為那是兩組來源。 */}
        {(body.notes ?? []).length > 0 ? null : (
        <section className="mt-12 border-t border-line-soft pt-6">
          <h2 className="mb-3 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">出處</h2>
          <ul className="space-y-2">
            {(entry.sources ?? []).map((source) => (
              <li key={source.label} className="text-token-sm leading-relaxed">
                {source.href
                  ? <a href={source.href} className="text-ink transition-colors duration-fast hover:text-accent">{source.label}</a>
                  : <span className="text-ink">{source.label}</span>}
                {source.note ? <span className="text-ink-faint">　{source.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
        )}

        {(entry.related ?? []).length > 0 ? (
          <section className="mt-10 border-t border-line-soft pt-6">
            <h2 className="mb-3 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">相關條目</h2>
            <ul className="space-y-2">
              {entry.related.map((item) => (
                <li key={item.href} className="text-token-sm leading-relaxed">
                  <ContentLink href={item.href} className="text-ink transition-colors duration-fast hover:text-accent">
                    {item.label}
                  </ContentLink>
                  {item.note ? <span className="text-ink-faint">　{item.note}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </ArticleLayout>
    </main>
  );
}
