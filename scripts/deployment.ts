export function deployment(env: Record<string, string | undefined>) {
 const deploying = env.GUIDE_DEPLOY === '1';
 if (deploying && (!env.GUIDE_SITE_URL || !env.GUIDE_BASE_PATH)) throw new Error('배포 목적지가 없습니다. GUIDE_SITE_URL과 GUIDE_BASE_PATH를 모두 지정하세요.');
 const site = env.GUIDE_SITE_URL || 'http://localhost:4321';
 const url = new URL(site);
 if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('GUIDE_SITE_URL은 경로·인증정보 없는 http(s) origin이어야 합니다.');
 if (deploying && url.protocol !== 'https:') throw new Error('공개 배포는 HTTPS origin이 필요합니다.');
 const base = env.GUIDE_BASE_PATH || '/';
 if (!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*\/?$/.test(base)) throw new Error('GUIDE_BASE_PATH는 / 또는 /저장소이름/ 형태여야 합니다.');
 return { site, base };
}
