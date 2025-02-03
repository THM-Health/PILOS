export function _arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
