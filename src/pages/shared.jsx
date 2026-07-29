import { Link } from 'react-router-dom';
import { ArticleNav, Prose } from '@phenomcanvas/ui';
import notes from '../data/generated/notes.json';
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

export function HtmlProse({ html, className = '' }) {
  return (
    <Prose>
      <div className={`notes-html ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
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
