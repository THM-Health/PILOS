import { palette, updatePreset } from '@primevue/themes';

export function updateTheme (color, rounded) {
  const theme = {
    primitive: {
      borderRadius: {
        none: '0',
        xs: rounded ? '2px' : '0',
        sm: rounded ? '4px' : '0',
        md: rounded ? '6px' : '0',
        lg: rounded ? '8px' : '0',
        xl: rounded ? '12px' : '0'
      }
    },
    semantic: {
      primary: palette(color)
    }
  };
  updatePreset(theme);
}
