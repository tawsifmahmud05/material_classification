const img = document.getElementById("img");
const imgVideo = document.getElementById("imgVideo");
const fileInput = document.getElementById("file-input");
const imageResultsDiv = document.getElementById("imageResult");
const videoResultsDiv = document.getElementById("videoResult");
const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");

// const imageButton = document.getElementById("image-button");
// const videoButton = document.getElementById("video-button");

const imgOption = document.getElementById("imgOption");
const vidOption = document.getElementById("vidOption");
const StartVideoButton = document.getElementById("startVideoBtn");
const StopVideoButton = document.getElementById("stopVideoBtn");

const imageSection = document.getElementById("image-section");
const videoSection = document.getElementById("video-section");

const captureButton = document.getElementById("capture");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const resetButton = document.getElementById("reset");

let videoStream;
imgOption.addEventListener("click", () => {
  // canvas.style.display = "none";
  captureButton.style.display = "block";
  video.style.display = "block";
  resetButton.style.display = "none";
  // loadingDiv.style.display = "none";
  // resultsDiv.style.display = "none";
  imgVideo.src = "375x500.png";
  // Format the output
  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];
  // displayResults(predictionData);
  updateProgressBars(predictionData, "Vid");
  stopVideoClassification();
  stopVideoStream();
  StopVideoButton.style.display = "none";
  StartVideoButton.style.display = "block";
});
vidOption.addEventListener("click", () => {
  // canvas.style.display = "none";

  img.src = "375x500.png";
  // Format the output
  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];
  // displayResults(predictionData);
  updateProgressBars(predictionData, "Img");
});
StopVideoButton.addEventListener("click", () => {
  // resultsDiv.innerHTML = ""; // Clear previous results
  // errorDiv.innerHTML = ""; // Clear previous errors
  stopVideoClassification();
  stopVideoStream();
  StopVideoButton.style.display = "none";
  StartVideoButton.style.display = "block";
});
StartVideoButton.addEventListener("click", () => {
  // resultsDiv.innerHTML = ""; // Clear previous results
  // errorDiv.innerHTML = ""; // Clear previous errors
  StartVideoButton.style.display = "none";
  StopVideoButton.style.display = "block";
  startVideoStream();
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    img.src = e.target.result;
    img.style.height = "300px";
    img.style.width = "auto";
    classifyImage();
  };
  reader.readAsDataURL(file);
});

async function classifyImage() {
  // resultsDiv.innerHTML = ""; // Clear previous results
  errorDiv.innerHTML = ""; // Clear previous errors
  loadingDiv.style.display = "block";

  try {
    const image = new Image();
    image.src = img.src;
    console.log(img.src);
    image.onload = async () => {
      const tensor = tf.browser.fromPixels(image, 3);
      const resizedImg = tf.image.resizeBilinear(tensor, [28, 28]);
      const normalizedImg = resizedImg.div(tf.scalar(255.0));
      const model = await tf.loadLayersModel(
        "./Model/new_web_model_Trp/my-model.json"
      );
      console.log(normalizedImg);
      const prediction = model.predict(normalizedImg.expandDims());
      const predictionArray = prediction.arraySync()[0];

      // Format the output
      const predictionData = [
        { className: "ABS", probability: predictionArray[0] },
        { className: "TRP", probability: predictionArray[1] },
      ];
      // displayResults(predictionData);
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
// function displayResults(predictions) {
//   predictions.forEach((prediction) => {
//     const resultDiv = document.createElement("div");
//     resultDiv.classList.add("result");
//     const className = document.createElement("div");
//     className.classList.add("class-name");
//     className.innerText = `Class Name: ${prediction.className}`;
//     const probability = document.createElement("div");
//     probability.innerText = `Probability: ${(
//       prediction.probability * 100
//     ).toFixed(2)}%`;
//     resultDiv.appendChild(className);
//     resultDiv.appendChild(probability);
//     imageResultsDiv.appendChild(resultDiv);
//   });
// }
captureButton.addEventListener("click", () => {
  // startVideoStream();
  // canvas.style.display = "block";
  capturePhoto();
  captureButton.style.display = "none";
  video.style.display = "none";
  resetButton.style.display = "block";
  // resultsDiv.style.display = "block";
});

resetButton.addEventListener("click", () => {
  // canvas.style.display = "none";
  captureButton.style.display = "block";
  video.style.display = "block";
  resetButton.style.display = "none";
  // loadingDiv.style.display = "none";
  // resultsDiv.style.display = "none";
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
    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById("video");
    video.srcObject = videoStream;
    video.play();
    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth / 2;
      canvas.height = video.videoHeight / 2;
    });
    // startVideoClassification();
  } catch (error) {
    errorDiv.innerText = "Error accessing video stream. Please try again.";
  }
}

function stopVideoClassification() {
  stopVideoStream();
  // clearInterval(classifyInterval);
  // canvas.style.display = "none";

  errorDiv.innerHTML = ""; // Clear previous errors
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
  // console.log(img.src);
  // img.style.display = "none";
  classifyImageFromCanvas();
}

async function classifyImageFromCanvas() {
  // resultsDiv.innerHTML = ""; // Clear previous results
  errorDiv.innerHTML = ""; // Clear previous errors
  loadingDiv.style.display = "block";

  try {
    const image = new Image();
    image.src = imgVideo.src;
    // console.log(img.src);
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
      // displayResults(predictionData);
      updateProgressBars(predictionData, "Vid");
    };
  } catch (error) {
    errorDiv.innerText =
      "Error loading or classifying image. Please try again. " + error.message;
  } finally {
    loadingDiv.style.display = "none";
  }
}
