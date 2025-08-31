export const formatCount = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(num % 1_000_000 >= 100_000 ? 0 : 1) + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(num % 1_000 >= 100 ? 0 : 1) + "k";
  }
  return num.toString();
};


export const calculateTimePeriod = (createdAt: string): string => {
  const createdTime = new Date(createdAt).getTime();
  const currentTime = Date.now();
  const diffMs = currentTime - createdTime;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));

  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 365) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
  }
};
