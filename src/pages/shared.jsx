import { Link } from 'react-router-dom';
import { AnnotatedHtml, ArticleNav, Prose } from '@phenomcanvas/ui';
import notes from '../data/generated/notes.json';
import kb from '../data/generated/kb.json';
import { relatedTarget } from '../config.js';

export function postsNav(currentSlug) {
  const years = [...new Set(notes.posts.map((post) => post.publishedAt.slice(0, 4)))];
  return (
    <ArticleNav
      topics={years.map((year) => ({ id: year, label: `${year} 年` }))}
      articles={notes.posts.map((post) => ({ ...post, topic: post.publishedAt.slice(0, 4) }))}
      currentSlug={currentSlug}
      homeHref="/"
      homeLabel="手記"
    />
  );
}

// 條目的左欄按分類分組。分類的順序照 data/kb.json 寫的順序，空的分類 ArticleNav 自己會略過。
export function kbNav(currentSlug) {
  return (
    <ArticleNav
      topics={(kb.categories ?? []).map((item) => ({ id: item.label, label: item.label }))}
      articles={(kb.entries ?? []).map((entry) => ({ ...entry, topic: entry.category }))}
      currentSlug={currentSlug}
      homeHref="/kb"
      homeLabel="條目"
    />
  );
}

// 正文在建置時就轉成 HTML 了，註標由 render-markdown.mjs 寫成 <sup class="fn-ref">。
// AnnotatedHtml 用事件委派把註標接上浮卡；沒有註的文章走同一條路，notes 是空陣列。
export function HtmlProse({ html, notes: annotations = [], className = '' }) {
  return (
    <Prose>
      <AnnotatedHtml html={html} notes={annotations} className={`notes-html ${className}`} />
    </Prose>
  );
}

export function ContentLink({ href, children, className }) {
  const target = relatedTarget(href);
  if (target.external) {
    return <a href={target.href} className={className}>{children}</a>;
  }
  return <Link to={target.href} className={className}>{children}</Link>;
}
