export async function imageToFile(imgElement) {
  const blob = await imageToBlob(imgElement);
  const fileName = generateRandomFileName(); // Generate a random file name

  // Create a File object from the Blob
  return new File([blob], fileName, { type: blob.type });
}

function imageToBlob(imgElement) {
  return new Promise((resolve) => {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match the image
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    // Draw the image onto the canvas
    ctx.drawImage(imgElement, 0, 0);

    // Convert the canvas to a Blob
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png"); // Specify the format
  });
}

function generateRandomFileName(extension = "png") {
  const randomString = Math.random().toString(36).substr(2, 9); // Generates a random string
  return `${randomString}.${extension}`;
}
