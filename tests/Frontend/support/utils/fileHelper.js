import pixelmatch from "pixelmatch";

export function _arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function _compareBase64Images(expectedImage, actualImage) {
  const { imageData: expectedImageData, blob: expectedImageBlob } =
    await _base64ToImageData(expectedImage);
  const { imageData: actualImageData, blob: actualImageBlob } =
    await _base64ToImageData(actualImage);

  expect(expectedImageData.width).to.eql(actualImageData.width);
  expect(expectedImageData.height).to.eql(actualImageData.height);

  const diff2 = pixelmatch(
    expectedImageData.data,
    actualImageData.data,
    null,
    expectedImageData.width,
    expectedImageData.height,
    {
      threshold: 0.1,
    },
  );

  const expectedImageBase64 = await blobToBase64(expectedImageBlob);
  const actualImageBase64 = await blobToBase64(actualImageBlob);

  expect(diff2).to.eql(
    0,
    "Expected Image: " +
      expectedImageBase64 +
      "\n\nActual Image: " +
      actualImageBase64 +
      "\n\n",
  );
}

async function blobToBase64(blob) {
  return new Promise((res) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      res(reader.result);
    });
    reader.readAsDataURL(blob);
  });
}

export async function _base64ToImageData(base64) {
  return await new Promise((res) => {
    const image = new Image();
    image.src = base64;

    image.onload = async () => {
      const { naturalWidth: width, naturalHeight: height } = image;
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      ctx.filter = "blur(1px)";
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, width, height);
      const blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: 1.0,
      });

      res({ imageData, blob });
    };
  });
}

export function getFileContentType(fileName) {
  const fileExtension = fileName.split(".").pop().toLowerCase();

  const contentType = FILE_CONTENT_TYPES[fileExtension];

  if (!contentType) {
    throw new Error(
      "No file content type listed for given file extension: " + fileExtension,
    );
  }

  return contentType;
}

const FILE_CONTENT_TYPES = {
  svg: "image/svg+xml",
  ico: "image/vnd.microsoft.icon",
};
