import { palette, updatePreset } from "@primevue/themes";

export function updateTheme(color, rounded) {
  const theme = {
    primitive: {
      borderRadius: {
        none: "0",
        xs: rounded ? "2px" : "0",
        sm: rounded ? "4px" : "0",
        md: rounded ? "6px" : "0",
        lg: rounded ? "8px" : "0",
        xl: rounded ? "12px" : "0",
      },
    },
    semantic: {
      primary: palette(color),
      colorScheme: {
        dark: {
          surface: {
            0: "#ffffff",
            50: "#E1E7EF",
            100: "#D5DDE7",
            200: "#B9C6D4",
            300: "#9FAFC1",
            400: "#899CAE",
            500: "#708599",
            600: "#5D6F7E",
            700: "#4C5862",
            800: "#3A434A",
            900: "#272C30",
            950: "#1D2022",
          },
        },
      },
    },
    components: {
      toast: {
        colorScheme: {
          dark: {
            blur: "1.5px",
            info: {
              background: "color-mix(in srgb, {blue.900}, transparent 10%)",
              color: "{blue.100}",
            },
            success: {
              background: "color-mix(in srgb, {green.900}, transparent 10%)",
              color: "{green.100}",
            },
            warn: {
              background: "color-mix(in srgb, {yellow.900}, transparent 10%)",
              color: "{yellow.100}",
            },
            error: {
              background: "color-mix(in srgb, {red.900}, transparent 10%)",
              color: "{red.100}",
            },
          },
        },
      },
      dataview: {
        header: {
          padding: "0.75rem 0.5rem",
        },
        content: {
          padding: "0 0 1rem 0",
        },
      },
      datatable: {
        paginatorBottom: {
          borderWidth: "0",
        },
      },
      avatar: {
        root: {
          fontSize: "0.85rem",
        },
        lg: {
          fontSize: "1.25rem",
        },
        xl: {
          fontSize: "1.85rem",
        },
      },
      radiobutton: {
        icon: {
          size: "0.6rem",
        },
      },
      toggleswitch: {
        root: {
          width: "2.25rem",
          height: "1.35rem",
        },
        handle: {
          size: "0.85rem",
        },
      },
    },
  };
  updatePreset(theme);
}
