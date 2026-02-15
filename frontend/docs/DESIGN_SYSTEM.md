# A.I.M.S. Design System & UI Specification

## 1. Core Philosophy: "Luxury Industrial AI"
The design language combines the precision of high-tech industrial tools with the elegance of a luxury showroom.
- **Keywords**: Precision, Opulence, Depth, Glass, Obsidian, Gold.
- **Metaphor**: A high-end boutique for advanced AI machinery.

## 2. Color Palette

### Base Layers (Obsidian)
- **Void Black**: `#000000` (Main backgrounds, deep space)
- **Obsidian**: `#0A0A0A` (Card backgrounds, modals)
- **Charcoal**: `#1A1A1A` (Sidebar, secondary surfaces)
- **Gunmetal**: `#2A2A2A` (Borders, separators)

### Accents (Gold & Signal)
- **AIMS Gold**: `#D4AF37` (Primary actions, active states, key highlights)
- **Champagne**: `#F6C453` (Gradients, hover states)
- **Signal Green**: `#10B981` (Success, online status, "Systems Normal")
- **Signal Red**: `#EF4444` (Error, offline, "Critical")

### Typography (Text)
- **Primary White**: `#EDEDED` (Headings, primary text)
- **Muted Gray**: `#A1A1AA` (Secondary text, labels)
- **Dark Text**: `#0A0A0A` (Text on Gold buttons)

## 3. Typography System

### Font Families
- **Interface**: `Inter` (Clean, legible, modern sans-serif) - *Default*
- **Data/Code**: `Doto` (Monospace, retro-futuristic, jagged edges) - *Tech specs, key values*
- **Human Touch**: `Permanent Marker` (Handwritten) - *Notes, annotations, "human in the loop"*

### Hierarchy
- **Display**: `text-4xl` to `text-6xl`, Bold, Tracking-tight (Main Headers)
- **H1-H3**: `text-xl` to `text-3xl`, SemiBold (Section Titles)
- **Body**: `text-base`, Regular (Content)
- **Label**: `text-xs` to `text-sm`, Uppercase, Tracking-widest (specs, tags)

## 4. Visual Effects (The "Glass & Light" Engine)

### Glassmorphism (The "Window")
Used for cards, panels, and overlays.
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
```

### Premium Glass (The "Showcase")
Used for high-value items (e.g., Pricing, Active Agent).
```css
.glass-premium {
  background: radial-gradient(
    circle at top left,
    rgba(212, 175, 55, 0.05),
    rgba(0, 0, 0, 0) 60%
  ), rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.05);
}
```

### Neon Glows
Subtle ambient light behind key elements.
- **Gold Glow**: `shadow-[0_0_20px_rgba(212,175,55,0.3)]`

## 5. Components

### Buttons
- **Primary (Gold)**: Solid Gold background (`#D4AF37`), Black text, slightly rounded (`rounded-md`).
- **Secondary (Glass)**: Transparent background, White border, White text, hover -> White background/Black text.
- **Ghost**: Text only, Gold hover.

### Inputs
- Dark background (`#050505`), border-b only (`border-gray-800`), focus -> `border-gold`.

## 6. Layout Principles
- **Grid-First**: Use CSS Grid for complex dashboards.
- **Breathing Room**: High padding (`p-6` to `p-10`) to separate sections.
- **Logo Wall**: Subtle repeating logo pattern in the deep background (opacity 2-5%).
