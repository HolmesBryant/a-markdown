/**
 * @class AMarkdown
 * @extends HTMLElement
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license MIT
 * @version 2.0.0
 * @summary A custom HTML element that fetches, converts and displays a Markdown file as HTML.
 *
 * @description
 * The `a-markdown` element fetches a markdown file from a specified URL,
 * converts it to HTML using the Showdown.js library, and renders the result
 * inside its Shadow DOM. It provides caching capabilities to avoid re-fetching
 * files and allows for customization of the Showdown library URL.
 *
 * @example
 * <!-- Basic usage -->
 * <a-markdown file="path/to/your/markdown.md"></a-markdown>
 *
 * @example
 * <!-- Disable caching -->
 * <a-markdown nocache file="path/to/another/markdown.md"></a-markdown>
 *
 * @example
 * <!-- Use a different version of Showdown -->
 * <a-markdown
 *   file="path/to/content.md"
 *   showdown-url="https://cdn.jsdelivr.net/npm/showdown@2.0.0/+esm">
 * </a-markdown>
 */
export default class AMarkdown extends HTMLElement {
  /**
   * Holds the singleton instance of the Showdown converter.
   * @private
   * @type {object | null}
   */
  #converter;

  /**
   * The container element within the Shadow DOM where the HTML is rendered.
   * @type {HTMLElement}
   */
  container;

  /**
   * The URL to import the Showdown ES module from.
   * @private
   * @type {string}
   */
  #showdownUrl = 'https://cdn.jsdelivr.net/npm/showdown@2.1.0/+esm';

  /**
   * A static cache to store the HTML content of fetched files.
   * The key is the file URL and the value is the converted HTML.
   * @static
   * @type {Map<string, string>}
   */
  static fileCache = new Map();

  /**
   * An array of attribute names to observe for changes.
   * The `attributeChangedCallback` will be invoked when these attributes change.
   * @static
   * @returns {string[]}
   */
  static observedAttributes = ['file', 'nocache', 'showdown-url'];

  /**
   * The HTML and CSS template for the component's Shadow DOM.
   * @static
   * @type {string}
   */
  static template = `
    <style>
      :host {
        --border-color: silver;
        --link-color: dodgerblue;
        --code-color: gray;

        display: block;
        overflow: auto;
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 5px;
      }

      a {
        color: var(--link-color);
        font-weight: bold;
        text-decoration: underline;
      }

      a:hover {
        text-decoration: none;
      }

      code {
        border-radius: 3px;
        color: var(--code-color);
        font-family: "Courier New", ui-monospace;
        padding: 0.2rem 0.4rem;
      }

      pre {
        padding: 1rem;
        border-radius: 5px;
        overflow-x: auto;
      }

      table {
        border-collapse: collapse;
        width: 100%;
      }

      th, td {
        border: 1px solid var(--border-color);
        padding: 8px;
      }

      .error { color: darkred; }
    </style>
    <div id="container"></div>
  `;

  /**
   * Initializes the component by creating a Shadow DOM and attaching the template.
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = AMarkdown.template;
    this.container = this.shadowRoot.querySelector('#container');
  }

  /**
   * A lifecycle callback invoked when one of the observed attributes changes.
   * @param {string} attr - The name of the attribute that changed.
   * @param {string} oldval - The old attribute value.
   * @param {string} newval - The new attribute value.
   */
  attributeChangedCallback(attr, oldval, newval) {
    if (!this.nocache && oldval === newval) return;
    switch (attr) {
      case 'showdown-url':
        this.#showdownUrl = newval;
        this.#converter = null; // Reset converter to force re-import
        AMarkdown.fileCache.clear(); // Clear cache as the converter changed
        // intentional fall-through
      default:
        // Re-render the content
        this.render();
    }
  }

  /**
   * A lifecycle callback invoked when the element is added to the DOM.
   */
  connectedCallback() {
    this.render();
  }

  /**
   * Displays an error message inside the component's container.
   * @param {string} message - The error message to display.
   */
  displayError(message) {
    this.container.innerHTML = `<p class="error"><strong>Error:</strong> ${message}</p>`;
  }

  /**
   * Lazily loads the Showdown converter. The converter is imported and instantiated
   * only on the first call, and the instance is cached for subsequent calls.
   * @returns {Promise<object>} A promise that resolves to the Showdown converter instance.
   * @throws {Error} If the Showdown library fails to load.
   */
  async getConverter() {
    // If the converter has already been loaded, return it immediately.
    if (this.#converter) {
      return this.#converter;
    }

    try {
      const mods = await import(this.#showdownUrl);
      const showdown = mods.default;
      this.#converter = new showdown.Converter({
        tables: true,
        strikethrough: true,
        simpleLineBreaks: true
      });
      return this.#converter;
    } catch (error) {
      throw new Error('Could not load the markdown converter library.');
    }
  }

  /**
   * Fetches the content of the markdown file specified by the URL.
   * @param {string} fileUrl - The URL of the file to fetch.
   * @returns {Promise<string>} A promise that resolves to the text content of the file.
   * @throws {Error} If the file cannot be found or the fetch request fails.
   */
  async getFile(fileUrl) {
    const options = {
      method: 'GET'
    };

    if (this.nocache) {
      // ignore the browser cache
      options.cache = 'reload';
    }

    const response = await fetch(fileUrl, options);
    if (!response.ok) {
      throw new Error(`File not found at ${fileUrl}`);
    }
    return response.text();
  }

  /**
   * The main rendering function. It coordinates the fetching of the markdown file
   * and the converter, performs the conversion, and renders the result.
   * It handles caching to avoid redundant operations.
   * @returns {Promise<void>}
   */
  async render() {
    if (!this.file) {
      this.displayError('No file was provided.');
      return;
    }

    // Use cached content if available and caching is not disabled
    if (!this.nocache && AMarkdown.fileCache.has(this.file)) {
      this.container.innerHTML = AMarkdown.fileCache.get(this.file);
      return;
    }

    try {
      // Fetch the converter and file content concurrently
      const [converter, text] = await Promise.all([
        this.getConverter(),
        this.getFile(this.file)
      ]);

      const html = converter.makeHtml(text);
      this.container.innerHTML = html;
      // Cache the result
      AMarkdown.fileCache.set(this.file, html);
    } catch (error) {
      console.error(error);
      this.displayError(error.message);
    }
  }

  /**
   * Gets the value of the `file` attribute.
   * @returns {string | null}
   */
  get file() { return this.getAttribute('file'); }

  /**
   * Sets the value of the `file` attribute.
   * @param {string} value - The URL of the markdown file.
   */
  set file(value) { this.setAttribute('file', value); }

  /**
   * Gets whether the `nocache` attribute is present.
   * @returns {boolean}
   */
  get nocache() { return this.hasAttribute('nocache') }

  /**
   * Sets or removes the `nocache` attribute.
   * @param {boolean} value - If true, the attribute is added; otherwise, it is removed.
   */
  set nocache(value) {
    this.toggleAttribute('nocache', !!value);
  }

  /**
   * Gets the value of the `showdown-url` attribute.
   * @returns {string | null}
   */
  get showdownUrl() { return this.getAttribute('showdown-url') }

  /**
   * Sets the value of the `showdown-url` attribute.
   * @param {string} value - The URL of the Showdown library.
   */
  set showdownUrl(value) { this.setAttribute('showdown-url', value) }
}


// Define the custom element if it hasn't been defined already.
if (!customElements.get('a-markdown')) {
  customElements.define('a-markdown', AMarkdown);
}
