export function getComplementaryColor(color?: string): string {
  if (!color) {
    return '#333333';
  }

  // Remove the # if present
  const hex = color.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate complementary color
  const compR = 255 - r;
  const compG = 255 - g;
  const compB = 255 - b;

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');

  return `#${toHex(compR)}${toHex(compG)}${toHex(compB)}`;
}