import { imageToFile } from "./imageConversion.js";

export async function uploadFile(detectedImage, predictionData) {
  const formData = new FormData();

  // Get file inputs and metadata from the form
  const uploadImage = await imageToFile(detectedImage);

  // Add files to the FormData object
  if (uploadImage) {
    formData.append("image", uploadImage);
  }
  // if (video) {
  //     formData.append('video', video);
  // }
  const metadata = JSON.stringify(predictionData);

  // Add metadata to the FormData object
  if (metadata) {
    formData.append("metadata", metadata);
  }
  console.log(uploadImage);
  console.log(metadata);
  try {
    // Make the POST request to FastAPI
    const response = await fetch(
      "https://dev.dc-material-detection.ktinformatik.com/upload/",
      {
        method: "POST",
        body: formData,
      }
    );

    // Check if the response is OK
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    // Parse the JSON response
    const result = await response.json();
    console.log("Success:", result);
    // alert("Files uploaded successfully! Folder ID: " + result.folder_id);
  } catch (error) {
    console.error("Error:", error);
    // alert("Error uploading files.");
  }
}
