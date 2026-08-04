// SettingsModule.js - Custom Quill plugin
import { IoMenu, IoTrash } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import ReactDOMServer from "react-dom/server";
import "./SettingsModule.css";

class SettingsModule {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;
    this.toolbar = quill.getModule("toolbar");

    this.menu = null;
    this.button = null;
    this.wrapper = null;
    this.autosaveItem = null; // Reference to the autosave menu item
    this.autosaveStatus = "Off"; // Track current autosave status
    this.init();
  }

  init() {
    setTimeout(() => {
      this.addSettingsDropdown();
      this.setupEventListeners();
    }, 100);
  }

  setupEventListeners() {
    window.addEventListener("autosave-changed", this.handleAutosaveChanged);
  }

  handleAutosaveChanged = (e) => {
    this.autosaveStatus = e.detail; // "On" or "Off"
    this.updateAutosaveLabel();
  };

  updateAutosaveLabel() {
    if (this.autosaveItem) {
      const checkHTML =
        this.autosaveStatus === "On"
          ? ReactDOMServer.renderToString(
              <FaCheck style={{ marginLeft: "30px"}} />
            )
          : "";
      this.autosaveItem.innerHTML = `AutoSave ${checkHTML}`;
    }
  }

  updateDocumentName(newName) {
    this.options.documentName = newName;
  }

  addSettingsDropdown() {
    const toolbar = document.querySelector("#custom-toolbar");
    if (!toolbar || toolbar.querySelector(".settings-dropdown")) return;

    this.wrapper = document.createElement("div");
    this.wrapper.className = "toolbar-group settings-dropdown";
    this.wrapper.style.position = "relative";

    this.button = document.createElement("button");
    const iconHTML = ReactDOMServer.renderToString(<IoMenu />);
    this.button.innerHTML = iconHTML;

    this.menu = document.createElement("div");
    this.menu.className = "settings-menu";
    this.menu.style.display = "none";

    const items = [
      { value: "autosave", isAutosave: true },
      { label: "Save", value: "save" },
      { label: "Save as PDF", value: "pdf" },
      { label: "Save as DOCX", value: "docx" },
      { label: "Save as Text", value: "txt" },
      { label: "Remove", value: "delete" },
    ];

    items.forEach((item) => {
      const opt = document.createElement("div");

      if (item.isAutosave) {
        const checkHTML =
          this.autosaveStatus === "On"
            ? ReactDOMServer.renderToString(
                <FaCheck style={{ marginLeft: "40px" }} />
              )
            : "";
        opt.innerHTML = `AutoSave ${checkHTML}`;
        this.autosaveItem = opt; // Store reference for updates
      } else if (item.value === "delete") {
        opt.classList.add("danger-item");
        opt.innerHTML = `Remove ${ReactDOMServer.renderToString(
          <IoTrash style={{ marginLeft: "40px" }} />
        )}`;
      } else {
        opt.textContent = item.label;
      }

      opt.dataset.value = item.value;
      opt.dataset.label = opt.innerHTML;

      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleOption(item.value, opt);
      });

      this.menu.appendChild(opt);
    });

    this.button.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    document.addEventListener("click", this.handleClickOutside);

    this.wrapper.appendChild(this.button);
    this.wrapper.appendChild(this.menu);
    toolbar.appendChild(this.wrapper);
  }

  toggleMenu() {
    const isOpen = this.menu.style.display === "block";
    this.menu.style.display = isOpen ? "none" : "block";
  }

  closeMenu() {
    if (this.menu) this.menu.style.display = "none";
  }

  handleClickOutside = (e) => {
    if (this.menu && this.button && !this.wrapper.contains(e.target)) {
      this.closeMenu();
    }
  };

  getDocumentNameViaEvent() {
    return new Promise((resolve) => {
      const handleResponse = (e) => {
        window.removeEventListener("document-name-response", handleResponse);
        resolve(e.detail.name);
      };

      window.addEventListener("document-name-response", handleResponse);
      window.dispatchEvent(new CustomEvent("get-document-name"));
    });
  }

  // Swaps a menu item's label for a spinner and dims its siblings while a
  // slow export (pdf/docx) runs, instead of the menu just closing and
  // leaving the user guessing whether anything happened.
  setItemLoading(itemEl, isLoading) {
    if (!itemEl) return;
    if (isLoading) {
      itemEl.innerHTML = `<span class="nb-spinner"></span> Working...`;
      itemEl.classList.add("settings-item-loading");
      this.menu.classList.add("menu-busy");
    } else {
      itemEl.innerHTML = itemEl.dataset.label ?? itemEl.innerHTML;
      itemEl.classList.remove("settings-item-loading");
      this.menu.classList.remove("menu-busy");
    }
  }

  handleOption(option, itemEl) {
    const content = this.quill.root.innerHTML;
    const text = this.quill.getText();

    this.getDocumentNameViaEvent().then((name) => {
      switch (option) {
        case "autosave":
          window.dispatchEvent(new CustomEvent("auto-save"));
          this.closeMenu();
          break;
        case "save":
          window.dispatchEvent(new CustomEvent("manual-save"));
          this.closeMenu();
          break;
        case "pdf":
          this.setItemLoading(itemEl, true);
          this.exportAsPDF(content, name).finally(() => {
            this.setItemLoading(itemEl, false);
            this.closeMenu();
          });
          break;
        case "docx":
          this.setItemLoading(itemEl, true);
          this.exportAsDocx(content, name).finally(() => {
            this.setItemLoading(itemEl, false);
            this.closeMenu();
          });
          break;
        case "txt":
          this.exportAsText(text, name);
          this.closeMenu();
          break;
        case "delete":
          window.dispatchEvent(new CustomEvent("delete-note"));
          this.closeMenu();
          break;
        default:
          this.closeMenu();
          break;
      }
    });
  }

  exportAsPDF(content, name) {
    return import("html2pdf.js").then((html2pdf) =>
      html2pdf
        .default()
        .from(content)
        .set({
          margin: 0.5,
          filename: `${name}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .save(),
    );
  }

  exportAsDocx(content, name) {
    return import("html-docx-js/dist/html-docx").then((htmlDocx) => {
      const doc = htmlDocx.default.asBlob(content);
      const url = URL.createObjectURL(doc);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  exportAsText(text, name) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  destroy() {
    document.removeEventListener("click", this.handleClickOutside);
    window.removeEventListener("autosave-changed", this.handleAutosaveChanged);
  }
}

export default SettingsModule;
