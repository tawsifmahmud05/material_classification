let detectedModal = new bootstrap.Modal(document.getElementById("gfg"));
export function showDetectedModal(image, predictedClass) {
  const modalImage = document.getElementById("modal-image");
  modalImage.src = image.src;

  document.getElementById("modal-class").innerHTML = predictedClass;
  detectedModal.show();
}
let undetectedModal = new bootstrap.Modal(
  document.getElementById("undetected-modal")
);
export function showUndetectedModal() {
  undetectedModal.show();
}
