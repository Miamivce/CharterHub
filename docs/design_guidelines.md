# Design Guidelines

## Brand Colors
- **Primary**: #fdba6c (Orange)
- **Secondary**: #000029 (Navy)
- **Accent**: #22C55E (Green)
- **Background**: #F8FAFC (Light Gray)
- **Text**: 
  - Primary: #1E293B
  - Secondary: #64748B
  - Light: #F1F5F9

## Typography
- **Primary Font**: Inter
- **Secondary Font**: Montserrat
- **Heading Sizes**:
  - H1: 2.5rem (40px)
  - H2: 2rem (32px)
  - H3: 1.5rem (24px)
  - H4: 1.25rem (20px)
- **Body Text**: 1rem (16px)
- **Small Text**: 0.875rem (14px)

## Spacing
- **Base Unit**: 4px
- **Common Spacing**:
  - xs: 4px
  - sm: 8px
  - md: 16px
  - lg: 24px
  - xl: 32px
  - 2xl: 48px

## Components

### Buttons
- **Primary**: Solid background, white text
- **Secondary**: Outlined, colored text
- **Text**: No background, colored text
- **States**:
  - Hover: Darken background
  - Active: Further darken
  - Disabled: 50% opacity

### Cards
- White background
- Subtle shadow
- Rounded corners (8px)
- Padding: 24px

### Forms
- **Input Height**: 40px
- **Border Radius**: 6px
- **States**:
  - Focus: Primary color outline
  - Error: Red border
  - Success: Green border
- **Labels**: 
  - Font: Inter
  - Size: 14px
  - Weight: Medium
  - Color: Text Primary

### Tabs
- **Container**:
  - Background: Light gray (gray-100)
  - Border Radius: 8px
  - Padding: 4px
- **Tab Items**:
  - Padding: 8px 16px
  - Border Radius: 6px
  - Font Weight: Medium
  - Transitions: 150ms color
- **Active Tab**:
  - Background: White
  - Shadow: Small
- **Inactive Tab**:
  - Color: Gray 600
  - Hover: Primary color

### Split Screen Layout
- **Left Panel**:
  - Width: 50% (on desktop)
  - Background: White
  - Padding: 32px
  - Content Max Width: 448px
  - Centered content
- **Right Panel**:
  - Width: 50% (on desktop)
  - Hidden on mobile
  - Background Image: Full cover
  - Overlay: Navy (#000029) at 40% opacity
  - Text Color: White
  - Content Padding: 48px

## Layout
- **Max Content Width**: 1280px
- **Grid System**: 12 columns
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

## Icons
- **Library**: Heroicons
- **Sizes**:
  - Small: 16px
  - Medium: 20px
  - Large: 24px

## Animation
- **Duration**: 
  - Fast: 150ms
  - Normal: 300ms
  - Slow: 500ms
- **Easing**: ease-in-out

## Accessibility
- **Minimum Contrast Ratio**: 4.5:1
- **Focus States**: Visible outlines
- **Interactive Elements**: 
  - Minimum size: 44x44px
  - Clear hover/focus states

## Images
- **Aspect Ratios**:
  - Hero: 16:9
  - Cards: 4:3
  - Thumbnails: 1:1
- **Formats**: 
  - Photos: JPEG
  - Icons: SVG
  - UI Elements: PNG with transparency
- **Hero Images**:
  - High resolution (min 2000px width)
  - Good contrast for overlay text
  - Subtle overlay for readability
  - Focus on luxury and quality 