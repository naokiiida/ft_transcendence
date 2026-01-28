import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: [
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  features: {
    experimentalRSC: true,
  },
  viteFinal: async (config) => {
    config.build = {
      ...config.build,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        ...config.build?.rollupOptions,
        output: {
          sourcemapIgnoreList: (relativeSourcePath: string) =>
            relativeSourcePath.includes('node_modules'),
        },
        onwarn(warning, warn) {
          // "use client" directive warnings - Vite/Rollup bundles ignore module-level directives
          if (
            warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
            warning.message.includes('"use client"')
          ) {
            return;
          }
          // Sourcemap resolution errors from node_modules
          if (warning.code === 'SOURCEMAP_ERROR') {
            return;
          }
          warn(warning);
        },
      },
    };
    return config;
  },
};
export default config;
