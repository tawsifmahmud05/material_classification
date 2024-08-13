const img = document.getElementById("img");
const fileInput = document.getElementById("file-input");
const resultsDiv = document.getElementById("results");
const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");

const imageButton = document.getElementById("image-button");
const videoButton = document.getElementById("video-button");

const imageSection = document.getElementById("image-section");
const videoSection = document.getElementById("video-section");

const captureButton = document.getElementById("capture");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const resetButton = document.getElementById("reset");

let videoStream;
imageButton.addEventListener("click", () => {
  imageSection.style.display = "block";
  videoSection.style.display = "none";
  imageButton.style.display = "none";
  canvas.style.display = "none";
  videoButton.style.display = "block";
  resultsDiv.innerHTML = ""; // Clear previous results
  errorDiv.innerHTML = ""; // Clear previous errors

  stopVideoClassification();
  stopVideoStream();
});
videoButton.addEventListener("click", () => {
  videoSection.style.display = "block";
  imageSection.style.display = "none";
  videoButton.style.display = "none";
  imageButton.style.display = "block";
  resultsDiv.innerHTML = ""; // Clear previous results
  errorDiv.innerHTML = ""; // Clear previous errors
  startVideoStream();
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    img.src = e.target.result;
    img.style.display = "block";
    classifyImage();
  };
  reader.readAsDataURL(file);
});

async function classifyImage() {
  resultsDiv.innerHTML = ""; // Clear previous results
  errorDiv.innerHTML = ""; // Clear previous errors
  loadingDiv.style.display = "block";

  try {
    const image = new Image();
    image.src = img.src;
    image.onload = async () => {
      const tensor = tf.browser.fromPixels(image, 3);
      const resizedImg = tf.image.resizeBilinear(tensor, [28, 28]);
      const normalizedImg = resizedImg.div(tf.scalar(255.0));
      const model = await tf.loadLayersModel(
        "./Model/new_web_model/my-model.json"
      );
      console.log(normalizedImg);
      // model.predict(normalizedImg.expandDims()).print();
      const prediction = model.predict(normalizedImg.expandDims());
      const predictionArray = prediction.arraySync()[0];

      // Format the output
      const predictionData = [
        { className: "ABS", probability: predictionArray[0] },
        { className: "TRP", probability: predictionArray[1] },
      ];
      displayResults(predictionData);
    };

    // const predictions = await model.predict(tensor);
    // displayResults(predictions);
    // displayResults(predictions);
    // const model = await tf.loadLayersModel(
    //   "./Model/tfjs_alexnet_model/model.json"
    // );
    // console.log(model.summary());
    // const predictions = await model.predict(x);
    // displayResults(predictions);
    // };
    // const model = await tf.loadLayersModel("./Model/Mnist/my-model.json");
    // console.log(model.summary());
  } catch (error) {
    errorDiv.innerText =
      "Error loading or classifying image. Please try again. " + error.message;
  } finally {
    loadingDiv.style.display = "none";
  }
}

function displayResults(predictions) {
  predictions.forEach((prediction) => {
    const resultDiv = document.createElement("div");
    resultDiv.classList.add("result");
    const className = document.createElement("div");
    className.classList.add("class-name");
    className.innerText = `Class Name: ${prediction.className}`;
    const probability = document.createElement("div");
    probability.innerText = `Probability: ${(
      prediction.probability * 100
    ).toFixed(2)}%`;
    resultDiv.appendChild(className);
    resultDiv.appendChild(probability);
    resultsDiv.appendChild(resultDiv);
  });
}
captureButton.addEventListener("click", () => {
  // startVideoStream();
  canvas.style.display = "block";
  capturePhoto();
  resultsDiv.style.display = "block";
});

resetButton.addEventListener("click", () => {
  canvas.style.display = "none";
  loadingDiv.style.display = "none";
  resultsDiv.style.display = "none";
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

// function startVideoClassification() {
//   classifyInterval = setInterval(async () => {
//     resultsDiv.innerHTML = ""; // Clear previous results
//     errorDiv.innerHTML = ""; // Clear previous errors
//     loadingDiv.style.display = "block";
//     // canvas.style.display = "none";

//     try {
//       // const context = canvas.getContext("2d");
//       // context.drawImage(video, 0, 0, canvas.width, canvas.height);
//       const model = await tf.loadLayersModel(
//         "Model\\tfjs_alexnet_model\\model.json"
//       );

//       const predictions = await model.predict(video);
//       console.log(predictions);
//       displayResults(predictions);
//     } catch (error) {
//       errorDiv.innerText = "Error classifying video. Please try again.";
//     } finally {
//       loadingDiv.style.display = "none";
//       // canvas.style.display = "block";
//     }
//   }, 5000);
// }

function stopVideoClassification() {
  stopVideoStream();
  // clearInterval(classifyInterval);
  // canvas.style.display = "none";
  resultsDiv.innerHTML = ""; // Clear previous results
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
  // img.src = dataURL;
  // img.style.display = "none";
  classifyImageFromCanvas();
}

async function classifyImageFromCanvas() {
  resultsDiv.innerHTML = ""; // Clear previous results
  errorDiv.innerHTML = ""; // Clear previous errors
  loadingDiv.style.display = "block";

  try {
    // const model = await tf.loadLayersModel(
    //   "Model\\tfjs_alexnet_model\\model.json"
    // );
    // const predictions = await model.predict(canvas);
    // displayResults(predictions);
  } catch (error) {
    errorDiv.innerText =
      "Error loading or classifying image. Please try again.";
  } finally {
    loadingDiv.style.display = "none";
  }
}
