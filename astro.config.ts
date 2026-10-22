import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import nimbus, { defineConfig as defineNimbusConfig } from '@cloudflare/nimbus-docs';
import { tableScroll } from '@cloudflare/nimbus-docs/markdown';

import { deployment } from './scripts/deployment';
const { site, base } = deployment(process.env);
const config = defineNimbusConfig({
  site,
  title: '대항해시대 II 항해 수첩',
  description: 'HD 리메이크의 여섯 주인공 완주 공략, 항해와 교역, 도감, 캐릭터 도전과제 가이드.',
  locale: 'ko',
  homeLabel: '수첩 첫 장',
  sidebar: { defaultCollapsed: true, items: [
    { label: '업데이트 내역', collapsed: false, items: [
      { label: '제공 현황', link: '/help/changelog/' },
      { autogenerate: { directory: 'updates' } },
    ] },
    { label: '수첩 첫 장', link: '/' },
    { label: '시작하기', autogenerate: { directory: 'start' }, collapsed: false },
    { label: 'AI 부관', autogenerate: { directory: 'ai' } },
    { label: '여섯 주인공', autogenerate: { directory: 'heroes' } },
    { label: '핵심 시스템', autogenerate: { directory: 'systems' } },
    { label: '도감', autogenerate: { directory: 'atlas' } },
    { label: '도전과제', autogenerate: { directory: 'challenges' } },
    { label: '도움말과 근거', items: [
      { label: '자주 막히는 상황', link: '/help/faq/' },
      { label: 'HD 리메이크 차이', link: '/help/remake/' },
      { label: '가이드 이용 안내', link: '/help/sources/' },
    ] },
  ] },
  github: null,
  editPattern: null,
  socialImageAlt: '대항해시대 II HD 리메이크 항해 수첩',
});
export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
  integrations: [nimbus(config, {
    rules: { 'nimbus/frontmatter-shape': 'error', 'nimbus/internal-link': 'error' },
    markdown: { hastPlugins: [tableScroll()] },
  })],
});
