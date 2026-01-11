import type { Preview } from '@storybook/nextjs-vite'
import { themes } from 'storybook/theming'
import React, { useEffect } from 'react'
import { TooltipProvider } from '../components/ui/tooltip'
import '../app/globals.css'

const WithProviders: React.FC<{ Story: React.ComponentType }> = ({ Story }) => {
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.lang = 'ja'

    // Add DotGothic16 font
    if (!document.getElementById('dotgothic16-font')) {
      const link = document.createElement('link')
      link.id = 'dotgothic16-font'
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=DotGothic16&display=swap'
      document.head.appendChild(link)
    }
    document.body.style.fontFamily = '"DotGothic16", sans-serif'

    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  )
}

const withProviders = (Story: React.ComponentType) => <WithProviders Story={Story} />

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
  decorators: [withProviders],
}

export default preview
