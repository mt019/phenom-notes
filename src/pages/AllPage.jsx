// 總覽：這個站上的東西一次全部列出來，不先分類。
//
// 三種內容各有各的家（文章、條目、短記），這一頁只把它們排在同一條時間軸上，
// 讓「我那件事寫在哪裡」有一個地方可以查。類型是可選的篩選，不篩就是全部。
// 別的站之後接進來時，資料倉那邊多一個來源，這一頁不必改。
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArticleLayout,
  Dropdown,
  FilterBar,
  SiteHeader,
  useFontScale,
  useTabParam,
} from '@phenomcanvas/ui';
import all from '../data/generated/all.json';
import { CANVAS_HOME, CANVAS_INDEX, NOTES_HOME } from '../config.js';
import { postsNav } from './shared.jsx';

const KIND_LABEL = { post: '文章', kb: '條目', stream: '短記' };

export default function AllPage() {
  const [scale, setScale] = useFontScale();
  const [kind, setKind] = useTabParam('kind', 'all');

  const shown = useMemo(
    () => (kind === 'all' ? all.items : all.items.filter((item) => item.kind === kind)),
    [kind],
  );
  const months = useMemo(() => {
    const out = [];
    for (const item of shown) {
      const month = item.date.slice(0, 7);
      const last = out.at(-1);
      if (last?.month === month) last.list.push(item);
      else out.push({ month, list: [item] });
    }
    return out;
  }, [shown]);

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
        title="全部"
        eyebrow="手記"
        eyebrowBack={NOTES_HOME}
        summary="這個站上的文章、條目與短記排在同一條時間軸上，按日期新到舊。改過的東西按改的那天排。"
        meta={(
          <p className="mt-5 border-y border-line-soft py-3 text-token-xs leading-relaxed text-ink-faint">
            <span className="font-accent tabular-nums">{all.count}</span> 項：
            {all.kinds.map((item, index) => (
              <span key={item.id}>
                {index > 0 ? '、' : ''}
                {item.label} <span className="font-accent tabular-nums">{item.count}</span>
              </span>
            ))}
            。目前收的是手記站自己的東西，別的站還沒有接進來。
          </p>
        )}
        tocLabel="月份"
        tocKey="notes-all"
        tocLevels={[2]}
        nav={postsNav()}
      >
        <FilterBar
          label="類型"
          note={kind === 'all' ? null : `列出 ${shown.length} 項，全部共 ${all.count} 項`}
          className="mb-10"
        >
          <Dropdown
            value={kind}
            onChange={(value) => setKind(value, { scroll: 'preserve' })}
            options={[
              { value: 'all', label: `全部（${all.count}）` },
              ...all.kinds.map((item) => ({ value: item.id, label: `${item.label}（${item.count}）` })),
            ]}
            panelWidth="w-56"
          />
          {kind === 'all' ? null : (
            <button
              type="button"
              onClick={() => setKind('all', { scroll: 'preserve' })}
              className="text-token-sm text-ink-faint underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent"
            >
              清除
            </button>
          )}
        </FilterBar>

        {months.map((group, index) => (
          <section key={group.month} className={index === 0 ? '' : 'mt-10 border-t border-line pt-6'}>
            <h2 id={`m-${group.month}`} className="font-display text-token-lg text-ink">{group.month}</h2>
            <ul className="mt-1">
              {group.list.map((item) => <Row key={item.id} item={item} />)}
            </ul>
          </section>
        ))}
      </ArticleLayout>
    </main>
  );
}

function Row({ item }) {
  return (
    <li>
      <Link
        to={item.route}
        className="group -mx-3 flex items-baseline gap-3 rounded-token-md px-3 py-3 transition-colors duration-fast hover:bg-surface"
      >
        <span className="w-[5.5rem] shrink-0 whitespace-nowrap font-accent text-token-xs tabular-nums text-ink-faint">
          {item.date}
        </span>
        <span className="w-8 shrink-0 whitespace-nowrap font-accent text-token-xs text-ink-faint">
          {KIND_LABEL[item.kind]}
        </span>
        <span className="text-token-sm leading-relaxed text-ink transition-colors duration-fast group-hover:text-accent">
          {item.title}
        </span>
      </Link>
    </li>
  );
}
