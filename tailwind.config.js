import phenomPreset from '@phenomcanvas/ui-vue/tailwind-preset';

export default {
  presets: [phenomPreset],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,vue}',
    './node_modules/@phenomcanvas/ui-vue/src/**/*.{js,jsx,ts,tsx,vue}',
  ],
};
