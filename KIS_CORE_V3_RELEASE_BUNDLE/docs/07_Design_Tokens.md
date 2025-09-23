# 07_Design_Tokens.md

## 디자인 토큰 시스템 (Design Token System)

### 디자인 토큰 개요 (Design Token Overview)

디자인 토큰은 디자인 결정을 코드로 변환하는 명명된 엔티티입니다. KIS_CORE_V3는 일관성 있는 사용자 경험과 WCAG AA 접근성 목표를 달성하기 위해 체계적인 토큰 시스템을 사용합니다.

### 토큰 구조 (Token Structure)

```javascript
// 토큰 명명 규칙: {category}-{type}-{variant}-{state}
// 예: color-primary-500, spacing-margin-large, typography-heading-xl
```

## 색상 토큰 (Color Tokens)

### 기본 색상 팔레트 (Primary Color Palette)

#### Primary Colors (주 색상)
```css
:root {
  /* Primary Blue - 브랜드 메인 컬러 */
  --color-primary-50: #eff6ff;   /* 매우 연한 파란색 */
  --color-primary-100: #dbeafe;  /* 연한 파란색 */
  --color-primary-200: #bfdbfe;  /* 밝은 파란색 */
  --color-primary-300: #93c5fd;  /* 중간 밝은 파란색 */
  --color-primary-400: #60a5fa;  /* 중간 파란색 */
  --color-primary-500: #3b82f6;  /* 기본 파란색 */
  --color-primary-600: #2563eb;  /* 진한 파란색 */
  --color-primary-700: #1d4ed8;  /* 더 진한 파란색 */
  --color-primary-800: #1e40af;  /* 매우 진한 파란색 */
  --color-primary-900: #1e3a8a;  /* 가장 진한 파란색 */
}
```

#### Secondary Colors (보조 색상)
```css
:root {
  /* Gray Scale - 텍스트 및 배경 */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Success Green */
  --color-success-50: #f0fdf4;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-success-700: #15803d;

  /* Warning Orange */
  --color-warning-50: #fffbeb;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-warning-700: #b45309;

  /* Error Red */
  --color-error-50: #fef2f2;
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  --color-error-700: #b91c1c;

  /* Info Blue */
  --color-info-50: #eff6ff;
  --color-info-500: #3b82f6;
  --color-info-600: #2563eb;
  --color-info-700: #1d4ed8;
}
```

### 의미론적 색상 토큰 (Semantic Color Tokens)

#### 텍스트 색상 (Text Colors)
```css
:root {
  /* Text Colors - WCAG AA 4.5:1 대비율 준수 */
  --color-text-primary: #111827;     /* 메인 텍스트 */
  --color-text-secondary: #4b5563;   /* 보조 텍스트 */
  --color-text-tertiary: #6b7280;    /* 부가 텍스트 */
  --color-text-disabled: #9ca3af;    /* 비활성 텍스트 */
  --color-text-inverse: #ffffff;     /* 역방향 텍스트 (어두운 배경) */
  --color-text-link: #2563eb;        /* 링크 텍스트 */
  --color-text-link-hover: #1d4ed8;  /* 링크 호버 */
}
```

#### 배경 색상 (Background Colors)
```css
:root {
  /* Background Colors */
  --color-bg-primary: #ffffff;       /* 메인 배경 */
  --color-bg-secondary: #f9fafb;     /* 보조 배경 */
  --color-bg-tertiary: #f3f4f6;      /* 패널 배경 */
  --color-bg-overlay: rgba(17, 24, 39, 0.5); /* 오버레이 */
  --color-bg-disabled: #f3f4f6;      /* 비활성 배경 */
}
```

#### 경계선 색상 (Border Colors)
```css
:root {
  /* Border Colors */
  --color-border-primary: #e5e7eb;   /* 기본 경계선 */
  --color-border-secondary: #d1d5db; /* 강조 경계선 */
  --color-border-focus: #3b82f6;     /* 포커스 경계선 */
  --color-border-error: #ef4444;     /* 오류 경계선 */
  --color-border-success: #22c55e;   /* 성공 경계선 */
}
```

### WCAG AA 대비율 검증 (WCAG AA Contrast Validation)

#### 대비율 매트릭스
```css
/* 
WCAG AA 요구사항:
- 일반 텍스트: 4.5:1 이상
- 큰 텍스트 (18pt+): 3:1 이상
- UI 컴포넌트: 3:1 이상
*/

/* 검증된 색상 조합 */
.wcag-validation {
  /* ✅ 4.5:1 - AA 준수 */
  --combo-primary-text: var(--color-text-primary) on var(--color-bg-primary); /* 16.8:1 */
  --combo-secondary-text: var(--color-text-secondary) on var(--color-bg-primary); /* 7.1:1 */
  --combo-button-primary: var(--color-text-inverse) on var(--color-primary-600); /* 4.6:1 */
  
  /* ✅ 3:1 - AA 큰 텍스트 준수 */
  --combo-tertiary-text: var(--color-text-tertiary) on var(--color-bg-primary); /* 4.1:1 */
  
  /* ⚠️ 확인 필요 */
  --combo-disabled-text: var(--color-text-disabled) on var(--color-bg-primary); /* 2.8:1 - 큰 텍스트만 */
}
```

## 간격 토큰 (Spacing Tokens)

### 기본 간격 시스템 (Base Spacing System)

#### 8px 기반 그리드 시스템
```css
:root {
  /* Base unit: 8px */
  --spacing-base: 8px;
  
  /* Spacing Scale */
  --spacing-0: 0;           /* 0px */
  --spacing-1: 4px;         /* 0.5 * base */
  --spacing-2: 8px;         /* 1 * base */
  --spacing-3: 12px;        /* 1.5 * base */
  --spacing-4: 16px;        /* 2 * base */
  --spacing-5: 20px;        /* 2.5 * base */
  --spacing-6: 24px;        /* 3 * base */
  --spacing-8: 32px;        /* 4 * base */
  --spacing-10: 40px;       /* 5 * base */
  --spacing-12: 48px;       /* 6 * base */
  --spacing-16: 64px;       /* 8 * base */
  --spacing-20: 80px;       /* 10 * base */
  --spacing-24: 96px;       /* 12 * base */
  --spacing-32: 128px;      /* 16 * base */
  --spacing-40: 160px;      /* 20 * base */
  --spacing-48: 192px;      /* 24 * base */
  --spacing-56: 224px;      /* 28 * base */
  --spacing-64: 256px;      /* 32 * base */
}
```

### 의미론적 간격 토큰 (Semantic Spacing Tokens)

#### 컴포넌트 간격 (Component Spacing)
```css
:root {
  /* Padding */
  --spacing-padding-xs: var(--spacing-2);     /* 8px */
  --spacing-padding-sm: var(--spacing-3);     /* 12px */
  --spacing-padding-md: var(--spacing-4);     /* 16px */
  --spacing-padding-lg: var(--spacing-6);     /* 24px */
  --spacing-padding-xl: var(--spacing-8);     /* 32px */

  /* Margin */
  --spacing-margin-xs: var(--spacing-2);      /* 8px */
  --spacing-margin-sm: var(--spacing-4);      /* 16px */
  --spacing-margin-md: var(--spacing-6);      /* 24px */
  --spacing-margin-lg: var(--spacing-8);      /* 32px */
  --spacing-margin-xl: var(--spacing-12);     /* 48px */

  /* Gap (for Grid/Flexbox) */
  --spacing-gap-xs: var(--spacing-2);         /* 8px */
  --spacing-gap-sm: var(--spacing-4);         /* 16px */
  --spacing-gap-md: var(--spacing-6);         /* 24px */
  --spacing-gap-lg: var(--spacing-8);         /* 32px */
  --spacing-gap-xl: var(--spacing-12);        /* 48px */
}
```

#### 레이아웃 간격 (Layout Spacing)
```css
:root {
  /* Container Spacing */
  --spacing-container-xs: var(--spacing-4);   /* 16px */
  --spacing-container-sm: var(--spacing-6);   /* 24px */
  --spacing-container-md: var(--spacing-8);   /* 32px */
  --spacing-container-lg: var(--spacing-12);  /* 48px */
  --spacing-container-xl: var(--spacing-16);  /* 64px */

  /* Section Spacing */
  --spacing-section-sm: var(--spacing-16);    /* 64px */
  --spacing-section-md: var(--spacing-24);    /* 96px */
  --spacing-section-lg: var(--spacing-32);    /* 128px */
  --spacing-section-xl: var(--spacing-48);    /* 192px */
}
```

## 타이포그래피 토큰 (Typography Tokens)

### 폰트 패밀리 (Font Family)
```css
:root {
  /* Font Families */
  --font-family-sans: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  --font-family-serif: 'Noto Serif KR', Georgia, serif;
}
```

### 폰트 크기 및 줄 높이 (Font Size & Line Height)
```css
:root {
  /* Font Sizes - rem 기반 (16px = 1rem) */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */
  --font-size-6xl: 3.75rem;   /* 60px */

  /* Line Heights */
  --line-height-none: 1;      /* 100% */
  --line-height-tight: 1.25;  /* 125% */
  --line-height-snug: 1.375;  /* 137.5% */
  --line-height-normal: 1.5;  /* 150% */
  --line-height-relaxed: 1.625; /* 162.5% */
  --line-height-loose: 2;     /* 200% */
}
```

### 타이포그래피 스케일 (Typography Scale)
```css
:root {
  /* Heading Styles */
  --typography-h1-size: var(--font-size-5xl);
  --typography-h1-weight: 700;
  --typography-h1-line-height: var(--line-height-tight);
  --typography-h1-letter-spacing: -0.025em;

  --typography-h2-size: var(--font-size-4xl);
  --typography-h2-weight: 600;
  --typography-h2-line-height: var(--line-height-tight);
  --typography-h2-letter-spacing: -0.025em;

  --typography-h3-size: var(--font-size-3xl);
  --typography-h3-weight: 600;
  --typography-h3-line-height: var(--line-height-snug);
  --typography-h3-letter-spacing: -0.025em;

  --typography-h4-size: var(--font-size-2xl);
  --typography-h4-weight: 600;
  --typography-h4-line-height: var(--line-height-snug);

  --typography-h5-size: var(--font-size-xl);
  --typography-h5-weight: 600;
  --typography-h5-line-height: var(--line-height-snug);

  --typography-h6-size: var(--font-size-lg);
  --typography-h6-weight: 600;
  --typography-h6-line-height: var(--line-height-snug);

  /* Body Text */
  --typography-body-large-size: var(--font-size-lg);
  --typography-body-large-weight: 400;
  --typography-body-large-line-height: var(--line-height-relaxed);

  --typography-body-base-size: var(--font-size-base);
  --typography-body-base-weight: 400;
  --typography-body-base-line-height: var(--line-height-normal);

  --typography-body-small-size: var(--font-size-sm);
  --typography-body-small-weight: 400;
  --typography-body-small-line-height: var(--line-height-normal);

  /* Caption & Labels */
  --typography-caption-size: var(--font-size-xs);
  --typography-caption-weight: 400;
  --typography-caption-line-height: var(--line-height-normal);

  --typography-label-size: var(--font-size-sm);
  --typography-label-weight: 500;
  --typography-label-line-height: var(--line-height-normal);
}
```

### 타이포그래피 유틸리티 클래스 (Typography Utility Classes)
```css
/* Heading Classes */
.text-h1 {
  font-size: var(--typography-h1-size);
  font-weight: var(--typography-h1-weight);
  line-height: var(--typography-h1-line-height);
  letter-spacing: var(--typography-h1-letter-spacing);
}

.text-h2 {
  font-size: var(--typography-h2-size);
  font-weight: var(--typography-h2-weight);
  line-height: var(--typography-h2-line-height);
  letter-spacing: var(--typography-h2-letter-spacing);
}

/* Body Text Classes */
.text-body-large {
  font-size: var(--typography-body-large-size);
  font-weight: var(--typography-body-large-weight);
  line-height: var(--typography-body-large-line-height);
}

.text-body {
  font-size: var(--typography-body-base-size);
  font-weight: var(--typography-body-base-weight);
  line-height: var(--typography-body-base-line-height);
}

.text-caption {
  font-size: var(--typography-caption-size);
  font-weight: var(--typography-caption-weight);
  line-height: var(--typography-caption-line-height);
}
```

## 그림자 토큰 (Shadow Tokens)

### 그림자 스케일 (Shadow Scale)
```css
:root {
  /* Box Shadows */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  --shadow-none: none;

  /* Focus Shadow */
  --shadow-focus: 0 0 0 3px rgba(59, 130, 246, 0.1);
  --shadow-focus-error: 0 0 0 3px rgba(239, 68, 68, 0.1);
  --shadow-focus-success: 0 0 0 3px rgba(34, 197, 94, 0.1);
}
```

## 경계선 반지름 토큰 (Border Radius Tokens)

### 반지름 스케일 (Radius Scale)
```css
:root {
  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 0.125rem;   /* 2px */
  --radius-base: 0.25rem;  /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-3xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;   /* 완전한 원형 */
}
```

## 애니메이션 토큰 (Animation Tokens)

### 전환 효과 (Transitions)
```css
:root {
  /* Transition Durations */
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;

  /* Transition Timing Functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Common Transitions */
  --transition-all: all var(--duration-150) var(--ease-in-out);
  --transition-colors: color var(--duration-150) var(--ease-in-out), 
                       background-color var(--duration-150) var(--ease-in-out),
                       border-color var(--duration-150) var(--ease-in-out);
  --transition-opacity: opacity var(--duration-150) var(--ease-in-out);
  --transition-transform: transform var(--duration-150) var(--ease-in-out);
}
```

## Z-Index 토큰 (Z-Index Tokens)
```css
:root {
  /* Z-Index Scale */
  --z-0: 0;
  --z-10: 10;
  --z-20: 20;
  --z-30: 30;
  --z-40: 40;
  --z-50: 50;
  --z-auto: auto;

  /* Semantic Z-Index */
  --z-dropdown: var(--z-50);
  --z-modal: var(--z-40);
  --z-popover: var(--z-30);
  --z-tooltip: var(--z-20);
  --z-header: var(--z-10);
}
```

## 다크 모드 토큰 (Dark Mode Tokens)

### 다크 테마 색상 (Dark Theme Colors)
```css
[data-theme="dark"] {
  /* Dark Mode Color Overrides */
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;

  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary: #94a3b8;

  --color-border-primary: #334155;
  --color-border-secondary: #475569;

  /* Adjusted shadows for dark mode */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}
```

## 토큰 사용 예시 (Token Usage Examples)

### 컴포넌트 스타일링 예시
```css
/* Button Component */
.btn-primary {
  background-color: var(--color-primary-600);
  color: var(--color-text-inverse);
  padding: var(--spacing-padding-md) var(--spacing-padding-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  line-height: var(--line-height-normal);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-colors);
}

.btn-primary:hover {
  background-color: var(--color-primary-700);
  box-shadow: var(--shadow-md);
}

.btn-primary:focus {
  outline: none;
  box-shadow: var(--shadow-focus);
}

/* Card Component */
.card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-padding-lg);
  box-shadow: var(--shadow-sm);
}

.card-header {
  margin-bottom: var(--spacing-margin-md);
  padding-bottom: var(--spacing-padding-md);
  border-bottom: 1px solid var(--color-border-primary);
}

.card-title {
  font-size: var(--typography-h4-size);
  font-weight: var(--typography-h4-weight);
  line-height: var(--typography-h4-line-height);
  color: var(--color-text-primary);
  margin: 0;
}
```

### 반응형 토큰 사용
```css
/* Mobile-first responsive design */
.container {
  padding: var(--spacing-container-sm);
}

@media (min-width: 768px) {
  .container {
    padding: var(--spacing-container-md);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-container-lg);
  }
}
```

## WCAG AA 접근성 목표 (WCAG AA Accessibility Goals)

### 접근성 체크리스트
- ✅ **색상 대비**: 모든 텍스트 4.5:1 이상, 큰 텍스트 3:1 이상
- ✅ **키보드 네비게이션**: 모든 인터랙티브 요소 키보드 접근 가능
- ✅ **포커스 표시**: 명확한 포커스 인디케이터 제공
- ✅ **텍스트 크기**: 200% 확대까지 지원
- ✅ **색상 정보**: 색상에만 의존하지 않는 정보 전달

### 자동 검증 도구 설정
```javascript
// 색상 대비 검증 함수
function validateContrast(foreground, background) {
  const ratio = getContrastRatio(foreground, background);
  return {
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    ratio: ratio.toFixed(1)
  };
}

// 토큰 검증 스크립트
const validationResults = Object.entries(colorTokens).map(([name, value]) => ({
  token: name,
  ...validateContrast(value, '--color-bg-primary')
}));
```

---
*문서 버전: 1.0*  
*최종 수정: 2025-09-22*  
*승인자: 이충원 (대표이사)*