# LawG v1.31 — Lawgraph Visualization ⚖️

> **Roe v. Wade (1973) → Dobbs v. Jackson Women's Health Organization (2022)**  
> Interactive Legal Battle Visualization with Crossing Graph Animation

[![Version](https://img.shields.io/badge/Version-1.31-blue)](.)
[![TypeScript](https://img.shields.io/badge/TypeScript-Compiled-3178C6)](.)
[![Security](https://img.shields.io/badge/Security-Passed-4CAF50)](.)

---

## 📖 Overview

An interactive Canvas-based visualization of two landmark Supreme Court cases:

1. **Stage 1: Roe v. Wade (1973)** — X(Blue/Plaintiff) wins 7-2  
2. **Stage 2: Dobbs v. Jackson (2022)** — X/Y positions & colors swap, X(Pink/↑Up) wins 6-3 (overrules Roe)

The graphs **cross each other** dynamically, with angles and lengths proportional to the number of justices and strength of their arguments.

---

## ✅ Completed Features (v1.31)

### Core Visualization
- **Crossing X/Y Graph Pattern**: Two graph vectors extend through origin point, crossing each other
- **Dynamic Angles & Lengths**: Proportional to justice count and argument strength
- **Two-Stage Continuous Animation**: 1-click plays Stage 1 → Transition → Stage 2

### v1.31 New Features
- **🆕 Initial Preview Screen**: Shows Stage 2 (Dobbs) final result statically on page load
- **🆕 Play from Stage 1**: Pressing Play starts from Roe v. Wade and runs through to Dobbs
- **🆕 Position Swap in Stage 2**: X graph moves UP (↑), Y graph moves DOWN (↓)
- **🆕 Color Swap**: Stage 1: X=Blue, Y=Pink → Stage 2: X=Pink, Y=Blue
- **🆕 Black Arc Arrow Points UP**: Arrow points toward X(Pink/Plaintiff) winner in Stage 2
- **🆕 Ground Truth on X(Pink)**: Winner marked on the upward-pointing X graph

### Animation & Interaction
- **Smooth Transition**: Color + position swap animation between stages (3s)
- **Black Arc with Arrow**: Connects crossing graphs, arrow points to winner
- **Excel-style Yellow Balloon Tooltips**: Hover for case details
- **Click for Detail Modal**: Full argument details with Oyez.org links
- **Progress Bar**: Shows Roe → Dobbs timeline with color gradient

### UI Elements
- **Null Hypothesis (H₀)** / **Alternative Hypothesis (H₁)** axis labels
- **Ground Truth** marking on winning graph
- **Stage Indicator** dots (Stage 1 / Stage 2)
- **Preview Badge**: "Press Play to start animation from Stage 1"
- **Responsive Design**: Works on desktop and mobile

---

## 📁 File Structure

```
index.html          → Main HTML page (v1.31)
css/
  └── style.css     → Stylesheet (v1.31)
js/
  └── lawgraph.js   → Visualization engine (v1.31)
README.md           → This file
```

---

## 🔗 Entry Points

| Path | Description |
|------|-------------|
| `index.html` | Main application entry — shows Dobbs final result, Play for full animation |

---

## 🎮 How to Use

1. **Page Load** → Stage 2 (Dobbs) final result is shown statically (X=Pink wins 6-3)
2. **Click "Play Animation"** → Animation starts from Stage 1 (Roe v. Wade)
3. **Stage 1 plays** → X(Blue) vs Y(Pink), X wins 7-2
4. **Transition** → Colors swap + positions swap (3 seconds)
5. **Stage 2 plays** → X(Pink, ↑Up) vs Y(Blue, ↓Down), X(Pink) wins 6-3
6. **Final** → Ground Truth shown on X(Pink), arc arrow points UP
7. **Click "Reset"** → Returns to preview state (Dobbs final)

---

## 🔄 v1.31 Changes from v1.1

| Feature | v1.1 | v1.31 |
|---------|------|-------|
| Initial screen | Empty canvas | Stage 2 (Dobbs) final result preview |
| Play behavior | Starts Stage 1 | Starts Stage 1 (same) |
| Stage 2 position | Same as Stage 1 | X/Y positions SWAPPED |
| Stage 2 X direction | Bottom-right | **Top (↑Up)** |
| Stage 2 Y direction | Top-left | **Bottom (↓Down)** |
| Arc arrow | Points to winner | Points **UP** to X(Pink) |
| Stage 2 colors | X=Pink, Y=Blue | X=Pink, Y=Blue (same) |
| Reset behavior | Empty canvas | Returns to Dobbs preview |

---

## 🔒 Security & Compliance Check

- ✅ **No personal data collected or stored**
- ✅ **No external API calls** (all data is embedded)
- ✅ **No authentication required**
- ✅ **No file upload/download operations**
- ✅ **No payment processing**
- ✅ **CORS-safe**: Uses only CDN resources (Google Fonts, Font Awesome)
- ✅ **XSS Protected**: All dynamic text uses `escapeHtml()` sanitization
- ✅ **No cookies or local storage**

---

## 📚 References

- [Roe v. Wade — Oyez.org](https://www.oyez.org/cases/1971/70-18)
- [Dobbs v. Jackson — Oyez.org](https://www.oyez.org/cases/2021/19-1392)

---

## 🚀 Next Steps for Development

1. **v1.4**: Add more Supreme Court case pairs (e.g., Brown v. Board of Education)
2. **Export**: PNG/SVG export of final visualization state
3. **Accessibility**: Screen reader support, keyboard navigation
4. **i18n**: Multi-language support (Korean, Japanese, etc.)
5. **Data-driven**: Load case data from external JSON files

---

*LawG v1.31 — Lawgraph Visualization System*  
*Built: 2026-02-13 | TypeScript Compiled*
