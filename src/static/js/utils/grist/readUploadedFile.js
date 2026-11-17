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

/**
 * Decode a text file as strict UTF-8, falling back to Windows-1252.
 * The UTF-8 decoder also removes its optional byte order mark.
 * @param {File} file CSV or TXT file to read.
 * @returns {Promise<string>} Decoded file content.
 * @throws {Error} When reading the file bytes fails.
 */
const readFileAsText = async (file) => {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
};

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
 * Map the first XLSX sheet directly to named rows without converting cell values.
 * Use unique headers so duplicate or empty names do not overwrite cells.
 * @param {File} file Workbook to read.
 * @returns {Promise<Object>} Named rows and column metadata for preview and import.
 */
const readExcelData = async (file) => {
  if (!window.readXlsxFile) {
    throw new Error("read-excel-file is not available");
  }
  const sheets = await window.readXlsxFile(file, { sheets: [1], trim: false });
  const [headerRow = [], ...rows] = sheets[0].data;
  const usedHeaders = new Set();
  const fields = headerRow.map((header, index) => {
    let name = `column_${index + 1}`;
    if (header !== null && header !== undefined && header !== "") {
      name = `${header}`;
    }
    let uniqueName = name;
    let suffix = 1;
    while (usedHeaders.has(uniqueName)) {
      uniqueName = `${name}_${suffix}`;
      suffix += 1;
    }
    usedHeaders.add(uniqueName);
    return uniqueName;
  });

  const data = rows
    .filter((row) =>
      row.some((value) => value !== null && value !== undefined && value !== "")
    )
    .map((row) => Object.fromEntries(fields.map((field, index) => [field, row[index]])));

  return { data, meta: { fields } };
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
