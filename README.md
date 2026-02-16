# GORADOS

2017년에 개발한 포켓몬고 실시간 위치 지도 서비스입니다. 서울 지역의 포케스탑, 체육관 위치와 포켓몬 출현 정보를 지도 위에 표시합니다.

2017년에는 실제 포켓몬고 게임 데이터를 수집하여 사용했지만, 현재는 시연 목적으로 시드 기반 PRNG 더미 데이터를 사용합니다. 스폰 포인트 위치(포케스탑, 체육관 등)는 실제 데이터이며, 포켓몬 출현은 결정론적 알고리즘으로 시뮬레이션합니다.

## 주요 기능

- **포켓몬 지도**: 30분 주기로 포켓몬이 출현/소멸하며, 같은 시간에 접속하면 같은 포켓몬이 표시됨 (결정론적)
- **포케스탑/체육관 표시**: 줌 레벨에 따라 주변 포케스탑과 체육관 표시
- **포켓몬 상세 정보**: 개체치(IV), 기술, 남은 시간 등 팝업으로 확인
- **포켓몬 필터**: 특정 포켓몬만 표시하도록 필터링
- **줌 레벨 기반 분류**: 줌 레벨에 따라 희귀도별 포켓몬 자동 필터링
- **외부 지도 연동**: 카카오맵, 구글맵으로 바로 길찾기
- **포켓몬 상성표**: 타입별 상성 정보 제공

## 기술 스택

- **Frontend**: jQuery, Leaflet + OpenStreetMap
- **Build**: Vite (IIFE 번들)
- **Test**: Vitest
- **Lint/Format**: Biome
- **Deploy**: GitHub Actions → GitHub Pages
- **Package Manager**: pnpm

## 설치 및 실행

### 사전 요구사항

- Node.js
- pnpm

### 설정

1. 의존성 설치:
   ```bash
   pnpm install
   ```

2. 빌드:
   ```bash
   pnpm build
   ```

3. 로컬 프리뷰:
   ```bash
   pnpm preview
   ```

### 개발 모드

```bash
pnpm dev   # Vite watch 모드 (src/ 변경 시 자동 빌드)
```

## 프로젝트 구조

```
gorados/
├── src/                  # 프론트엔드 소스
│   ├── map.js            # 메인 지도 로직
│   ├── pokemon.js        # 포켓몬 클래스 (팝업 등)
│   ├── spawner.js        # 시드 PRNG 기반 포켓몬 생성
│   ├── prng.js           # mulberry32 PRNG 및 헬퍼
│   ├── iv-utils.js       # IV 계산 유틸리티
│   ├── filter.js         # 포켓몬 필터 UI
│   ├── type-chart.js     # 상성표 UI
│   └── ...
├── data/                 # 정적 데이터
│   ├── places.json       # 스폰 포인트 15,217개
│   └── move-pools.json   # 종별 기술풀 (251종)
├── classification.json   # 줌 레벨별 포켓몬 분류 기준
├── tests/                # 테스트
│   ├── pokemon.test.js
│   ├── prng.test.js
│   └── spawner.test.js
├── app/                  # 정적 파일 (HTML, CSS)
│   ├── index.html
│   ├── css/
│   └── js/
├── static/images/        # 포켓몬 아이콘, 장소 아이콘
├── scripts/              # 빌드/추출 스크립트
├── server/               # 아카이브된 Express 서버 코드 (2017년 원본)
├── vite.config.js        # Vite 빌드 설정
├── biome.json            # Biome 린트/포맷 설정
└── .github/workflows/    # GitHub Actions 배포
```

## 포켓몬 생성 원리

현재 버전은 서버 없이 클라이언트에서 결정론적으로 포켓몬을 생성합니다:

1. **시드**: `hash(스폰포인트 인덱스, 사이클 번호)` → 같은 시간+위치 = 같은 포켓몬
2. **사이클**: 30분 주기, 15~25분간 활성
3. **멀티 슬롯**: 스폰 포인트당 3개 슬롯, 좌표 미세 분산으로 밀집 스폰
4. **분산**: 스폰포인트별 고유 오프셋으로 자연스러운 출현/소멸
5. **PRNG**: mulberry32 알고리즘 (빠르고 분포 균일)

## 데이터

- **스폰 포인트**: 서울 지역 약 15,217개 (포케스탑, 체육관, 편의점 등) — 실제 위치 데이터
- **포켓몬**: 1~251번 (1~2세대), 종별 기술풀 포함 — 더미 데이터 (PRNG 생성)

## Changelog

| 시기 | 내용 |
|------|------|
| 2017.02 | 프로젝트 시작. 포케스탑 정보 수집, SQLite DB 구축, 다음지도 기반 클러스터링 지도 구현 |
| 2017.02 | Mapbox(Leaflet) 기반 지도로 전환. 실제 포켓몬고 데이터를 활용한 실시간 위치 표시, 팝업 정보(IV, 기술, 남은 시간) 구현 |
| 2017.02 | 카카오맵/구글맵 연동, OS별 딥링크 분기, 2세대 포켓몬 대응 |
| 2017.03 | 포켓몬 필터(검색, 쿠키 저장), 상성표, 포켓몬 링크 공유 기능 추가 |
| 2017.03 | 줌 레벨별 포켓몬 분류, 남은 시간에 따른 투명도 조절, 몬스터볼 throbber 구현 |
| 2017.03 | gzip 압축, static 캐싱, Winston 로깅, Cloudflare 대응 등 서버 최적화 |
| 2017.04 | SQLite → MySQL 전환, multi-column 인덱스로 쿼리 성능 개선 |
| 2017.11 | 포트폴리오 전시용 정리 |
| 2026.02 | 빌드 도구 모던화: gulp+browserify → Vite, yarn → pnpm, Biome, Vitest 도입 |
| 2026.02 | Mapbox → Leaflet + OpenStreetMap 전환 (Mapbox 유료화 대응) |
| 2026.02 | 서버 기반 → 정적 사이트 전환. 실제 게임 데이터 대신 시드 PRNG 더미 데이터로 포켓몬 생성, GitHub Pages 배포 |

## 라이선스

MIT
