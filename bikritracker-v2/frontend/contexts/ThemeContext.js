import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bikri-dark-mode') === 'true';
    setDarkMode(saved);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('bikri-dark-mode', next);
    if (next) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
