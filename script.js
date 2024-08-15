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
  captureButton.style.display = "block";
  video.style.display = "block";
  resetButton.style.display = "none";
  imgVideo.src = "375x500.png";

  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];

  updateProgressBars(predictionData, "Vid");

  stopVideoStream();

  StopVideoButton.style.display = "none";
  StartVideoButton.style.display = "block";
});

// VideoTab Onclick
vidOption.addEventListener("click", () => {
  img.src = "375x500.png";
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
    otsuThreshold(image);
    classify(img, "Img");
  };
  reader.readAsDataURL(file);
});

// Caotyre Onclick
captureButton.addEventListener("click", () => {
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

      let src = cv.imread(threscanvas);
      let dst = new cv.Mat();

      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
      cv.threshold(src, dst, 200, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
      cv.imshow("thresCanvas", dst);

      src.delete();
      dst.delete();

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
function otsuThreshold(img) {
  let src = cv.imread(img);
  let dst = new cv.Mat();
  let canvas = document.getElementById("new-canvas");

  canvas.width = img.width / 2;
  canvas.height = img.height / 2;

  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

  cv.threshold(src, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

  cv.imshow("new-canvas", dst);

  src.delete();
  dst.delete();
}
