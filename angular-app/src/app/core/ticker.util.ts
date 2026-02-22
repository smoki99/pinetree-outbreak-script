/** Convert EXCHANGE:TICKER to plain ticker for APIs */
export function toTicker(symbol: string): string {
  const parts = symbol.split(':');
  return parts.length > 1 ? parts[1]! : symbol;
}
