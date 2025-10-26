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

  #dedent = true;
  #display = 'converted';
  #file;
  #options = {};
  #sanitize = false;

  // Private

  #abortController;
  #converter;
  #dataUrls = {};
  #markdown;
  #showdown;
  #dompurify;

  // Public

  /**
   * The URL to load the DOMPurify library from.
   * @type {string}
  */
  dompurifyUrl = 'https://cdn.jsdelivr.net/npm/dompurify@3.3.0/+esm';

  /**
   * The URL to load the Showdown library from.
   * @type {string}
  */
  showdownUrl = 'https://cdn.jsdelivr.net/npm/showdown@2.1.0/+esm';

  static observedAttributes = [
    'dedent',
    'display',
    'file',
    'options',
    'sanitize'
  ]


  constructor() {
    super();
  }

  // Lifecycle

  attributeChangedCallback(attr, oldval, newval) {
    if (oldval === newval) return;

    switch (attr) {
    case 'dedent':
      this.#dedent = newval !== false && newval !== 'false';
      break;
    case 'display':
      this.#display = newval;
      break;
    case 'file':
      this.#file = newval;
      break;
    case 'options':
      try {
        this.#options = JSON.parse(newval);
      } catch (error) {
        console.error('Error: Failed to parse options. Make sure it is a valid JSON formatted string.');
      }
      break;
    case 'sanitize':
      this.#sanitize = newval !== false && newval !== 'false';
      break;
    }
  }

  connectedCallback() {
    this.#abortController = new AbortController();
    this.#init();
  }

  disconnectedCallback() {
    this.#abortController.abort();
    this.#converter = null;
    this.#showdown = null;
    this.#dompurify = null;
    if (this.#file instanceof URL) {
      URL.revokeObjectURL(this.#file);
    }
  }

  // Public

  // Private

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
   * @async
   * @param {string} html The HTML to sanitize.
   * @returns {Promise<string>} The sanitized HTML.
   * @private
   */
  async #doSanitize(html) {
    if (!this.#dompurify) {
        throw new Error('DOMPurify not found!.');
    }

    return this.#dompurify.sanitize(html);
  }

  async #setAssets() {
    let file, showdown, dompurify;
    const promises = [];
    showdown = await import(this.showdownUrl);
    promises.push(showdown);

    if (this.file) {
      file = await fetch(this.#file);
      promises.push(file);
    } else if (this.textContent.trim().length > 0) {
      const blob = new Blob([this.textContent.trim()], { type: 'text/markdown' });
      file = await fetch(URL.createObjectURL(blob));
      this.#file = file;
    }

    if (this.#sanitize) {
      dompurify = await import(this.dompurifyUrl);
      promises.push(dompurify);
    }

    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`Failed to fetch: ${result.value.url}`)
      }
    }

    this.#markdown = await file.text();
    this.#showdown = showdown.default;
    if (dompurify) this.#dompurify = dompurify.default;
  }

  async #init() {
    await this.#setAssets();
    this.#converter = new this.#showdown.Converter(this.#options);
    this.#setOptionProperties();
    this.#render();
  }

  async #render() {
    if (!this.#showdown) throw new Error('Showdown library not found!');
    if (!this.#converter) throw new Error('Showdown converter not initialized!');
    const html = await this.#toHtml(this.#converter, this.#markdown);
    if (this.#display === 'markdown') {
        this.textContent = this.#markdown;
      } else if (this.#display === 'html') {
        this.textContent = html;
      } else {
        this.innerHTML = html;
      }
  }

  #setOptionProperties() {
    if (!this.#showdown || !this.#converter) {
      throw new Error('No markdown converter. Process terminated.')
    }

    const options = this.#converter.getOptions();

    for (const option in options) {
      this[option] = options[option];
    }
  }

  /**
   * Transforms markdown to HTML.
   * @async
   * @private
   * @returns {Promise<string>} The converted HTML.
  */
  async #toHtml() {
    let content = this.#dedent ? this.#doDedent(this.#markdown) : this.#markdown;
    try {
      let html = this.#converter.makeHtml(content);
      if (this.#sanitize) html = await this.#doSanitize(html);
      return html;
    } catch (error) {
      throw new Error(`Error transforming markdown: ${error.message}`, { cause: error });
    }
  }

  // Getters / Setters

  get dedent() { return this.#dedent }
  set dedent(value) {
    this.setAttribute('dedent', value !== 'false' && value !== 'false');
  }

  get display() { return this.#display }
  set display(value) { this.setAttribute('display', value) }

  get file() { return this.#file }
  set file(value) { this.setAttribute('file', value) }

  get options() { return this.#options }
  set options(value) {
    try {
      this.setAttribute('options', JSON.stringify(value));
    } catch (error) {
      console.error('Failed to decode options', error);
    }
  }

  get sanitize() { return this.#sanitize }
  set sanitize(value) { this.setAttribute('sanitize', value !== false && value !== 'false') }
}

if (!customElements.get('a-markdown')) customElements.define('a-markdown', AMarkdown);
