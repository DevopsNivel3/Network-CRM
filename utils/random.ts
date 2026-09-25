// Gera uma senha que tenha 12 caracteres, contendo uma letra maiúscula, um caractere especial e um número
export const randomPassword = (length: number = 12): string => {
  if (length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres");

  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_-";
  const allChars = upper + lower + numbers + specialChars;

  const getRandomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  let password = [
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(numbers),
    getRandomChar(specialChars),
  ];

  const randomValues = crypto.getRandomValues(new Uint8Array(length - password.length));
  password = password.concat(
    Array.from(randomValues).map((byte) => allChars[byte % allChars.length])
  );

  return password.sort(() => Math.random() - 0.5).join("");
};

// Gera uma cor aleatória baseada no índice e total de itens
export const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
};
