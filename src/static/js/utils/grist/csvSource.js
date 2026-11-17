import { createGristApiError, fetchWithApiError, readGristResponse } from "./apiError.js";

const requests = new Map();

/**
 * Invalide le téléchargement partagé à la réouverture ou après une modification Grist.
 * @param {string} url URL du CSV concerné.
 * @returns {void}
 */
export function clearGristCsv(url) {
  requests.delete(url);
}

/**
 * Partage le CSV authentifié entre les onglets Données et Style, y compris pendant le chargement.
 * @param {string} url URL du CSV Grist.
 * @param {string} apiKey Clé API validée pour ce chargement.
 * @returns {Promise<Object>} Données PapaParse, conservées jusqu'à invalidation.
 */
export function loadGristCsv(url, apiKey) {
  const cached = requests.get(url);
  if (cached && cached.apiKey === apiKey) return cached.promise;
  const entry = { apiKey };
  entry.promise = fetchWithApiError(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
    .then(async (response) => {
      const data = Papa.parse(await readGristResponse(response, "text"), {
        header: true,
        skipEmptyLines: true,
      });
      if (data.errors && data.errors.length) {
        throw await createGristApiError(
          new Error(mviewer.tr("modal.layer.grist.preview.error"))
        );
      }
      return data;
    })
    .catch((error) => {
      // L'échec d'une ancienne clé ne doit pas supprimer le chargement lancé avec la suivante.
      if (requests.get(url) === entry) requests.delete(url);
      throw error;
    });
  requests.set(url, entry);
  return entry.promise;
}
