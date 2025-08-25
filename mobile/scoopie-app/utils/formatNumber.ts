export const formatCount = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(num % 1_000_000 >= 100_000 ? 0 : 1) + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(num % 1_000 >= 100 ? 0 : 1) + "k";
  }
  return num.toString();
};
