import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DefaultTheme, ThemeProvider } from "styled-components";

import { darkTheme } from "./dark";
import { lightTheme } from "./light";

type ThemeMode = "light" | "dark";

type Theme = {
  mode: ThemeMode;
  onChangeThemeMode: () => void;
  addCustomTheme: (name: string, theme: DefaultTheme) => void;
};

const AppThemeContext = createContext<Theme>({
  mode: "dark",
  onChangeThemeMode: () => {},
  addCustomTheme: () => {},
});

type CustomThemes = {
  [key: string]: DefaultTheme;
};

function AppThemeProvider(props: { children: ReactNode }) {
  const { children } = props;
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const theme = window.localStorage.getItem("theme");
    return theme ? (theme as ThemeMode) : "dark";
  });
  const [customThemes, setCustomThemes] = useState<CustomThemes>({});

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    if (!window.localStorage.getItem("theme")) {
      setThemeMode(systemTheme);
    }
  }, []);

  function handleChangeThemeMode(): void {
    const theme = themeMode === "dark" ? "light" : "dark";
    window.localStorage.setItem("theme", theme);
    setThemeMode(theme);
  }

  function getTheme(): DefaultTheme {
    if (customThemes[themeMode]) {
      return customThemes[themeMode];
    }
    return themeMode === "dark" ? darkTheme : lightTheme;
  }

  function addCustomTheme(name: string, theme: DefaultTheme) {
    setCustomThemes((prevThemes) => ({
      ...prevThemes,
      [name]: theme,
    }));
  }

  return (
    <AppThemeContext.Provider value={{ mode: themeMode, onChangeThemeMode: handleChangeThemeMode, addCustomTheme }}>
      <ThemeProvider theme={getTheme()}>{children}</ThemeProvider>
    </AppThemeContext.Provider>
  );
}

const useAppTheme = () => useContext(AppThemeContext);

export default AppThemeProvider;
export { useAppTheme, AppThemeContext };
