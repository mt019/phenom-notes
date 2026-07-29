import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  AppearanceMenu,
  DashboardLayout,
  Dropdown,
  FilterBar,
  FontSizeControl,
  SectionLink,
  useFontScale,
  useTabParam,
} from '@phenomcanvas/ui';
import notes from '../data/generated/notes.json';
import archive from '../data/generated/archive.json';
import stream from '../data/generated/stream.json';
import { CANVAS_HOME, CANVAS_INDEX } from '../config.js';

export default function HomePage() {
  const { site, posts = [], tags = [] } = notes;
  const [scale, setScale] = useFontScale();
  const [tag, setTag] = useTabParam('tag', 'all');
  const shown = useMemo(
    () => (tag === 'all' ? posts : posts.filter((post) => (post.tags ?? []).includes(tag))),
    [posts, tag],
  );
  const years = useMemo(() => {
    const out = [];
    for (const post of shown) {
      const year = post.publishedAt.slice(0, 4);
      const last = out.at(-1);
      if (last?.year === year) last.list.push(post);
      else out.push({ year, list: [post] });
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
        eyebrow="Notes"
        title={site.title}
        summary={site.intro}
        tocLabel="本頁區塊"
        refreshKey={tag}
      >
        <SectionLink to="/stream" title="短記" count={stream.count} className="mb-8">
          <span className="mr-2 whitespace-nowrap font-accent text-token-xs tabular-nums text-ink-faint">
            {stream.latest.date} {stream.latest.time}
          </span>
          {stream.latest.text}
        </SectionLink>

        <FilterBar
          label="標籤"
          note={tag === 'all' ? null : `列出 ${shown.length} 篇，全部共 ${posts.length} 篇`}
          className="mb-10"
        >
          <Dropdown
            value={tag}
            onChange={(value) => setTag(value, { scroll: 'preserve' })}
            options={[
              { value: 'all', label: `全部（${posts.length}）` },
              ...tags.map((item) => ({ value: item.label, label: `${item.label}（${item.count}）` })),
            ]}
            panelWidth="w-64"
          />
          {tag === 'all' ? null : (
            <button
              type="button"
              onClick={() => setTag('all', { scroll: 'preserve' })}
              className="text-token-sm text-ink-faint underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent"
            >
              清除
            </button>
          )}
        </FilterBar>

        {years.map((group, index) => (
          <section key={group.year} className={index === 0 ? '' : 'mt-12 border-t border-line pt-8'}>
            <h2 id={`year-${group.year}`} className="font-display text-token-lg text-ink">{group.year}</h2>
            <div className="mt-1">
              {group.list.map((post) => <PostRow key={post.slug} post={post} />)}
            </div>
          </section>
        ))}

        {shown.length === 0 ? (
          <p className="py-10 text-token-sm text-ink-faint">沒有標記「{tag}」的文章。</p>
        ) : null}

        <div className="mt-14 border-t border-line pt-2">
          <SectionLink to="/archive" title="舊帖" count={archive.count}>
            {archive.dateRange.from.slice(0, 4)}–{archive.dateRange.to.slice(0, 4)} 年的短記，多半只有一兩行，
            最短的一則六個字。收在同一頁上，按年份排。
          </SectionLink>
        </div>

        <div className="mt-10 border-t border-line-soft pt-5">
          <p className="text-token-sm leading-relaxed text-ink-faint">{site.note}</p>
        </div>
      </DashboardLayout>
    </div>
  );
}

function PostRow({ post }) {
  return (
    <Link
      to={post.route}
      className="group -mx-3 block rounded-token-md px-3 py-5 transition-colors duration-fast hover:bg-surface"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3
          id={`post-${post.slug}`}
          className="font-display text-token-lg text-ink transition-colors duration-fast group-hover:text-accent"
        >
          {post.title}
        </h3>
        <ArrowRight
          size={16}
          className="shrink-0 text-ink-faint transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </div>
      {post.subtitle ? <p className="mt-1 text-token-sm text-ink-muted">{post.subtitle}</p> : null}
      <p className="mt-2 text-token-sm leading-relaxed text-ink-faint">{post.summary}</p>
      <p className="mt-3 font-accent text-token-xs text-ink-faint">
        {post.publishedAt}
        {post.readingMinutes ? ` · 約 ${post.readingMinutes} 分鐘` : ''}
        {(post.tags ?? []).length > 0 ? ` · ${post.tags.join('、')}` : ''}
      </p>
    </Link>
  );
}
