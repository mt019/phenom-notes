import { computed, defineComponent } from 'vue';
// 單則條目。版型與文章共用同一個殼，差別在眉標印編號、日期印建立與更新兩個、
// 正文底下多一段出處。
import { useRoute } from 'vue-router';
import {
  ArticleLayout,
  SiteHeader,
  useFontScale,
} from '@phenomcanvas/ui-vue';
import kb from '../data/generated/kb.json';
import content from '../data/generated/content.json';
import { CANVAS_HOME, CANVAS_INDEX, KB_HOME } from '../config.js';
import { ContentLink, HtmlProse, kbNav } from './shared.jsx';
import NotFoundPage from './NotFoundPage.jsx';

export default defineComponent({
  name: 'KbEntryPage',
  setup() {
    const route = useRoute();
    const slug = computed(() => route.params.slug);
    const { scale, setScale } = useFontScale();
    const entry = computed(() => (kb.entries ?? []).find((item) => item.slug === slug.value));
    const body = computed(() => content.kb?.[slug.value]);

    return () => {
      if (!entry.value || !body.value?.html) {
        return <NotFoundPage />;
      }

      return (
        <main
          id="main-content"
          class="reading-grain min-h-screen bg-paper pb-10 text-ink"
          style={{ '--reader-scale': scale.value }}
        >
          <SiteHeader
            back={CANVAS_HOME}
            backIndexHref={CANVAS_INDEX}
            scale={scale.value}
            onScaleChange={setScale}
          />
          <ArticleLayout
            title={entry.value.title}
            eyebrow="條目"
            eyebrowBack={KB_HOME}
            summary={entry.value.question}
            meta={(
              <p class="mt-5 border-y border-line-soft py-3 font-accent text-token-xs leading-relaxed text-ink-faint">
                <span class="tabular-nums">{entry.value.id}</span>
                <span class="mx-2">·</span>
                {entry.value.category}
                <span class="mx-2">·</span>
                <span class="tabular-nums">建立 {entry.value.createdAt}</span>
                <span class="mx-2">·</span>
                <span class="tabular-nums">更新 {entry.value.updatedAt}</span>
                <span class="mx-2">·</span>
                <span class="tabular-nums">{entry.value.readingMinutes} 分鐘</span>
              </p>
            )}
            tocLabel="本頁目次"
            tocKey={`kb-${slug.value}`}
            hideToc={!entry.value.hasSections}
            keepReadingWidth
            nav={kbNav(slug.value)}
          >
            <HtmlProse html={body.value.html} notes={body.value.notes} />

            {/* 正文掛得出註標的條目，出處已經隨註腳清單印在正文末尾（同一組資料，見
                scripts/render-markdown.mjs）。這一節只留給還沒逐句掛註的條目，兩份都印會讓
                讀者以為那是兩組來源。 */}
            {(body.value.notes ?? []).length > 0 ? null : (
            <section class="mt-12 border-t border-line-soft pt-6">
              <h2 class="mb-3 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">出處</h2>
              <ul class="space-y-2">
                {(entry.value.sources ?? []).map((source) => (
                  <li key={source.label} class="text-token-sm leading-relaxed">
                    {source.href
                      ? <a href={source.href} class="text-ink transition-colors duration-fast hover:text-accent">{source.label}</a>
                      : <span class="text-ink">{source.label}</span>}
                    {source.note ? <span class="text-ink-faint">　{source.note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
            )}

            {(entry.value.related ?? []).length > 0 ? (
              <section class="mt-10 border-t border-line-soft pt-6">
                <h2 class="mb-3 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">相關條目</h2>
                <ul class="space-y-2">
                  {entry.value.related.map((item) => (
                    <li key={item.href} class="text-token-sm leading-relaxed">
                      <ContentLink href={item.href} class="text-ink transition-colors duration-fast hover:text-accent">
                        {item.label}
                      </ContentLink>
                      {item.note ? <span class="text-ink-faint">　{item.note}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </ArticleLayout>
        </main>
      );
    };
  },
});
