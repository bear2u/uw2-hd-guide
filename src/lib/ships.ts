import type { ImageMetadata } from 'astro';
import reference from '../data/game-reference.json';
import guide from '../data/ship-guide.json';
import catalog from '../data/ship-catalog.json';

/** 함선 메뉴가 함께 쓰는 배 정보: 내보낸 기준값(game-reference) + 함선 안내 자료(ship-guide). */
export type Hull = 'sail' | 'oar';

export interface Ship {
  id: number;
  slug: string;
  name: string;
  hull: Hull;
  hullLabel: string;
  capacity: number;
  minCrew: number;
  maxCrew: number;
  durability: number;
  power: number;
  tacking: number;
  maxGuns: number;
  price: number;
  industry: number;
  description: string;
  image: ImageMetadata;
}

export interface Shipyard {
  key: string;
  label: string;
  ports: { id: number; name: string; industry: number }[];
  models: number[];
}

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/ships/*.png', { eager: true });

export const hullLabels: Record<Hull, string> = { sail: '범선', oar: '노 젓는 배' };

export const ships: Ship[] = reference.ships.map((row) => {
  const extra = guide.ships.find((s) => s.id === row.id);
  if (!extra) throw new Error(`함선 안내 자료 없음: ${row.name}`);
  const image = images[`../assets/ships/${extra.image}`]?.default;
  if (!image) throw new Error(`함선 그림 없음: ${extra.image}`);
  const hull = extra.hull as Hull;
  return {
    ...row,
    slug: extra.image.replace(/^\d+-/, '').replace(/\.png$/, ''),
    hull,
    hullLabel: hullLabels[hull],
    industry: extra.industry,
    description: extra.description,
    image,
  };
});

/** 범선 먼저, 같은 구분 안에서는 적재량이 작은 배부터 (같으면 기준 가격이 낮은 배부터). */
export const orderedShips: Ship[] = [...ships].sort((a, b) =>
  (a.hull === b.hull ? 0 : a.hull === 'sail' ? -1 : 1) || a.capacity - b.capacity || a.price - b.price,
);

export const shipById = (id: number): Ship => {
  const ship = ships.find((s) => s.id === id);
  if (!ship) throw new Error(`알 수 없는 함선: ${id}`);
  return ship;
};

export const shipyards: Shipyard[] = guide.shipyards.map((yard) => ({
  ...yard,
  ports: yard.ports.map((id) => {
    const port = reference.ports.find((p) => p.id === id);
    if (!port) throw new Error(`알 수 없는 항구: ${id}`);
    return { id, name: port.name, industry: port.industry };
  }),
}));

export const yardByKey = (key: string): Shipyard => {
  const yard = shipyards.find((y) => y.key === key);
  if (!yard) throw new Error(`알 수 없는 조선소 계열: ${key}`);
  return yard;
};

/** 그 배를 짓는 조선소 계열 */
export const yardsBuilding = (ship: Ship): Shipyard[] => shipyards.filter((y) => y.models.includes(ship.id));

/** 게임 시작 때 공업이 이미 필요한 값에 이른 항구 (그 배를 짓는 계열 안에서) */
export const startPorts = (ship: Ship, yards: Shipyard[] = yardsBuilding(ship)) =>
  yards.flatMap((y) => y.ports).filter((p) => p.industry >= ship.industry);

export const basis = guide.basis;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const shipHref = (ship: Ship) => `${base}/ships/details/#ship-${ship.slug}`;
export const yardHref = (yard: Shipyard) => `${base}/ships/shipyards/#yard-${yard.key}`;

export const num = (value: number) => value.toLocaleString('ko-KR');

// ───────────── 엔딩 뒤 새 배 (ship-catalog): 엔딩 뒤 지역 조선소 49종 + 숨은 조선소 7종 ─────────────

export interface CatalogPort { id: number; name: string; industry: number; economy: number; capital: boolean }

export interface NewShip {
  slug: string;
  name: string;
  native: string;
  region: string;
  regionLabel: string;
  hidden: boolean;
  role: string;
  tier: number;
  tierLabel: string;
  hull: Hull;
  hullLabel: string;
  stormProof: boolean;
  capacity: number;
  minCrew: number;
  maxCrew: number;
  durability: number;
  power: number;
  tacking: number;
  maxGuns: number;
  price: number;
  industry: number;
  economy: number;
  challenge: string | null;
  regionShips: number;
  ports: CatalogPort[];
  /** 본편 기준 짓는 곳 밖의 안내 (외전이 항구를 옮기는 곳) */
  portNote: string | null;
  /** 아직 배포하지 않은 배 (카탈로그 status next) — 가이드에 upcomingLabel 표시. 2026.11.15.2 부터는 없다 */
  upcoming: boolean;
  description: string;
  image: ImageMetadata;
}

export const upcomingLabel = '다음 버전 제공 예정';

export const regions: { key: string; label: string }[] = catalog.regions;
const regionLabel = (key: string) => (key === 'hidden' ? '숨은 조선소' : regions.find((r) => r.key === key)?.label ?? key);
export const tierLabels: Record<number, string> = { 0: '숨은 조선소', 1: '1등급', 2: '2등급', 3: '3등급' };

export const newShips: NewShip[] = catalog.ships.map((row) => {
  const image = images[`../assets/ships/${row.image}`]?.default;
  if (!image) throw new Error(`함선 그림 없음: ${row.image}`);
  const hull = row.hull as Hull;
  return {
    ...row,
    regionLabel: regionLabel(row.region),
    hidden: row.region === 'hidden',
    tierLabel: tierLabels[row.tier],
    hull,
    hullLabel: hullLabels[hull],
    portNote: 'portNote' in row && typeof row.portNote === 'string' ? row.portNote : null,
    upcoming: 'status' in row && row.status === 'next',
    image,
    ports: row.ports.map((id) => {
      const port = reference.ports.find((p) => p.id === id);
      if (!port) throw new Error(`알 수 없는 항구: ${id}`);
      return { id, name: port.name, industry: port.industry, economy: port.economy, capital: catalog.capitals.includes(id) };
    }),
  };
});

/** 지역 순서 → 등급 → 적재량이 작은 배부터 (같으면 기준 가격이 낮은 배부터) */
const regionOrder = (s: NewShip) => (s.hidden ? regions.length : regions.findIndex((r) => r.key === s.region));
export const orderedNewShips: NewShip[] = [...newShips].sort((a, b) =>
  regionOrder(a) - regionOrder(b) || a.tier - b.tier || a.capacity - b.capacity || a.price - b.price,
);
export const regionalShips = orderedNewShips.filter((s) => !s.hidden);
export const hiddenShips = orderedNewShips.filter((s) => s.hidden);
export const shipsOfRegion = (key: string) => orderedNewShips.filter((s) => s.region === key);
/** 동아시아의 조선 배 다섯 (나가사키, 외전에서는 부산포) — 새 함선 페이지에서 따로 묶어 보인다 */
export const joseonSlugs = ['maengseon', 'joun-seon', 'tongsinsa-seon', 'panokseon', 'geobukseon'];

/** 본편 주인공 한 사람의 도전과제 수 (여섯 모두 같다) */
const mainChallenges = reference.challenges.filter((c) => c.heroId === 0).length;
const share = (fraction: string) => fraction.split('/').map(Number) as [number, number];
/** 도전과제 몫의 말과 본편 주인공 기준 개수 (올림, 적어도 1) */
export const challengeText = (fraction: string) => {
  const [a, b] = share(fraction);
  const need = Math.max(1, Math.ceil((mainChallenges * a) / b));
  return `도전과제 ${b === 2 && a === 1 ? '절반' : `${b}분의 ${a}`} (본편 ${need}개)`;
};

/** 여는 조건 (엔딩 뒤 자유 항해는 모두 같으므로 빼고) */
export const needsOf = (s: NewShip): string[] => {
  const needs: string[] = [];
  if (s.industry > 0) needs.push(`공업 ${num(s.industry)}`);
  if (s.economy > 0) needs.push(`경제 ${num(s.economy)}`);
  if (s.challenge) needs.push(challengeText(s.challenge));
  if (s.regionShips > 0) needs.push(`서로 다른 지역의 상급 새 배 ${s.regionShips}척`);
  return needs;
};

/** 시작 값 (1522년) 으로 이미 공업·경제 조건을 채운 항구인가 */
export const portReady = (s: NewShip, p: CatalogPort) => p.industry >= s.industry && p.economy >= s.economy;

export const portLabel = (s: NewShip, p: CatalogPort) => {
  const values = s.hidden ? '' : s.tier >= 2 ? `${num(p.industry)}·${num(p.economy)}` : num(p.industry);
  const inner = [p.capital ? '수도' : '', values].filter(Boolean).join(', ');
  return inner ? `${p.name}(${inner})` : p.name;
};

/** 항구 묶음 (조선소 계열) 에 더해지는 새 배와 그 안의 짓는 항구 */
export const newShipsAtPorts = (portIds: number[]) =>
  regionalShips
    .map((ship) => ({ ship, ports: ship.ports.filter((p) => portIds.includes(p.id)) }))
    .filter((row) => row.ports.length > 0);

export const newShipHref = (s: NewShip) => `${base}/ships/new/#ship-${s.slug}`;
