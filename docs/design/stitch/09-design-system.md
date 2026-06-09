---
name: Nexus Intelligence
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#494e57'
  on-tertiary: '#ffffff'
  tertiary-container: '#61666f'
  on-tertiary-container: '#e0e4ef'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl: { fontFamily: Inter, fontSize: 48px, fontWeight: '700', lineHeight: '1.1', letterSpacing: -0.02em }
  headline-lg: { fontFamily: Inter, fontSize: 32px, fontWeight: '600', lineHeight: '1.2', letterSpacing: -0.01em }
  headline-md: { fontFamily: Inter, fontSize: 20px, fontWeight: '600', lineHeight: '1.4' }
  body-lg:     { fontFamily: Inter, fontSize: 18px, fontWeight: '400', lineHeight: '1.6' }
  body-md:     { fontFamily: Inter, fontSize: 16px, fontWeight: '400', lineHeight: '1.5' }
  body-sm:     { fontFamily: Inter, fontSize: 14px, fontWeight: '400', lineHeight: '1.5' }
  label-md:    { fontFamily: Inter, fontSize: 14px, fontWeight: '500', lineHeight: '1' }
  label-sm:    { fontFamily: Inter, fontSize: 12px, fontWeight: '600', lineHeight: '1', letterSpacing: 0.05em }
rounded: { sm: 0.25rem, DEFAULT: 0.5rem, md: 0.75rem, lg: 1rem, xl: 1.5rem, full: 9999px }
spacing: { unit: 4px, container-max: 1440px, gutter: 24px, margin-desktop: 40px, margin-mobile: 16px, stack-sm: 8px, stack-md: 16px, stack-lg: 32px }
---

## Brand & Style
브랜드 개성: 권위 있으면서도 접근 가능한, 현대 기업을 위한 고성능 파트너. 타깃은 깊은 기술 역량과 손쉬운 사용성을 동시에 요구하는 의사결정권자·고성과 팀.

디자인 스타일은 **Corporate Modern** + **Information Architecture** 중심. 고대비 타이포그래피와 구조적 레이아웃으로 복잡한 워크플로우의 명확성을 확보. AI 기반 인텔리전스를 나타내기 위해 "Intelligence Accents"(미묘한 고품질 그라데이션·소프트 inner glow)로 자동화된 인사이트를 정적 데이터와 구분. 감정적 목표는 "calm control"과 "amplified productivity".

## Colors
- **Primary** (`#003ec7` / container `#0052ff`): 주요 CTA, 활성 상태, 브랜드 핵심 터치포인트
- **Secondary (Indigo, `#4648d4`)**: "Intelligence" 기능이나 보조 인터랙티브 요소에 절제 사용
- **Surface & Neutrals**: Cool Gray(Slate) 계열. 배경은 아주 옅은 틴트로 눈 피로 감소, 텍스트는 Slate-900(제목)~Slate-500(메타)
- **AI Accents**: AI 생성 컴포넌트(스파크라인, 추천 액션, "magic" 버튼)에 primary→secondary 그라데이션

## Typography
- **Inter** 전용 (데이터 밀집 SaaS 가독성)
- 위계는 크기보다 **굵기** 대비로. 제목은 bold + tight-tracking
- 본문 16px base + 넉넉한 line-height
- 라벨(버튼/네비)은 Medium~SemiBold

## Layout & Spacing
- 메인 콘텐츠 **12컬럼 fluid grid** + 고정 사이드바
- 데이터 밀도: 기본 "Comfortable"(24px 패딩), 데이터 많은 테이블은 "Compact"(세로 8px)
- 브레이크포인트: Desktop 1280px+(12col/40px) · Tablet 768~1279px(8col/24px) · Mobile <768px(4col/16px)
- 모든 간격은 4px 베이스라인 그리드

## Elevation & Depth
- L0 기본 배경 / L1 카드(surface + 1px border `#E2E8F0`, no shadow) / L2 드롭다운(soft shadow) / L3 모달(고elevation + 20% backdrop blur)
- AI 상태: inner glow 또는 soft primary drop shadow

## Shapes
- Standard 8px(버튼/입력/소형 카드) · Large 16px(컨테이너/모달) · Circular(아바타/상태)
- hover 시 모양 변화 없이 shadow만 증가

## Components
- **Buttons**: Primary = solid Enterprise Blue + white. AI-action = 그라데이션 배경. Secondary = Slate-100 + Slate-900
- **Inputs**: 1px border → focus 시 2px Enterprise Blue. error = soft red tint + red border
- **Chips/Tags**: 비활성 = light gray. 활성 필터 = white + border + primary text
- **Cards**: white + light gray border. AI 추천 = 2px 좌측 그라데이션 accent
- **Data Tables**: 고밀도 borderless rows + subtle divider. 헤더 = label-sm(uppercase)
- **AI Sparkle**: AI 기능 옆 4-pointed star, primary-secondary 그라데이션

> 출처: Stitch 프로젝트 "Remix of Smart AI Work Hub" (ID 3829221727082257922) designMd. device: DESKTOP / roundness: ROUND_EIGHT.
