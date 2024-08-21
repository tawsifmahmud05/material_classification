// Front and Rare based on device
export function getFacingMode() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? "environment" : "user";
}
