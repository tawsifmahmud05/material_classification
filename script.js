const imgOption = document.getElementById("imgOption");
const vidOption = document.getElementById("vidOption");

const img = document.getElementById("img");
const imgVideo = document.getElementById("imgVideo");
const fileInput = document.getElementById("file-input");

const imageResultsDiv = document.getElementById("imageResult");
const videoResultsDiv = document.getElementById("videoResult");

const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");

const StartVideoButton = document.getElementById("startVideoBtn");
const StopVideoButton = document.getElementById("stopVideoBtn");
const resetButton = document.getElementById("reset");
const captureButton = document.getElementById("capture");

const video = document.getElementById("video");
const threscanvas = document.getElementById("thresCanvas");
const canvas = document.getElementById("canvas");

let videoStream;

// ImageTab Onclick
imgOption.addEventListener("click", () => {
  stopVideoStream();
  captureButton.style.display = "block";
  video.style.display = "block";
  resetButton.style.display = "none";
  imgVideo.src = "375x500.png";
  const canvas = document.getElementById("new-canvas");
  canvas.style.display = "none";

  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];

  updateProgressBars(predictionData, "Vid");

  StopVideoButton.style.display = "none";
  StartVideoButton.style.display = "block";
});

// VideoTab Onclick
vidOption.addEventListener("click", () => {
  img.src = "375x500.png";
  threscanvas.style.display = "none";
  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];
  updateProgressBars(predictionData, "Img");
});

// StopVideo Onclick
StopVideoButton.addEventListener("click", () => {
  threscanvas.style.display = "none";
  StopVideoButton.style.display = "none";
  StartVideoButton.style.display = "block";

  stopVideoStream();
});

// StartVideo Onclick
StartVideoButton.addEventListener("click", () => {
  threscanvas.style.display = "block";
  StartVideoButton.style.display = "none";
  StopVideoButton.style.display = "block";
  startVideoStream();
});

// file input change
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  let image = new Image();
  image.src = URL.createObjectURL(file);
  reader.onload = function (e) {
    img.src = e.target.result;
    img.style.height = "300px";
    img.style.width = "auto";
    otsuThreshold(image, "new-canvas");
    // performWaveletLikeDecomposition(image, "new-canvas");
    const canvas = document.getElementById("new-canvas");
    canvas.style.display = "block";
    classify(img, "Img");
  };
  reader.readAsDataURL(file);
});

// Caotyre Onclick
captureButton.addEventListener("click", () => {
  console.log("here");
  threscanvas.style.display = "none";
  capturePhoto();
  captureButton.style.display = "none";
  video.style.display = "none";
  resetButton.style.display = "block";
});

// reset video page
resetButton.addEventListener("click", () => {
  captureButton.style.display = "block";
  video.style.display = "block";
  resetButton.style.display = "none";
  imgVideo.src = "375x500.png";
  threscanvas.style.display = "block";

  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];
  updateProgressBars(predictionData, "Vid");
});

// Updating progress bar
function updateProgressBars(predictionData, txt) {
  predictionData.forEach((prediction) => {
    const progressBar = document.getElementById(
      `my${txt}${prediction.className}Bar`
    );
    const probabilityPercentage = prediction.probability * 100;

    progressBar.style.width = `${probabilityPercentage}%`;
    progressBar.textContent = `${
      prediction.className
    } (${probabilityPercentage.toFixed(2)}%)`;

    if (probabilityPercentage > 50) {
      progressBar.style.backgroundColor = "#90ee90";
    } else {
      progressBar.style.backgroundColor = "#ffcccb";
    }
  });
}

// Front and Rare based on device
function getFacingMode() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? "environment" : "user";
}

// Start video stream
async function startVideoStream() {
  try {
    const constraints = {
      video: {
        facingMode: getFacingMode(),
      },
    };
    const ctx = threscanvas.getContext("2d");
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (videoStream) {
        video.srcObject = videoStream;

        video.addEventListener("loadedmetadata", () => {
          canvas.width = video.videoWidth / 2;
          canvas.height = video.videoHeight / 2;
          threscanvas.width = video.videoWidth;
          threscanvas.height = video.videoHeight;

          processFrame();
        });
      })
      .catch(function (err) {
        console.log("An error occurred: " + err);
      });

    function processFrame() {
      if (video.paused || video.ended) {
        return;
      }
      ctx.drawImage(video, 0, 0, threscanvas.width, threscanvas.height);

      // performWaveletLikeDecomposition(threscanvas, "thresCanvas");
      otsuThreshold(threscanvas, "thresCanvas");
      // threscanvas.style.display = "block";
      requestAnimationFrame(processFrame);
    }

    video.play();
  } catch (error) {
    errorDiv.innerText = "Error accessing video stream. Please try again.";
  }
}

// Stop video stream
function stopVideoStream() {
  if (videoStream) {
    const tracks = videoStream.getTracks();
    tracks.forEach((track) => track.stop());
  }
  const video = document.getElementById("video");
  video.srcObject = null;
}

// Photo capture from video stream
function capturePhoto() {
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataURL = canvas.toDataURL("image/png");
  imgVideo.src = dataURL;

  classify(imgVideo, "Vid");
}

// Classify Image
async function classify(element, eleName) {
  errorDiv.innerHTML = "";
  loadingDiv.style.display = "block";
  try {
    const image = new Image();
    image.src = element.src;
    image.onload = async () => {
      const tensor = tf.browser.fromPixels(image, 3);
      const resizedImg = tf.image.resizeBilinear(tensor, [28, 28]);
      const normalizedImg = resizedImg.div(tf.scalar(255.0));
      const model = await tf.loadLayersModel(
        "./Model/new_web_model_Trp/my-model.json"
      );
      const prediction = model.predict(normalizedImg.expandDims());
      const predictionArray = prediction.arraySync()[0];

      const predictionData = [
        { className: "ABS", probability: predictionArray[0] },
        { className: "TRP", probability: predictionArray[1] },
      ];
      updateProgressBars(predictionData, eleName);
    };
  } catch (error) {
    errorDiv.innerText =
      "Error loading or classifying image. Please try again. " + error.message;
  } finally {
    loadingDiv.style.display = "none";
  }
}

// Applying Therhold to Image Data
async function otsuThreshold(img, canvasName) {
  let src = cv.imread(img);
  let gray = new cv.Mat();
  let lbp = new cv.Mat();
  let dst = new cv.Mat();
  let canvas = document.getElementById(canvasName);

  canvas.width = img.width / 2;
  canvas.height = img.height / 2;

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // Apply Local Binary Patterns
  applyLBP(gray, lbp);

  cv.threshold(lbp, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

  cv.imshow(canvasName, dst);
  const templateUrl1 = "target_patch/raw_abs_target.PNG";
  const templateUrl2 = "target_patch/raw_trp_target.PNG";
  let template1 = await loadImage(templateUrl1);
  let template2 = await loadImage(templateUrl2);
  try {
    // templateMatching(src, template);
    // orbMatching(src, template);
    orbMatchingWithTwoTemplates(src, template1, template2);
  } catch (e) {
    console.log("Error: " + e.message);
  }

  // template.delete();
  // src.delete();
  gray.delete();
  lbp.delete();
  dst.delete();
}

function applyLBP(gray, lbp) {
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

function performWaveletLikeDecomposition(img, canvasName) {
  // let canvas = document.getElementById("new-canvas");

  // canvas.width = img.width / 2;
  // canvas.height = img.height / 2;
  // const canvasLL = document.getElementById("canvasLL");
  // const canvasLH = document.getElementById("canvasLH");
  // const canvasHL = document.getElementById("canvasHL");
  // const canvasHH = document.getElementById("canvasHH");

  // const ctxOriginal = canvas.getContext("2d");
  // canvas.width = img.width;
  // canvas.height = img.height;
  // ctxOriginal.drawImage(img, 0, 0, img.width, img.height);

  // Load the image into OpenCV
  let src = cv.imread(img);
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // Apply GaussianBlur to simulate low-pass filtering (LL)
  let LL = new cv.Mat();
  cv.GaussianBlur(gray, LL, new cv.Size(9, 9), 0);

  // Subtract LL from the original to get high-pass (HH) content
  let HH = new cv.Mat();
  cv.subtract(gray, LL, HH);

  // Compute horizontal and vertical high-frequency sub-bands using Sobel filters
  let LH = new cv.Mat();
  let HL = new cv.Mat();
  cv.Sobel(gray, LH, cv.CV_64F, 1, 0, 3); // LH: Horizontal edges
  cv.Sobel(gray, HL, cv.CV_64F, 0, 1, 3); // HL: Vertical edges

  // Convert results to displayable format
  cv.convertScaleAbs(LH, LH);
  cv.convertScaleAbs(HL, HL);
  cv.convertScaleAbs(HH, HH);

  // Display results
  // displayResult(LL, canvasLL);
  // displayResult(LH, canvasLH);
  // displayResult(HL, canvasHL);
  // displayResult(HH, "new-canvas");
  cv.imshow(canvasName, HL);

  // Clean up
  src.delete();
  gray.delete();
  LL.delete();
  LH.delete();
  HL.delete();
  HH.delete();
}

// function templateMatching(image, template) {
//   // Load images into OpenCV
//   let src = image;
//   let templ = template;
//   let dst = new cv.Mat();
//   let mask = new cv.Mat();

//   // Convert images to grayscale for better matching
//   cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
//   cv.cvtColor(templ, templ, cv.COLOR_RGBA2GRAY);

//   // Define scaling and rotation factors to test
//   let scales = [0.5, 1.0, 1.5, 2.0]; // Example scale factors
//   let rotations = [0, 45, 90, 135]; // Example rotation angles (in degrees)
//   let bestMatch = {
//     scale: 1.0,
//     rotation: 0,
//     point: null,
//     value: -1,
//     size: null,
//   };

//   for (let scale of scales) {
//     for (let rotation of rotations) {
//       // Scale the template
//       let scaledTempl = new cv.Mat();
//       let newSize = new cv.Size(templ.cols * scale, templ.rows * scale);
//       cv.resize(templ, scaledTempl, newSize, 0, 0, cv.INTER_CUBIC);

//       // Rotate the template
//       let rotatedTempl = new cv.Mat();
//       let center = new cv.Point(scaledTempl.cols / 2, scaledTempl.rows / 2);
//       let rotationMatrix = cv.getRotationMatrix2D(center, rotation, 1);
//       cv.warpAffine(
//         scaledTempl,
//         rotatedTempl,
//         rotationMatrix,
//         newSize,
//         cv.INTER_LINEAR,
//         cv.BORDER_CONSTANT,
//         new cv.Scalar()
//       );

//       // Perform template matching
//       cv.matchTemplate(src, rotatedTempl, dst, cv.TM_CCOEFF_NORMED, mask);
//       let result = cv.minMaxLoc(dst, mask);

//       // Get match details
//       let maxPoint = result.maxLoc;
//       let maxVal = result.maxVal;

//       // Check if this is the best match so far
//       if (maxVal > bestMatch.value) {
//         bestMatch = {
//           scale: scale,
//           rotation: rotation,
//           point: maxPoint,
//           value: maxVal,
//           size: newSize,
//         };
//       }

//       // Clean up matrices
//       scaledTempl.delete();
//       rotatedTempl.delete();
//     }
//   }

//   // Draw rectangle around the best match
//   if (bestMatch.point) {
//     let color = new cv.Scalar(255, 0, 0, 255); // Red color
//     let point = new cv.Point(
//       bestMatch.point.x + bestMatch.size.width,
//       bestMatch.point.y + bestMatch.size.height
//     );
//     console.log(bestMatch.value);
//     cv.rectangle(src, bestMatch.point, point, color, 2, cv.LINE_8, 0);
//   }

//   // Display result
//   cv.imshow("new-canvas", src);

//   // Clean up
//   src.delete();
//   templ.delete();
//   dst.delete();
//   mask.delete();
// }
console.log("done");
// function orbMatching(image, template) {
//   // Load images into OpenCV
//   let src = image;
//   let templ = template;

//   // Convert images to grayscale for better keypoint detection
//   cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
//   cv.cvtColor(templ, templ, cv.COLOR_RGBA2GRAY);

//   // Initialize ORB detector
//   let orb = new cv.ORB();

//   // Detect ORB keypoints and descriptors
//   let keypoints1 = new cv.KeyPointVector();
//   let keypoints2 = new cv.KeyPointVector();
//   let descriptors1 = new cv.Mat();
//   let descriptors2 = new cv.Mat();

//   orb.detectAndCompute(src, new cv.Mat(), keypoints1, descriptors1);
//   orb.detectAndCompute(templ, new cv.Mat(), keypoints2, descriptors2);

//   // Match descriptors using BFMatcher (Brute Force)
//   let bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
//   let matches = new cv.DMatchVector();
//   bf.match(descriptors1, descriptors2, matches);

//   // Draw keypoints on the images
//   let outputImage = new cv.Mat();
//   cv.drawMatches(src, keypoints1, templ, keypoints2, matches, outputImage);
//   // Count total matches
//   let totalMatches = matches.size();
//   console.log(`Total matches: ${totalMatches}`);
//   // Display the result
//   cv.imshow("new-canvas", outputImage);

//   // Clean up
//   src.delete();
//   templ.delete();
//   keypoints1.delete();
//   keypoints2.delete();
//   descriptors1.delete();
//   descriptors2.delete();
//   matches.delete();
//   outputImage.delete();
//   // // Load images into OpenCV
//   // let src = image;
//   // let templ = template;
//   // let dst = new cv.Mat();

//   // // Convert images to grayscale for better matching
//   // cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
//   // cv.cvtColor(templ, templ, cv.COLOR_RGBA2GRAY);

//   // // Initialize ORB detector
//   // let orb = new cv.ORB();

//   // // Detect ORB keypoints and descriptors
//   // let keypoints1 = new cv.KeyPointVector();
//   // let keypoints2 = new cv.KeyPointVector();
//   // let descriptors1 = new cv.Mat();
//   // let descriptors2 = new cv.Mat();

//   // orb.detectAndCompute(src, new cv.Mat(), keypoints1, descriptors1);
//   // orb.detectAndCompute(templ, new cv.Mat(), keypoints2, descriptors2);

//   // // Match descriptors using BFMatcher (Brute Force)
//   // let bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
//   // let matches = new cv.DMatchVector();
//   // bf.match(descriptors1, descriptors2, matches);

//   // // Find the best match location
//   // let goodMatches = [];
//   // for (let i = 0; i < matches.size(); i++) {
//   //   goodMatches.push(matches.get(i));
//   // }
//   // goodMatches.sort((a, b) => a.distance - b.distance);

//   // // Draw the matches on the output image
//   // cv.drawMatches(src, keypoints1, templ, keypoints2, goodMatches, dst);

//   // // Draw the rectangle around the best match
//   // // if (goodMatches.length > 0) {
//   // //   let bestMatch = goodMatches[0];
//   // //   let maxPoint = keypoints1.get(bestMatch.queryIdx).pt;
//   // //   let point = new cv.Point(maxPoint.x + templ.cols, maxPoint.y + templ.rows);
//   // //   let color = new cv.Scalar(255, 0, 0, 255); // Red color
//   // //   cv.rectangle(src, maxPoint, point, color, 2, cv.LINE_8, 0);
//   // // }

//   // // Display the result
//   // cv.imshow("new-canvas", dst);

//   // // Clean up
//   // dst.delete();
//   // src.delete();
//   // templ.delete();
//   // keypoints1.delete();
//   // keypoints2.delete();
//   // descriptors1.delete();
//   // descriptors2.delete();
//   // matches.delete();
// }
function orbMatchingWithTwoTemplates(image, template1, template2) {
  // Load images into OpenCV
  let src = image;
  let templ1 = template1;
  let templ2 = template2;

  // Convert images to grayscale for better matching
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
  cv.cvtColor(templ1, templ1, cv.COLOR_RGBA2GRAY);
  cv.cvtColor(templ2, templ2, cv.COLOR_RGBA2GRAY);

  // Initialize ORB detector
  let orb = new cv.ORB();

  // Detect ORB keypoints and descriptors for the main image
  let keypointsSrc = new cv.KeyPointVector();
  let descriptorsSrc = new cv.Mat();
  orb.detectAndCompute(src, new cv.Mat(), keypointsSrc, descriptorsSrc);

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
      src,
      keypointsSrc,
      templ,
      keypointsTempl,
      matches,
      outputImage,
      color,
      new cv.Scalar(0, 255, 0, 255)
    );

    // Return the drawn image
    return outputImage;
  }

  // Draw matches for both templates
  let outputImage1 = matchAndDrawTemplate(
    templ1,
    new cv.Scalar(255, 0, 0, 255)
  ); // Red color for template 1
  let outputImage2 = matchAndDrawTemplate(
    templ2,
    new cv.Scalar(0, 255, 0, 255)
  ); // Green color for template 2

  // Combine images vertically
  let combinedImage = new cv.Mat();
  let rows = outputImage1.rows + outputImage2.rows;
  let cols = Math.max(outputImage1.cols, outputImage2.cols);
  combinedImage.create(rows, cols, outputImage1.type());

  // Copy the first image into the top portion of the combined image
  outputImage1.copyTo(
    combinedImage.rowRange(0, outputImage1.rows).colRange(0, outputImage1.cols)
  );

  // Copy the second image into the bottom portion of the combined image
  outputImage2.copyTo(
    combinedImage
      .rowRange(outputImage1.rows, rows)
      .colRange(0, outputImage2.cols)
  );

  // Display the result
  cv.imshow("new-canvas", combinedImage);

  // Clean up
  src.delete();
  templ1.delete();
  templ2.delete();
  keypointsSrc.delete();
  descriptorsSrc.delete();
  outputImage1.delete();
  outputImage2.delete();
  combinedImage.delete();
}

async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const imgTemp = new Image();
    imgTemp.crossOrigin = "Anonymous"; // Handle CORS issues
    imgTemp.onload = () => {
      // Create a canvas to draw the image
      const canvasTemp = document.createElement("canvas");
      canvasTemp.width = imgTemp.width;
      canvasTemp.height = imgTemp.height;
      const ctx = canvasTemp.getContext("2d");
      ctx.drawImage(imgTemp, 0, 0);

      // Convert image data to OpenCV.js Mat
      const imageData = ctx.getImageData(0, 0, imgTemp.width, imgTemp.height);
      const mat = cv.matFromImageData(imageData);
      resolve(mat);
    };
    imgTemp.onerror = (error) => reject(error);
    imgTemp.src = url;
  });
}
