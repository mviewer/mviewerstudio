/**
 * Simple Grist API key form block.
 *
 * Usage:
 * `const block = new mv.components.grist.gristApiKey();`
 * `target.appendChild(block.render());`
 * 
 * This component use :
 *  - https://support.getgrist.com/rest-api/
 * 
 */
import { getUserOrgs } from "../../utils/grist/requests.js";

const GRIST_API_KEY_SESSION_STORAGE_KEY = "mviewerstudio.grist.apiKey";

const readStoredGristApiKey = () => {
  try {
    return window.sessionStorage.getItem(GRIST_API_KEY_SESSION_STORAGE_KEY) || "";
  } catch (error) {
    console.warn("Unable to read Grist API key from sessionStorage:", error);
    return "";
  }
};

const storeGristApiKey = (apiKey) => {
  try {
    window.sessionStorage.setItem(GRIST_API_KEY_SESSION_STORAGE_KEY, apiKey);
  } catch (error) {
    console.warn("Unable to store Grist API key in sessionStorage:", error);
  }
};

const clearStoredGristApiKey = () => {
  try {
    window.sessionStorage.removeItem(GRIST_API_KEY_SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to clear Grist API key from sessionStorage:", error);
  }
};

const GristApiKey = function(
  gristInstanceUrl = "/grist",
  gristApiKeyHelpUrl = "https://grist.numerique.gouv.fr/account/developer",
  options = {}
) {
  this.gristInstanceUrl = gristInstanceUrl;
  this.gristApiKeyHelpUrl = gristApiKeyHelpUrl;
  this.gristApiKeyUrl = this.gristInstanceUrl + "/api/profile/apikey";
  this.alertTimeout = null;
  this.onValidApiKey = options.onValidApiKey || function () {};
  this.onInvalidApiKey = options.onInvalidApiKey || function () {};

  this.element = document.createElement("div");
  this.element.className = "grist-api-key";
}

/**
 * Fetch grist api KEY from Grist rest API :
 * https://grist.numerique.gouv.fr/api/profile/apikey
 * 
 * 
 * 
 * Only if user is logged in and has a valid session (via ProConnect)
 */
GristApiKey.prototype.fetchKeyFromGristAPI = function () {
  return fetch(this.gristApiKeyUrl, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "text/plain",
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.text();
  });
};

GristApiKey.prototype.loadApiKey = function () {
  const input = this.element.querySelector("#grist-api-key-input");

  if (!input) {
    return;
  }

  const storedApiKey = readStoredGristApiKey();
  if (storedApiKey) {
    input.value = storedApiKey;
    input.readOnly = false;
    return;
  }

  this.fetchKeyFromGristAPI()
    .then((data) => {
      const apiKey = data.trim();
      if (!apiKey) {
        throw new Error("Empty Grist API key");
      }
      input.value = apiKey;
      input.readOnly = true;
    })
    .catch((error) => {
      this.onInvalidApiKey();
      input.readOnly = false;
      input.focus();
      this.showAlert(
        "warning",
        "Clé API GRIST non récupérée automatiquement. Saisissez-la manuellement."
      );
      console.warn("Error fetching Grist API key:", error);
    });
};

GristApiKey.prototype.showAlert = function (type, message, autoHide = false) {
  const alert = this.element.querySelector("#grist-api-key-alert");

  if (!alert) {
    return;
  }

  clearTimeout(this.alertTimeout);
  alert.className = `grist-api-key-status grist-api-key-status-${type}`;
  alert.textContent = message;

  if (autoHide) {
    this.alertTimeout = window.setTimeout(() => {
      this.showAlert("muted", "La clé n'est pas encore vérifiée.");
    }, 10000);
  }
};

GristApiKey.prototype.toggleApiKeyVisibility = function () {
  const input = this.element.querySelector("#grist-api-key-input");
  const button = this.element.querySelector("[data-grist-api-key-toggle]");
  const icon = button?.querySelector("i");

  if (!input || !button || !icon) {
    return;
  }

  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  button.setAttribute("aria-pressed", String(isHidden));
  button.setAttribute(
    "aria-label",
    isHidden ? "Masquer la clé API GRIST" : "Afficher la clé API GRIST"
  );
  icon.className = isHidden ? "ri-eye-off-line" : "ri-eye-line";
};

GristApiKey.prototype.validateApiKey = function () {
  const input = this.element.querySelector("#grist-api-key-input");
  const button = this.element.querySelector("#grist-valid-key-btn");
  const apiKey = input ? input.value.trim() : "";

  if (!apiKey) {
    clearStoredGristApiKey();
    this.showAlert("warning", "Veuillez saisir une cle API GRIST.");
    this.onInvalidApiKey();
    input?.focus();
    return;
  }

  if (button) {
    button.disabled = true;
  }

  getUserOrgs(this.gristInstanceUrl, apiKey)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Invalid Grist API key");
      }

      this.showAlert("success", "Clé API GRIST valide.");
      storeGristApiKey(apiKey);
      this.onValidApiKey(apiKey);
    })
    .catch((error) => {
      clearStoredGristApiKey();
      this.onInvalidApiKey();
      this.showAlert("danger", "Cle API GRIST invalide ou impossible a verifier.");
      console.error("Error validating Grist API key:", error);
    })
    .finally(() => {
      if (button) {
        button.disabled = false;
      }
    });
};

/**
 * Get Grist API key from grist-api-key-input input field.
 * @returns {string} Grist API key.
 */
const getGristApiKey = () => {
  const input = document.getElementById("grist-api-key-input");
  return input ? input.value : readStoredGristApiKey();
}

GristApiKey.prototype.render = function () {
  this.element.innerHTML = `
    <div class="grist-api-key-header">
      <label class="grist-api-key-label" for="grist-api-key-input">
        Clé API Grist <span aria-hidden="true">ⓘ</span>
      </label>
      <a href="${this.gristApiKeyHelpUrl}" target="_blank" rel="noopener noreferrer" class="grist-api-key-help">Récupérer ma clé API Grist <i class="ri-external-link-line" aria-hidden="true"></i></a>
    </div>
    <div class="grist-api-key-row">
      <div class="grist-api-key-field">
        <i class="ri-key-2-line grist-api-key-field-icon" aria-hidden="true"></i>
        <input
          id="grist-api-key-input"
          type="password"
          class="form-control grist-api-key-input"
          placeholder="Entrez votre clé API GRIST"
          value=""
          autocomplete="off"
          spellcheck="false"
          readonly
        >
        <button
          type="button"
          class="grist-api-key-toggle"
          data-grist-api-key-toggle
          aria-label="Afficher la clé API GRIST"
          aria-pressed="false"
        >
          <i class="ri-eye-line" aria-hidden="true"></i>
        </button>
      </div>
      <button
        type="button"
        id="grist-valid-key-btn"
        class="btn grist-api-key-validate-btn"
      >
        Valider
      </button>
    </div>
    <p
      id="grist-api-key-alert"
      class="grist-api-key-status grist-api-key-status-muted"
      role="status"
    >
      La clé n'est pas encore vérifiée.
    </p>
  `;

  this.loadApiKey();

  this.element
    .querySelector("#grist-valid-key-btn")
    ?.addEventListener("click", () => this.validateApiKey());

  this.element
    .querySelector("#grist-api-key-input")
    ?.addEventListener("input", () => {
      clearStoredGristApiKey();
      this.showAlert("muted", "La clé n'est pas encore vérifiée.");
      this.onInvalidApiKey();
    });

  this.element
    .querySelector("[data-grist-api-key-toggle]")
    ?.addEventListener("click", () => this.toggleApiKeyVisibility());

  return this.element;
};

export default GristApiKey;
