export function getFileContentType(fileName) {
  const fileExtension = fileName.split(".").pop().toLowerCase();

  return FILE_CONTENT_TYPES[fileExtension] || "";
}

const FILE_CONTENT_TYPES = {
  svg: "image/svg+xml",
  ico: "image/vnd.microsoft.icon",
};
