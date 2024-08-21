export function applyLBP(gray, lbp) {
  const rows = gray.rows;
  const cols = gray.cols;
  lbp.create(rows, cols, cv.CV_8UC1);

  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      let center = gray.ucharPtr(y, x)[0];
      let value = 0;

      // Compare each neighbor with the center pixel
      value |= (gray.ucharPtr(y - 1, x - 1)[0] >= center) << 7;
      value |= (gray.ucharPtr(y - 1, x)[0] >= center) << 6;
      value |= (gray.ucharPtr(y - 1, x + 1)[0] >= center) << 5;
      value |= (gray.ucharPtr(y, x + 1)[0] >= center) << 4;
      value |= (gray.ucharPtr(y + 1, x + 1)[0] >= center) << 3;
      value |= (gray.ucharPtr(y + 1, x)[0] >= center) << 2;
      value |= (gray.ucharPtr(y + 1, x - 1)[0] >= center) << 1;
      value |= (gray.ucharPtr(y, x - 1)[0] >= center) << 0;

      lbp.ucharPtr(y, x)[0] = value;
    }
  }
}
