import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../app/tailwind.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        macbook13: {
          name: 'MacBook 13"',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
        macbook14: {
          name: 'MacBook 14"',
          styles: {
            width: '1512px',
            height: '982px',
          },
        },
        macbook16: {
          name: 'MacBook 16"',
          styles: {
            width: '1728px',
            height: '1117px',
          },
        },
        ipadPro: {
          name: 'iPad Pro',
          styles: {
            width: '1024px',
            height: '1366px',
          },
        },
        iphone14: {
          name: 'iPhone 14',
          styles: {
            width: '390px',
            height: '844px',
          },
        },
        iphone14Pro: {
          name: 'iPhone 14 Pro',
          styles: {
            width: '393px',
            height: '852px',
          },
        },
      },
    },
    docs: {
      theme: {
        base: 'light',
        brandTitle: 'Forge MOI Components',
        fontBase: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    (Story) => (
      <div className="min-h-screen bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;