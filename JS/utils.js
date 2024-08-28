// Front and Rare based on device
export function getFacingMode() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? "environment" : "user";
}

export function setPlaceholderThresCanvas() {
  // Get the canvas element and context
  const canvas = document.getElementById("thresCanvas");
  const ctx = canvas.getContext("2d");

  // Set canvas dimensions (if not set in HTML)
  canvas.width = 150;
  canvas.height = 200;

  // Placeholder text
  const placeholderText = "Start Camera";

  // Function to draw placeholder text
  function drawPlaceholder() {
    // Set background color (optional)
    ctx.fillStyle = "#cccccc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.font = "20px Arial";
    ctx.fillStyle = "#888888";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw the text
    ctx.fillText(placeholderText, canvas.width / 2, canvas.height / 2);
  }

  // Call the function to draw the placeholder
  drawPlaceholder();
}

// export function updateProgressBars(predictionData, txt) {
//   predictionData.forEach((prediction) => {
//     const progressBar = document.getElementById(
//       `my${txt}${prediction.className}Bar`
//     );
//     const probabilityPercentage = prediction.probability * 100;

//     progressBar.style.width = `${probabilityPercentage}%`;
//     progressBar.textContent = `${
//       prediction.className
//     } (${probabilityPercentage.toFixed(2)}%)`;

//     if (probabilityPercentage > 50) {
//       progressBar.style.backgroundColor = "#d3f36b";
//     } else {
//       progressBar.style.backgroundColor = "#ffcccb";
//     }
//   });
// }

export function updateProgressBars(predictionData, txt) {
  let maxProbability = 0;
  let maxClassName = "";

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
      progressBar.style.backgroundColor = "#87f43f";
    } else {
      progressBar.style.backgroundColor = "#f43f5e";
    }

    // Track the maximum probability and corresponding class name
    if (prediction.probability > maxProbability) {
      maxProbability = prediction.probability;
      maxClassName = prediction.className;
    }
  });

  return maxClassName;
}

export function resetVidSection() {
  video.style.display = "none";
  imgVideo.src = "assets\\placeholder.png";
  const canvas = document.getElementById("new-canvas");
  canvas.style.display = "none";

  const predictionData = [
    { className: "ABS", probability: 0 },
    { className: "TRP", probability: 0 },
  ];
  updateProgressBars(predictionData, "Vid");
}
