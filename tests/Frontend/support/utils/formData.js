export function _arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function parseFormData(data, headers) {
  const boundary = headers["content-type"].split(
    "multipart/form-data; boundary=",
  )[1];
  const rawBoundary = new TextEncoder().encode("--" + boundary + "\r\n");
  const rawBoundaryLast = new TextEncoder().encode("\r\n--" + boundary + "--");

  const regex = new RegExp(
    `${rawBoundary.join(";")};|${rawBoundaryLast.join(";")};`,
    "g",
  );

  if (typeof data === "string") {
    data = new TextEncoder().encode(data);
  }

  const segments = new Uint8Array(data).join(";").split(regex);
  segments.shift();
  segments.pop();

  const formData = new FormData();

  segments.forEach((segment) => {
    const lines = segment.split(
      new TextEncoder().encode("\r\n").join(";") + ";",
    );

    const firstLine = lines.shift();
    const firstLineDecoded = new TextDecoder().decode(
      new Uint8Array(firstLine.split(";")),
    );

    const found = firstLineDecoded.match(
      /Content-Disposition: form-data; (\w+)="([^"]*)"(?:; (\w+)="([^"]*)")*/,
    );

    const name = found[2].replaceAll("\x00", "");
    const filename = found[4]?.replaceAll("\x00", "");

    if (filename) {
      const contentTypeLine = new TextDecoder().decode(
        new Uint8Array(lines.shift().split(";")),
      );

      const contentType = contentTypeLine
        .match(/Content-Type: (.*)/)[1]
        .replaceAll("\x00", "");
      lines.shift();

      let lineFileBits = lines
        .join(new TextEncoder().encode("\r\n").join(";") + ";")
        .split(";")
        .slice(0, -1);

      if (
        lineFileBits.slice(-2).join(";") ===
        new TextEncoder().encode("\r\n").join(";")
      ) {
        lineFileBits = lineFileBits.slice(0, -2);
      }

      const fileBits = new Uint8Array(lineFileBits);

      const file = new Blob([fileBits], {
        type: contentType,
      });

      formData.append(name, file, filename);
    } else {
      lines.shift();
      const value = new TextDecoder("utf-8")
        .decode(new Uint8Array(lines.shift().split(";")))
        .slice(0, -1);

      formData.append(name, value);
    }
  });

  return formData;
}
