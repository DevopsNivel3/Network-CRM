// Parser que aceita somente números no input
export const onlyNumber = (value: string): string => {
  return value.replace(/\D/g, "");
};

// Parser para avatar
export const parserAvatar = (value: string | null | undefined): string | undefined => {
  return value ? "/uploads" + value : undefined;
};
