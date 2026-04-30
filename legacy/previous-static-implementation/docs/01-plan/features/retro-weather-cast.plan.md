---
title: "Retro Weather Cast - Wallpaper Engine Background"
feature: "retro-weather-cast"
date: 2026-04-03
phase: plan
status: draft
---

# Plan: Retro Weather Cast Wallpaper

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | WallpaperEngine 배경화면에 실시간 날씨 정보를 90년대 레トロ TV 방송 감성으로 표시하고 싶다 |
| **Solution** | HTML/CSS/JS 기반 Web Wallpaper로 RetroCast 스타일 날씨 화면 구현, Wallpaper Engine에 연동 |
| **Core Value** | 데스크톱 배경화면에서 레트로한 날씨 방송을 감상하는 경험 — 장식적이면서도 유용한 정보 제공 |

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 90년대 Weather Channel의 향수를 WallpaperEngine 배경화면으로 재현 |
| **WHO** | 레트로 감성과 날씨 정보를 동시에 원하는 WallpaperEngine 사용자 |
| **RISK** | Wallpaper Engine JS 환경 제한, 무료 Weather API의 호출 제한, 오프라인 대응 |
| **SUCCESS** | 데스크톱 배경화면에서 레트로 날씨 방송이 실시간으로 업데이트되며 CRT 감성이 살아있는 화면 |
| **SCOPE** | Web Wallpaper (HTML/CSS/JS) + 무료 Weather API + Wallpaper Engine 연동 |

---

## 1. Requirements

### 1.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | 현재 날씨 표시 (온도, 날씨 상태, 날씨 아이콘) | Must |
| FR-02 | 풍향/풍속, 습도, 체감온도 등 상세 정보 | Must |
| FR-03 | 주요 도시별 날씨 목록 (스크롤 또는 자동전환) | Must |
| FR-04 | 주간 예보 (5~7일) — 아이콘 + 최고/최저 온도 | Must |
| FR-05 | 일출/일몰 시간 표시 | Should |
| FR-06 | 달 위상 (Moon Phase) 표시 | Could |
| FR-07 | 텍스트 예보 내레이션 ("Today... Cloudy skies...") | Should |
| FR-08 | 사용자 설정 도시/위치 지정 | Must |
| FR-09 | 온도 단위 전환 (°F / °C) | Should |
| FR-10 | Wallpaper Engine 사용자 설정 패널 연동 | Must |

### 1.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-01 | 모든 에셋 로컬 번들링 (오프라인 동작 보장) | Must |
| NFR-02 | 1920×1080 ~ 3840×2160 + 21:9 해상도 대응 | Must |
| NFR-03 | CPU 사용률 5% 이하 유지 | Must |
| NFR-04 | 외부 CDN/라이브러리 의존성 없음 | Must |
| NFR-05 | 날씨 API 호출 실패 시 캐시 데이터 표시 | Should |

### 1.3 Constraints

- **Wallpaper Engine Web Wallpaper** 형식만 사용 (Scene 아님)
- **무료 Weather API** 사용 (OpenWeatherMap Free Tier: 1000 calls/day)
- **외부 프레임워크 없음** — 바닐라 HTML/CSS/JS
- 모든 리소스 로컬 번들링 필수

---

## 2. Technical Approach

### 2.1 Architecture: Pragmatic Monolith

단일 `index.html`에 CSS/JS 인라인 또는 별도 파일로 분리. 외부 의존성 없이 자체 완결.

```
retro-weather-cast/
├── project.json          # Wallpaper Engine 프로젝트 설정
├── index.html            # 메인 진입점
├── css/
│   └── style.css         # 레트로 스타일 (CRT, 스캔라인, 빈티지)
├── js/
│   ├── weather.js        # Weather API 연동
│   ├── app.js            # 메인 앱 로직
│   └── wallpaper.js      # Wallpaper Engine API 연동
├── assets/
│   ├── icons/            # 날씨 아이콘 (SVG)
│   ├── fonts/            # 레트로 폰트
│   └── sounds/           # 배경음 (옵션)
└── README.md
```

### 2.2 Weather API Strategy

| Option | Pros | Cons |
|--------|------|------|
| **OpenWeatherMap Free** | 무료 1000회/일, 한국어 지원, 상세 데이터 | API 키 필요, 호출 제한 |
| **WeatherAPI.com Free** | 무료 100만회/월, 천문 데이터 포함 | 영어 전용 |
| **직접 스크래핑** | API 키 불필요 | 불안정, 유지보수 어려움 |

**선택: OpenWeatherMap Free** — 한국어 지원, 충분한 무료 티어, 안정적인 API

사용할 엔드포인트:
- `Current Weather Data` — 현재 날씨
- `5 Day / 3 Hour Forecast` — 주간 예보
- `One Call API 3.0` — 일출/일몰, UV (Free Tier 포함)

### 2.3 Retro Visual Effects

| Effect | Implementation |
|--------|---------------|
| CRT 곡면 왜곡 | CSS `border-radius` + `box-shadow` inset |
| 스캔라인 | CSS `repeating-linear-gradient` 오버레이 |
| 화면 깜빡임 | CSS `@keyframes` subtle opacity animation |
| 빈티지 폰트 | Google Fonts 대신 로컬 폰트 번들링 (Press Start 2P, VT323) |
| 색상 팔레트 | 90년대 TV 스타일 — 다크 블루 배경 + 네온 그린/옐로우 텍스트 |
| 날씨 아이콘 | weather.com/retro 스타일 SVG 직접 제작 또는 오픈소스 활용 |

### 2.4 Wallpaper Engine Integration

`project.json` 설정:
```json
{
  "description": "Retro Weather Cast — 90s style weather forecast wallpaper",
  "file": "index.html",
  "type": "web",
  "visibility": "public",
  "general": {
    "properties": {
      "city": {
        "text": "City Name",
        "type": "text",
        "value": "Seoul",
        "order": 0
      },
      "apiKey": {
        "text": "OpenWeatherMap API Key",
        "type": "text",
        "value": "",
        "order": 1
      },
      "temperatureUnit": {
        "text": "Temperature Unit",
        "type": "combo",
        "value": "celsius",
        "options": "celsius\nfahrenheit",
        "order": 2
      },
      "updateInterval": {
        "text": "Update Interval (minutes)",
        "type": "slider",
        "min": 5,
        "max": 60,
        "value": 15,
        "order": 3
      },
      "schemecolor": {
        "text": "ui_browse_properties_scheme_color",
        "type": "color",
        "value": "0 0 30",
        "order": 4
      }
    },
    "supportsaudioprocessing": false
  }
}
```

---

## 3. Implementation Plan

### Phase 1: 기본 구조 (1-2시간)
- 프로젝트 디렉토리 생성
- `project.json` 설정
- `index.html` 기본 레이아웃
- CSS 리셋 + 기본 스타일

### Phase 2: 레트로 비주얼 (2-3시간)
- CRT 효과 (스캔라인, 곡면, 깜빡임)
- 빈티지 색상 팔레트
- 레트로 폰트 적용
- 날씨 아이콘 SVG 준비

### Phase 3: 날씨 API 연동 (2-3시간)
- OpenWeatherMap API 연동
- 현재 날씨 데이터 파싱
- 주간 예보 데이터 파싱
- 에러 핸들링 + 캐싱

### Phase 4: UI 데이터 바인딩 (2-3시간)
- 현재 날씨 섹션
- 도시 목록 섹션
- 주간 예보 섹션
- 일출/일몰, 달 위상
- 텍스트 예보

### Phase 5: Wallpaper Engine 연동 (1-2시간)
- 사용자 설정 프로퍼티 연동
- 동적 도시 변경
- 온도 단위 전환
- 업데이트 간격 설정

### Phase 6: 최적화 + 테스트 (1-2시간)
- 해상도 대응 테스트
- 성능 최적화 (FPS 제한)
- 오프라인 대응
- 최종 QA

---

## 4. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API 키 유출 | High | Medium | 사용자 입력 방식으로 Wallpaper Engine 설정에 저장 |
| API 호출 제한 초과 | Medium | Low | 15분 간격 업데이트 + 로컬 캐시 |
| Wallpaper Engine JS 제한 | Medium | Medium | ECMAScript 2018 호환 코드, polyfill 최소화 |
| 오픈소스 아이콘 저작권 | Low | Low | 직접 제작 또는 MIT 라이선스 아이콘 사용 |
| 울트라와이드 레이아웃 깨짐 | Medium | Medium | CSS Grid + Flexbox + vw/vh 단위 사용 |

---

## 5. Success Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| SC-01 | 현재 날씨가 정확히 표시됨 | API 응답 데이터와 UI 일치 |
| SC-02 | 레트로 CRT 감성이 시각적으로 구현됨 | 스캔라인, 곡면, 깜빡임 효과 확인 |
| SC-03 | Wallpaper Engine 설정에서 도시 변경 시 즉시 반영됨 | 프로퍼티 변경 → UI 업데이트 |
| SC-04 | 1920×1080 ~ 3840×2160 해상도에서 레이아웃 유지 | 각 해상도에서 테스트 통과 |
| SC-05 | API 장애 시 마지막 캐시 데이터 표시 | 네트워크 차단 후 확인 |
| SC-06 | CPU 사용률 5% 이하 | Wallpaper Engine 프로파일러 확인 |
