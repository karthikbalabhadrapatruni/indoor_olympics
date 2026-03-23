export function readPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read file"));
        return;
      }

      resolve({
        data: result.split(",")[1],
        name: file.name,
        mime: file.type,
        preview: result,
      });
    };

    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}
