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
  StopVideoButton.style.display = "none";
  StartVideoButton.style.display = "block";

  stopVideoStream();
});

// StartVideo Onclick
StartVideoButton.addEventListener("click", () => {
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

      performWaveletLikeDecomposition(threscanvas, "thresCanvas");
      // otsuThreshold(threscanvas, "thresCanvas");
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
function otsuThreshold(img, canvasName) {
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

  src.delete();
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

// function displayResult(mat, canvas) {
//   cv.imshow(canvas.id, mat);
//   mat.delete();
// }
