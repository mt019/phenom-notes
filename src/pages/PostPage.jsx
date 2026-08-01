import { useParams } from 'react-router-dom';
import {
  ArticleLayout,
  ArticleMeta,
  SiteHeader,
  useFontScale,
} from '@phenomcanvas/ui';
import notes from '../data/generated/notes.json';
import content from '../data/generated/content.json';
import { CANVAS_HOME, CANVAS_INDEX, NOTES_HOME } from '../config.js';
import { ContentLink, HtmlProse, postsNav } from './shared.jsx';
import NotFoundPage from './NotFoundPage.jsx';

export default function PostPage() {
  const { slug } = useParams();
  const [scale, setScale] = useFontScale();
  const post = notes.posts.find((item) => item.slug === slug);
  const body = content.posts[slug];

  if (!post || !body) {
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
        title={post.title}
        eyebrow="手記"
        eyebrowBack={NOTES_HOME}
        summary={post.subtitle}
        meta={(
          <ArticleMeta
            publishedAt={post.publishedAt}
            updatedAt={post.updatedAt}
            readingMinutes={post.readingMinutes}
            tags={post.tags ?? []}
          />
        )}
        tocLabel="本頁目次"
        tocKey={slug}
        hideToc={!post.hasSections}
        keepReadingWidth
        nav={postsNav(slug)}
      >
        <HtmlProse html={body} />

        {(post.related ?? []).length > 0 ? (
          <section className="mt-12 border-t border-line-soft pt-6">
            <h2 className="mb-3 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">延伸</h2>
            <ul className="space-y-2">
              {post.related.map((item) => (
                <li key={item.href} className="text-token-sm leading-relaxed">
                  <ContentLink href={item.href} className="text-ink transition-colors duration-fast hover:text-accent">
                    {item.label}
                  </ContentLink>
                  {item.note ? <span className="text-ink-faint">——{item.note}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </ArticleLayout>
    </main>
  );
}
