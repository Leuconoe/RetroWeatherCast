---
title: "Retro Weather Cast - Design Document"
feature: "retro-weather-cast"
date: 2026-04-03
phase: design
status: draft
architecture: "Option C - Pragmatic Balance"
---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 90년대 Weather Channel의 향수를 WallpaperEngine 배경화면으로 재현 |
| **WHO** | 레트로 감성과 날씨 정보를 동시에 원하는 WallpaperEngine 사용자 |
| **RISK** | Wallpaper Engine JS 환경 제한, 무료 Weather API의 호출 제한, 오프라인 대응 |
| **SUCCESS** | 데스크톱 배경화면에서 레트로 날씨 방송이 실시간으로 업데이트되며 CRT 감성이 살아있는 화면 |
| **SCOPE** | Web Wallpaper (HTML/CSS/JS) + 무료 Weather API + Wallpaper Engine 연동 |

---

## 1. Overview

### 1.1 Selected Architecture: Option C — Pragmatic Balance

논리적 관심사별로 파일을 분리하되, 과도한 추상화 없이 직관적인 구조를 유지.

```
retro-weather-cast/
├── project.json              # Wallpaper Engine 프로젝트 설정
├── index.html                # HTML 구조 + 메타
├── css/
│   └── style.css             # 레트로 스타일 전체 (CRT, 레이아웃, 애니메이션)
├── js/
│   ├── weather.js            # OpenWeatherMap API 연동 + 캐싱
│   ├── app.js                # UI 렌더링 + 상태 관리 + 메인 루프
│   └── wallpaper.js          # Wallpaper Engine API 브리지
├── assets/
│   ├── icons/                # 날씨 아이콘 (SVG, 20종)
│   └── fonts/                # VT323 폰트 (woff2)
└── README.md
```

### 1.2 Data Flow

```
[Wallpaper Engine Settings]
        │
        ▼
  wallpaper.js ──► app.js (state update)
                      │
                      ▼
                weather.js ──► OpenWeatherMap API
                      │              │
                      ▼              ▼
                cache (localStorage)  response
                      │
                      ▼
                app.js (render) ──► DOM update
                      │
                      ▼
                style.css (CRT overlay always on top)
```

### 1.3 Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 상태 관리 | 단순 객체 + 이벤트 | Wallpaper Engine 환경에서 Redux/Context 과잉 |
| API 캐시 | localStorage | 오프라인 대응, WE 재시작 시에도 유지 |
| 폰트 | VT323 (woff2 로컬 번들) | 90년대 터미널 감성, Google Fonts 의존 제거 |
| 아이콘 | 인라인 SVG | HTTP 요청 최소화, 색상 CSS 제어 가능 |
| 애니메이션 | CSS `@keyframes` | GPU 가속, JS 애니메이션보다 CPU 효율적 |

---

## 2. UI Layout Design

### 2.1 Screen Layout (16:9 기준)

```
┌─────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════╗  │
│  ║  [The Weather Channel Logo]        [Current Time] ║  │
│  ║                                                    ║  │
│  ║  ┌─────────────────┐  ┌─────────────────────────┐ ║  │
│  ║  │                 │  │                         │ ║  │
│  ║  │   WEATHER ICON  │  │   SEOUL                 │ ║  │
│  ║  │    (large)      │  │   72°F  Fair            │ ║  │
│  ║  │                 │  │   Wind: SSW 6 mph       │ ║  │
│  ║  │                 │  │   Humidity: 29%         │ ║  │
│  ║  │                 │  │   Pressure: 29.86↓      │ ║  │
│  ║  └─────────────────┘  └─────────────────────────┘ ║  │
│  ║                                                    ║  │
│  ║  ┌──────────────────────────────────────────────┐ ║  │
│  ║  │  Busan  63° P Cloudy  │  Incheon  67° ...   │ ║  │
│  ║  │  Daejeon 73° P Cloudy │  Pyongyang 69° ...  │ ║  │
│  ║  └──────────────────────────────────────────────┘ ║  │
│  ║                                                    ║  │
│  ║  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        ║  │
│  ║  │ SAT │ │ SUN │ │ MON │ │ TUE │ │ WED │        ║  │
│  ║  │ ☀️  │ │ 🌧  │ │ ☀️  │ │ ⛅  │ │ 🌤  │        ║  │
│  ║  │ 64° │ │ 57° │ │ 57° │ │ 60° │ │ 62° │        ║  │
│  ║  │ 40° │ │ 42° │ │ 39° │ │ 36° │ │ 38° │        ║  │
│  ║  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        ║  │
│  ║                                                    ║  │
│  ║  Sunrise: 6:14 AM  │  Sunset: 6:55 PM            ║  │
│  ║  Moon: 🌗 Last Quarter (Apr 10)                   ║  │
│  ║                                                    ║  │
│  ║  "Today... Cloudy skies. High 71F. Winds SW..."  ║  │
│  ║                                                    ║  │
│  ╚═══════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────┘
     CRT Scanline Overlay (pointer-events: none, always on top)
```

### 2.2 Color Palette

| Token | Color | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0e2a` | 메인 배경 (다크 네이비) |
| `--bg-panel` | `#0d1440` | 패널 배경 |
| `--text-primary` | `#00ff88` | 주요 텍스트 (네온 그린) |
| `--text-secondary` | `#ffdd00` | 보조 텍스트 (옐로우) |
| `--text-accent` | `#00ccff` | 강조 텍스트 (시안) |
| `--border-glow` | `#00ff8840` | 테두리 글로우 |
| `--scanline-color` | `rgba(0,0,0,0.15)` | 스캔라인 |
| `--crt-vignette` | `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)` | 비네트 |

### 2.3 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| City Name | VT323 | 2.5rem | 400 |
| Temperature | VT323 | 4rem | 400 |
| Weather Label | VT323 | 1.5rem | 400 |
| Detail Text | VT323 | 1.2rem | 400 |
| Forecast Day | VT323 | 1.3rem | 400 |
| Narration Text | VT323 | 1.1rem | 400 |

---

## 3. Component Architecture

### 3.1 Component List

| Component | File | Responsibility |
|-----------|------|----------------|
| `App` | `app.js` | 상태 관리, 초기화, 메인 업데이트 루프 |
| `WeatherService` | `weather.js` | API 호출, 파싱, 캐싱, 에러 처리 |
| `WallpaperBridge` | `wallpaper.js` | WE property 수신/적용 |
| `CurrentWeather` | `app.js` | 현재 날씨 섹션 렌더링 |
| `CityList` | `app.js` | 도시 목록 렌더링 |
| `ForecastPanel` | `app.js` | 5일 예보 렌더링 |
| `AstronomyInfo` | `app.js` | 일출/일몰/달 위상 렌더링 |
| `NarrationText` | `app.js` | 텍스트 예보 렌더링 |
| `CRTEffect` | `style.css` | 스캔라인, 비네트, 깜빡임 오버레이 |

### 3.2 State Shape

```javascript
{
  city: "Seoul",              // 현재 도시
  apiKey: "",                 // OWM API 키
  unit: "metric",             // metric(°C) | imperial(°F)
  updateInterval: 15,         // 분 단위
  current: null,              // 현재 날씨 데이터
  forecast: null,             // 5일 예보 데이터
  astronomy: null,            // 일출/일몰/달 데이터
  lastUpdate: null,           // 마지막 업데이트 시간戳
  isLoading: false,           // 로딩 상태
  error: null                 // 에러 메시지
}
```

---

## 4. API Contract

### 4.1 OpenWeatherMap Endpoints

#### Current Weather
```
GET https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units={unit}&lang=kr
```

Response shape:
```json
{
  "main": { "temp": 22, "feels_like": 21, "humidity": 45, "pressure": 1013 },
  "weather": [{ "id": 800, "main": "Clear", "description": "맑음", "icon": "01d" }],
  "wind": { "speed": 3.6, "deg": 200 },
  "sys": { "sunrise": 1680000000, "sunset": 1680040000 },
  "name": "Seoul",
  "dt": 1680020000
}
```

#### 5 Day Forecast
```
GET https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={key}&units={unit}&lang=kr
```

Response: `list[]` (3시간 단위, 40개 아이템), `city` 메타데이터.

### 4.2 Weather Code → Icon Mapping

| OWM ID Range | Condition | Icon File |
|--------------|-----------|-----------|
| 200-299 | Thunderstorm | `thunderstorm.svg` |
| 300-399 | Drizzle | `drizzle.svg` |
| 500-599 | Rain | `rain.svg` |
| 600-699 | Snow | `snow.svg` |
| 700-799 | Atmosphere | `mist.svg` |
| 800 | Clear | `clear.svg` |
| 801-802 | Few/Scattered Clouds | `partly-cloudy.svg` |
| 803-804 | Broken/Overcast | `cloudy.svg` |

### 4.3 Moon Phase Calculation

OWM One Call API의 `daily[0].moon_phase` 사용 (0.0~1.0). 없으면 로컬 계산:

```javascript
// 간단한 달 위상 계산 (synodic month ≈ 29.53일)
function getMoonPhase(date) {
  const knownNewMoon = new Date('2024-01-11').getTime();
  const diff = date.getTime() - knownNewMoon;
  const cycle = 29.53 * 24 * 60 * 60 * 1000;
  return (diff % cycle) / cycle; // 0.0 ~ 1.0
}
```

Moon phase values:
- `0.0` = New Moon 🌑
- `0.25` = First Quarter 🌓
- `0.5` = Full Moon 🌕
- `0.75` = Last Quarter 🌗

---

## 5. Wallpaper Engine Integration

### 5.1 Property Bridge (`wallpaper.js`)

```javascript
// Wallpaper Engine에서 property 변경 시 호출
function onPropertyChange(key, value) {
  switch(key) {
    case 'city':
      appState.city = value;
      app.refresh();
      break;
    case 'apiKey':
      appState.apiKey = value;
      app.refresh();
      break;
    case 'temperatureUnit':
      appState.unit = value === 'celsius' ? 'metric' : 'imperial';
      app.refresh();
      break;
    case 'updateInterval':
      appState.updateInterval = parseInt(value);
      app.restartTimer();
      break;
  }
}
```

### 5.2 project.json

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

## 6. CRT Visual Effects Specification

### 6.1 Scanline Effect

```css
.crt-overlay::before {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15) 0px,
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 9999;
}
```

### 6.2 Vignette (Screen Curvature Simulation)

```css
.crt-overlay::after {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 0, 0, 0.6) 100%
  );
  pointer-events: none;
  z-index: 9998;
}
```

### 6.3 Subtle Flicker

```css
@keyframes crt-flicker {
  0%   { opacity: 0.97; }
  5%   { opacity: 0.99; }
  10%  { opacity: 0.96; }
  15%  { opacity: 0.98; }
  20%  { opacity: 0.97; }
  100% { opacity: 0.98; }
}

.crt-screen {
  animation: crt-flicker 0.15s infinite;
}
```

### 6.4 Screen Glow Border

```css
.tv-frame {
  border: 3px solid rgba(0, 255, 136, 0.3);
  box-shadow:
    0 0 15px rgba(0, 255, 136, 0.15),
    inset 0 0 30px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
}
```

---

## 7. Weather Icon SVG Specifications

### 7.1 Icon Style

- **Retro pixel-art style** inspired by weather.com/retro
- **Size**: 64×64 viewBox
- **Colors**: Match palette (neon green, yellow, cyan)
- **Format**: Inline SVG in JS or separate `.svg` files

### 7.2 Required Icons (9 files)

| File | Description |
|------|-------------|
| `clear.svg` | ☀️ Sun with rays |
| `partly-cloudy.svg` | ⛅ Sun behind cloud |
| `cloudy.svg` | ☁️ Full cloud |
| `rain.svg` | 🌧 Cloud with rain drops |
| `drizzle.svg` | 🌦 Light rain |
| `thunderstorm.svg` | ⛈ Cloud with lightning |
| `snow.svg` | 🌨 Cloud with snowflakes |
| `mist.svg` | 🌫 Fog lines |
| `moon-*.svg` | Moon phases (4 variants) |

---

## 8. Test Plan

### 8.1 Visual Testing

| Test | Method |
|------|--------|
| CRT effects visible | Browser dev tools overlay inspection |
| Responsive layout | Chrome DevTools device emulation (1920×1080, 2560×1440, 3840×2160, 3440×1440) |
| Color contrast | WCAG AA check on neon green against navy |
| Animation smoothness | 60fps maintained, no jank |

### 8.2 Functional Testing

| Test | Method |
|------|--------|
| API data renders correctly | Compare UI values with raw API response |
| City change updates data | Change property, verify new city data appears |
| Unit toggle works | Switch °C↔°F, verify values convert |
| Cache works offline | Block network, verify last data still shows |
| Error state displays | Invalid API key → user-friendly error message |

### 8.3 Performance Testing

| Test | Target |
|------|--------|
| Initial load time | < 2 seconds |
| Memory usage | < 50MB |
| CPU usage | < 5% (Wallpaper Engine profiler) |
| API calls per hour | ≤ 4 (15분 간격) |

---

## 9. Error Handling Strategy

| Scenario | Behavior |
|----------|----------|
| Invalid API key | "API Key not configured — click Edit to set your key" 메시지 표시 |
| Network error | localStorage 캐시 데이터 표시 + "Using cached data" 인디케이터 |
| No cache available | "Unable to fetch weather data — check network connection" 표시 |
| City not found | "City not found — check spelling in settings" 표시 |
| API rate limit | "Rate limit reached — next update in X minutes" 표시 + 백오프 |

---

## 10. File-by-File Implementation Guide

### 10.1 `project.json`
- Wallpaper Engine 프로젝트 메타데이터
- 사용자 설정 프로퍼티 정의 (city, apiKey, temperatureUnit, updateInterval)

### 10.2 `index.html`
- 기본 HTML5 구조
- CSS/JS 링크
- 메인 컨테이너 div들 (current-weather, city-list, forecast, astronomy, narration)
- CRT 오버레이 div

### 10.3 `css/style.css`
- CSS 변수 정의 (색상, 폰트)
- 레이아웃 (CSS Grid + Flexbox)
- CRT 효과 (스캔라인, 비네트, 깜빡임)
- 반응형 미디어 쿼리
- 애니메이션 (@keyframes)

### 10.4 `js/weather.js` — WeatherService 클래스
- `fetchCurrentWeather(city, apiKey, unit)` — 현재 날씨 API 호출
- `fetchForecast(city, apiKey, unit)` — 5일 예보 API 호출
- `parseCurrentData(response)` — 현재 날씨 파싱
- `parseForecastData(response)` — 일별 예보 집계 (3시간 → 일별)
- `getCache(key)` / `setCache(key, data)` — localStorage 캐싱
- `getMoonPhase(date)` — 달 위상 계산
- `getWeatherIconUrl(code)` — 날씨 코드 → 아이콘 매핑

### 10.5 `js/app.js` — App 클래스
- `state` — 애플리케이션 상태 객체
- `init()` — 초기화, DOM 참조, 첫 데이터 로드
- `refresh()` — 전체 데이터 새로고침
- `renderCurrent(data)` — 현재 날씨 렌더링
- `renderForecast(data)` — 5일 예보 렌더링
- `renderAstronomy(data)` — 일출/일몰/달 위상 렌더링
- `renderNarration(data)` — 텍스트 예보 생성
- `startTimer()` — 주기적 업데이트 타이머
- `showError(message)` — 에러 상태 표시

### 10.6 `js/wallpaper.js` — WallpaperBridge
- `onPropertyChange(key, value)` 핸들러 등록
- WE API 감지 (브라우저에서 열었을 때 vs WE에서 열었을 때)
- 폴백: URL 파라미터로 디버깅 지원

---

## 11. Implementation Guide

### 11.1 Implementation Order

1. **project.json** 생성 — WE 프로젝트 설정
2. **index.html** 스켈레톤 — 기본 구조 + 컨테이너
3. **css/style.css** — CRT 효과 + 레이아웃 + 색상
4. **assets/icons/** — 날씨 SVG 아이콘 9종
5. **js/weather.js** — WeatherService (API + 캐싱)
6. **js/app.js** — App (상태 + 렌더링 + 타이머)
7. **js/wallpaper.js** — WallpaperBridge (property 연동)
8. **index.html**에 통합 — 스크립트 로드 + 초기화
9. **테스트 + 최적화** — 해상도, 성능, 오프라인

### 11.2 Module Map

| Module | Files | Description |
|--------|-------|-------------|
| module-1 | `project.json`, `index.html` | 프로젝트 뼈대 + HTML 구조 |
| module-2 | `css/style.css`, `assets/` | 레트로 비주얼 + 아이콘 |
| module-3 | `js/weather.js` | 날씨 API 서비스 레이어 |
| module-4 | `js/app.js` | 메인 앱 + UI 렌더링 |
| module-5 | `js/wallpaper.js` | Wallpaper Engine 연동 |
| module-6 | 통합 + 테스트 | 전체 통합 + QA |

### 11.3 Session Guide

| Session | Modules | Estimated Effort | Deliverable |
|---------|---------|-----------------|-------------|
| Session 1 | module-1, module-2 | 2-3시간 | HTML 구조 + CRT 레트로 비주얼 완성 |
| Session 2 | module-3, module-4 | 3-4시간 | API 연동 + UI 데이터 바인딩 완성 |
| Session 3 | module-5, module-6 | 1-2시간 | WE 연동 + 최종 테스트 + QA |

**Recommended**: 3 sessions for clean separation. Session 2 is the heaviest (API + rendering logic).
