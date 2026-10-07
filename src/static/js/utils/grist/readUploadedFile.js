const getFileExtension = (file) => {
  let fileName = "";

  if (file && file.name) {
    fileName = file.name;
  }

  const extension = fileName.split(".").pop();

  if (!extension) {
    return "";
  }

  return extension.toLowerCase();
};

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result || ""));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(file, "UTF-8");
  });

const readCsvData = (content) =>
  new Promise((resolve, reject) => {
    if (!window.Papa) {
      reject(new Error("PapaParse is not available"));
      return;
    }

    window.Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results);
      },
      error: reject,
    });
  });

/**
 * Read CSV data for file preview and import.
 * @param {File} file File to read.
 * @returns {Promise<Object>} Read result with columns and parsed data.
 */
const readUploadedFile = async (file) => {
  if (!file) {
    return {
      valid: false,
      reason: "missing_file",
      message: "Veuillez selectionner un fichier.",
    };
  }

  const extension = getFileExtension(file);

  if (!["csv", "txt"].includes(extension)) {
    return {
      valid: false,
      reason: "unsupported_format",
      message: "Ce format ne peut pas encore être lu automatiquement.",
    };
  }

  const content = await readFileAsText(file);
  const parsedData = await readCsvData(content);
  let columns = [];

  if (parsedData.meta) {
    columns = parsedData.meta.fields;
  }
  return {
    valid: true,
    columns,
    parsedData,
  };
};

export default readUploadedFile;
