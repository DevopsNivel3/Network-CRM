// Função usada para mudar o tema entre escuro e claro e verificar em qual tema está
export const useTheme = () => {
  const colorMode = useColorMode();

  const isDark = computed(() => colorMode.preference === "dark");
  const toggleTheme = () =>
    (colorMode.preference = colorMode.preference === "dark" ? "light" : "dark");

  return {
    isDark,
    toggleTheme,
  };
};
