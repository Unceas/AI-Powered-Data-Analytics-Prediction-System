# InsightGrid V1.4.5 — Frontend UI/UX Audit & Design Foundations Report

> **Document Type:** Engineering & Design Foundations Audit  
> **Target Version:** InsightGrid V1.4.5  
> **Release Sequence:** V1.4.6 – V1.4.8 UI/UX Hardening & Grounding Sequence  
> **Status:** Completed Audit  
> **Auditor:** Antigravity AI Engine  
> **Date:** October 18, 2026  
> **Baseline Commit:** `29ee85a` (master)  
> **Test Status:** 132/132 Backend Unit Tests Passing (Pytest); Frontend Production Build Clean (`vite build`); 4 ESLint Errors & 2 Warnings Pre-existing.

---

## 1. Executive Summary

InsightGrid has made significant architectural strides through V1.4.4.3, establishing deterministic evidence extraction, calibrated ML reliability, evidence graph relations, and evidence-grounded Copilot Q&A. However, a rigorous, repository-grounded audit of the frontend workspace reveals a stark divergence between the verified analytical backend and the current React frontend implementation:

1. **Analytical Integrity Breaches in UI Presentation (P0):**
   Despite strict backend Investigation Integrity Rules, `Dashboard.tsx` presents hardcoded correlation matrices (`dropout_risk`, `absences`, `gpa_cumulative`, `study_hours`), synthetic feature weights calculated via an arbitrary formula (`0.35 - (idx * 0.05)`), and synthetic simulated chart waves (`generateChartData()`). When real counts are null or zero, the UI falls back to fabricated static numbers (`14` insights, `13` anomalies, `94%` health, `91%` reliability).
2. **Severe Mobile & Tablet Layout Breakage (P0/P1):**
   The application container enforces a fixed `100vw × 100vh` flex layout. The sidebar defaults to `220px` expanded and lacks any responsive media queries, drawer toggles, or mobile overlays. On viewports below 430px (e.g., iPhone, Pixel, Galaxy), the sidebar leaves only 100px–210px for the workspace. Furthermore, `.dashboard-top-section` (`2.1fr 1fr`), `.hero-stats-grid` (`repeat(3, 1fr)`), `.split-layout` (`1fr 1fr`), and `.tables-grid-layout` (`1.2fr 1fr`) lack responsive stacking queries, causing horizontal clipping, overflow, and illegibility.
3. **Palette & Design System Schism (P2):**
   The codebase suffers from a token identity conflict. While `index.css` defines an editorial Warm Sand & Metallic Gold palette (`#D4AF37`), multiple views (`WorkspaceContextBanner`, `Hero`, `DataManager`, `Dashboard`) hardcode legacy cyan and blue tokens (`#3b82f6`, `rgba(59, 130, 246, ...)`, undefined `.text-cyan` class), conflicting with the restrained white/off-white, gray, dark-accent, and selective-green baseline.
4. **Performance & Bundle Bloat (P1):**
   The production build produces a single, un-split client bundle of **1,542 kB (452 kB gzipped)**. All views, Recharts, Framer Motion, jsPDF, and html2canvas are statically imported on first load in `App.tsx`.
5. **Code Hygiene & Pre-existing Failures (P0/P2):**
   `npm run lint` fails with **4 errors and 2 warnings** (`prefer-const` in `App.tsx`, useless escape regex in `Dashboard.tsx`, useless assignment in `Diagnostics.tsx`, and Fast Refresh component export violation in `WorkspaceContext.tsx`). Additionally, 4 orphaned legacy components (`UploadSection.tsx`, `AIInsightsBubble.tsx`, `DataProcessing.tsx`, `AIInsights.tsx`) and over 1,600 lines of dead CSS in `Dashboard.css` remain in the repository.

This audit provides a complete, evidence-backed implementation plan to resolve these findings across **V1.4.6 (Layout & Responsive Foundations)**, **V1.4.7 (Data Grounding & Token Harmonization)**, and **V1.4.8 (Performance Splitting, a11y & PDF Hardening)** without altering analytical logic, API contracts, or the isolated cinematic landing experience.

---

## 2. Verified Route and Page Inventory

The frontend does not utilize a router library (such as `react-router-dom`). Navigation is entirely state-driven within [`App.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/App.tsx) via `viewMode` (`'product' | 'workspace'`) and `currentView` (`string`).

```
                    ┌─────────────────────────┐
                    │      App (Root)         │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             │ viewMode === 'product'                │ viewMode === 'workspace'
             ▼                                       ▼
  ┌──────────────────────┐                ┌──────────────────────┐
  │  LandingExperience   │                │   AppContainer       │
  │  (Cinematic Scroll)  │                │  ┌────────────────┐  │
  └──────────────────────┘                │  │    Sidebar     │  │
                                          │  ├────────────────┤  │
                                          │  │     Hero       │  │
                                          │  ├────────────────┤  │
                                          │  │ WorkspaceBanner│  │
                                          │  └────────────────┘  │
                                          └──────────┬───────────┘
                                                     │
         ┌──────────────┬──────────────┬─────────────┼──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼             ▼              ▼              ▼              ▼
   ['dashboard']  ['diagnostics'] ['data-manager'] ['analytics'] ['ml-workbench']  ['ai-chat']    ['settings']
    Dashboard     Diagnostics    DataManager     Analytics   MachineLearning  AIChatPage     Settings
```

### Route-to-Page Mapping

| Virtual Route / View State | Rendered Component | Layout Container | Navigation Trigger | Verified Status |
|---|---|---|---|---|
| `viewMode: 'product'` | [`LandingExperience`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/LandingExperience.tsx) | Standalone full-viewport canvas | Default entry if `localStorage('insightgrid-viewmode') !== 'workspace'`, or via Sidebar "Product Overview" | Active & Verified |
| `currentView: 'dashboard'` | [`Dashboard`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx) | `Sidebar` + `Hero` + `WorkspaceBanner` | Sidebar "Overview", Logo click, Breadcrumbs | Active & Verified |
| `currentView: 'data-manager'` | [`DataManager`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/DataManager.tsx) | `Sidebar` + `Hero` + `WorkspaceBanner` | Sidebar "Data & Understanding", Action Cards | Active & Verified |
| `currentView: 'analytics'` | [`Analytics`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/PipelineTabs/Analytics.tsx) | `Sidebar` + `Hero` + `WorkspaceBanner` | Sidebar "Analysis & Patterns", Decision Brief CTA, Banner CTA | Active & Verified |
| `currentView: 'ml-workbench'` | [`MachineLearning`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/PipelineTabs/MachineLearning.tsx) | `Sidebar` + `Hero` + `WorkspaceBanner` | Sidebar "Predictions", Decision Brief CTA, Banner CTA | Active & Verified |
| `currentView: 'ai-chat'` | [`AIChatPage`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/AIChatPage.tsx) | `Sidebar` + `Hero` + `WorkspaceBanner` | Sidebar "Ask InsightGrid", Banner CTA | Active & Verified |
| `currentView: 'diagnostics'` | [`Diagnostics`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Diagnostics.tsx) | `Sidebar` + `Hero` + `WorkspaceBanner` | Sidebar "Diagnostics", Recent Session Cards | Active & Verified |
| `currentView: 'settings'` | [`Settings`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Settings.tsx) | `Sidebar` + `Hero` + `WorkspaceBanner` | Sidebar "Settings" | Active & Verified |
| PDF Export Modal / Overlay | [`IntelligenceReport`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/IntelligenceReport.tsx) | Off-screen DOM root (`#pdf-report-render-root`) | "Generate Intelligence Report" CTA | Active & Verified |

---

## 3. Component and Layout Inventory

### Active Layout & View Components

| Component | Source File | CSS File | Purpose / Scope | Dependencies |
|---|---|---|---|---|
| `App` / `AppContent` | [`App.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/App.tsx) | [`App.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/App.css) | Root orchestrator, sequential pipeline runner, PDF compilation | Axios, jsPDF, html2canvas, WorkspaceContext |
| `LandingExperience` | [`LandingExperience.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/LandingExperience.tsx) | [`LandingExperience.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/LandingExperience.css) | Cinematic, scroll-driven interactive product showcase | Framer Motion, Lucide Icons |
| `Sidebar` | [`Sidebar.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Sidebar.tsx) | [`Sidebar.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Sidebar.css) | Workspace navigation bar with status indicators & theme toggle | Lucide Icons, useTheme, BrandIcon |
| `Hero` | [`Hero.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Hero.tsx) | [`Hero.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Hero.css) | Top-level operational status bar & real-time clock | Lucide Icons |
| `WorkspaceContextBanner` | [`WorkspaceContextBanner.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/WorkspaceContextBanner.tsx) | [`WorkspaceContextBanner.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/WorkspaceContextBanner.css) | Cross-tab investigation context chip, active dimension tags & quick actions | WorkspaceContext, Lucide Icons |
| `Dashboard` | [`Dashboard.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx) | [`Dashboard.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.css) | Executive snapshot, proactive discovery, operational findings, decomposition modal | Recharts, Lucide Icons, WorkspaceContext |
| `DataManager` | [`DataManager.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/DataManager.tsx) | [`DataManager.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/DataManager.css) | Dataset file upload, sample presets, data understanding profile, preprocessing | Lucide Icons |
| `Analytics` | [`Analytics.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/PipelineTabs/Analytics.tsx) | [`PipelineTabs.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/PipelineTabs/PipelineTabs.css) | Pearson correlation matrix table, univariate feature distributions, AI summary | Recharts, Lucide Icons, WorkspaceContext |
| `MachineLearning` | [`MachineLearning.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/PipelineTabs/MachineLearning.tsx) | [`PipelineTabs.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/PipelineTabs/PipelineTabs.css) | Auto-ML training, target selection, driver attribution, Isolation Forest anomaly scanner | Lucide Icons, WorkspaceContext |
| `AIChatPage` | [`AIChatPage.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/AIChatPage.tsx) | [`AIChatPage.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/AIChatPage.css) | Evidence-Aware Copilot, conversational history, dimension actions, context meta | Lucide Icons, WorkspaceContext |
| `Diagnostics` | [`Diagnostics.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Diagnostics.tsx) | [`Diagnostics.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Diagnostics.css) | Stepper audit timeline, live activity console filter, simulated telemetry | Lucide Icons |
| `Settings` | [`Settings.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Settings.tsx) | [`Settings.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Settings.css) | User preferences (font size, density, theme, model defaults) | Lucide Icons, useTheme |
| `IntelligenceReport` | [`IntelligenceReport.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/IntelligenceReport.tsx) | [`IntelligenceReport.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/IntelligenceReport.css) | Multi-page printable A4 PDF report layout with embedded vector charts | Recharts, BrandIcon |
| `BrandIcon` | [`BrandIcon.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/BrandIcon.tsx) | Inline / SVG | Scalable 5×5 brand grid icon | Pure SVG |

### Orphaned / Dead Components Identified

The following components exist in the source tree but are **never imported or referenced anywhere in the application**:

1. [`frontend-react/src/components/UploadSection.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/UploadSection.tsx) & [`UploadSection.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/UploadSection.css) (Orphaned upload panel superseded by `DataManager.tsx`).
2. [`frontend-react/src/components/AIInsightsBubble.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/AIInsightsBubble.tsx) & [`AIInsightsBubble.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/AIInsightsBubble.css) (Orphaned floating AI bubble superseded by `AIChatPage.tsx`).
3. [`frontend-react/src/components/PipelineTabs/DataProcessing.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/PipelineTabs/DataProcessing.tsx) (Orphaned tab superseded by `DataManager.tsx`).
4. [`frontend-react/src/components/PipelineTabs/AIInsights.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/PipelineTabs/AIInsights.tsx) (Orphaned tab superseded by `AIChatPage.tsx` and `Dashboard.tsx`).

---

## 4. Responsive Viewport-by-Route Findings

> **Methodology Note:** In compliance with Operating Rule 10, findings in this section are classified by **rigorous code and layout inspection of CSS rules, DOM hierarchies, and container constraints**. Browser automation / screenshot tools are not available in this environment; observations reflect exact structural styles and viewport math.

### Evaluation Grid Across 6 Standard Viewport Tiers

```
┌─────────────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────┐
│  320–375 px     │  390–430 px       │  600–820 px       │ 1024–1280 px      │ 1366–1440 px      │ 1600–1920 px      │
│  Compact Mobile │  Standard Mobile  │  Tablet/Foldable  │  Small Desktop    │  Standard Desktop │  Ultrawide / FHD  │
├─────────────────┼───────────────────┼───────────────────┼───────────────────┼───────────────────┼───────────────────┤
│ CRITICAL:       │ CRITICAL:         │ MODERATE:         │ NOMINAL:          │ OPTIMAL:          │ MODERATE:         │
│ Sidebar blocks  │ Sidebar takes >50%│ Sidebar works if  │ Full layout fits; │ Standard design   │ Excessive card    │
│ workspace; grid │ width; horizontal │ collapsed; tables │ status pills hide │ baseline; good    │ stretch; line     │
│ overflow & text │ scroll in tables  │ wrap; cards tight │ at 1024px         │ balance           │ length > 120 char │
│ clipping        │ & top cards       │                   │                   │                   │                   │
└─────────────────┴───────────────────┴───────────────────┴───────────────────┴───────────────────┴───────────────────┘
```

### Detailed Observations by Route & Viewport

#### 1. Navigation Shell & Sidebar ([`Sidebar.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Sidebar.css), [`App.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/App.css))
- **320–375 px & 390–430 px (Severity: P0):**
  - `.app-container` has `display: flex; height: 100vh; width: 100vw; overflow: hidden;`.
  - `.sidebar.expanded` has fixed `width: 220px;`.
  - On a 320px screen, the sidebar occupies **68.75% of the viewport width**, leaving a mere 100px for `.main-content`. Even collapsed (`72px`), it takes 22.5% of horizontal space permanently.
  - There is zero responsive media query in `Sidebar.css`. No hamburger icon, backdrop overlay, or slide-out drawer mechanism exists.
- **600–820 px (Severity: P1):**
  - The sidebar consumes 220px, leaving ~380px–600px for main content. Collapsing to 72px is manually possible, but not automated via media queries.
- **1024–1920 px (Severity: Pass):**
  - Well-proportioned at standard desktop viewports.

#### 2. Overview / Dashboard ([`Dashboard.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.css))
- **320–375 px & 390–430 px (Severity: P0):**
  - `.dashboard-top-section` has `display: grid; grid-template-columns: 2.1fr 1fr;` with no media query. The executive operations card is squeezed into an unusable vertical strip beside the hero stats.
  - `.hero-stats-grid` has `display: grid; grid-template-columns: repeat(3, 1fr);` with no media query. Metric values and labels clip and collide.
  - `.dashboard-middle-section.split-layout` has `display: grid; grid-template-columns: 1fr 1fr;` forcing pipeline audits and console side-by-side into 50px–80px slivers.
  - `.tables-grid-layout` has `display: grid; grid-template-columns: 1.2fr 1fr;` forcing two multi-column data tables side-by-side.
  - `.proactive-findings-grid` uses `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));`. When horizontal padding is added, `minmax(320px)` forces horizontal overflow.
- **600–820 px (Severity: P1):**
  - Middle split and table split remain two-column, resulting in heavy horizontal scrollbars inside tables.
- **1024–1280 px (Severity: P2):**
  - `.summary-workspace-content-split` properly collapses to 1fr at 1024px. However, `.dashboard-top-section` remains 2.1fr 1fr and looks crowded.
- **1600–1920 px (Severity: P3):**
  - Uncapped container widths cause findings cards and decision brief text to stretch up to 1800px wide, degrading typographic readability.

#### 3. Data & Understanding ([`DataManager.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/DataManager.css))
- **320–430 px (Severity: P1):**
  - `.manager-grid` collapses to 1fr at `@media (max-width: 900px)`.
  - However, `.sample-presets-grid` has `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));`. At 320px, with sidebar and main content padding, this overflows horizontally.
  - The Column Profiles table has `overflow-x: auto`, which provides a scroll fallback, but column headers clip on narrow screens.
- **600–1920 px (Severity: Pass):**
  - Clean stacking at 900px; responsive and usable.

#### 4. Predictions / ML Workbench ([`PipelineTabs.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/PipelineTabs/PipelineTabs.css))
- **320–430 px (Severity: P1):**
  - `.ml-controls` input and button row has `display: flex; gap: 1rem; align-items: center; max-width: 600px;`. On screens < 360px, the input and button squash each other without wrapping.
  - Prediction overview flex header clips reliability pills.
- **600–1920 px (Severity: Pass):**
  - Operates cleanly on tablet and desktop.

#### 5. Ask InsightGrid / Copilot ([`AIChatPage.css`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/AIChatPage.css))
- **320–430 px (Severity: P1):**
  - `.chat-page-layout` collapses to `grid-template-columns: 1fr` at `@media (max-width: 900px)`.
  - However, `.chat-sidebar` containing the dataset picker and grounding elements remains stacked above the chat window, pushing the actual conversation interface below the fold.
  - Chat quick prompt pills wrap into multiple rows, taking excessive vertical height.
- **600–1920 px (Severity: Pass):**
  - Good two-column layout on desktop viewports.

#### 6. Progressive Decomposition Modal ([`Dashboard.tsx:1735`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L1735))
- **320–430 px (Severity: P1):**
  - Fixed modal container has `max-width: 680px; width: 100%; padding: 1.5rem; max-height: 90vh;`.
  - On mobile, `1.5rem` padding leaves too little room for multi-node decomposition chains.
  - Dimension selection chips (`.candidate-dim-tag`) lack sufficient touch target spacing and wrap abruptly.

---

## 5. Visual Consistency and Accessibility Findings

### 1. Color Palette & Token Discipline
- **Token Inconsistency:**
  - `index.css` defines `--accent-color: #D4AF37` (Metallic Gold) and `--bg-color: #FAF8F5` / `#080808`.
  - `WorkspaceContextBanner.css` has `border-left: 3px solid var(--accent-color, #3b82f6)` and uses blue `#3b82f6` as its active background.
  - `Dashboard.tsx` hardcodes inline styles with `background: rgba(59,130,246,0.06)`, `border: 1px solid rgba(59,130,246,0.2)`, and `color: #3b82f6` in the Decision Brief "Investigate Next" box (lines 645–647).
  - `DataManager.tsx` applies class `className="text-cyan"` to icons across 5 locations, but `.text-cyan` is never defined in any stylesheet.
  - `Hero.css` defines `.status-pill.active-cyan` which sets background to `var(--accent-light)` (gold), creating cognitive dissonance between the class name and its actual visual appearance.
- **Baseline Alignment:**
  - The project's visual direction is **restrained white/off-white, gray, dark-accent, and selective-green**. The accidental mixture of metallic gold, cyan, and royal blue must be consolidated into the unified design system.

### 2. Typographic Scannability & Hierarchy
- **Font Stack:**
  - `Space Grotesk` (display headings: h1, h2)
  - `Manrope` (body, section headers, ui controls: h3, h4, buttons)
  - `IBM Plex Mono` (numerical values, metric pills, timestamps, code)
- **Hierarchy Conflicts:**
  - `index.css:189-237` utilizes multiple `!important` flags on `.panel-header-row h3`, `.panel-title`, `.panel-badge`, and `.card h3`.
  - In `Dashboard.tsx`, card headers alternate inconsistently between `<h3>`, `<h4>`, and `<h5>` with varying font sizes (e.g. `0.85rem` uppercase vs `1.1rem` title case vs `1.35rem` headline).
  - Monospace font is not consistently applied to all numeric tabular outputs in `DataManager.tsx` and `IntelligenceReport.tsx`.

### 3. Accessibility (WCAG 2.1 AA Compliance)
- **Keyboard Navigation & Focus Visibility (Critical Failure - WCAG 2.4.7):**
  - `index.css:268` sets `button { outline: none; }` and line 273 sets `input, select, textarea { outline: none; }`.
  - No alternative `:focus-visible` styling is supplied. Tabbing through the application provides zero visual cue as to which element has focus.
- **Non-Semantic Interactive Elements (WCAG 4.1.2):**
  - In `Dashboard.tsx:418-450`, the Recent Session cards are `<div>` elements with `onClick` handlers. They lack `role="button"`, `tabIndex={0}`, and `onKeyDown` listeners, making them completely inaccessible to keyboard users.
  - In `Dashboard.tsx:693-740`, Executive Snapshot cards toggle detail popovers via `<div className="snapshot-card clickable" onClick={...}>` without `aria-expanded` attributes or keyboard triggers.
- **Modal Dialog Accessibility (WCAG 2.1.2, 2.4.3):**
  - The Progressive Decomposition Modal (`Dashboard.tsx:1735`) lacks `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
  - Keyboard focus is not trapped within the modal; pressing `Tab` navigates through background cards.
  - Pressing `Escape` does not dismiss the modal.
- **Touch Target Sizing (WCAG 2.5.5):**
  - `WorkspaceContextBanner.css:104`: `.dimension-remove-btn` has `width: 12px; height: 12px;`, falling drastically short of the 44×44px minimum touch target recommendation.
  - `Sidebar.css:71`: `.toggle-btn` has `padding: 0.25rem`, yielding an effective interactive area of only ~24×24px.
  - `candidate-dim-tag` buttons in proactive findings measure ~20px in height.
- **Color Contrast (WCAG 1.4.3):**
  - `--text-muted: #A8A29E` on `--bg-color: #FAF8F5` provides a contrast ratio of **2.82:1**, failing the minimum 4.5:1 threshold for standard text.
  - Multiple metadata badges use small font sizes (`0.58rem`–`0.65rem`) with muted opacity, rendering them difficult to read under normal ambient lighting.

---

## 6. Workflow and Regression Matrix

| Workflow Stage | Current Frontend Behavior | Technical Implementation | Critical Regression Risk | Automated Test Coverage |
|---|---|---|---|---|
| **1. Dataset Upload & Ingestion** | Drag-drop or preset click initiates multi-stage sequential async pipeline in `App.tsx:runFullPipeline`. | `POST /upload-csv` $\to$ `/understand-csv` $\to$ `/process-csv` $\to$ `/analyze-csv` $\to$ `/predict-csv` $\to$ `/extract-evidence` $\to$ `/investigate-insight`. | If any pipeline stage errors out, `App.tsx` catches and updates state to `'ERROR'`, but provides no per-stage retry or recovery mechanism. | 11 backend tests in `test_cleaner.py`, `test_data_understanding.py`; 0 frontend integration tests. |
| **2. Data Understanding & Profiling** | Displays structural health score, duplicate count, candidate targets, column profiles table, and limitation notices. | `DataManager.tsx:258-377` renders `activeDataset.understanding`. | If categorical profiles lack `unique_count` or inferred type, candidate dimensions in Dashboard and Investigation fail to populate. | 2 backend tests in `test_data_understanding.py`; 0 frontend tests. |
| **3. Descriptive Analytics & Correlation** | Renders Pearson correlation matrix, univariate distribution histograms, and outlier counts. | `Analytics.tsx:78-200` dynamically maps `activeDataset.analyticsData.correlation_matrix`. | `Dashboard.tsx:1664` ignores `analyticsData` and renders a hardcoded student performance matrix, breaking context across tabs. | 5 backend tests in `test_analyzer.py`; 0 frontend tests. |
| **4. Proactive Discovery & Key Findings** | Displays top 3–5 findings with priority ranking badges, confidence tags, and "Investigate by" dimension chips. | `Dashboard.tsx:905-1047` filters `insightsList` by `is_key_finding`. | Finding confidence badges use hardcoded color styles (`#22c55e`, `#ef4444`, `#eab308`, `#3b82f6`) rather than design tokens. | 5 backend tests in `test_v1_4_proactive_discovery.py`; 0 frontend tests. |
| **5. Progressive Investigation Chains** | Clicking "🔍 Investigate" opens modal; selecting dimension sends step request to backend; renders lineage nodes. | `Dashboard.tsx:56-87` invokes `POST /investigate-step`; updates modal and `WorkspaceContext`. | State divergence: modal maintains local `nodes` array; if user closes modal, active investigation remains in banner but modal state resets. | 7 backend tests in `test_v1_4_iteration_2_decomposition.py`; 0 frontend tests. |
| **6. Evidence Graph & Relationships** | Displays verified relationships (`supports`, `corroborates`, `contradicts`, `derived_from`) in insight explainability console. | `Dashboard.tsx:1380-1430` filters `activeDataset.evidence_relationships` by matching evidence IDs. | Contradictions must never be muted or hidden; currently rendered in a scrollable box with max-height 140px that can obscure warnings. | 22 backend tests in `test_v1_4_4_1_evidence_graph.py`; 0 frontend tests. |
| **7. Evidence-Aware Copilot** | Conversational Q&A grounded in verified evidence, active investigation node, and allowlisted dimension actions. | `AIChatPage.tsx:97-163` submits question and context to `POST /ask-insightgrid`. | `AIChatPage.tsx:89` has missing dependency in `useEffect` dependency array, triggering warning and risking stale context. | 32 backend tests in `test_v1_4_4_3_evidence_aware_copilot.py`; 0 frontend tests. |
| **8. Intelligence Reports & PDF Export** | Compiles executive Decision Brief, feature weights, and correlation matrix into multi-page downloadable PDF. | `App.tsx:66-105` renders hidden `#pdf-report-render-root`, waits 1200ms, calls `html2canvas` and `jsPDF`. | Arbitrary `setTimeout(1200)` race condition: on low-end hardware or large tables, canvas renders before Recharts animation finishes, producing blank or clipped PDFs. | 5 backend tests in `test_v1_2_analytics_intelligence.py`; 0 frontend export tests. |

---

## 7. Performance Baseline and Limitations

### 1. Measured Production Build Metrics

Execution of `npm run build` in `frontend-react` yielded the following asset bundle measurements:

| Asset File | Size (Uncompressed) | Size (Gzipped) | Status / Warning |
|---|---|---|---|
| `dist/assets/index-ChtEWxxu.js` | **1,542.17 kB** | **451.98 kB** | `(!)` Exceeds 500 kB chunk warning threshold |
| `dist/assets/index.es-CgZQHUIH.js` | 151.41 kB | 48.88 kB | Standalone vendor chunk (jsPDF/canvg) |
| `dist/assets/purify.es-D47s59bc.js` | 26.09 kB | 10.18 kB | DOMPurify sanitizer |
| `dist/assets/chunk-BNv3lrIs.js` | 0.82 kB | 0.47 kB | Utility helper |
| `dist/assets/index-ChGp1ZeL.css` | **120.20 kB** | **20.89 kB** | Monolithic combined stylesheet |
| `dist/index.html` | 0.67 kB | 0.39 kB | HTML entry |

### 2. Key Performance Observations
- **Lack of Code-Splitting:**
  Every component, icon, and heavy third-party library (`framer-motion`, `recharts`, `jspdf`, `html2canvas`) is bundled into the initial entry chunk. A user navigating solely to the landing page downloads 1.54 MB of application code that is never executed.
- **CSS File Overhead:**
  The combined CSS bundle is 120 kB uncompressed. `Dashboard.css` alone accounts for 65.1 kB (3,329 lines), of which more than 50% consists of deprecated styles from prior iterations (`.dashboard-initialization-workspace`, `.dashboard-telemetry-hub`, `.capabilities-grid`).
- **Telemetry & Timer Re-render Hotspots (Observed via Code Inspection):**
  - [`Hero.tsx:13-24`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Hero.tsx#L13-L24): An unthrottled `setInterval` executes every 1,000ms to update `timeStr`, triggering continuous re-renders of the top bar.
  - [`Diagnostics.tsx:32-49`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Diagnostics.tsx#L32-L49): A simulated telemetry loop updates 4 state variables (`cpuUsage`, `memUsage`, `ioThroughput`, `gatewayPing`) every 2,000ms.
- **Performance Hypotheses (Unmeasured Concerns):**
  - *Hypothesis 1:* In `Dashboard.tsx`, large SVG trees rendered by Recharts for 28 data points and vertical bar charts re-render during state changes, likely causing frame drops on low-power devices.
  - *Hypothesis 2:* Off-screen DOM rendering with `html2canvas` at `scale: 2` on 100+ row datasets could cause high peak memory consumption (> 250 MB heap spike) and potential tab crashes on mobile browsers.

---

## 8. Severity-Ranked Issue Backlog

### P0 — Critical Workflow, Data Integrity & Navigation Failures

#### `ISSUE-DATA-001`
- **Severity:** P0
- **Route & Component:** `/dashboard` — [`Dashboard.tsx:1664-1705`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L1664-L1705)
- **Reproduction / Evidence:** In `Dashboard.tsx`, Table 1 ("Pearson Correlation Matrix") hardcodes column names (`dropout_risk`, `absences`, `gpa_cumulative`, `study_hours`) and static values (`1.00`, `0.74`, `-0.62`, `-0.48`) directly into JSX, ignoring `activeDataset.analyticsData.correlation_matrix`.
- **Expected Behavior:** Table columns and correlation values must be dynamically rendered from `activeDataset.analyticsData.correlation_matrix`, matching the behavior in `Analytics.tsx`.
- **Recommended Fix:** Refactor Table 1 to dynamically iterate over `Object.keys(activeDataset.analyticsData.correlation_matrix)`.
- **Likely Shared Root Cause:** Mock table code from early prototyping was never connected to the real analytics payload.
- **Regression Risk:** Low. Analytical data is already available on `activeDataset`.
- **Suggested Release:** **V1.4.6**

#### `ISSUE-DATA-002`
- **Severity:** P0
- **Route & Component:** `/dashboard` — [`Dashboard.tsx:168-171`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L168-L171) & [`IntelligenceReport.tsx:47-51`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/IntelligenceReport.tsx#L47-L51)
- **Reproduction / Evidence:** In `getFeatureWeights()`, feature weights are calculated synthetically via `weight: 0.35 - (idx * 0.05)` rather than reading `activeDataset.mlResult.feature_importance` or `drivers`.
- **Expected Behavior:** Feature attribution weights must strictly reflect verified model importances calculated by the ML engine.
- **Recommended Fix:** Map `activeDataset.mlResult.feature_importance` entries directly into the weights state.
- **Likely Shared Root Cause:** Copy-pasted simulation formula between `Dashboard.tsx` and `IntelligenceReport.tsx`.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.6**

#### `ISSUE-DATA-003`
- **Severity:** P0
- **Route & Component:** `/dashboard` — [`Dashboard.tsx:537, 544, 550, 679, 680, 718, 726`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L537)
- **Reproduction / Evidence:** Fallback values for missing or zero-count metrics use hardcoded static numbers (`activeDataset.insights?.length || 14`, `anomalies || '13'`, `health_score || 94`, `reliability_score || 91`, `imbalance_ratio ?? 15.5`).
- **Expected Behavior:** If a dataset has 0 anomalies or 0 insights, the UI must display `0` or an empty state, never fabricated numbers.
- **Recommended Fix:** Remove all non-zero numeric fallbacks; display authentic counts or null dashes (`--`).
- **Likely Shared Root Cause:** Demo-mode fallback values left in production code.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.6**

#### `ISSUE-RESP-001`
- **Severity:** P0
- **Route & Component:** Global Workspace Shell — [`Sidebar.tsx:38`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Sidebar.tsx#L38), [`Sidebar.css:1-20`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Sidebar.css#L1-L20), [`App.css:1-18`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/App.css#L1-L18)
- **Reproduction / Evidence:** On viewports 320px–430px, the 220px fixed sidebar occupies up to 68.75% of screen width. No mobile drawer or toggle exists.
- **Expected Behavior:** On viewports < 768px, the sidebar must collapse off-canvas and be toggled via a mobile header button.
- **Recommended Fix:** Implement responsive off-canvas drawer with backdrop overlay for viewports < 768px.
- **Likely Shared Root Cause:** Desktop-first layout assumed fixed monitor dimensions.
- **Regression Risk:** Moderate. Requires testing across all 7 workspace views.
- **Suggested Release:** **V1.4.6**

#### `ISSUE-LINT-001`
- **Severity:** P0
- **Route & Component:** Codebase Build Validation — [`App.tsx:218`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/App.tsx#L218), [`Dashboard.tsx:206`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L206), [`Diagnostics.tsx:90`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Diagnostics.tsx#L90), [`WorkspaceContext.tsx:270`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/context/WorkspaceContext.tsx#L270)
- **Reproduction / Evidence:** `npm run lint` exits with code 1:
  1. `App.tsx:218:11`: `'targetCol' is never reassigned. Use 'const' instead`
  2. `Dashboard.tsx:206:49`: `Unnecessary escape character: \[`
  3. `Diagnostics.tsx:90:7`: `The value assigned to 'progressPercentage' is not used in subsequent statements`
  4. `WorkspaceContext.tsx:270:14`: `Fast refresh only works when a file only exports components`
- **Expected Behavior:** `npm run lint` must pass cleanly with 0 errors.
- **Recommended Fix:** Resolve lint rules; move `useWorkspace` hook or provider into dedicated files if necessary.
- **Likely Shared Root Cause:** Missing pre-commit lint hook.
- **Regression Risk:** Zero.
- **Suggested Release:** **V1.4.6**

---

### P1 — Serious Layout, Usability & Accessibility Failures

#### `ISSUE-RESP-002`
- **Severity:** P1
- **Route & Component:** `/dashboard` — [`Dashboard.css:1700, 1714, 1795, 2487`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.css#L1700)
- **Reproduction / Evidence:** `.dashboard-top-section` (`2.1fr 1fr`), `.hero-stats-grid` (`repeat(3, 1fr)`), `.dashboard-middle-section.split-layout` (`1fr 1fr`), and `.tables-grid-layout` (`1.2fr 1fr`) lack responsive media queries, causing severe squashing and horizontal overflow on tablet/mobile screens.
- **Expected Behavior:** Grids must collapse to single-column layouts on viewports < 900px, and stats grid must scale to 2-column then 1-column.
- **Recommended Fix:** Add `@media (max-width: 900px)` and `@media (max-width: 600px)` breakpoints for all primary dashboard grid containers.
- **Likely Shared Root Cause:** Dashboard CSS was written against a fixed 1440px viewport.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.6**

#### `ISSUE-PERF-001`
- **Severity:** P1
- **Route & Component:** Build Bundle Architecture — [`App.tsx:2-15`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/App.tsx#L2-L15)
- **Reproduction / Evidence:** Production build yields a single 1.54 MB chunk (`dist/assets/index-ChtEWxxu.js`), triggering Vite's bundle size warning.
- **Expected Behavior:** Application views (`LandingExperience`, `Dashboard`, `AIChatPage`, etc.) should be dynamically loaded via `React.lazy()` to keep the initial chunk under 350 kB.
- **Recommended Fix:** Introduce dynamic imports and a lightweight `<Suspense>` fallback in `App.tsx`.
- **Likely Shared Root Cause:** Absence of code-splitting architecture.
- **Regression Risk:** Low to Moderate. Ensure lazy-loaded components do not lose state during tab navigation.
- **Suggested Release:** **V1.4.8**

#### `ISSUE-A11Y-001`
- **Severity:** P1
- **Route & Component:** Global Styling — [`index.css:268, 273`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/index.css#L268)
- **Reproduction / Evidence:** `button { outline: none; }` and `input, select, textarea { outline: none; }` globally strip focus rings without providing `:focus-visible` replacements.
- **Expected Behavior:** Keyboard focus must have an unambiguous visual ring (`:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; }`).
- **Recommended Fix:** Remove `outline: none;` and implement unified `:focus-visible` token styles.
- **Likely Shared Root Cause:** Default cosmetic CSS reset stripped browser outlines without accessibility review.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.6**

#### `ISSUE-A11Y-002`
- **Severity:** P1
- **Route & Component:** `/dashboard` — [`Dashboard.tsx:1735-1815`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L1735-L1815)
- **Reproduction / Evidence:** Progressive Decomposition Modal does not trap keyboard focus, lacks ARIA dialog roles, and cannot be dismissed with the `Escape` key.
- **Expected Behavior:** Modal must implement `role="dialog"`, `aria-modal="true"`, focus trap, and `Escape` key listener.
- **Recommended Fix:** Wrap modal in accessible dialog hook or standard accessible container.
- **Likely Shared Root Cause:** Ad-hoc inline modal implementation.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.7**

#### `ISSUE-STATE-001`
- **Severity:** P1
- **Route & Component:** State Architecture — [`Dashboard.tsx:53, 985`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L53), [`WorkspaceContext.tsx:94-136`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/context/WorkspaceContext.tsx#L94-L136)
- **Reproduction / Evidence:** `Dashboard.tsx` maintains duplicate investigation state in `activeInvestigationModal` alongside `WorkspaceContext.investigation`. Closing the modal leaves the workspace banner active, but re-opening the modal creates a detached copy.
- **Expected Behavior:** `WorkspaceContext` should be the authoritative single source of truth for active investigation lineage.
- **Recommended Fix:** Bind `activeInvestigationModal` directly to `workspace.investigation`.
- **Likely Shared Root Cause:** Fast iteration during V1.4.2 without complete refactoring of local component state.
- **Regression Risk:** Moderate. Must preserve progressive decomposition step API calls.
- **Suggested Release:** **V1.4.7**

#### `ISSUE-EXPORT-001`
- **Severity:** P1
- **Route & Component:** Report Export — [`App.tsx:66-105`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/App.tsx#L66-L105), [`IntelligenceReport.tsx`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/IntelligenceReport.tsx)
- **Reproduction / Evidence:** Report generation mounts a hidden DOM container at `left: -9999px` and relies on an arbitrary `await new Promise(r => setTimeout(r, 1200))` before calling `html2canvas`. If chart rendering delays, captured images are blank or corrupt.
- **Expected Behavior:** Export engine should deterministically detect when vector charts have finished rendering before rasterizing.
- **Recommended Fix:** Implement render completion callback or utilize server-side report compilation.
- **Likely Shared Root Cause:** Client-side rasterization workaround for PDF compilation.
- **Regression Risk:** Moderate.
- **Suggested Release:** **V1.4.8**

---

### P2 — Consistency, Hierarchy & Component Issues

#### `ISSUE-DESIGN-001`
- **Severity:** P2
- **Route & Component:** Design Tokens & Styling — [`WorkspaceContextBanner.css:7, 57`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/WorkspaceContextBanner.css#L7), [`Dashboard.tsx:645`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L645), [`DataManager.tsx:139`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/DataManager.tsx#L139)
- **Reproduction / Evidence:** Rogue cyan and blue colors (`#3b82f6`, `.text-cyan`) clash with the Metallic Gold (`#D4AF37`) and editorial ivory baseline.
- **Expected Behavior:** All views must use standardized tokens from `index.css`.
- **Recommended Fix:** Replace hardcoded blues and undefined cyan classes with design system tokens (`--accent-color`, `--accent-light`, `--accent-border`).
- **Likely Shared Root Cause:** Merging components developed during different design iterations.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.7**

#### `ISSUE-DEAD-001`
- **Severity:** P2
- **Route & Component:** Component Repository — `UploadSection.tsx`, `AIInsightsBubble.tsx`, `PipelineTabs/DataProcessing.tsx`, `PipelineTabs/AIInsights.tsx`
- **Reproduction / Evidence:** 4 unreferenced legacy files exist in `frontend-react/src/components/`.
- **Expected Behavior:** Dead code should be safely archived or removed to prevent developer confusion.
- **Recommended Fix:** Remove or archive unused legacy components.
- **Likely Shared Root Cause:** Feature evolution without cleaning up replaced prototypes.
- **Regression Risk:** Zero. Verified unimported across codebase.
- **Suggested Release:** **V1.4.6**

#### `ISSUE-CSS-001`
- **Severity:** P2
- **Route & Component:** Styling — [`Dashboard.css:1-1699`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.css#L1-L1699)
- **Reproduction / Evidence:** Over 1,600 lines of CSS in `Dashboard.css` target classes that do not exist in `Dashboard.tsx` (`.dashboard-initialization-workspace`, `.dashboard-grid-layout`, etc.).
- **Expected Behavior:** `Dashboard.css` should only contain styles for active elements in `Dashboard.tsx`.
- **Recommended Fix:** Purge dead CSS selectors and split `Dashboard.css` into modular stylesheets.
- **Likely Shared Root Cause:** Dashboard rewritten without trimming old styles.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.7**

#### `ISSUE-CSS-002`
- **Severity:** P2
- **Route & Component:** Styling — [`WorkspaceContextBanner.css:4`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/WorkspaceContextBanner.css#L4)
- **Reproduction / Evidence:** Contains invalid CSS property `justifyContent: space-between;` (camelCase React inline style syntax in raw CSS file).
- **Expected Behavior:** Valid CSS syntax `justify-content: space-between;`.
- **Recommended Fix:** Change `justifyContent` to `justify-content`.
- **Likely Shared Root Cause:** Typo during CSS authoring.
- **Regression Risk:** Zero.
- **Suggested Release:** **V1.4.6**

#### `ISSUE-DATA-004`
- **Severity:** P2
- **Route & Component:** `/dashboard` — [`Dashboard.tsx:417-450`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L417-L450)
- **Reproduction / Evidence:** When no dataset is selected, "Recent Sessions" shows hardcoded fake items ("Completed 2h ago", "Completed Yesterday").
- **Expected Behavior:** Display authentic user upload history from `localStorage` or an honest "Sample Datasets" card.
- **Recommended Fix:** Connect Recent Sessions to `localStorage` dataset cache or rename section to "Quick Start Presets".
- **Likely Shared Root Cause:** Static mock UI.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.7**

#### `ISSUE-ROUT-001`
- **Severity:** P2
- **Route & Component:** Architecture — [`App.tsx:34-48`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/App.tsx#L34-L48)
- **Reproduction / Evidence:** No URL routing or HTML5 History API integration; page refresh resets to dashboard and breaks browser back/forward navigation.
- **Expected Behavior:** URL hash or path reflects active view and dataset (`#/workspace/analytics?dataset=...`).
- **Recommended Fix:** Introduce lightweight hash router or standard router integration in V1.4.8.
- **Likely Shared Root Cause:** State-driven prototype evolved into full application.
- **Regression Risk:** Moderate.
- **Suggested Release:** **V1.4.8**

#### `ISSUE-A11Y-003`
- **Severity:** P2
- **Route & Component:** Global Styling — [`index.css:12, 69`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/index.css#L12)
- **Reproduction / Evidence:** `--text-muted: #A8A29E` on `--bg-color: #FAF8F5` yields 2.82:1 contrast ratio, failing WCAG AA.
- **Expected Behavior:** Contrast ratio must be at least 4.5:1.
- **Recommended Fix:** Darken light mode `--text-muted` to `#78716C` (4.6:1 ratio).
- **Likely Shared Root Cause:** Low-contrast muted color chosen for subtle aesthetic.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.7**

#### `ISSUE-A11Y-004`
- **Severity:** P2
- **Route & Component:** Workspace Shell — [`WorkspaceContextBanner.css:104`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/WorkspaceContextBanner.css#L104), [`Sidebar.css:71`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Sidebar.css#L71)
- **Reproduction / Evidence:** Dimension removal button is 12×12px; sidebar toggle is 24×24px; violates 44×44px touch target guidelines.
- **Expected Behavior:** Interactive touch targets must meet at least 44×44px via padding or touch bounding boxes.
- **Recommended Fix:** Expand clickable hit areas using `::after` pseudo-elements or min-height/width properties.
- **Likely Shared Root Cause:** Desktop mouse-centric styling.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.7**

---

### P3 — Minor Polish & Non-Blocking Improvements

#### `ISSUE-RERENDER-001`
- **Severity:** P3
- **Route & Component:** Layout — [`Hero.tsx:13-24`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Hero.tsx#L13-L24)
- **Reproduction / Evidence:** `setInterval(1000)` causes continuous re-rendering of `Hero.tsx`.
- **Expected Behavior:** Real-time clock should be isolated to a dedicated sub-component.
- **Recommended Fix:** Extract `SystemClock` into a memoized leaf component.
- **Likely Shared Root Cause:** Direct placement of timer hook in parent bar.
- **Regression Risk:** Zero.
- **Suggested Release:** **V1.4.8**

#### `ISSUE-DATA-005`
- **Severity:** P3
- **Route & Component:** Documentation — [`README.md:7`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/README.md#L7)
- **Reproduction / Evidence:** README badge displays "142/142 Passing", but pytest collects and runs 132 tests.
- **Expected Behavior:** Documentation badge accurately reflects actual test suite count.
- **Recommended Fix:** Update badge to "132/132 Passing (100%)".
- **Likely Shared Root Cause:** Outdated documentation badge after test refactoring.
- **Regression Risk:** Zero.
- **Suggested Release:** **V1.4.6**

#### `ISSUE-TYPO-001`
- **Severity:** P3
- **Route & Component:** Typography — `index.css`, `Dashboard.css`
- **Reproduction / Evidence:** Inconsistent font family declarations and `!important` tags between `Space Grotesk` and `Manrope`.
- **Expected Behavior:** Clean typographic scale using CSS variables without `!important` overrides.
- **Recommended Fix:** Normalize heading scale in `index.css`.
- **Likely Shared Root Cause:** Ad-hoc typography overrides.
- **Regression Risk:** Low.
- **Suggested Release:** **V1.4.7**

#### `ISSUE-A11Y-005`
- **Severity:** P3
- **Route & Component:** Accessibility — [`Dashboard.tsx:881`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Dashboard.tsx#L881), [`Diagnostics.tsx:100`](file:///c:/Users/kayus/OneDrive/Desktop/ProJeeCt/frontend-react/src/components/Diagnostics.tsx#L100)
- **Reproduction / Evidence:** Streaming activity logs do not declare `aria-live="polite"`.
- **Expected Behavior:** Screen readers are alerted to log status updates when focused.
- **Recommended Fix:** Add `aria-live="polite"` and `role="log"` to console stream containers.
- **Likely Shared Root Cause:** Omission during console development.
- **Regression Risk:** Zero.
- **Suggested Release:** **V1.4.8**

---

## 9. Recommended V1.4.6–V1.4.8 Implementation Sequence

```
  ┌─────────────────────────────────────────────────────────────┐
  │                           V1.4.6                            │
  │    Critical Layout, Responsive Foundations & Hygiene        │
  │  • Fix 4 ESLint errors & 2 warnings                         │
  │  • Mobile off-canvas drawer & responsive Sidebar            │
  │  • Responsive grid stacking for Dashboard (< 900px, < 600px)│
  │  • Fix P0 hardcoded Correlation Matrix & Feature Weights    │
  │  • Remove 4 orphaned dead components & fix CSS syntax typo  │
  │  • Restore :focus-visible accessibility baseline            │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                           V1.4.7                            │
  │   Dashboard Data Grounding, Tokens & Modal Architecture     │
  │  • Eliminate fabricated fallback counts (14, 13, 94, 91)    │
  │  • Unify Investigation Modal state with WorkspaceContext    │
  │  • Consolidate color tokens (purge rogue blue/cyan)         │
  │  • Purge 1,600+ lines of dead CSS from Dashboard.css        │
  │  • Accessible Dialog semantics & Escape key on modal        │
  │  • Touch target expansion to 44×44px                        │
  │  • Connect Recent Sessions to genuine localStorage history  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                           V1.4.8                            │
  │       Performance Splitting, a11y & PDF Hardening           │
  │  • React.lazy() code-splitting (< 350 kB entry bundle)      │
  │  • HTML5 Hash/History routing for deep-linking              │
  │  • High-reliability vector PDF export pipeline              │
  │  • Screen-reader aria-live regions on streaming logs        │
  │  • Sub-component timer isolation (Hero clock)               │
  │  • WCAG 2.1 AA full contrast certification                  │
  └─────────────────────────────────────────────────────────────┘
```

### Detailed Phase Specifications

#### Phase 1: InsightGrid V1.4.6 — Critical Layout, Responsive Foundations & Hygiene
- **Primary Goal:** Eliminate blocking build errors, resolve layout collapse on mobile/tablet viewports, restore keyboard focusability, and ground the most egregious hardcoded data in the dashboard.
- **Scope of Changes:**
  - Resolve all 4 ESLint errors and 2 warnings (`App.tsx`, `Dashboard.tsx`, `Diagnostics.tsx`, `WorkspaceContext.tsx`).
  - Add mobile drawer navigation with toggle button in `Sidebar.tsx` / `Sidebar.css` for viewports < 768px.
  - Implement responsive media queries in `Dashboard.css` for `.dashboard-top-section`, `.hero-stats-grid`, `.split-layout`, and `.tables-grid-layout`.
  - Fix `Dashboard.tsx:1664` to render real Pearson correlation values from `activeDataset.analyticsData.correlation_matrix`.
  - Fix `Dashboard.tsx:168` to read real feature importances from `activeDataset.mlResult.feature_importance`.
  - Delete 4 dead component files (`UploadSection`, `AIInsightsBubble`, `DataProcessing`, `AIInsights`).
  - Fix `justifyContent` typo in `WorkspaceContextBanner.css:4`.
  - Restore `:focus-visible` styling in `index.css`.
- **Measurable Acceptance Criteria:**
  - `npm run lint` passes with 0 errors and 0 warnings.
  - `npm run build` succeeds cleanly.
  - Application displays without horizontal scrolling on 320px, 375px, and 768px viewports.
  - Uploading any non-student dataset (e.g. `healthcare_risk.csv`) displays authentic healthcare column names in the dashboard correlation table.

#### Phase 2: InsightGrid V1.4.7 — Dashboard Data Grounding, Tokens & Modal Architecture
- **Primary Goal:** Eradicate all remaining synthetic metrics, unify the visual identity around the restrained baseline, consolidate investigation state, and clean dead stylesheet bloat.
- **Scope of Changes:**
  - Replace hardcoded metric fallbacks (`|| 14`, `|| 13`, `|| 94`, `|| 91`) in `Dashboard.tsx` with honest empty/zero states.
  - Bind `activeInvestigationModal` directly to `useWorkspace()` to ensure cross-tab continuity.
  - Replace rogue blue/cyan instances (`#3b82f6`, `.text-cyan`, `.active-cyan`) with semantic design tokens.
  - Purge orphaned selector blocks from `Dashboard.css` (reducing file size by > 40%).
  - Implement accessible modal dialog attributes (`role="dialog"`, `aria-modal="true"`, focus trap, and `Escape` key close).
  - Expand touch targets on dimension chips and removal buttons to 44×44px.
  - Replace fake "Recent Sessions" cards with authentic local history.
- **Measurable Acceptance Criteria:**
  - Zero hardcoded fallback numbers present in the entire `Dashboard.tsx` file.
  - An investigation started on the Dashboard preserves its full decomposition tree when navigating to Analytics and returning.
  - Zero instances of undefined `.text-cyan` class in the codebase.
  - Modal can be opened, navigated, and closed entirely via keyboard (`Tab`, `Enter`, `Escape`).

#### Phase 3: InsightGrid V1.4.8 — Performance Splitting, a11y & PDF Hardening
- **Primary Goal:** Optimize production delivery through route-level code-splitting, harden report export, and complete WCAG 2.1 AA accessibility.
- **Scope of Changes:**
  - Implement `React.lazy()` for all views, reducing `index.js` below 350 kB.
  - Implement lightweight client-side URL routing (`#/overview`, `#/analytics`, `#/predictions`, etc.).
  - Refactor PDF generation in `App.tsx` and `IntelligenceReport.tsx` to detect chart render completion reliably rather than using a fragile 1200ms `setTimeout`.
  - Isolate `Hero.tsx` clock into a memoized leaf component.
  - Add `aria-live="polite"` regions to streaming activity consoles in Dashboard and Diagnostics.
  - Final WCAG AA color contrast adjustments on muted text tokens.
- **Measurable Acceptance Criteria:**
  - Production initial bundle size < 350 kB (gzipped < 100 kB).
  - Direct URL navigation and browser back/forward buttons work across all 7 views.
  - PDF generation completes cleanly without blank charts on throttled CPU test profiles.
  - 100% WCAG 2.1 AA contrast compliance on all text elements.

---

## 10. Explicitly Untested Areas and Unresolved Questions

### Explicitly Untested Areas (Runtime Tooling Limitation)
1. **Interactive Touch Events on Physical Devices:**
   Touch interaction, inertia scrolling, and pinch-zoom behavior on physical iOS Safari and Android Chrome devices could not be verified in this environment.
2. **Real-time Live WebSocket / Stream Degradation:**
   Long-running pipeline execution over throttled network conditions (e.g., 3G network profiles) was inspected via code logic but not measured over real packet latency.
3. **High-DPI Canvas Memory Footprint:**
   Peak GPU and canvas memory utilization during `html2canvas` 2× resolution rendering on large tabular datasets (1,000+ rows) was not profiled in a headless browser.

### Unresolved Design & Product Questions
1. **Workspace vs Product Landing Strategy:**
   Should the cinematic landing experience (`viewMode: 'product'`) be served on a distinct root route (e.g. `/`) while the workspace resides under `/app` or `/workspace`?
2. **Deep-Linking & Dataset Persistence:**
   Should active datasets be addressable via URL query parameters (e.g. `?dataset=<id>`), requiring persistent backend session storage or indexedDB caching?
3. **Correlation Matrix Presentation for High-Dimensional Datasets:**
   When a dataset contains 50+ continuous columns, how should the correlation matrix behave? Should it display a top-10 most correlated subset or provide an interactive column search filter?
4. **Report Export Format Preference:**
   Should V1.4.8 prioritize client-side vector PDF generation or introduce a backend FastAPI PDF/HTML rendering endpoint using headless Chromium/WeasyPrint for superior rendering fidelity?

---

*End of InsightGrid V1.4.5 UI/UX Audit & Design Foundations Report.*
