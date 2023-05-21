export default {
  space: [0, 4, 8, 16, 24, 32, 42, 56, 72, 96, 128, 256, 512],
  fonts: {
    heading: "Space Grotesk, monospace",
    body: "Inter, sans-serif",
    monospace: "Space Mono, monospace",
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 96],
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.125,
  },
  colors: {
    text: "#60656F",
    background: "#FFF",
    primary: "#62a6ef",
    secondary: "#F6F7F8",
    mediumGray: "#8f8f8f",
    lightGray: "#afafaf",
    primaryActive: "#59a2f1",
    secondaryActive: "#e0e4e7",
    mediumGrayActive: "#43474e",
    lightGrayActive: "#7a7c7e",
  },
  links: {
    text: {
      fontWeight: "600",
      color: "primary",
      "&:visited": {
        color: "primary",
      },
      "&:active": {
        color: "primary",
      },
      "&:hover": {
        color: "primary",
        textDecoration: "underline",
      },
      textDecoration: "none",
      cursor: "pointer",
    },
    button: {
      px: [3],
      py: [2],
      borderRadius: "4px",
      backgroundColor: "primary",
      textDecoration: "none",
      color: "background",
      "&:hover": {
        bg: "primaryActive",
      },
      bg: "primary",
      fontFamily: "monospace",
      cursor: "pointer",
    },
    nav: {
      color: "inherit",
      "&.active": {
        color: "primary",
      },
      "&:hover": {
        color: "primary",
        borderBottom: "2px solid",
        borderBottomColor: "primary",
      },
      textDecoration: "none",
      mr: [4],
      fontSize: [2],
      fontWeight: "bold",
      cursor: "pointer",
      borderBottom: "2px solid",
      borderBottomColor: "background",
    },
    activeNav: {
      color: "inherit",
      "&.active": {
        color: "primary",
      },
      "&:hover": {
        color: "primary",
        borderBottomColor: "primary",
      },
      textDecoration: "none",
      mr: [4],
      fontSize: [2],
      fontWeight: "bold",
      cursor: "pointer",
      borderBottom: "2px solid",
      borderBottomColor: "mediumGray",
    },
  },
  buttons: {
    primary: {
      color: "background",
      bg: "primary",
      fontFamily: "monospace",
      cursor: "pointer",
    },
  },
  cards: {
    primary: {
      backgroundColor: "background",
      color: "mediumGray",
      padding: 3,
      borderRadius: 4,
      boxShadow: "0 0 8px rgba(0, 0, 0, 0.125)",
    },
  },
  styles: {
    root: {
      fontFamily: "body",
      lineHeight: "body",
      fontWeight: "body",
    },
    a: {
      color: "primary",
      "&:visited": {
        color: "primary",
      },
      "&:active": {
        color: "primary",
      },
      "&:hover": {
        color: "primary",
        borderBottom: "solid",
        borderWidth: 2,
        borderColor: "primary",
      },
      textDecoration: "none",
      cursor: "pointer",
      borderBottom: "solid",
      borderWidth: 2,
      borderColor: "background",
    },
  },
}
