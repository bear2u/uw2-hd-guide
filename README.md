# 대항해시대 II 항해 수첩

[항해 수첩 열기](https://bear2u.github.io/uw2-hd-guide/)

HD 리메이크를 위한 한국어 가이드입니다. 여섯 주인공 공략, 교역·항해·전투 안내, 도감과 캐릭터별 144개 도전과제를 다룹니다. 이야기의 결말과 발견물 위치를 포함합니다.

## 실행과 검사

Node 24 및 npm 10.8.2 이상을 사용합니다.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
npm run lint:docs
npm run check:links
npm run preview
```

검색은 빌드 후 preview에서 확인할 수 있습니다. 의존성 버전과 lockfile을 고정했습니다. 개인 계정이나 저장 데이터를 연결하지 않는 정적 문서 사이트입니다.

## 공개 배포

GitHub Pages의 GitHub Actions 배포를 사용합니다. 저장소 Variables:

- `GUIDE_SITE_URL`: `https://bear2u.github.io`
- `GUIDE_BASE_PATH`: `/uw2-hd-guide/`

기본 브랜치에 push하면 검사 후 문서를 배포합니다. 배포 출력은 `dist/`만 포함합니다. 게임 실행 파일은 포함하지 않습니다.

```sh
GUIDE_SITE_URL=https://bear2u.github.io GUIDE_BASE_PATH=/uw2-hd-guide/ npm run build:deploy
GUIDE_SITE_URL=https://bear2u.github.io GUIDE_BASE_PATH=/uw2-hd-guide/ npm run check:links
```

수정할 때는 [AGENTS.md](./AGENTS.md)에 따라 날짜별 업데이트 문서도 갱신하세요.

## 라이선스 안내

Nimbus의 MIT 라이선스는 `licenses/Nimbus-MIT.txt`, Noto Sans KR의 SIL Open Font License는 `public/fonts/NotoSansKR-OFL.txt`에 보관합니다.
