import type { SidebarItem } from '@cloudflare/nimbus-docs/types';

/** Keep the three newest published update dates visible without moving their URLs. */
export function groupOlderUpdates(items: SidebarItem[]): SidebarItem[] {
  return items.map((group) => {
    if (group.type !== 'group' || group.label !== '업데이트 내역') return group;
    const dated = group.children.flatMap((item) => {
      const date = item.type === 'link'
        ? item.href.match(/\/updates\/(\d{4}-\d{2}-\d{2})\/?$/)?.[1]
        : undefined;
      return date ? [{ item, date }] : [];
    }).sort((a, b) => b.date.localeCompare(a.date));
    const dates = [...new Set(dated.map(({ date }) => date))];
    const recentDates = new Set(dates.slice(0, 3));
    const datedItems = new Set(dated.map(({ item }) => item));
    const recent = dated.filter(({ date }) => recentDates.has(date)).map(({ item }) => item);
    const older = dated.filter(({ date }) => !recentDates.has(date)).map(({ item }) => item);
    return {
      ...group,
      children: [
        ...group.children.filter((item) => !datedItems.has(item)),
        ...recent,
        ...(older.length ? [{ type: 'group' as const, label: '더보기', order: 0, collapsed: true, children: older }] : []),
      ],
    };
  });
}
