// The code tab shows the sheet indented, not as one long line.
export function formatHtml(html) {
  const tokens = String(html || '')
    .replace(/>\s*</g, '><')
    .trim()
    .replace(/</g, '\n<')
    .split('\n')
    .filter((token) => token.trim());

  let depth = 0;
  return tokens
    .map((token) => {
      const closing = /^<\//.test(token);
      const voidTag =
        /\/>$/.test(token) ||
        /^<(!doctype|meta|link|br|img|input|hr|source|area|base|col|embed|track|wbr)[\s>]/i.test(token);
      if (closing) depth = Math.max(depth - 1, 0);
      const line = `${'  '.repeat(depth)}${token.trim()}`;
      if (!closing && !voidTag) depth += 1;
      return line;
    })
    .join('\n');
}