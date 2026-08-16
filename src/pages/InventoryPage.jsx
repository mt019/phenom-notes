import { useMemo } from 'react';
import {
  AppearanceMenu,
  DashboardLayout,
  Dropdown,
  FilterBar,
  FontSizeControl,
  useFontScale,
  useTabParam,
} from '@phenomcanvas/ui';
import inventory from '../data/generated/inventory.json';
import { CANVAS_HOME, CANVAS_INDEX, NOTES_HOME } from '../config.js';

const STATUS_LABEL = {
  'in-use': '在用',
  backup: '備用',
  archive: '封存',
  retired: '退役',
  sold: '已出售',
  wishlist: '想買',
};

const FINANCIAL_LABEL = {
  'fixed-asset': '固定設備',
  'movable-asset': '可移動設備',
  'monthly-fixed': '每月固定支出',
  'monthly-variable': '每月浮動支出',
};

const VALUE_LABEL = {
  'production-tool': '生產工具',
  'capability-investment': '能力投資',
  'health-investment': '健康投資',
  'necessary-cost': '必要成本',
  consumption: '一般消費',
};

function formatCapacity(totalGB) {
  return totalGB >= 1000 ? `${(totalGB / 1000).toFixed(totalGB % 1000 === 0 ? 0 : 1)} TB` : `${totalGB} GB`;
}

const PRICE_TONE = {
  actual: 'border-accent/30 bg-accent/5 text-accent',
  'actual-estimate': 'border-line bg-paper-warm text-ink-muted',
  market: 'border-line bg-paper-warm text-ink-muted',
  'market-current': 'border-line bg-paper-warm text-ink-muted',
  bundle: 'border-accent/30 bg-accent/5 text-accent',
};

function formatPrice(price) {
  if (!price?.amount) return null;
  const symbol = price.currency === 'TWD' ? 'NT$' : price.currency === 'HKD' ? 'HK$' : price.currency === 'CNY' ? 'CN¥' : `${price.currency} `;
  return `${symbol}${price.amount.toLocaleString('zh-TW')}`;
}

export default function InventoryPage() {
  const { categories, items, stats } = inventory;
  const [scale, setScale] = useFontScale();
  const [category, setCategory] = useTabParam('category', 'all');
  const [finance, setFinance] = useTabParam('finance', 'all');
  const [valueRole, setValueRole] = useTabParam('role', 'all');

  const shown = useMemo(
    () => items.filter((item) => (category === 'all' || item.category === category)
      && (finance === 'all' || item.financialClass === finance)
      && (valueRole === 'all' || item.valueRoles?.includes(valueRole))),
    [items, category, finance, valueRole],
  );
  const groups = useMemo(
    () => categories
      .map((entry) => ({ ...entry, list: shown.filter((item) => item.category === entry.id) }))
      .filter((entry) => entry.list.length > 0),
    [categories, shown],
  );

  const capacityLine = Object.entries(stats.capacity)
    .map(([kind, value]) => `${kind} ${value.count} 件共 ${formatCapacity(value.totalGB)}`)
    .join('、');

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
        eyebrow="手記"
        eyebrowBack={NOTES_HOME}
        title="器物"
        summary="手上的電腦、相機、儲存與線材，一件一列，附規格、入手時間與價格；實付和市場參考價分開標示。"
        tocLabel="分類"
        refreshKey={`${category}-${finance}-${valueRole}`}
      >
        <p className="mb-8 border-y border-line-soft py-3 text-token-sm leading-relaxed text-ink-muted">
          目前列著 <span className="font-accent tabular-nums">{stats.count}</span> 件，
          分在 <span className="font-accent tabular-nums">{categories.length}</span> 類；
          固定設備與可移動設備共 <span className="font-accent tabular-nums">
            {(stats.byFinancialClass?.['fixed-asset'] ?? 0) + (stats.byFinancialClass?.['movable-asset'] ?? 0)}
          </span> 件，每月支出項目共 <span className="font-accent tabular-nums">
            {(stats.byFinancialClass?.['monthly-fixed'] ?? 0) + (stats.byFinancialClass?.['monthly-variable'] ?? 0)}
          </span> 項。{' '}
          {capacityLine ? `儲存的部分，${capacityLine}。` : null}
        </p>

        <FilterBar
          label="查看"
          note={category === 'all' ? null : `列出 ${shown.length} 件，全部共 ${items.length} 件`}
          className="mb-10"
        >
          <Dropdown
            value={category}
            onChange={(value) => setCategory(value, { scroll: 'preserve' })}
            options={[
              { value: 'all', label: `全部（${items.length}）` },
              ...categories.map((entry) => ({ value: entry.id, label: `${entry.label}（${entry.count}）` })),
            ]}
            panelWidth="w-56"
          />
          <Dropdown
            value={finance}
            onChange={(value) => setFinance(value, { scroll: 'preserve' })}
            options={[
              { value: 'all', label: '全部財務性質' },
              ...Object.entries(FINANCIAL_LABEL).map(([value, label]) => ({
                value,
                label: `${label}（${stats.byFinancialClass?.[value] ?? 0}）`,
              })),
            ]}
            panelWidth="w-48"
          />
          <Dropdown
            value={valueRole}
            onChange={(value) => setValueRole(value, { scroll: 'preserve' })}
            options={[
              { value: 'all', label: '全部用途' },
              ...Object.entries(VALUE_LABEL).map(([value, label]) => ({
                value,
                label: `${label}（${items.filter((item) => item.valueRoles?.includes(value)).length}）`,
              })),
            ]}
            panelWidth="w-44"
          />
          {category === 'all' && finance === 'all' && valueRole === 'all' ? null : (
            <button
              type="button"
              onClick={() => {
                setCategory('all', { scroll: 'preserve' });
                setFinance('all', { scroll: 'preserve' });
                setValueRole('all', { scroll: 'preserve' });
              }}
              className="text-token-sm text-ink-faint underline decoration-line underline-offset-4 transition-colors duration-fast hover:text-accent"
            >
              清除
            </button>
          )}
        </FilterBar>

        {groups.map((group, index) => (
          <section key={group.id} className={index === 0 ? '' : 'mt-12 border-t border-line pt-8'}>
            <h2 id={`category-${group.id}`} className="font-display text-token-lg text-ink">{group.label}</h2>
            {group.note ? <p className="mt-1 text-token-sm text-ink-muted">{group.note}</p> : null}
            <div className="mt-2">
              {group.list.map((item) => <ItemRow key={item.id} item={item} />)}
            </div>
          </section>
        ))}

        {shown.length === 0 ? (
          <p className="py-10 text-token-sm text-ink-faint">這一類目前沒有東西。</p>
        ) : null}

      </DashboardLayout>
    </div>
  );
}

function ItemRow({ item }) {
  const specs = Object.entries(item.specs ?? {});
  const formattedPrice = formatPrice(item.price);
  return (
    <article className="-mx-3 border-b border-line-soft px-3 py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 id={`item-${item.id}`} className="font-display text-token-base text-ink">
          {item.maker ? <span className="text-ink-muted">{item.maker} </span> : null}
          {item.name}
        </h3>
        <span className="whitespace-nowrap font-accent text-token-xs text-ink-muted">
          {STATUS_LABEL[item.status] ?? item.status}
          {item.quantity > 1 ? ` ×${item.quantity}` : ''}
        </span>
        {item.financialClass ? (
          <span className="whitespace-nowrap font-accent text-token-xs text-ink-faint">
            {FINANCIAL_LABEL[item.financialClass]}
          </span>
        ) : null}
        {item.valueRoles?.map((role) => (
          <span key={role} className="whitespace-nowrap font-accent text-token-xs text-ink-faint">
            {VALUE_LABEL[role] ?? role}
          </span>
        ))}
        {item.acquiredAt ? (
          <span className="whitespace-nowrap font-accent text-token-xs tabular-nums text-ink-faint">
            {item.acquiredAt}
          </span>
        ) : null}
        {item.price ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-accent text-token-xs tabular-nums ${PRICE_TONE[item.price.kind] ?? PRICE_TONE.market}`}
          >
            <span>{item.price.label}</span>
            {formattedPrice ? <span>{formattedPrice}</span> : null}
            {item.price.asOf ? <span className="opacity-70">（{item.price.asOf}）</span> : null}
          </span>
        ) : null}
      </div>
      {specs.length > 0 ? (
        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-token-sm text-ink-muted">
          {specs.map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <dt className="text-ink-faint">{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {item.note ? <p className="mt-2 text-token-sm leading-relaxed text-ink-muted">{item.note}</p> : null}
    </article>
  );
}
