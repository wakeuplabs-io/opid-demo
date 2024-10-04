

export function shortenString(str: string) {
  if (str.length < 10) return str;
  return str.slice(0, 10) + "..." + str.slice(-10);
}
  