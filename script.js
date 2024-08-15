const img = document.getElementById("img");
const imgVideo = document.getElementById("imgVideo");
const fileInput = document.getElementById("file-input");
const imageResultsDiv = document.getElementById("imageResult");
const videoResultsDiv = document.getElementById("videoResult");

const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");

const imgOption = document.getElementById("imgOption");
const vidOption = document.getElementById("vidOption");
const StartVideoButton = document.getElementById("startVideoBtn");
const StopVideoButton = document.getElementById("stopVideoBtn");

// const imageSection = document.getElementById("image-section");
// const videoSection = document.getElementById("video-section");

const captureButton = document.getElementById("capture");
const video = document.getElementById("video");
const threscanvas = document.getElementById("thresCanvas");
const canvas = document.getElementById("canvas");
const resetButton = document.getElementById("reset");

let videoStream;

imgOption.addEventListener("click", () => {
  captureButton.style.display = "block";
  video.style.display = "block";
  resetButton.style.display = "none";

  imgVideo.src = "375x500.png";
  // Format the output
  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];
  updateProgressBars(predictionData, "Vid");
  stopVideoClassification();
  stopVideoStream();
  StopVideoButton.style.display = "none";
  StartVideoButton.style.display = "block";
});

vidOption.addEventListener("click", () => {
  img.src = "375x500.png";
  // Format the output
  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];
  updateProgressBars(predictionData, "Img");
});

StopVideoButton.addEventListener("click", () => {
  StopVideoButton.style.display = "none";
  StartVideoButton.style.display = "block";
  stopVideoClassification();
  stopVideoStream();
});

StartVideoButton.addEventListener("click", () => {
  StartVideoButton.style.display = "none";
  StopVideoButton.style.display = "block";
  startVideoStream();
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  let image = new Image();
  image.src = URL.createObjectURL(file);
  reader.onload = function (e) {
    img.src = e.target.result;
    img.style.height = "300px";
    img.style.width = "auto";
    // console.log(cv.imread(img));
    otsuThreshold(image);
    classifyImage();
  };
  reader.readAsDataURL(file);
});

async function classifyImage() {
  errorDiv.innerHTML = "";
  loadingDiv.style.display = "block";

  try {
    const image = new Image();
    image.src = img.src;
    image.onload = async () => {
      const tensor = tf.browser.fromPixels(image, 3);
      const resizedImg = tf.image.resizeBilinear(tensor, [28, 28]);
      const normalizedImg = resizedImg.div(tf.scalar(255.0));
      const model = await tf.loadLayersModel(
        "./Model/new_web_model_Trp/my-model.json"
      );
      const prediction = model.predict(normalizedImg.expandDims());
      const predictionArray = prediction.arraySync()[0];

      // Format the output
      const predictionData = [
        { className: "ABS", probability: predictionArray[0] },
        { className: "TRP", probability: predictionArray[1] },
      ];
      updateProgressBars(predictionData, "Img");
    };
  } catch (error) {
    errorDiv.innerText =
      "Error loading or classifying image. Please try again. " + error.message;
  } finally {
    loadingDiv.style.display = "none";
  }
}

function updateProgressBars(predictionData, txt) {
  predictionData.forEach((prediction) => {
    const progressBar = document.getElementById(
      `my${txt}${prediction.className}Bar`
    );
    const probabilityPercentage = prediction.probability * 100;

    // Update the width and inner text of the progress bar
    progressBar.style.width = `${probabilityPercentage}%`;
    progressBar.textContent = `${
      prediction.className
    } (${probabilityPercentage.toFixed(2)}%)`;

    // Change background color based on probability
    if (probabilityPercentage > 50) {
      progressBar.style.backgroundColor = "#90ee90"; // Light green
    } else {
      progressBar.style.backgroundColor = "#ffcccb"; // Light red
    }
  });
}

captureButton.addEventListener("click", () => {
  capturePhoto();
  captureButton.style.display = "none";
  video.style.display = "none";
  resetButton.style.display = "block";
});

resetButton.addEventListener("click", () => {
  captureButton.style.display = "block";
  video.style.display = "block";
  resetButton.style.display = "none";
  imgVideo.src = "375x500.png";
  // Format the output
  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];
  // displayResults(predictionData);
  updateProgressBars(predictionData, "Vid");
});

function getFacingMode() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? "environment" : "user";
}

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

      // Process the next frame
      requestAnimationFrame(processFrame);
    }

    video.play();
  } catch (error) {
    errorDiv.innerText = "Error accessing video stream. Please try again.";
  }
}

function stopVideoClassification() {
  errorDiv.innerHTML = ""; // Clear previous errors
  stopVideoStream();
}

function stopVideoStream() {
  if (videoStream) {
    const tracks = videoStream.getTracks();
    tracks.forEach((track) => track.stop());
  }
  const video = document.getElementById("video");
  video.srcObject = null;
}

function capturePhoto() {
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataURL = canvas.toDataURL("image/png");
  imgVideo.src = dataURL;

  classifyImageFromCanvas();
}

async function classifyImageFromCanvas() {
  errorDiv.innerHTML = ""; // Clear previous errors
  loadingDiv.style.display = "block";

  try {
    const image = new Image();
    image.src = imgVideo.src;
    image.onload = async () => {
      const tensor = tf.browser.fromPixels(image, 3);
      const resizedImg = tf.image.resizeBilinear(tensor, [28, 28]);
      const normalizedImg = resizedImg.div(tf.scalar(255.0));
      const model = await tf.loadLayersModel(
        "./Model/new_web_model_Trp/my-model.json"
      );
      const prediction = model.predict(normalizedImg.expandDims());
      const predictionArray = prediction.arraySync()[0];

      // Format the output
      const predictionData = [
        { className: "ABS", probability: predictionArray[0] },
        { className: "TRP", probability: predictionArray[1] },
      ];
      console.log(predictionData);
      updateProgressBars(predictionData, "Vid");
    };
  } catch (error) {
    errorDiv.innerText =
      "Error loading or classifying image. Please try again. " + error.message;
  } finally {
    loadingDiv.style.display = "none";
  }
}

function otsuThreshold(img) {
  // Create source and destination Mat objects
  let src = cv.imread(img);
  let dst = new cv.Mat();
  let canvas = document.getElementById("new-canvas");
  canvas.width = img.width / 2;
  canvas.height = img.height / 2;

  // Convert the image to grayscale
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

  // Apply Otsu's thresholding
  cv.threshold(src, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

  // Display the result on the canvas
  cv.imshow("new-canvas", dst);

  // Clean up
  src.delete();
  dst.delete();
}
