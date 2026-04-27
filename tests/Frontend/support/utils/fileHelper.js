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

export async function _compareBase64Images(
  expectedImageBase64,
  actualImageBase64,
) {
  const expectedImage = await _base64ToImageData(expectedImageBase64);
  const actualImage = await _base64ToImageData(actualImageBase64);

  expect(expectedImage.width).to.eql(actualImage.width);
  expect(expectedImage.height).to.eql(actualImage.height);

  const diff2 = pixelmatch(
    expectedImage.data,
    actualImage.data,
    null,
    expectedImage.width,
    expectedImage.height,
    {
      threshold: 0.1,
    },
  );

  expect(diff2).to.eql(
    0,
    "Expected Image: " +
      expectedImageBase64 +
      " Actual Image: " +
      actualImageBase64,
  );
}

export async function _base64ToImageData(base64) {
  return await new Promise((res) => {
    const image = new Image();
    image.src = base64;

    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image;
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      res(ctx.getImageData(0, 0, width, height));
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
