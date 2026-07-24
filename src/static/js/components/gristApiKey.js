/**
 * Simple Grist API key form block.
 *
 * Usage:
 * `const block = new mv.components.gristApiKey();`
 * `target.appendChild(block.render());`
 * 
 * This component use :
 *  - https://support.getgrist.com/rest-api/
 * 
 */
import { getUserOrgs } from "../utils/grist/requests.js";

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
  const alert = this.element.querySelector("#grist-api-key-alert");

  if (!input) {
    return;
  }

  if (alert) {
    alert.classList.add("d-none");
  }

  this.fetchKeyFromGristAPI()
    .then((data) => {
      const apiKey = data.trim();
      if (!apiKey) {
        throw new Error("Empty Grist API key");
      }
      input.value = apiKey;
      input.readOnly = true;
      this.validateApiKey();
    })
    .catch((error) => {
      this.onInvalidApiKey();
      input.readOnly = false;
      input.focus();
      if (alert) {
        alert.classList.remove("d-none");
        clearTimeout(this.alertTimeout);
        this.alertTimeout = window.setTimeout(() => {
          alert.classList.add("d-none");
        }, 10000);
      }
      console.warn("Error fetching Grist API key:", error);
    });
};

GristApiKey.prototype.showAlert = function (type, message, autoHide = false) {
  const alert = this.element.querySelector("#grist-api-key-alert");

  if (!alert) {
    return;
  }

  clearTimeout(this.alertTimeout);
  alert.className = `alert alert-${type} mt-3 mb-0`;
  alert.textContent = message;

  if (autoHide) {
    this.alertTimeout = window.setTimeout(() => {
      alert.classList.add("d-none");
    }, 10000);
  }
};

GristApiKey.prototype.validateApiKey = function () {
  const input = this.element.querySelector("#grist-api-key-input");
  const button = this.element.querySelector("#grist-valid-key-btn");
  const apiKey = input ? input.value.trim() : "";

  if (!apiKey) {
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

      this.showAlert("success", "Cle API GRIST valide.", true);
      this.onValidApiKey(apiKey);
    })
    .catch((error) => {
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
  return input ? input.value : "";
}

GristApiKey.prototype.render = function () {
  this.element.innerHTML = `
    <div class="d-flex align-items-center justify-content-between gap-3 mb-2">
      <label class="mb-0 text-muted" for="grist-api-key-input">
        Cle API GRIST <span aria-hidden="true">ⓘ</span>
      </label>
      <a href="${this.gristApiKeyHelpUrl}" target="_blank" class="small" style="color: #8c3dff;">Recuperer ma cle API GRIST</a>
    </div>
    <div class="d-flex align-items-center gap-3">
      <input
        id="grist-api-key-input"
        type="text"
        class="form-control"
        placeholder="Entrez votre cle API GRIST"
        value=""
        readonly
      >
      <button
        type="button"
        id="grist-valid-key-btn"
        class="btn btn-outline-primary"
        style="border-color: #b57aff; color: #8c3dff; border-radius: 10px;"
      >
        Valider
      </button>
    </div>
    <div
      id="grist-api-key-alert"
      class="alert alert-warning mt-3 mb-0 d-none"
      role="alert"
    >
      Clé API GRIST non recupérée automatiquement. Saisissez-la manuellement.
    </div>
  `;

  this.loadApiKey();

  this.element
    .querySelector("#grist-valid-key-btn")
    ?.addEventListener("click", () => this.validateApiKey());

  this.element
    .querySelector("#grist-api-key-input")
    ?.addEventListener("input", () => this.onInvalidApiKey());

  return this.element;
};

export default GristApiKey;
