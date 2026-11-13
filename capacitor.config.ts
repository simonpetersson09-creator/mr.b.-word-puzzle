import type { CapacitorConfig } from '@capacitor/cli';
// Ludo/Sudoku local-bundle pattern, with Ord's separate identity and no online dependency.
const config: CapacitorConfig = {
  appId: 'se.shiningdays.mrbord',
  appName: 'Mr.B. Word Puzzle',
  webDir: 'dist-native',
  ios: { contentInset: 'never' },
  android: { allowMixedContent: false },
};
export default config;