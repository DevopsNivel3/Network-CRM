export const extractMessageText = (message: any): string | null => {
  if (!message) return null;
  if (typeof message === "string") return message;
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    null
  );
};
