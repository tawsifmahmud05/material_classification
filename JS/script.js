import { applyLBP } from "./applyLBP.js";
import { orbMatchingWithTwoTemplates } from "./orbMatching.js";
import {
  getFacingMode,
  setPlaceholderThresCanvas,
  updateProgressBars,
  resetVidSection,
} from "./utils.js";
import { uploadFile } from "./upload.js";
import { showDetectedModal, showUndetectedModal } from "./modal.js";
import { cameraShutter } from "./shutterEffect.js";

const imgOption = document.getElementById("imgOption");
const vidOption = document.getElementById("vidOption");

const img = document.getElementById("img");
const imgVideo = document.getElementById("imgVideo");
const fileInput = document.getElementById("file-input");
fileInput.disabled = true;

const ClearButton = document.getElementById("ClearBtn");
const modalButtonYes = document.getElementById("modalBtnYes");
const modalButtonNo = document.getElementById("modalBtnNo");

const video = document.getElementById("video");
const threscanvas = document.getElementById("thresCanvas");
const canvas = document.getElementById("canvas");
const blinkingtext = document.getElementById("blinking-text");

const templateUrl1 = "assets/target_patch/raw_abs_target.PNG";
const templateUrl2 = "assets/target_patch/raw_trp_target.PNG";

let stream;

let isVideoOn = false;
let predictionData = [];
let predictedClass;

let results;
// model
const model = await tf.loadLayersModel(
  "./Model/new_web_model_Trp/my-model.json"
);

function waitForOpenCV() {
  let checkInterval = setInterval(() => {
    if (cv && cv.Mat) {
      // Check if OpenCV.js is ready
      clearInterval(checkInterval); // Stop checking
      console.log("OpenCV.js is loaded and ready to use.");
      fileInput.disabled = false;
    }
  }, 100); // Check every 100ms
}

// Start waiting for OpenCV.js to load
waitForOpenCV();

setPlaceholderThresCanvas();

// ImageTab Onclick
imgOption.addEventListener("click", () => {
  setPlaceholderThresCanvas();
  stopVideoStream();
  video.style.display = "none";
  imgVideo.src = "assets\\placeholder.png";
  const canvas = document.getElementById("new-canvas");
  canvas.style.display = "none";

  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];

  updateProgressBars(predictionData, "Vid");
});

// VideoTab Onclick
vidOption.addEventListener("click", () => {
  img.src = "assets\\placeholder.png";
  // threscanvas.style.display = "none";
  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];
  updateProgressBars(predictionData, "Img");
});

document.getElementById("toggle").addEventListener("change", function () {
  if (this.checked) {
    console.log("Toggle is ON");
    blinkingtext.style.display = "block";
    threscanvas.style.display = "block";
    startVideoStream();
    isVideoOn = true;
  } else {
    console.log("Toggle is OFF");
    blinkingtext.style.display = "none";

    isVideoOn = false;
    stopVideoStream();
    if (!isVideoOn && predictionData.length > 0) {
      showDetectedModal(imgVideo, predictedClass);
    }
    setPlaceholderThresCanvas();
  }
});

ClearButton.addEventListener("click", () => {
  resetVidSection();
  setPlaceholderThresCanvas();
});

// file input change
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  let image = new Image();

  // Set up the image load event
  image.onload = function () {
    fileInput.disabled = true;
    imagePreProcessing(image, "new-canvas");
  };

  // Create a URL for the selected file and assign it to the image source
  image.src = URL.createObjectURL(file);

  reader.onload = function (e) {
    img.src = e.target.result;
    img.style.height = "300px";
    img.style.width = "auto";
  };

  reader.readAsDataURL(file);
});

modalButtonYes.addEventListener("click", () => {
  const modalImage = document.getElementById("modal-image");
  const actualLabelByUser = document.getElementById("modal-class").innerHTML;
  const metadata = [...predictionData, { actualLabelByUser }];
  uploadFile(modalImage, metadata);
  predictionData = [];
});

modalButtonNo.addEventListener("click", () => {
  const modalImage = document.getElementById("modal-image");
  let falsePrediction = document.getElementById("modal-class").innerHTML;
  const actualLabelByUser = falsePrediction == "TRP" ? "ABS" : "TRP";
  const metadata = [...predictionData, { actualLabelByUser }];
  uploadFile(modalImage, metadata);
  predictionData = [];
});

// Start video stream
async function startVideoStream() {
  try {
    const constraints = {
      video: {
        facingMode: getFacingMode(),
        frameRate: { ideal: 30, max: 30 },
      },
    };
    const ctx = threscanvas.getContext("2d");

    // Clean up any previous video stream and event listeners
    if (video.srcObject) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      video.srcObject = null;
    }

    // Remove previous event listener if any
    video.removeEventListener("loadedmetadata", onLoadedMetadata);

    // Define the event listener for loadedmetadata
    function onLoadedMetadata() {
      canvas.width = video.videoWidth / 2;
      canvas.height = video.videoHeight / 2;
      threscanvas.width = video.videoWidth;
      threscanvas.height = video.videoHeight;

      processFrame();
    }

    video.addEventListener("loadedmetadata", onLoadedMetadata);

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.play();
    let frameCounter = 0;
    function processFrame() {
      if (video.paused || video.ended) {
        return;
      }
      ctx.drawImage(video, 0, 0, threscanvas.width, threscanvas.height);

      // performWaveletLikeDecomposition(threscanvas, "thresCanvas");
      if (frameCounter % 15 === 0) {
        // Your processing logic here

        imagePreProcessing(threscanvas, "thresCanvas");
      }
      // Increment the frame counter
      frameCounter++;
      // console.log(frameCounter);

      // Reset the counter after every 60 frames (optional)
      if (frameCounter >= 30) {
        frameCounter = 0;
      }
      localStorage.clear();
      sessionStorage.clear();

      requestAnimationFrame(processFrame);
    }
  } catch (error) {
    console.log("Error accessing video stream. Please try again.");
  }
}

function stopVideoStream() {
  const video = document.getElementById("video");
  if (video && video.srcObject) {
    // Stop all tracks of the stream
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());

    // Clear the video source
    video.srcObject = null;
  }
}
// Photo capture from video stream
function capturePhoto() {
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataURL = canvas.toDataURL("image/png");
  imgVideo.src = dataURL;
  cameraShutter();
  classify(imgVideo, "Vid");
}

async function classify(element, eleName) {
  try {
    const image = new Image();
    image.src = element.src;

    image.onload = async () => {
      try {
        const tensor = tf.browser.fromPixels(image, 3);
        const resizedImg = tf.image.resizeBilinear(tensor, [28, 28]);
        const normalizedImg = resizedImg.div(tf.scalar(255.0));

        // Predict using the model
        const prediction = model.predict(normalizedImg.expandDims());
        const predictionArray = prediction.arraySync()[0];

        // Dispose of tensors to free memory
        tensor.dispose();
        resizedImg.dispose();
        normalizedImg.dispose();
        prediction.dispose();

        predictionData = [
          { className: "ABS", probability: predictionArray[0] },
          { className: "TRP", probability: predictionArray[1] },
        ];
        predictedClass = updateProgressBars(predictionData, eleName);
        if (eleName == "Img") {
          fileInput.disabled = false;
          showDetectedModal(image, predictedClass);
        } else {
          // if (!isVideoOn && predictionData.length > 0) {
          //   showModal(image, predictedClass);
          // }
        }
      } catch (predictError) {
        console.log("message: " + predictError.message);
      }
    };

    image.onerror = () => {
      throw new Error("Error loading the image.");
    };
  } catch (error) {
    console.log("Message: " + error.message);
  } finally {
  }
}

//Pre-Processing
async function imagePreProcessing(img, canvasName) {
  let src = cv.imread(img);
  let template1 = await loadImage(templateUrl1);
  let template2 = await loadImage(templateUrl2);

  try {
    // results = await orbMatchingWithTwoTemplates(src, template1, template2);
    results = await orbMatchingWithTwoTemplates(src, template1, template2);
    // console.log(results);
    if (results.matchesKeypointTemp1 + results.matchesKeypointTemp2 > 160) {
      if (canvasName == "thresCanvas") {
        blinkingtext.style.display = "none";
        threscanvas.style.display = "block";
        capturePhoto();
        video.style.display = "none";
      } else {
        classify(img, "Img");
      }
    } else {
      console.log("Non-detected");
      if (canvasName == "new-canvas") {
        fileInput.disabled = false;
        showUndetectedModal();
      }
    }
    // console.log(!isVideoOn);
    // console.log(predictionData.length);
  } catch (e) {
    console.log("Error: " + e.message);
  } finally {
  }
}
//load template images
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
