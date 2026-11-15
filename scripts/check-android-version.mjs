import fs from 'node:fs';
import assert from 'node:assert/strict';

// This is the latest downloadable Android release, not the latest web build.
const release = JSON.parse(fs.readFileSync(new URL('../public/android-version.json', import.meta.url), 'utf8'));
assert.equal(release.platform, 'android');
assert.match(release.version, /^\d{4}\.\d{2}\.\d{2}\.\d{1,3}$/);
const home = fs.readFileSync(new URL('../src/content/docs/index.mdx', import.meta.url), 'utf8');
assert.ok(home.includes(`Android용 APK **${release.version}**`), 'Android feed must match the download version on the guide home.');
console.log(`Android 다운로드 버전 일치: ${release.version}`);
