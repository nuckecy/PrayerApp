# PrayerApp Design System Documentation

## Overview

A comprehensive Vercel/Stripe-inspired design system for PrayerApp, featuring a minimal, professional aesthetic with a monochromatic color palette and strategic accent colors.

## Design Philosophy

- **Minimalist**: Clean interfaces with generous whitespace
- **Monochromatic**: Grayscale foundation with strategic color accents
- **Professional**: Subtle interactions and refined typography
- **Accessible**: WCAG 2.1 AA compliant with proper contrast ratios
- **Responsive**: Mobile-first design that scales beautifully

## Color System

### Grayscale Palette

| Name | Light Mode | Dark Mode | Usage |
|------|------------|-----------|--------|
| gray-50 | #FAFAFA | #0A0A0A | Subtle backgrounds |
| gray-100 | #F5F5F5 | #141414 | Secondary backgrounds |
| gray-200 | #EBEBEB | #1E1E1E | Borders, dividers |
| gray-300 | #E0E0E0 | #292929 | Disabled states |
| gray-400 | #BDBDBD | #434343 | Placeholder text |
| gray-500 | #9E9E9E | #636363 | Secondary text |
| gray-600 | #757575 | #898989 | Icons, captions |
| gray-700 | #525252 | #AFAFAF | Body text |
| gray-800 | #262626 | #DBDBDB | Headings |
| gray-900 | #171717 | #EEEEEE | Primary text |
| gray-950 | #0A0A0A | #F5F5F5 | High contrast |

### Accent Colors

| Color | Hex | Usage |
|-------|-----|--------|
| Success | #16A34A | Positive actions, confirmations |
| Warning | #F59E0B | Alerts, important notices |
| Destructive | #EF4444 | Errors, destructive actions |
| Info | #0EA5E9 | Information, tips |

## Typography Scale

```css
/* Font Family */
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Type Scale */
text-xs:    0.75rem  (12px)
text-sm:    0.875rem (14px)
text-base:  1rem     (16px)
text-lg:    1.125rem (18px)
text-xl:    1.25rem  (20px)
text-2xl:   1.5rem   (24px)
text-3xl:   1.875rem (30px)
text-4xl:   2.25rem  (36px)
text-5xl:   3rem     (48px)

/* Font Weights */
font-normal:   400
font-medium:   500
font-semibold: 600
font-bold:     700

/* Line Heights */
leading-tight:   1.25
leading-snug:    1.375
leading-normal:  1.5
leading-relaxed: 1.625
leading-loose:   2
```

## Spacing System

```css
/* Base unit: 0.25rem (4px) */
0:    0
px:   1px
0.5:  0.125rem (2px)
1:    0.25rem  (4px)
1.5:  0.375rem (6px)
2:    0.5rem   (8px)
2.5:  0.625rem (10px)
3:    0.75rem  (12px)
4:    1rem     (16px)
5:    1.25rem  (20px)
6:    1.5rem   (24px)
8:    2rem     (32px)
10:   2.5rem   (40px)
12:   3rem     (48px)
16:   4rem     (64px)
20:   5rem     (80px)
24:   6rem     (96px)
```

## Border Radius

```css
rounded-none: 0
rounded-sm:   0.25rem  (4px)
rounded:      0.375rem (6px)
rounded-md:   0.5rem   (8px)
rounded-lg:   0.625rem (10px)
rounded-xl:   0.75rem  (12px)
rounded-2xl:  1rem     (16px)
rounded-3xl:  1.5rem   (24px)
rounded-full: 9999px
```

## Shadow System

### Light Mode Shadows

```css
shadow-xs:  0 1px 2px 0 rgba(0, 0, 0, 0.05)
shadow-sm:  0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.08)
shadow:     0 2px 8px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.08)
shadow-md:  0 4px 12px 0 rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.08)
shadow-lg:  0 8px 16px 0 rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.08)
shadow-xl:  0 12px 24px 0 rgba(0, 0, 0, 0.1), 0 8px 8px -4px rgba(0, 0, 0, 0.08)
shadow-2xl: 0 24px 48px 0 rgba(0, 0, 0, 0.12), 0 12px 16px -8px rgba(0, 0, 0, 0.08)
```

### Dark Mode Glow Effects

```css
glow-sm: 0 0 16px rgba(255, 255, 255, 0.03)
glow:    0 0 24px rgba(255, 255, 255, 0.05)
glow-lg: 0 0 32px rgba(255, 255, 255, 0.08)
```

## Component Usage

### Buttons

```jsx
// Primary Button (filled)
<button className="btn-primary">Create Prayer</button>

// Secondary Button (outline)
<button className="btn-secondary">View All</button>

// Ghost Button (minimal)
<button className="btn-ghost">Cancel</button>

// Destructive Button (danger)
<button className="btn-destructive">Delete</button>

// Button with icon
<button className="btn-primary">
  <PlusIcon className="w-4 h-4 mr-2" />
  Add Prayer
</button>

// Button sizes
<button className="btn-primary text-xs px-3 py-1.5">Extra Small</button>
<button className="btn-primary text-sm px-4 py-2">Small</button>
<button className="btn-primary text-base px-5 py-2.5">Medium</button>
<button className="btn-primary text-lg px-6 py-3">Large</button>
```

### Cards

```jsx
// Default Card (with border)
<div className="card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>

// Elevated Card (with shadow)
<div className="card-elevated">
  <h3>Elevated Card</h3>
  <p>This card has shadow elevation</p>
</div>

// Interactive Card (clickable)
<div className="card-interactive" onClick={handleClick}>
  <h3>Click Me</h3>
  <p>This card has hover and active states</p>
</div>
```

### Form Inputs

```jsx
// Basic Input
<div className="form-group">
  <label htmlFor="email" className="input-label">
    Email Address
  </label>
  <input
    type="email"
    id="email"
    className="input"
    placeholder="you@example.com"
  />
  <p className="input-help">
    We'll never share your email
  </p>
</div>

// Input with Error
<div className="form-group">
  <label htmlFor="password" className="input-label">
    Password
  </label>
  <input
    type="password"
    id="password"
    className="input input-error"
    placeholder="Enter password"
  />
  <p className="input-error-text">
    Password is required
  </p>
</div>

// Textarea
<div className="form-group">
  <label htmlFor="prayer" className="input-label">
    Prayer Content
  </label>
  <textarea
    id="prayer"
    className="input min-h-[120px] resize-none"
    placeholder="Write your prayer..."
  />
</div>
```

### Badges

```jsx
// Status Badges
<span className="badge badge-default">Default</span>
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-destructive">Error</span>
<span className="badge badge-info">Info</span>

// Custom sizes
<span className="badge badge-success text-sm px-3 py-1">
  Active Streak: 7 days
</span>
```

### Alerts

```jsx
// Success Alert
<div className="alert alert-success">
  <div className="flex gap-3">
    <CheckCircleIcon className="w-5 h-5" />
    <div>
      <h4 className="font-medium">Success!</h4>
      <p className="text-sm opacity-90 mt-1">
        Your prayer has been saved.
      </p>
    </div>
  </div>
</div>

// Error Alert
<div className="alert alert-destructive">
  <div className="flex gap-3">
    <XCircleIcon className="w-5 h-5" />
    <div>
      <h4 className="font-medium">Error</h4>
      <p className="text-sm opacity-90 mt-1">
        Something went wrong. Please try again.
      </p>
    </div>
  </div>
</div>
```

### Dialog/Modal

```jsx
// Modal Structure
{isOpen && (
  <>
    {/* Overlay */}
    <div className="dialog-overlay" onClick={onClose} />

    {/* Content */}
    <div className="dialog-content">
      <div className="dialog-header">
        <h2 className="text-lg font-semibold">Modal Title</h2>
        <p className="text-sm text-muted-foreground">
          Modal description
        </p>
      </div>

      <div className="py-4">
        {/* Modal body content */}
      </div>

      <div className="dialog-footer">
        <button className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  </>
)}
```

### Navigation

```jsx
// Sidebar Navigation
<nav className="space-y-1">
  <a href="#" className="nav-item nav-item-active">
    <HomeIcon className="w-5 h-5" />
    <span>Dashboard</span>
  </a>
  <a href="#" className="nav-item">
    <BookOpenIcon className="w-5 h-5" />
    <span>Prayer Journal</span>
  </a>
  <a href="#" className="nav-item">
    <UsersIcon className="w-5 h-5" />
    <span>Prayer Groups</span>
  </a>
</nav>
```

## Animation Guidelines

### Timing Functions

```css
/* Smooth transitions */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce effect */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Custom easing */
ease-out: cubic-bezier(0, 0, 0.2, 1)
ease-in:  cubic-bezier(0.4, 0, 1, 1)
```

### Animation Durations

```css
duration-75:  75ms   /* Micro-interactions */
duration-100: 100ms  /* Quick transitions */
duration-150: 150ms  /* Standard transitions */
duration-200: 200ms  /* Default animations */
duration-300: 300ms  /* Slide animations */
duration-500: 500ms  /* Complex animations */
duration-700: 700ms  /* Page transitions */
```

### Common Animations

```css
/* Fade */
.animate-fade-in  /* 200ms ease-out */
.animate-fade-out /* 150ms ease-in */

/* Scale */
.animate-scale-in  /* 200ms spring */
.animate-scale-out /* 150ms spring */

/* Slide */
.animate-slide-in-from-top    /* 300ms spring */
.animate-slide-in-from-bottom  /* 300ms spring */
.animate-slide-in-from-left   /* 300ms spring */
.animate-slide-in-from-right  /* 300ms spring */

/* Loading */
.loading-dots /* Pulsing dots animation */
.shimmer     /* Loading shimmer effect */
.skeleton    /* Skeleton loader pulse */
```

## Utility Classes

### Glass Morphism

```jsx
// Glass effects for overlays
<div className="glass">Standard glass effect</div>
<div className="glass-subtle">Subtle glass effect</div>
<div className="glass-strong">Strong glass effect</div>
```

### Gradients

```jsx
// Background gradients
<div className="gradient-primary">Primary gradient</div>
<div className="gradient-subtle">Subtle gradient</div>
<div className="gradient-radial">Radial gradient</div>

// Text gradient
<h1 className="text-gradient">Gradient Text</h1>
```

### Interactive Effects

```jsx
// Hover lift effect
<div className="hover-lift">Card with lift on hover</div>

// Focus ring
<button className="focus-ring">Focusable element</button>

// Shimmer loading
<div className="card shimmer">Loading content...</div>
```

### Layout Helpers

```jsx
// Divider
<div className="divider" />

// Scrollbar
<div className="scrollbar-thin overflow-auto">
  Scrollable content with custom scrollbar
</div>
```

## Best Practices

1. **Color Usage**
   - Use grayscale for 90% of the interface
   - Reserve colors for important actions and states
   - Maintain consistent color meaning across the app

2. **Typography**
   - Use Inter font for all text
   - Maintain clear hierarchy with font sizes and weights
   - Keep line lengths between 45-75 characters for readability

3. **Spacing**
   - Use consistent spacing units (4px base)
   - Apply generous whitespace for clarity
   - Group related elements with proximity

4. **Shadows**
   - Use subtle shadows for depth
   - Apply elevation consistently based on component importance
   - Use glow effects sparingly in dark mode

5. **Animations**
   - Keep animations fast and subtle (150-300ms)
   - Use ease-out for entrances, ease-in for exits
   - Provide immediate feedback for user interactions

6. **Accessibility**
   - Ensure color contrast meets WCAG AA standards
   - Provide focus indicators for all interactive elements
   - Include proper ARIA labels and roles
   - Support keyboard navigation throughout

## Implementation Checklist

- [ ] Import Inter font from Google Fonts
- [ ] Update `globals.css` with new design system
- [ ] Configure Tailwind with custom theme extensions
- [ ] Replace existing components with new design system classes
- [ ] Test in both light and dark modes
- [ ] Verify accessibility compliance
- [ ] Test responsive behavior on all screen sizes
- [ ] Optimize animation performance
- [ ] Document any custom modifications