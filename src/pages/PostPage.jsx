import { computed, defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import {
  ArticleLayout,
  ArticleMeta,
  SiteHeader,
  useFontScale,
} from '@phenomcanvas/ui-vue';
import notes from '../data/generated/notes.json';
import content from '../data/generated/content.json';
import { CANVAS_HOME, CANVAS_INDEX, NOTES_HOME } from '../config.js';
import { ContentLink, HtmlProse, postsNav } from './shared.jsx';
import NotFoundPage from './NotFoundPage.jsx';

export default defineComponent({
  name: 'PostPage',
  setup() {
    const route = useRoute();
    const slug = computed(() => route.params.slug);
    const { scale, setScale } = useFontScale();
    const post = computed(() => notes.posts.find((item) => item.slug === slug.value));
    const body = computed(() => content.posts[slug.value]);

    return () => {
      if (!post.value || !body.value?.html) {
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
            title={post.value.title}
            eyebrow="手記"
            eyebrowBack={NOTES_HOME}
            summary={post.value.subtitle}
            meta={(
              <ArticleMeta
                publishedAt={post.value.publishedAt}
                updatedAt={post.value.updatedAt}
                readingMinutes={post.value.readingMinutes}
                tags={post.value.tags ?? []}
              />
            )}
            tocLabel="本頁目次"
            tocKey={slug.value}
            hideToc={!post.value.hasSections}
            keepReadingWidth
            nav={postsNav(slug.value)}
          >
            <HtmlProse html={body.value.html} notes={body.value.notes} />

            {(post.value.related ?? []).length > 0 ? (
              <section class="mt-12 border-t border-line-soft pt-6">
                <h2 class="mb-3 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">延伸</h2>
                <ul class="space-y-2">
                  {post.value.related.map((item) => (
                    <li key={item.href} class="text-token-sm leading-relaxed">
                      <ContentLink href={item.href} class="text-ink transition-colors duration-fast hover:text-accent">
                        {item.label}
                      </ContentLink>
                      {item.note ? <span class="text-ink-faint">——{item.note}</span> : null}
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
