/**
 * Single file upload block.
 *
 * Usage:
 * `const upload = new mv.components.uploadFile({ accept: [".csv", ".xlsx"] });`
 * `target.appendChild(upload.render());`
 */
let uploadFileInstanceId = 0;

const normalizeAccept = (accept) => {
  if (Array.isArray(accept)) {
    return accept.join(",");
  }

  return accept || ".csv,.xls,.xlsx";
};

const UploadFile = function (options = {}) {
  uploadFileInstanceId += 1;

  this.id = `upload-file-${uploadFileInstanceId}`;
  this.accept = normalizeAccept(options.accept || options.acceptedFormats);
  this.placeholder =
    options.placeholder ||
    "Glissez-deposez un fichier CSV ou Excel,\nou selectionnez un fichier\nLe fichier doit contenir une information geographique (adresse, code administratif ou coordonnees X/Y).";
  this.buttonLabel = options.buttonLabel || "Choisir un fichier";
  this.verifyFile = options.verifyFile || null;
  this.onChange = options.onChange || function () {};
  this.file = null;
  this.verification = null;
  this.verificationToken = 0;

  this.element = document.createElement("div");
  this.element.className = "upload-files";
};

UploadFile.prototype.setFiles = function (files) {
  const [file = null] = Array.from(files || []);
  const verificationToken = this.verificationToken + 1;

  this.verificationToken = verificationToken;
  this.file = file;
  this.verification = null;
  this.update();

  if (!this.file || typeof this.verifyFile !== "function") {
    this.onChange(this.file, this.verification);
    return;
  }

  this.setVerification({
    status: "pending",
    message: "Verification du fichier...",
  });

  Promise.resolve(this.verifyFile(this.file))
    .then((result) => {
      if (this.verificationToken !== verificationToken) {
        return;
      }

      this.setVerification({
        status: result?.valid ? "valid" : "invalid",
        message: result?.message || "Verification terminee.",
        result,
      });
      this.onChange(this.file, result);
    })
    .catch((error) => {
      if (this.verificationToken !== verificationToken) {
        return;
      }

      const result = {
        valid: false,
        reason: "verification_error",
        message: "Impossible de verifier le fichier.",
      };

      this.setVerification({
        status: "invalid",
        message: result.message,
        result,
      });
      this.onChange(this.file, result);
      console.error("Error verifying uploaded file:", error);
    });
};

UploadFile.prototype.setVerification = function (verification) {
  this.verification = verification;
  this.update();
};

UploadFile.prototype.update = function () {
  const placeholder = this.element.querySelector(".upload-files__placeholder");
  const status = this.element.querySelector(".upload-files__status");
  const dropzone = this.element.querySelector("[data-upload-dropzone]");

  if (!placeholder) {
    return;
  }

  dropzone?.classList.remove(
    "upload-files__dropzone--valid",
    "upload-files__dropzone--invalid",
    "upload-files__dropzone--pending"
  );

  if (status) {
    status.textContent = "";
    status.className = "upload-files__status d-none";
  }

  if (!this.file) {
    placeholder.textContent = this.placeholder;
    return;
  }

  placeholder.textContent = this.file.name;

  if (!status || !dropzone) {
    return;
  }

  dropzone.classList.toggle(
    "upload-files__dropzone--valid",
    this.verification?.status === "valid"
  );
  dropzone.classList.toggle(
    "upload-files__dropzone--invalid",
    this.verification?.status === "invalid"
  );
  dropzone.classList.toggle(
    "upload-files__dropzone--pending",
    this.verification?.status === "pending"
  );

  if (!this.verification?.message) {
    return;
  }

  status.textContent = this.verification.message;
  status.className = `upload-files__status upload-files__status--${this.verification.status}`;
};

UploadFile.prototype.render = function () {
  this.element.innerHTML = `
    <div class="upload-files__dropzone" data-upload-dropzone>
      <p class="upload-files__placeholder"></p>
      <input
        id="${this.id}"
        type="file"
        class="d-none"
      >
      <button type="button" class="upload-files__button" data-upload-button></button>
      <p class="upload-files__status d-none"></p>
    </div>
  `;

  const input = this.element.querySelector(`#${this.id}`);
  const button = this.element.querySelector("[data-upload-button]");
  const dropzone = this.element.querySelector("[data-upload-dropzone]");

  input?.setAttribute("accept", this.accept);
  if (button) {
    button.textContent = this.buttonLabel;
  }

  button?.addEventListener("click", () => input?.click());
  input?.addEventListener("change", () => this.setFiles(input.files));

  dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("upload-files__dropzone--dragover");
  });

  dropzone?.addEventListener("dragleave", () => {
    dropzone.classList.remove("upload-files__dropzone--dragover");
  });

  dropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("upload-files__dropzone--dragover");

    if (event.dataTransfer?.files?.length) {
      this.setFiles(event.dataTransfer.files);
    }
  });

  this.update();

  return this.element;
};

export default UploadFile;
