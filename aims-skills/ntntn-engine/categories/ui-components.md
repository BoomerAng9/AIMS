# NtNtN Engine — Category 6: UI Component Systems

> Pre-built, accessible, composable building blocks.

---

## shadcn/ui

### Overview
Copy-paste React components built on Radix UI primitives + Tailwind CSS.
You own the code — components are copied into your project, not imported from a package.

- **Current:** shadcn/ui (continuously updated)
- **Foundation:** Radix UI (accessibility) + Tailwind CSS (styling) + CVA (variants)
- **A.I.M.S. Status:** Default component library for all builds

### Key Patterns & Techniques

#### 1. CLI Installation
```bash
npx shadcn@latest init         # Initialize in project
npx shadcn@latest add button   # Add specific component
npx shadcn@latest add dialog card input   # Add multiple
```

#### 2. Component Customization
Every component lives in `components/ui/` — you own and modify freely:
```tsx
// components/ui/button.tsx (you own this file)
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
  }
);
```

#### 3. Theming
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
}
```

### Available Components (Selection)
Accordion, Alert, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel,
Chart, Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table,
Dialog, Drawer, Dropdown Menu, Form, Hover Card, Input, Label, Menubar,
Navigation Menu, Pagination, Popover, Progress, Radio Group, Scroll Area,
Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner (toast), Switch,
Table, Tabs, Textarea, Toggle, Tooltip

### Picker_Ang Notes
- **Default for every A.I.M.S. build** — full ownership, accessible, Tailwind-native
- Choose when: Any React/Next.js project
- Avoid when: Non-React project (use Ark UI or headless alternatives)

---

## Radix UI

### Overview
Unstyled, accessible React primitives. The foundation that shadcn/ui is built on.
Handles all accessibility, keyboard navigation, and focus management.

- **Current:** Radix Primitives 1.x
- **Approach:** Headless components — you bring your own styles
- **Accessibility:** WAI-ARIA compliant, keyboard navigable, screen reader tested

### Key Patterns
```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Picker_Ang Notes
- Choose when: Building a custom design system from scratch, need maximum control
- Avoid when: Use shadcn/ui instead (pre-styled Radix, faster to ship)

---

## Headless UI

### Overview
Unstyled, accessible components from Tailwind Labs. Designed specifically for
Tailwind CSS projects. Fewer components than Radix but tighter Tailwind integration.

- **Current:** Headless UI 2.x
- **Components:** Dialog, Disclosure, Listbox, Menu, Popover, Radio Group, Switch, Tabs, Transition

### Picker_Ang Notes
- Choose when: Tailwind project needing specific accessible patterns not in shadcn
- Avoid when: Use shadcn/ui (more components, same accessibility)

---

## Ark UI

### Overview
Framework-agnostic headless components from the Chakra UI team. Supports React,
Vue, and Solid with the same API. Built on state machines for predictable behavior.

- **Current:** Ark UI 4.x
- **Frameworks:** React, Vue, Solid
- **Foundation:** Zag.js state machines

### Picker_Ang Notes
- Choose when: Multi-framework projects, need same components across React + Vue
- Avoid when: React-only project (use shadcn/ui)

---

## Chakra UI

### Overview
Styled component library with a comprehensive theme system. Ready-to-use components
with sensible defaults. Good for rapid prototyping.

- **Current:** Chakra UI v3
- **Approach:** Style props + theme tokens + dark mode out of the box

### Key Patterns
```tsx
<Box bg="gray.100" p={4} borderRadius="lg" _dark={{ bg: 'gray.800' }}>
  <Heading size="md">Title</Heading>
  <Text color="gray.600" _dark={{ color: 'gray.400' }}>Content</Text>
  <Button colorScheme="blue" size="md">Action</Button>
</Box>
```

### Picker_Ang Notes
- Choose when: Rapid prototyping, team wants pre-styled components with themes
- Avoid when: A.I.M.S. builds (use shadcn/ui), need fine control over styling

---

## Material UI (MUI)

### Overview
Google Material Design implementation for React. The most widely-used React
component library by install count. Enterprise-grade with extensive documentation.

- **Current:** MUI v6 (with Pigment CSS — zero-runtime)
- **Design:** Material Design 3 (Material You)
- **Components:** 50+ components, Data Grid, Date Pickers, Charts

### Picker_Ang Notes
- Choose when: Material Design required, enterprise admin panels, data-heavy tables
- Avoid when: Custom design aesthetic (Material is opinionated), bundle size concerns

---

## Ant Design

### Overview
Enterprise UI component library with comprehensive data display and form components.
Strong in admin panels, dashboards, and CJK (Chinese/Japanese/Korean) locales.

- **Current:** Ant Design 5.x
- **Approach:** CSS-in-JS (cssinjs) + Design tokens + ConfigProvider
- **Components:** 60+ including ProComponents for enterprise layouts

### Picker_Ang Notes
- Choose when: Admin panels, data-heavy dashboards, CJK market
- Avoid when: Consumer-facing creative sites, custom design systems

---

## UI Component Comparison Matrix

| Library | Styled | Accessible | Customizable | Bundle | Best For |
|---------|--------|-----------|-------------|--------|----------|
| **shadcn/ui** | Yes (Tailwind) | Excellent | Full ownership | Per-component | A.I.M.S. default |
| **Radix UI** | No (headless) | Excellent | Maximum | Small | Custom design systems |
| **Headless UI** | No (headless) | Excellent | Maximum | Small | Tailwind-specific needs |
| **Ark UI** | No (headless) | Excellent | Maximum | Small | Multi-framework |
| **Chakra UI** | Yes (style props) | Good | Theme-level | Medium | Rapid prototyping |
| **MUI** | Yes (Material) | Good | Theme + sx | Large | Material Design / enterprise |
| **Ant Design** | Yes (tokens) | Good | ConfigProvider | Large | Admin panels / CJK |

---

## A.I.M.S. Default: shadcn/ui

For all A.I.M.S. builds, **shadcn/ui** is the default component library.
Built on Radix (accessible) + Tailwind (consistent) + CVA (variants).
Full code ownership — every component lives in the project.
