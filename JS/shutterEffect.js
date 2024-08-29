export function cameraShutter() {
  const shutterOverlay = document.querySelector(".shutter-overlay");
  // Trigger the shutter effect
  shutterOverlay.classList.add("shutter-effect");

  // Remove the class after the animation completes
  setTimeout(() => {
    shutterOverlay.classList.remove("shutter-effect");
  }, 1650); // 150ms for flash + 1500ms for reveal
}
