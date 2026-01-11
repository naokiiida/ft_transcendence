import type { Preview } from '@storybook/nextjs-vite'
import { themes } from 'storybook/theming'
import React, { useEffect } from 'react'
import '../app/globals.css'

const withDarkMode = (Story: React.ComponentType) => {
  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return <Story />
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'hsl(0 0% 5%)' },
        { name: 'light', value: 'hsl(0 0% 98%)' },
      ],
    },
    docs: {
      theme: themes.dark,
    },
  },
  decorators: [withDarkMode],
}

export default preview
