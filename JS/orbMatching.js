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
  let garbage1 = new cv.Mat();
  orb.detectAndCompute(image, garbage1, keypointsSrc, descriptorsSrc);

  try {
    // Match with the first template
    let result1 = matchAndDrawTemplate(
      image,
      orb,
      keypointsSrc,
      descriptorsSrc,
      template1,
      new cv.Scalar(255, 0, 0, 255)
    ); // Red color for template 1

    // Match with the second template
    let result2 = matchAndDrawTemplate(
      image,
      orb,
      keypointsSrc,
      descriptorsSrc,
      template2,
      new cv.Scalar(0, 255, 0, 255)
    ); // Green color for template 2

    // Combine the results for both templates horizontally
    // let combinedImage = new cv.Mat();
    // let rows = Math.max(result1.outputImage.rows, result2.outputImage.rows);
    // let cols = result1.outputImage.cols + result2.outputImage.cols;
    // combinedImage.create(rows, cols, result1.outputImage.type());

    // result1.outputImage.copyTo(
    //   combinedImage
    //     .rowRange(0, result1.outputImage.rows)
    //     .colRange(0, result1.outputImage.cols)
    // );
    // result2.outputImage.copyTo(
    //   combinedImage
    //     .rowRange(0, result2.outputImage.rows)
    //     .colRange(result1.outputImage.cols, cols)
    // );

    // result1.outputImage.delete();
    // result2.outputImage.delete();
    descriptorsSrc.delete();
    keypointsSrc.delete();
    orb.delete();
    garbage1.delete();
    // combinedImage.delete();

    // Return the number of matches and the combined image
    return {
      matchesKeypointTemp1: result1.matchedKeypoint,
      matchesKeypointTemp2: result2.matchedKeypoint,
    };
  } catch (error) {
    console.error("Error during ORB matching or image processing:", error);
    // Clean up in case of error
    if (result1) {
      result1.matches.delete();
      result1.outputImage.delete();
    }
    if (result2) {
      result2.matches.delete();
      result2.outputImage.delete();
    }
    if (combinedImage) {
      combinedImage.delete();
    }

    descriptorsSrc.delete();
    keypointsSrc.delete();
    orb.delete();
    garbage1.delete();
    combinedImage.delete();
    return {
      matchesTemplate1: null,
      matchesTemplate2: null,
      combinedImage: null,
    };
  } finally {
    image.delete();
    template1.delete();
    template2.delete();
  }
}

// Function to match and draw keypoints for a single template
function matchAndDrawTemplate(
  image,
  orb,
  keypointsSrc,
  descriptorsSrc,
  templ,
  color
) {
  let keypointsTempl = new cv.KeyPointVector();
  let descriptorsTempl = new cv.Mat();
  let garbage2 = new cv.Mat();
  orb.detectAndCompute(templ, garbage2, keypointsTempl, descriptorsTempl);

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
  let matchedKeypoint = matches.size();
  keypointsTempl.delete();
  descriptorsTempl.delete();
  bf.delete();
  garbage2.delete();
  outputImage.delete();
  return {
    matchedKeypoint: matchedKeypoint,
  };
}
