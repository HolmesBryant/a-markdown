/**
 * @class AMarkdown
 * @extends HTMLElement
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license MIT
 * @version 2.0.2
 * @summary A custom HTML element that fetches, converts and displays a Markdown file or inline Markdown content as HTML.
 *
 * @description
 * The `a-markdown` element fetches a markdown file from a specified URL or uses the inline content,
 * converts it to HTML using the Showdown.js library, and renders the result.
 * It provides caching capabilities to avoid re-fetching and re-converting content
 * and allows for customization of the Showdown library URL.
 *
 * @example
 * <!-- Basic usage with a file -->
 * <a-markdown file="path/to/your/markdown.md"></a-markdown>
 *
 * @example
 * <!-- Basic usage with inline Markdown -->
 * <a-markdown>
 *   # This is a heading
 *
 *   This is a paragraph with some **bold** text.
 * </a-markdown>
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
  // Attributes

  #debug = false;

  /**
   * 'converted', 'markdown', 'html'
   */
  #display = 'converted';

  #file;

  #options = {
    tables: true,
    strikethrough: true,
    simpleLineBreaks: true
  };

  /**
   * The URL to import the Showdown ES module from.
   * @private
   * @type {string}
   */
  #showdownUrl = 'https://cdn.jsdelivr.net/npm/showdown@2.1.0/+esm';

  // Properties

  #abortController;
  #blobUrl;
  /**
   * Holds the singleton instance of the Showdown converter.
   * @private
   * @type {object | null}
   */
  #converter;
  #initialized = false;
  #markdown;
  #showdown;

  static #ta = document.createElement('textarea');

  /**
   * A static cache to store the HTML content of fetched files or inline content.
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
  static observedAttributes = [
    'debug',
    'display',
    'file',
    'nocache',
    'options',
    'showdown-url'
  ];

  /**
   * Initializes the component.
   */
  constructor() {
    super();
  }

  /**
   * A lifecycle callback invoked when one of the observed attributes changes.
   * @param {string} attr - The name of the attribute that changed.
   * @param {string} oldval - The old attribute value.
   * @param {string} newval - The new attribute value.
   */
  attributeChangedCallback(attr, oldval, newval) {
    if (this.debug) {
      console.groupCollapsed(`attributeChangedCallback(${attr})`);
      console.log('oldval', oldval);
      console.log('newval', newval);
    }

    if (oldval === newval) return;
    switch (attr) {
    case 'debug':
        this.#debug = newval !== 'false';
        if (this.debug) console.log(attr, this[attr]);
        break;
      case 'display':
        this.#display = newval;
        if (this.debug) console.log(attr, this[attr]);
        break;
      case 'options':
        const opts = JSON.parse(newval);
        for (const opt in opts) opts[opt] = opts[opt] !== 'false';
        this.#options = { ...this.#options, ...opts};
        if (this.debug) console.log(attr, this[attr]);
        break;
      case 'showdown-url':
        this.#showdownUrl = newval;
        this.#converter = null; // Reset converter to force re-import
        AMarkdown.fileCache.clear(); // Clear cache as the converter changed
        if (this.debug) console.log(attr, this.showdownUrl);
        break;
    }

    if (this.debug) { console.groupEnd() }
    if (this.initialized) this.render();
  }

  /**
   * A lifecycle callback invoked when the element is added to the DOM.
   */
  connectedCallback() {
    this.#abortController = new AbortController();
    // Check if the element has a file attribute. If not, check for inline markdown.
    if (!this.hasAttribute('file') && this.textContent.trim().length > 0) {
      this.renderInlineMarkdown();
    } else {
      this.render();
    }
  }

  /**
   * A lifecycle callback invoked when the element is removed from the DOM.
   * Used here to clean up the Blob URL and prevent memory leaks.
   */
  disconnectedCallback() {
    if (this.#blobUrl) URL.revokeObjectURL(this.#blobUrl);
    this.#abortController.abort();
    this.#abortController = null;
    this.#blobUrl = null;
    this.#converter = null;
    this.#showdown = null;
  }

  /**
   * Displays an error message inside the component's content.
   * @param {string} message - The error message to display.
   */
  displayError(message) {
    this.innerHTML = `<p class="error"><strong>Error:</strong> ${message}</p>`;
  }

  getMetadata() {
    if (!this.#converter) return;
    return this.#converter.getMetadata();
  }

  /**
   * Lazily loads the Showdown converter. The converter is imported and instantiated
   * only on the first call, and the instance is cached for subsequent calls.
   * @returns {Promise<object>} A promise that resolves to the Showdown converter instance.
   * @throws {Error} If the Showdown library fails to load.
   */
  async getConverter() {
    if (!this.nocache && this.#converter) return this.#converter;

    try {
      const showdown = await this.getShowdown();
      this.#converter = new showdown.Converter(this.#options);
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
      method: 'GET',
      headers: {},
      signal: this.#abortController.signal
    };

    if (this.nocache) {
      // ignore the browser cache
      options.cache = 'reload';
      options.headers['Cache-Control'] = 'no-store, no-cache';
    }

    const response = await fetch(fileUrl, options);
    if (!response.ok) {
      throw new Error(`File not found at ${fileUrl}`);
    }
    return response.text();
  }

  async getShowdown() {
    if (!this.nocache && this.#showdown) return this.#showdown;
    try {
      const mods = await import(this.#showdownUrl);
      this.#showdown = mods.default;
      return this.#showdown;
    } catch (error) {
      throw new Error('Could not import Showdown');
    }
  }

  /**
   * The main rendering function. It coordinates the fetching of the markdown file
   * (or inline content via Blob URL) and the converter, performs the conversion, and renders the result.
   * It handles caching to avoid redundant operations.
   * @returns {Promise<void>}
   */
  async render() {
    if (this.debug) {
      console.groupCollapsed('render()');
      console.log('file', this.file);
      console.log('blobUrl', this.#blobUrl);
      console.log('display', this.display);
    }

    let html;

    if (!this.file) {
      this.displayError('No file was provided or inline markdown found.');
      if (this.debug) console.groupEnd();
      return;
    }

    // Use cached content if available and caching is not disabled
    if (!this.nocache && AMarkdown.fileCache.has(this.file)) {
      html = AMarkdown.fileCache.get(this.file);
    } else {
      try {
        // Fetch the converter and file content concurrently
        const [converter, markdown] = await Promise.all([
          this.getConverter(),
          this.getFile(this.file)
        ]);

        this.#markdown = markdown;
        html = this.transformData(converter, markdown);

        if (this.debug) {
          console.log('showdown', this.#showdown);
          console.log('converter', converter);
          console.log('converter options', converter?.getOptions());
          console.groupCollapsed('markdown');
            console.log(markdown);
            console.groupEnd();
          console.groupCollapsed('html');
            console.log(html);
            console.groupEnd();
          console.groupEnd();
        }

      } catch (error) {
        console.error(error);
        if (this.debug) console.groupEnd();
        this.displayError(error.message);
      }
    }

    if (this.#display === 'markdown') {
      this.textContent = this.#markdown;
    } else if (this.#display === 'html') {
      this.textContent = html;
    } else {
      this.innerHTML = html;
    }
  }

  /**
   * Converts the inline markdown content into a Blob URL and triggers the main render method.
   */
  renderInlineMarkdown() {
    // Create a Blob from the inline content
    const blob = new Blob([this.textContent], { type: 'text/markdown' });
    // Create a URL for the Blob
    this.#blobUrl = URL.createObjectURL(blob);
    // Set the file attribute to the Blob URL, which will be handled by the render() method
    this.file = this.#blobUrl;
    this.render();
  }

  sanitize(value) {
    const ta = AMarkdown.#ta;
    ta.textContent = value;
    return ta.textContent;
  }

  setFlavor(value) {
    if (!this.#converter) return;
    this.#options.flavor = value;
    this.#converter.setFlavor(value);
  }

  setOption(event) {
    console.log(event)
    if (this.debug) {
      console.groupCollapsed('setOption()');
      console.log('event', event);
      console.log('event target', event.target);
    }
    const {name, value} = event.target;
    if (this.debug) {
      console.log('name', name);
      console.log('value', value);
    }

    const [prop, sub] = name.split('.');

    if (this.debug) {
      console.log('prop', prop);
      console.log('sub', sub);
    }

    this.options[sub] = event.target.checked;

    if (this.debug) {
      console.log(`options[${sub}]`, this.options[sub]);
      console.groupEnd();
    }

    this.render();
  }

  transformData(converter, markdown) {
    if (this.debug) {
      console.groupCollapsed('transformData()');
      console.log('converter options', converter.getOptions());
    }

    let html;

    markdown = this.sanitize(markdown);

    if (this.debug) {
      console.groupCollapsed('markdown');
        console.log(markdown);
        console.groupEnd();
    }

    try {
      html = converter.makeHtml(markdown);
      if (this.debug) {
        console.groupCollapsed('html');
          console.log(html);
          console.groupEnd();
        console.groupEnd();
      }
    } catch (error) {
      if (this.debug) console.groupEnd();
      this.displayError(`Error transforming markdown. ${error.message}`);
      throw error;
    }

    AMarkdown.fileCache.set(this.file, html);
    return html;
  }

  get debug() { return this.#debug }
  set debug(value) { this.setAttribute('debug', value) }

  get display() { return this.#display }
  set display(value) {
    this.setAttribute('display', value)
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

  get options() { return this.#options }
  set options(value) {
    this.setAttribute('options', JSON.stringify(value))
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
