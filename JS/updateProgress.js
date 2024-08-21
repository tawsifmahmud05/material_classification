export function updateProgressBars(predictionData, txt) {
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
