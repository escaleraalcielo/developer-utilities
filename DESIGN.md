# Dev Utils - Design Tokens

Machine-readable design specification for AI consistency.

## Colors

### Primary Palette
- `--bg-color`: #0f172a (navy dark background)
- `--card-bg`: rgba(30, 41, 59, 0.7) (surface/card, glassmorphic)
- `--text-primary`: #f8fafc (headings, primary text)
- `--text-secondary`: #94a3b8 (body, labels)
- `--accent-color`: #38bdf8 (sky blue primary accent)
- `--accent-hover`: #0ea5e9 (accent hover state)
- `--border-color`: rgba(148, 163, 184, 0.1) (subtle borders)

### Semantic Colors
- Success: #10b981 (green)
- Error: #ef4444 (red)
- Warning: #f59e0b (amber)
- Info: #0ea5e9 (sky blue)
- Text Disabled: #64748b

### Gradients
- Primary gradient: `linear-gradient(135deg, #38bdf8, #818cf8)` — buttons, highlights
- Text gradient: `linear-gradient(to right, #38bdf8, #818cf8)` with `background-clip: text`
- Success gradient: `linear-gradient(135deg, #10b981, #059669)`

### Background Effects
- Base: radial-gradient overlays at 0% 0%, 50% 0%, 100% 0% (hsla values)
- Glass shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`

## Typography

### Font Families
- Primary: `'Inter', system-ui, -apple-system, sans-serif`
- Monospace: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`

### Type Scale
- H1: 32px, 700 weight, 1.2 line-height, letter-spacing -0.025em
- H2: 24px, 600 weight, 1.3 line-height, letter-spacing -0.025em
- H3: 20px, 600 weight, 1.3 line-height
- Body: 16px, 400 weight, 1.5 line-height
- Body Small: 14px, 400 weight, 1.4 line-height
- Caption: 12px, 400 weight, 1.4 line-height

### Font Weights
- 400: regular
- 500: medium
- 600: semibold
- 700: bold

## Spacing & Layout

### Base Unit
- 8px

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 20px
- 2xl: 24px
- 3xl: 32px
- 4xl: 48px

### Layout
- Container max-width: 1200px
- Container padding: 4rem (64px)
- Grid gap: 1rem (16px)
- Section gap: 2rem (32px)

### Breakpoints
- sm: 576px
- md: 768px
- lg: 992px
- xl: 1200px

## Components

### Glass Panel
```css
background: rgba(30, 41, 59, 0.7);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(148, 163, 184, 0.1);
border-radius: 1rem;
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
padding: 1.5rem;
```

### Button Primary
```css
background: linear-gradient(135deg, #38bdf8, #6366f1);
border: none;
border-radius: 0.5rem;
padding: 0.75rem 1.5rem;
font-weight: 600;
transition: all 0.3s ease;
/* Hover */
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
```

### Button Secondary / Outline
```css
background: transparent;
border: 1px solid rgba(148, 163, 184, 0.2);
border-radius: 0.5rem;
color: #94a3b8;
/* Hover */
background: rgba(148, 163, 184, 0.1);
border-color: #f8fafc;
color: #f8fafc;
```

### Form Inputs
```css
background: rgba(15, 23, 42, 0.6);
border: 1px solid rgba(148, 163, 184, 0.1);
border-radius: 0.375rem;
color: #f8fafc;
padding: 0.75rem;
/* Focus */
border-color: #38bdf8;
box-shadow: 0 0 0 0.25rem rgba(56, 189, 248, 0.25);
background: rgba(15, 23, 42, 0.8);
/* Placeholder */
color: rgba(203, 213, 225, 0.6);
```

### Tool Cards
```css
background: rgba(30, 41, 59, 0.5);
border: 1px solid rgba(148, 163, 184, 0.1);
border-radius: 1rem;
padding: 1.5rem;
transition: all 0.3s ease;
/* Hover */
transform: translateY(-4px);
border-color: rgba(56, 189, 248, 0.3);
box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
```

### Global Navigation Button
```css
background: rgba(30, 41, 59, 0.7);
backdrop-filter: blur(8px);
border: 1px solid rgba(148, 163, 184, 0.1);
color: #f8fafc;
width: 48px;
height: 48px;
border-radius: 50%;
transition: all 0.3s ease;
/* Hover/Active */
background: #38bdf8;
color: white;
transform: rotate(90deg);
```

### Navigation Dropdown
```css
background: rgba(15, 23, 42, 0.95);
backdrop-filter: blur(12px);
border: 1px solid rgba(148, 163, 184, 0.1);
border-radius: 1rem;
padding: 0.5rem;
box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
min-width: 200px;
```

### History Table
```css
background: transparent;
border: 1px solid rgba(148, 163, 184, 0.1);
color: #94a3b8;
/* Row hover */
background: rgba(255, 255, 255, 0.05);
/* Striped */
background: rgba(255, 255, 255, 0.02);
```

### Scrollbar
```css
width: 8px;
height: 8px;
track-background: rgba(15, 23, 42, 0.5);
thumb-background: #475569;
thumb-border-radius: 4px;
thumb-hover: #64748b;
```

## Design Voice

- Theme: Dark-first glassmorphic with layered transparency
- Accessibility: WCAG 2.1 AA contrast ratios; focus-visible on all interactives
- Tone: Developer-focused, functional, minimal chrome
- Animations: 200-300ms transitions, hover lifts (translateY), no distracting motion
- Icons: Bootstrap Icons 1.11.1, line style
- Effects: Glassmorphism (backdrop-filter blur), gradient text highlights
- Security: "All processing happens locally" messaging
