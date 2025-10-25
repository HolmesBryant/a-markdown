/**
 * @class AMarkdown
 * @extends HTMLElement
 * @author Holmes Bryant https://github.com/HolmesBryant
 * @license MIT
 * @version 1.0.0
 * @summary A custom HTML element that fetches, converts and displays a Markdown file or inline Markdown content as HTML.
*/
export default class AMarkdown extends HTMLElement {
  // Attributes

  /**
   * Whether to remove leading whitespace from the markdown content.
   * @private
   * @type {boolean}
   * @default true
  */
  #dedent = true;

  /**
   *How to display the content. Can be 'converted', 'markdown', or 'html'.
   *@private
   *@type {string}
   *@default 'converted'
  */
  #display = 'converted';

  /**
   * The URL of the markdown file to fetch.
   * @private
   * @type {string | undefined}
  */
  #file;

  /**
   * Whether to bypass the cache when fetching the markdown file.
   * @private
   * @type {boolean}
   * @default false
  */
  #nocache = false;

  /**
   * Options to pass to the Showdown converter.
   * @private
   * @type {object}
   * @see https://github.com/showdownjs/showdown#options
  */
  #options = {
  tables: true,
  strikethrough: true,
  simpleLineBreaks: true
  };

  /**
   * Whether to sanitize the converted HTML using DOMPurify.
   * @private
   * @type {boolean}
   * @default false
  */
  #sanitize = false;

  /**
   * The URL to load the Showdown library from.
   * @private
   * @type {string}
  */
  #showdownUrl = 'https://cdn.jsdelivr.net/npm/showdown@2.1.0/+esm';

  /**
   * The URL to load the DOMPurify library from.
   * @private
   * @type {string}
  */
  #dompurifyUrl = 'https://cdn.jsdelivr.net/npm/dompurify@3.3.0/+esm';

  // Private Properties
  /**
   * Abort controller for fetch requests.
   * @private
   * @type {AbortController | undefined}
  */
  #abortController;

  /**
   * The URL created from inline markdown content.
   * @private
   * @type {string | undefined}
   */
  #blobUrl;

  /**
   * The key used for caching the converted HTML.
   * @private
   * @type {string | undefined}
  */
  #cacheKey;

  /**
   * The Showdown converter instance.
   * @private
   * @type {object | undefined}
  */
  #converter;

  /**
   * The DOMPurify instance.
   * @private
   * @type {object | undefined}
  */
  #dompurify;

  /**
   * Whether the component has been initialized.
   * @private
   * @type {boolean}
  */
  #initialized = false;

  /**
   * Whether the component is currently initializing.
   * @private
   * @type {boolean}
  */
  #isInitializing = false;

  /**
   * The fetched markdown content.
   * @private
   * @type {string | undefined}
  */
  #markdown;

  /**
   * The mutation observer for inline content changes.
   * @private
   * @type {MutationObserver | undefined}
  */
  #mutationObserver;

  /**
   * The ID of the render debounce timeout.
   * @private
   * @type {number | null}
  */
  #renderDebounceId = null;

  /**
   * The Showdown library module.
   * @private
   * @type {object | undefined}
  */
  #showdown;

  // Public Static Properties

  /**
   * A cache for converted markdown files.
   * @static
   * @type {Map<string, string>}
  */
  static fileCache = new Map();

  /**
   * The observed attributes for the custom element.
   * @static
   * @type {string[]}
  */
  static observedAttributes = [
    'dedent',
    'display',
    'dompurify-url',
    'file',
    'nocache',
    'options',
    'sanitize',
    'showdown-url',
  ];

  /**
   * Creates an instance of AMarkdown.
  */
  constructor() {
    super();
  }

  // Lifecycle

  /**
   * Called when the element is added to the document.
   * @private
  */
  connectedCallback() {
    this.#abortController = new AbortController();
    this.#setMutationObserver();
    this.#init();
  }

  /**
   * Called when the element is removed from the document.
   * @private
  */
  disconnectedCallback() {
    if (this.#blobUrl) URL.revokeObjectURL(this.#blobUrl);
    if (this.#renderDebounceId) clearTimeout(this.#renderDebounceId);
    if (this.#mutationObserver) this.#mutationObserver.disconnect();
    this.#abortController?.abort();
  }

  /**
   * Called when an observed attribute changes.
   * @private
   * @param {string} attr The attribute name.
   * @param {string} oldval The old attribute value.
   * @param {string} newval The new attribute value.
  */
  attributeChangedCallback(attr, oldval, newval) {
    if (oldval === newval || !this.#initialized) return;

    const reInit = new Set(['file', 'showdown-url']);
    const reRender = new Set(['dedent', 'display', 'dompurify-url', 'nocache', 'options', 'sanitize']);

    switch (attr) {
      case 'dedent':
        this.#dedent = newval !== null && newval !== 'false';
        break;
      case 'display':
        this.#display = newval;
        break;
      case 'dompurify-url':
        this.#dompurifyUrl = newval;
        this.#dompurify = null; // Invalidate to reload
        break;
      case 'file':
        this.#file = newval;
        break;
      case 'nocache':
        this.#nocache = newval !== null && newval !== 'false';
        break;
      case 'options':
        try {
          this.#options = { ...this.#options, ...JSON.parse(newval) };
          this.#converter = null; // Invalidate to recreate
        } catch (error) {
          console.error('Failed to parse "options" attribute.', error);
        }
        break;
      case 'sanitize':
        this.#sanitize = newval !== null && newval !== 'false';
        break;
      case 'showdown-url':
        this.#showdownUrl = newval;
        this.#showdown = null; // Invalidate to reload
        this.#converter = null;
        break;
    }

    if (reInit.has(attr)) {
      this.#init();
    } else if (reRender.has(attr)) {
      this.#debounceRender();
    }
  }

  // Public

  setOption(event) {
    const checkable = ['checkbox', 'radio'];
    let {name, value} = event.target;

    if (!name) {
      console.error('setOption requires that event.target has a `name` attribute');
    }

    if (checkable.indexOf(event.target.type) > -1) {
      value = event.target.checked;
    } else {
      value = value !== null && value !== 'false';
    }

    const [prop, sub] = name.split('.');

    if (sub) {
      this[prop][sub] = event.target.value;
    } else {
      this[prop] = value;
    }

    this.#converter = null;
    AMarkdown.fileCache.delete(this.#cacheKey)
    this.#init();
  }

  // Private

  /**
   * Initializes the component by fetching and rendering the markdown.
   * @private
   * @async
   */
  async #init() {
    if (this.#isInitializing) return;
    this.#isInitializing = true;

    // Prioritize the 'file' attribute as the source of truth
    this.#file = this.getAttribute('file');

    if (!this.#file && this.textContent.trim().length > 0) {
      if (this.#blobUrl) URL.revokeObjectURL(this.#blobUrl);
      this.#file = this.#convertToBlobUrl(this.textContent);
    }

    if (!this.#file) {
        this.#displayError("A 'file' attribute or inline content is required.");
        this.#isInitializing = false;
        // Mark as initialized to allow future attribute changes
        this.#initialized = true;
        return;
    }

    this.#cacheKey = `${this.#showdownUrl}:${this.#file}`;

    try {
      // Ensure Showdown and the converter are ready
      if (!this.#showdown) this.#showdown = await this.#getShowdown();
      if (!this.#converter) this.#converter = this.#getConverter(this.#showdown);

      // Fetch the markdown content
      this.#markdown = await this.#getFile(this.#file);

      // Now render
      await this.#render();
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.#displayError(error.message);
        console.error("Initialization failed", error);
      }
    } finally {
        this.#initialized = true;
        this.#isInitializing = false;
    }
  }

  /**
   * Converts a string to a blob URL.
   * @param {string} str The string to convert.
   * @returns {string} The blob URL.
   * @private
  */
  #convertToBlobUrl(str) {
    const blob = new Blob([str], { type: 'text/markdown' });
    return URL.createObjectURL(blob);
  }

  /**
   * Debounces the render method.
   * @param {number} [delay=50] The debounce delay in milliseconds.
   * @private
  */
  #debounceRender(delay = 50) {
    clearTimeout(this.#renderDebounceId);
    this.#renderDebounceId = setTimeout(() => this.#render(), delay);
  }

  /**
   * Displays an error message in the element.
   * @param {string} message The error message.
   * @private
  */
  #displayError(message) {
    this.innerHTML = `<p class="error"><strong>Error:</strong> ${message}</p>`;
  }

  /**
   * Removes leading whitespace from a string.
   * @param {string} str The string to dedent.
   * @returns {string} The dedented string.
   * @private
  */
  #doDedent(str) {
    const lines = (str || '').split('\n');
    let minIndent = null;

    for (const line of lines) {
      if (line.trim().length > 0) {
        const indentMatch = line.match(/^(\s*)/);
        const currentIndent = indentMatch?.[0].length ?? 0;
        if (minIndent === null || currentIndent < minIndent) {
          minIndent = currentIndent;
        }
      }
    }
    return (minIndent > 0) ? lines.map(line => line.substring(minIndent)).join('\n') : str;
  }

  /**
   * Sanitizes HTML using DOMPurify.
   * @param {string} html The HTML to sanitize.
   * @returns {Promise<string>} The sanitized HTML.
   * @private
   * @async
  */
  async #doSanitize(html) {
    if (!this.#dompurify) {
      try {
        const mods = await import(this.#dompurifyUrl);
        this.#dompurify = mods.default;
      } catch (error) {
        throw new Error('Could not load DOMPurify', { cause: error });
      }
    }
    return this.#dompurify.sanitize(html);
  }

  /**
   * Gets the Showdown converter instance.
   * @param {object} showdown The Showdown library module.
   * @returns {object} The Showdown converter instance.
   * @private
  */
  #getConverter(showdown) {
    if (!this.#nocache && this.#converter) return this.#converter;
    return new showdown.Converter(this.#options);
  }

  /**
   * Fetches the markdown file.
   * @param {string} fileUrl The URL of the markdown file.
   * @returns {Promise<string>} The markdown content.
   * @private
   * @async
  */
  async #getFile(fileUrl) {
    const options = { method: 'GET', signal: this.#abortController.signal };
    if (this.#nocache) options.cache = 'reload';

    const response = await fetch(fileUrl, options);
    if (!response.ok) {

      throw new Error(`File not found at ${fileUrl}`);
    }
    return response.text();
  }

  /**
   * Gets the Showdown library module.
   * @returns {Promise<object>} The Showdown library module.
   * @private
   * @async
  */
  async #getShowdown() {
    try {
      const mods = await import(this.#showdownUrl);
      return mods.default;
    } catch (error) {
      throw new Error('Could not import Showdown', { cause: error });
    }
  }

  /**
   * Renders the markdown content.
   * @private
   * @async
  */
  async #render() {
    if (!this.#markdown || !this.#converter) {
      if (!this.#markdown) return console.error('no markdown text at time of render');
      if (!this.#converter) return console.error('no converter at time of render');
      return;
    }

    let html;
    const cacheExists = !this.#nocache && AMarkdown.fileCache.has(this.#cacheKey);

    if (cacheExists) {
      html = AMarkdown.fileCache.get(this.#cacheKey);
    } else {
      html = await this.#transformData(this.#converter, this.#markdown);
      AMarkdown.fileCache.set(this.#cacheKey, html);
    }

    if (this.isConnected) {
      if (this.#display === 'markdown') {
        this.textContent = this.#markdown;
      } else if (this.#display === 'html') {
        this.textContent = html;
      } else {
        this.innerHTML = html;
      }
    }
  }

  /**
   * Sets up the mutation observer to watch for inline content changes.
   * @private
  */
  #setMutationObserver() {
    const callback = () => {
      if (!this.hasAttribute('file')) {
        this.#init();
      }
    };
    this.#mutationObserver = new MutationObserver(callback);
    this.#mutationObserver.observe(this, { characterData: true, childList: true, subtree: true });
  }

  /**
   * Transforms markdown to HTML.
   * @async
   * @private
   * @param {object} converter The Showdown converter instance.
   * @param {string} markdown The markdown content.
   * @returns {Promise<string>} The converted HTML.
  */
  async #transformData(converter, markdown) {
    let content = this.#dedent ? this.#doDedent(markdown) : markdown;
    try {
      let html = converter.makeHtml(content);
      if (this.#sanitize) {
        html = await this.#doSanitize(html);
      }
      return html;
    } catch (error) {
      throw new Error(`Error transforming markdown: ${error.message}`, { cause: error });
    }
  }

  // Getters / Setters

  /**
   * Gets the dedent property.
   * @returns {boolean}
  */
  get dedent() { return this.#dedent; }

  /*
   * Sets the dedent property.
   * @param {boolean} value
  */
  set dedent(value) { this.toggleAttribute('dedent', !!value); }

  /**
   * Gets the display property.
   * @returns {string}
  */
  get display() { return this.#display; }

  /*
   * Sets the display property.
   * @param {string} value
  */
  set display(value) { this.setAttribute('display', value); }

  /**
   * Gets the dompurify-url property.
   * @returns {string}
  */
  get dompurifyUrl() { return this.#dompurifyUrl; }

  /*
   * Sets the dompurify-url property.
   * @param {string} value
  */
  set dompurifyUrl(value) { this.setAttribute('dompurify-url', value); }

  /**
   * Gets the file property.
   * @returns {string | null}
  */
  get file() { return this.getAttribute('file'); }

  /*
   * Sets the file property.
   * @param {string} value
  */
  set file(value) { this.setAttribute('file', value); }

  /**
   * Gets the nocache property.
   * @returns {boolean}
  */
  get nocache() { return this.#nocache; }

  /*
   * Sets the nocache property.
   * @param {boolean} value
  */
  set nocache(value) { this.toggleAttribute('nocache', !!value); }

  /**
   * Gets the options property.
   * @returns {object}
  */
  get options() { return this.#options; }

  /*
   * Sets the options property.
   * @param {object | string} value
  */
  set options(value) {
    this.setAttribute('options', typeof value === 'string' ? value : JSON.stringify(value));
  }

  /**
   * Gets the sanitize property.
   * @returns {boolean}
  */
  get sanitize() { return this.#sanitize; }

  /*
   * Sets the sanitize property.
   * @param {boolean} value
  */
  set sanitize(value) { this.toggleAttribute('sanitize', !!value); }

  /**
   * Gets the showdown-url property.
   * @returns {string}
  */
  get showdownUrl() { return this.#showdownUrl; }

  /*
   * Sets the showdown-url property.
   * @param {string} value
  */
  set showdownUrl(value) { this.setAttribute('showdown-url', value); }
}

if (!customElements.get('a-markdown')) {
customElements.define('a-markdown', AMarkdown);
}
