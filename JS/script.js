import { applyLBP } from "./applyLBP.js";
import { orbMatchingWithTwoTemplates } from "./orbMatching.js";
import { updateProgressBars } from "./updateProgress.js";
import { getFacingMode } from "./utils.js";
import { imageToFile } from "./imageConversion.js";

const imgOption = document.getElementById("imgOption");
const vidOption = document.getElementById("vidOption");

const img = document.getElementById("img");
const imgVideo = document.getElementById("imgVideo");
const fileInput = document.getElementById("file-input");

const StartVideoButton = document.getElementById("startVideoBtn");
const StopVideoButton = document.getElementById("stopVideoBtn");

const video = document.getElementById("video");
const threscanvas = document.getElementById("thresCanvas");
const canvas = document.getElementById("canvas");

const templateUrl1 = "target_patch/raw_abs_target.PNG";
const templateUrl2 = "target_patch/raw_trp_target.PNG";

let stream;

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
    }
  }, 100); // Check every 100ms
}

// Start waiting for OpenCV.js to load
waitForOpenCV();

// ImageTab Onclick
imgOption.addEventListener("click", () => {
  stopVideoStream();
  video.style.display = "none";
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
    imagePreProcessing(image, "new-canvas");
  };
  reader.readAsDataURL(file);
});

// Start video stream
async function startVideoStream() {
  try {
    const constraints = {
      video: {
        facingMode: getFacingMode(),
        frameRate: { ideal: 60, max: 60 },
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

    function processFrame() {
      if (video.paused || video.ended) {
        return;
      }
      ctx.drawImage(video, 0, 0, threscanvas.width, threscanvas.height);

      // performWaveletLikeDecomposition(threscanvas, "thresCanvas");
      imagePreProcessing(threscanvas, "thresCanvas");
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

        const predictionData = [
          { className: "ABS", probability: predictionArray[0] },
          { className: "TRP", probability: predictionArray[1] },
        ];
        updateProgressBars(predictionData, eleName);
        uploadFile(image, predictionData);
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
    console.log(results);
    if (results.matchesKeypointTemp1 + results.matchesKeypointTemp2 > 160) {
      if (canvasName == "thresCanvas") {
        threscanvas.style.display = "block";
        capturePhoto();
        video.style.display = "none";
      } else {
        classify(img, "Img");
      }
    } else {
      console.log("Non-detected");
    }
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

async function uploadFile(detectedImage, predictionData) {
  const formData = new FormData();

  // Get file inputs and metadata from the form
  const uploadImage = await imageToFile(detectedImage);

  // Add files to the FormData object
  if (uploadImage) {
    formData.append("image", uploadImage);
  }
  // if (video) {
  //     formData.append('video', video);
  // }
  const metadata = JSON.stringify(predictionData);

  // Add metadata to the FormData object
  if (metadata) {
    formData.append("metadata", metadata);
  }
  console.log(uploadImage);
  console.log(metadata);
  try {
    // Make the POST request to FastAPI
    const response = await fetch("http://localhost:8000/upload/", {
      method: "POST",
      body: formData,
    });

    // Check if the response is OK
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    // Parse the JSON response
    const result = await response.json();
    console.log("Success:", result);
    // alert("Files uploaded successfully! Folder ID: " + result.folder_id);
  } catch (error) {
    console.error("Error:", error);
    // alert("Error uploading files.");
  }
}
