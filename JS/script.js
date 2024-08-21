import { applyLBP } from "./applyLBP.js";
import { orbMatchingWithTwoTemplates } from "./orbMatching.js";
import { updateProgressBars } from "./updateProgress.js";
import { getFacingMode } from "./utils.js";

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
// const resetButton = document.getElementById("reset");
// const captureButton = document.getElementById("capture");

const video = document.getElementById("video");
const threscanvas = document.getElementById("thresCanvas");
const canvas = document.getElementById("canvas");

let videoStream;

// ImageTab Onclick
imgOption.addEventListener("click", () => {
  stopVideoStream();
  // captureButton.style.display = "block";
  video.style.display = "block";
  // resetButton.style.display = "none";
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
  };
  reader.readAsDataURL(file);
});

// Caotyre Onclick
// captureButton.addEventListener("click", () => {
//   console.log("here");
//   threscanvas.style.display = "none";
//   capturePhoto();
//   captureButton.style.display = "none";
//   video.style.display = "none";
//   // resetButton.style.display = "block";
// });

// reset video page
// resetButton.addEventListener("click", () => {
//   captureButton.style.display = "block";
//   video.style.display = "block";
//   resetButton.style.display = "none";
//   imgVideo.src = "375x500.png";
//   threscanvas.style.display = "block";

//   const predictionData = [
//     { className: "ABS", probability: 0 },
//     { className: "TRP", probability: 0 },
//   ];
//   updateProgressBars(predictionData, "Vid");
// });

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

  const templateUrl1 = "target_patch/raw_abs_target.PNG";
  const templateUrl2 = "target_patch/raw_trp_target.PNG";
  let template1 = await loadImage(templateUrl1);
  let template2 = await loadImage(templateUrl2);
  try {
    let results = orbMatchingWithTwoTemplates(src, template1, template2);
    console.log("Matches with Template 1:", results.matchesTemplate1);
    console.log("Matches with Template 2:", results.matchesTemplate2);
    if (results.matchesTemplate1 + results.matchesTemplate2 > 160) {
      if (canvasName == "thresCanvas") {
        console.log("here");
        threscanvas.style.display = "none";
        capturePhoto();
        // captureButton.style.display = "none";
        video.style.display = "none";
        // resetButton.style.display = "block";
      } else {
        // const canvas = document.getElementById("new-canvas");
        // canvas.style.display = "block";
        classify(img, "Img");
      }
    }
  } catch (e) {
    console.log("Error: " + e.message);
  }
}

// function performWaveletLikeDecomposition(img, canvasName) {
//   // let canvas = document.getElementById("new-canvas");

//   // canvas.width = img.width / 2;
//   // canvas.height = img.height / 2;
//   // const canvasLL = document.getElementById("canvasLL");
//   // const canvasLH = document.getElementById("canvasLH");
//   // const canvasHL = document.getElementById("canvasHL");
//   // const canvasHH = document.getElementById("canvasHH");

//   // const ctxOriginal = canvas.getContext("2d");
//   // canvas.width = img.width;
//   // canvas.height = img.height;
//   // ctxOriginal.drawImage(img, 0, 0, img.width, img.height);

//   // Load the image into OpenCV
//   let src = cv.imread(img);
//   let gray = new cv.Mat();
//   cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

//   // Apply GaussianBlur to simulate low-pass filtering (LL)
//   let LL = new cv.Mat();
//   cv.GaussianBlur(gray, LL, new cv.Size(9, 9), 0);

//   // Subtract LL from the original to get high-pass (HH) content
//   let HH = new cv.Mat();
//   cv.subtract(gray, LL, HH);

//   // Compute horizontal and vertical high-frequency sub-bands using Sobel filters
//   let LH = new cv.Mat();
//   let HL = new cv.Mat();
//   cv.Sobel(gray, LH, cv.CV_64F, 1, 0, 3); // LH: Horizontal edges
//   cv.Sobel(gray, HL, cv.CV_64F, 0, 1, 3); // HL: Vertical edges

//   // Convert results to displayable format
//   cv.convertScaleAbs(LH, LH);
//   cv.convertScaleAbs(HL, HL);
//   cv.convertScaleAbs(HH, HH);

//   // Display results
//   // displayResult(LL, canvasLL);
//   // displayResult(LH, canvasLH);
//   // displayResult(HL, canvasHL);
//   // displayResult(HH, "new-canvas");
//   cv.imshow(canvasName, HL);

//   // Clean up
//   src.delete();
//   gray.delete();
//   LL.delete();
//   LH.delete();
//   HL.delete();
//   HH.delete();
// }

console.log("done");

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
