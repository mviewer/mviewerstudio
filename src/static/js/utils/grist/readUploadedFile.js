import {
  GRIST_TEXT_FILE_EXTENSIONS,
  GRIST_SPREADSHEET_FILE_EXTENSIONS,
} from "./const.js";

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

const readExcelData = async (file) => {
  if (!window.readXlsxFile) {
    throw new Error("read-excel-file is not available");
  }
  if (!window.Papa) {
    throw new Error("PapaParse is not available");
  }

  const sheets = await window.readXlsxFile(file, { sheets: [1], trim: false });
  const content = window.Papa.unparse(sheets[0].data);
  return readCsvData(content);
};

/**
 * Read CSV, TXT or the first XLSX sheet for file preview and import.
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

  const isTextFile = GRIST_TEXT_FILE_EXTENSIONS.includes(extension);
  const isSpreadsheetFile = GRIST_SPREADSHEET_FILE_EXTENSIONS.includes(extension);

  if (!isTextFile && !isSpreadsheetFile) {
    return {
      valid: false,
      reason: "unsupported_format",
      message: "Format non pris en charge. Utilisez un fichier CSV, TXT ou XLSX.",
    };
  }

  let parsedData;

  if (isTextFile) {
    const content = await readFileAsText(file);
    parsedData = await readCsvData(content);
  } else {
    parsedData = await readExcelData(file);
  }
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
