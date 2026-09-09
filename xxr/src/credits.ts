import text from "../mx/credits.txt?raw";

export const CREDITS_TEXT = String(text).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
