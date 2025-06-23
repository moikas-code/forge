# Storybook Documentation

Storybook is configured for UI component development and testing in Forge MOI.

## Getting Started

### Running Storybook

```bash
# Start Storybook development server
bun run storybook

# Build static Storybook
bun run build-storybook
```

Storybook will open at `http://localhost:6006`

## Features

### Dark Mode Testing
- Toggle between light and dark themes using the sun/moon icon in the toolbar
- All components automatically respond to theme changes
- CSS variables update dynamically

### Responsive Testing
- Use the viewport addon to test components at different screen sizes
- Predefined viewports for:
  - MacBook Pro (1440x900)
  - iPhone 14 Pro (393x852)
  - iPad Pro (1024x1366)
  - Custom sizes

### Component Controls
- Interact with component props in real-time
- Test different states and variations
- Export code snippets with current prop values

## Writing Stories

### Basic Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta = {
  title: 'Category/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered', // or 'fullscreen', 'padded'
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // default props
  },
};
```

### Testing Stateful Components

For components using Zustand stores:

```typescript
import { withMockStore } from '@/stories/decorators/zustandDecorator';

export const WithState: Story = {
  decorators: [
    withMockStore({
      tabs: [{ id: '1', title: 'Tab 1', type: 'terminal' }],
      activeTabId: '1',
    }),
  ],
};
```

### Dark Mode Specific Stories

```typescript
export const DarkMode: Story = {
  parameters: {
    themes: { default: 'dark' },
  },
};
```

## Component Stories

### Layout Components
- **AppLayout**: Main application layout with resizable panels
- **Sidebar**: Navigation sidebar with Developer/Studio modes
- **TabManager**: Tab bar for managing open tabs

### UI Components
- **Button**: All button variants, sizes, and states
- **Terminal**: Terminal emulator component
- **Welcome**: Welcome screen showcase

## Best Practices

1. **Story Organization**
   - Group related stories by category
   - Use descriptive names for stories
   - Include "Playground" stories for experimentation

2. **Props Documentation**
   - Add JSDoc comments to component props
   - Use ArgTypes for better control customization
   - Include usage examples in story descriptions

3. **Testing States**
   - Cover all component states (default, hover, active, disabled)
   - Test edge cases (empty states, overflow)
   - Include loading and error states

4. **Accessibility**
   - Use the a11y addon to check accessibility
   - Test keyboard navigation
   - Verify ARIA labels and roles

## Troubleshooting

### Common Issues

1. **Styles not loading**
   - Ensure `app/tailwind.css` is imported in `.storybook/preview.tsx`
   - Check that PostCSS is configured correctly

2. **Path aliases not working**
   - Verify webpack aliases in `.storybook/main.ts`
   - Match Next.js tsconfig paths

3. **Dark mode not switching**
   - Check that `withThemeByDataAttribute` decorator is applied
   - Verify CSS variables are properly defined

## Contributing

When adding new components:
1. Create a `.stories.tsx` file alongside the component
2. Include all variants and states
3. Add interactive controls for props
4. Test in both light and dark modes
5. Verify responsive behavior