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
      primary: palette(color),
      colorScheme: {
        dark: {
          surface: {
            0: '#ffffff',
            50: '#E1E7EF',
            100: '#D5DDE7',
            200: '#B9C6D4',
            300: '#9FAFC1',
            400: '#899CAE',
            500: '#708599',
            600: '#5D6F7E',
            700: '#4C5862',
            800: '#3A434A',
            900: '#272C30',
            950: '#1D2022'
          }
        }
      }
    },
    components: {
      dataview: {
        header: {
          padding: '0.75rem 0.5rem'
        },
        content: {
          padding: '0 0 1rem 0'
        }
      }
    }
  };
  updatePreset(theme);
}
