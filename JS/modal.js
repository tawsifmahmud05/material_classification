let modal = new bootstrap.Modal(document.getElementById("gfg"));
export function showModal(image, predictedClass) {
  const modalImage = document.getElementById("modal-image");
  modalImage.src = image.src;

  document.getElementById("modal-class").innerHTML = predictedClass;
  modal.show();
}
