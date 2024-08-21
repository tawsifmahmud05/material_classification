export function orbMatchingWithTwoTemplates(image, template1, template2) {
  // Convert images to grayscale
  cv.cvtColor(image, image, cv.COLOR_RGBA2GRAY);
  cv.cvtColor(template1, template1, cv.COLOR_RGBA2GRAY);
  cv.cvtColor(template2, template2, cv.COLOR_RGBA2GRAY);

  // Initialize ORB detector
  let orb = new cv.ORB();

  // Detect ORB keypoints and descriptors for the main image
  let keypointsSrc = new cv.KeyPointVector();
  let descriptorsSrc = new cv.Mat();
  orb.detectAndCompute(image, new cv.Mat(), keypointsSrc, descriptorsSrc);

  // Function to match and draw keypoints for a single template
  function matchAndDrawTemplate(templ, color) {
    let keypointsTempl = new cv.KeyPointVector();
    let descriptorsTempl = new cv.Mat();
    orb.detectAndCompute(templ, new cv.Mat(), keypointsTempl, descriptorsTempl);

    let bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
    let matches = new cv.DMatchVector();
    bf.match(descriptorsSrc, descriptorsTempl, matches);

    // Draw matches
    let outputImage = new cv.Mat();
    cv.drawMatches(
      image,
      keypointsSrc,
      templ,
      keypointsTempl,
      matches,
      outputImage,
      color,
      new cv.Scalar(0, 255, 0, 255)
    );

    return {
      matches: matches.size(),
      outputImage: outputImage,
    };
  }

  // Match with the first template
  let result1 = matchAndDrawTemplate(template1, new cv.Scalar(255, 0, 0, 255)); // Red color for template 1

  // Match with the second template
  let result2 = matchAndDrawTemplate(template2, new cv.Scalar(0, 255, 0, 255)); // Green color for template 2

  // Combine the results for both templates horizontally
  let combinedImage = new cv.Mat();
  let rows = Math.max(result1.outputImage.rows, result2.outputImage.rows);
  let cols = result1.outputImage.cols + result2.outputImage.cols;
  combinedImage.create(rows, cols, result1.outputImage.type());
  result1.outputImage.copyTo(
    combinedImage
      .rowRange(0, result1.outputImage.rows)
      .colRange(0, result1.outputImage.cols)
  );
  result2.outputImage.copyTo(
    combinedImage
      .rowRange(0, result2.outputImage.rows)
      .colRange(result1.outputImage.cols, cols)
  );

  // Return the number of matches and the combined image
  return {
    matchesTemplate1: result1.matches,
    matchesTemplate2: result2.matches,
    combinedImage: combinedImage,
  };
}
