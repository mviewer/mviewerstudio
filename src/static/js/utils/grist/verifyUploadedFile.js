const ADDRESS_COLUMNS = [
  "adresse",
  "address",
  "voie",
  "rue",
  "numero",
  "numvoie",
  "codepostal",
  "cp",
  "ville",
  "commune",
];

const ADMIN_CODE_COLUMNS = [
  "codeinsee",
  "insee",
  "codecommune",
  "codepostal",
  "cp",
  "codeepci",
  "codedepartement",
  "departement",
  "coderegion",
  "region",
];

const GEOMETRY_COLUMNS = ["geom", "geometry", "geometrie", "wkt", "geojson"];
const LATITUDE_COLUMNS = ["lat", "latitude", "y"];
const LONGITUDE_COLUMNS = ["lon", "lng", "long", "longitude", "x"];

const normalizeColumnName = (columnName) =>
  String(columnName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const hasAnyColumn = (columns, candidates) =>
  columns.some((column) => candidates.includes(column));

const getMatchedColumns = (columns, candidates) =>
  columns.filter((column) => candidates.includes(column));

const getFileExtension = (file) => {
  const fileName = file?.name || "";
  const extension = fileName.split(".").pop();

  return extension ? extension.toLowerCase() : "";
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

const verifyColumns = (rawColumns) => {
  const columns = rawColumns.map(normalizeColumnName).filter(Boolean);
  const matchedGeometryColumns = getMatchedColumns(columns, GEOMETRY_COLUMNS);
  const matchedAddressColumns = getMatchedColumns(columns, ADDRESS_COLUMNS);
  const matchedAdminColumns = getMatchedColumns(columns, ADMIN_CODE_COLUMNS);
  const hasLatitude = hasAnyColumn(columns, LATITUDE_COLUMNS);
  const hasLongitude = hasAnyColumn(columns, LONGITUDE_COLUMNS);

  if (matchedGeometryColumns.length) {
    return {
      valid: true,
      reason: "geometry",
      matchedColumns: matchedGeometryColumns,
      message: "Fichier valide : colonne de geometrie détéctée.",
    };
  }

  if (hasLatitude && hasLongitude) {
    return {
      valid: true,
      reason: "coordinates",
      matchedColumns: columns.filter((column) =>
        LATITUDE_COLUMNS.includes(column) || LONGITUDE_COLUMNS.includes(column)
      ),
      message: "Fichier valide : colonnes de coordonnées détéctées.",
    };
  }

  if (matchedAddressColumns.length) {
    return {
      valid: true,
      reason: "address",
      matchedColumns: matchedAddressColumns,
      message: "Fichier valide : colonne d'adresse détéctéeS.",
    };
  }

  if (matchedAdminColumns.length) {
    return {
      valid: true,
      reason: "admin_code",
      matchedColumns: matchedAdminColumns,
      message: "Fichier valide : code administratif détécté.",
    };
  }

  return {
    valid: false,
    reason: "missing_geographic_columns",
    matchedColumns: [],
    message:
      "Le fichier doit contenir une adresse, un code administratif, une geometrie ou des coordonnees X/Y.",
  };
};

const verifyUploadedFile = async (file) => {
  if (!file) {
    return {
      valid: false,
      reason: "missing_file",
      matchedColumns: [],
      message: "Veuillez selectionner un fichier.",
    };
  }

  const extension = getFileExtension(file);

  if (!["csv", "txt"].includes(extension)) {
    return {
      valid: false,
      reason: "unsupported_format",
      matchedColumns: [],
      message: "Ce format ne peut pas encore etre verifie automatiquement.",
    };
  }

  const content = await readFileAsText(file);
  const parsedData = await readCsvData(content);
  const columns = parsedData.meta?.fields || [];
  const result = verifyColumns(columns);

  return {
    ...result,
    columns,
    parsedData,
  };
};

export { verifyColumns };
export default verifyUploadedFile;
