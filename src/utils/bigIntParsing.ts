export function formatBigInt(value: bigint, decimals: number) {
  const str = value.toString(); // Convert the BigInt to a string to avoid precision issues
  const len = str.length; // Get the length of the string

  if (len <= decimals) {
    // If the string is shorter than the decimal places, pad with zeroes
    const padded = str.padStart(decimals + 1, '0');
    return parseFloat('0.' + padded.slice(0, -decimals)); // We lose a bit of precision but its ok for now
  } else {
    // Else, insert a dot at the correct place
    return parseFloat(str.slice(0, len - decimals) + '.' + str.slice(len - decimals)); // We lose a bit of precision but its ok for now
  }
}
