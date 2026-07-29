import phenomPreset from '@phenomcanvas/ui/tailwind-preset';

export default {
  presets: [phenomPreset],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './node_modules/@phenomcanvas/ui/src/**/*.{js,jsx}',
  ],
};
