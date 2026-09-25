import { FilterXSS } from "xss";

const sanitizer = new FilterXSS({
  whiteList: {
    div: ["data-attachments"],
    p: [],
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    s: [],
    blockquote: [],
    ul: [],
    ol: [],
    li: [],
    a: [
      "href",
      "target",
      "rel",
      "data-attachment",
      "data-attachment-id",
      "data-name",
      "data-type",
      "data-size",
    ],
    img: ["src", "alt", "title", "width", "height", "loading"],
    iframe: [
      "src",
      "width",
      "height",
      "allow",
      "allowfullscreen",
      "loading",
      "referrerpolicy",
    ],
    span: [],
    code: [],
    pre: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  css: false,
});

export const sanitizeHtml = (value: string) => sanitizer.process(value || "");

export const isHtmlEmpty = (value: string) => {
  const hasImage = /<img\b/i.test(value);
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return !text && !hasImage;
};

export const getHtmlLength = (value: string) => {
  if (!value) return 0;
  const images = (value.match(/<img\b/gi) || []).length;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text.length + images;
};
