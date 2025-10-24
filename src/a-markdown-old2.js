/**
 * @class AMarkdown
 * @extends HTMLElement
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license MIT
 * @version 2.0.1
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

  #debug;

  /**
   * 'converted', 'markdown', 'html'
   */
  #display = 'converted';

  #file;

  #nocache;

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
   * The key is the file URL or the inline markdown and the value is the converted HTML.
   * @static
   * @type {Map<string, string>}
   */
  static contentCache = new Map();

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
    'showdown-url',
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
      console.groupCollapsed(`attributeChangedCallback(${attr})`)
    }

    if (!this.nocache && oldval === newval) return;
    switch (attr) {
      case 'debug':
        this.#debug = newval !== 'false';
        break;
      case 'display':
        this.#display = newval;
        break;
      case 'options':
        this.#options = { ...this.#options,
          ...JSON.parse(newval)
        };
        break;
      case 'showdown-url':
        this.#showdownUrl = newval;
        this.#converter = null; // Reset converter to force re-import
        AMarkdown.contentCache.clear(); // Clear cache as the converter changed
        break;
    }

    if (this.debug) console.log({attr:attr, oldval:oldval, newval:newval, nocache:this.nocache});

    if (this.debug) console.groupEnd();

    // Re-render the content
    if (this.#initialized) this.render();
  }

  /**
   * A lifecycle callback invoked when the element is added to the DOM.
   */
  connectedCallback() {
    if (this.debug) {
      console.groupCollapsed('connectedCallback');
      console.log({innerHTMLLength: this.innerHTML.length})
      console.groupEnd();
    }

    // if file attribute exists, render
    if (this.file) {
      this.render();
    } else {
      // check if element contains markdown
      if (this.innerHTML.trim().length > 0) {
        this.renderInlineMarkdown();
      } else {
        // throw error
        throw new Error('Component needs either markdown text or a file url')
      }
    }

    this.#initialized = true;
  }

  /**
   * Displays an error message inside the component's content.
   * @param {string} message - The error message to display.
   */
  displayError(message) {
    if (this.debug) {
      console.groupCollapsed('displayError()');
      console.log(message);
      console.groupEnd();
    }

    this.innerHTML = `<p class="error"><strong>Error:</strong> ${message}</p>`;
  }

  getMetadata() {
    if (this.debug) {
      console.groupCollapsed('getMetadata()');
      console.log(this.#converter);
      console.groupEnd()
    }

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
    if (this.debug) {
      console.groupCollapsed('getConverter()');
      console.log('nocache', this.nocache);
      // console.log('converter', this.#converter);
    }

    if (!this.nocache && this.#converter) return this.#converter;

    try {
      const showdown = await this.getShowdown();
      this.#converter = new showdown.Converter(this.#options);

      if (this.debug) {
        console.log('options', this.#options);
        console.log('showdown', showdown);
        console.log('converter', this.#converter);
        console.groupEnd();
      }

      return this.#converter;
    } catch (error) {
      console.groupEnd();
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
    if (this.debug) {
      console.groupCollapsed('getFile()');
      console.log('fileUrl', fileUrl);
      console.groupEnd();
    }

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

    if (this.debug) console.debug({fetchOptions:options, nocache:this.nocache, fileUrl:fileUrl});
    return response.text();
  }

  async getShowdown() {
    if (this.debug) {
      console.groupCollapsed('getShowdown()');
      console.log('nocache', this.nocache);
    }

    if (!this.nocache && this.#showdown) return this.#showdown;
    try {
      const mods = await import(this.#showdownUrl);
      if (this.debug) {
        console.log('mods', mods);
        console.log('default mod', mods.default)
      }

      this.#showdown = mods.default;
      if (this.debug) {
        console.log('showdown', this.#showdown);
        console.groupEnd()
      }
      return this.#showdown;
    } catch (error) {
      if (this.debug) console.groupEnd();
      throw new Error('Could not import Showdown', {cause:error});
    }
  }

  /**
   * The main rendering function for file-based markdown. It coordinates the fetching of the markdown file
   * and the converter, performs the conversion, and renders the result.
   * It handles caching to avoid redundant operations.
   * @returns {Promise<void>}
   */
  async render() {
    if (this.debug) {
      console.groupCollapsed('render()');
      console.log('this.file', this.file);
      console.log('nocache', this.nocache);
    }

    let html;

    if (!this.file) {
      // If there's no file and no inline content, display an error.
      if (this.innerHTML.trim().length === 0) {
        this.displayError('No file was provided and no inline markdown was found.');
      }
      if (this.debug) console.groupEnd();
      return;
    }

    // Use cached content if available and caching is not disabled
    if (!this.nocache && AMarkdown.contentCache.has(this.file)) {
      html = AMarkdown.contentCache.get(this.file);
    } else {
      try {
        // Fetch the converter and file content concurrently
        const [converter, markdown] = await Promise.all([
          this.getConverter(),
          this.getFile(this.file)
        ]);

        this.#markdown = markdown;
        html = this.transformData(converter, markdown, this.file);

      } catch (error) {
        console.error(error);
        if (this.debug) console.groupEnd();
        this.displayError(error.message);
      }
    }

    if (this.debug) console.log('display', this.#display);

    if (this.#display === 'markdown') {
      this.textContent = this.#markdown;
    } else if (this.#display === 'html') {
      this.textContent = html;
    } else {
      this.innerHTML = html;
    }

    if (this.debug) console.groupEnd();
  }

  /**
   * Renders the inline markdown content of the element.
   * @returns {Promise<void>}
   */
  async renderInlineMarkdown() {
    if (this.debug) console.groupCollapsed('renderInlineMarkdown()');

    let html;
    const inlineMarkdown = this.innerHTML;

    if (this.debug) {
      console.log('nocache', this.nocache);
      console.log('display', this.#display);
      console.groupCollapsed('inlineMarkdown');
        console.log(inlineMarkdown);
        console.groupEnd();
    }

    /*if (!this.nocache && AMarkdown.contentCache.has(inlineMarkdown)) {
      html = AMarkdown.contentCache.get(inlineMarkdown);
    } else {
      try {
        const converter = await this.getConverter();
        this.#markdown = inlineMarkdown;
        html = this.transformData(converter, inlineMarkdown, inlineMarkdown);
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
    }*/

    if (this.debug) console.groupEnd();
  }

  sanitize(value) {
    if (this.debug) {
      console.groupCollapsed('sanitize()');
    }

    const ta = AMarkdown.#ta;
    ta.textContent = value;

    if (this.debug) {
      console.log(ta.innerHTML);
      console.groupEnd();
    }

    return ta.innerHTML;
  }

  setFlavor(value) {
    if (this.debug) {
      console.groupCollapsed('setFlavor()');
      console.log('value', value);
      console.log('converter', this.#converter);
    }

    if (!this.#converter) return;
    this.#options.flavor = value;
    this.#converter.setFlavor(value);

    if (this.debug) {
      console.log('options.flavor', this.#options.flavor);
      console.groupEnd();
    }
  }

  setOption(event) {
    if (this.debug) {
      console.groupCollapsed('setOption()');
      console.log('event', event);
    }

    try {
      const { name, value } = event.target;
      const [prop, sub] = name.split('.');
      this.#options[sub] = event.target.checked;
    } catch (error) {
      console.error(error, this);
      if (this.debug) console.groupEnd();
      return;
    }

    this.render();
  }

  transformData(converter, markdown, cacheKey) {
    if (this.debug) {
      console.groupCollapsed(`transformData()`);
    }

    markdown = this.sanitize(markdown);
    const html = converter.makeHtml(markdown);

    if (this.debug) {
      console.log('cacheKey', cacheKey);
      console.log('converter', converter);
      console.groupCollapsed('markdown');
        console.log(markdown);
        console.groupEnd();
      console.groupCollapsed('html');
        console.log(html);
        console.groupEnd();
      console.groupEnd();
    }

    AMarkdown.contentCache.set(cacheKey, html);

    return html;
  }

  get debug() { return this.hasAttribute('debug') }
  set debug(value) { this.toggleAttribute('debug', !!value) }

  get display() {
    return this.#display
  }
  set display(value) {
    this.setAttribute('display', value)
  }

  /**
   * Gets the value of the `file` attribute.
   * @returns {string | null}
   */
  get file() {
    return this.getAttribute('file');
  }

  /**
   * Sets the value of the `file` attribute.
   * @param {string} value - The URL of the markdown file.
   */
  set file(value) {
    this.setAttribute('file', value);
  }

  /**
   * Gets whether the `nocache` attribute is present.
   * @returns {boolean}
   */
  get nocache() {
    return this.hasAttribute('nocache')
  }

  /**
   * Sets or removes the `nocache` attribute.
   * @param {boolean} value - If true, the attribute is added; otherwise, it is removed.
   */
  set nocache(value) {
    this.toggleAttribute('nocache', !!value);
  }

  get options() {
    return this.#options
  }
  set options(value) {
    this.setAttribute('options', JSON.stringify(value))
  }

  /**
   * Gets the value of the `showdown-url` attribute.
   * @returns {string | null}
   */
  get showdownUrl() {
    return this.getAttribute('showdown-url')
  }

  /**
   * Sets the value of the `showdown-url` attribute.
   * @param {string} value - The URL of the Showdown library.
   */
  set showdownUrl(value) {
    this.setAttribute('showdown-url', value)
  }
}


// Define the custom element if it hasn't been defined already.
if (!customElements.get('a-markdown')) {
  customElements.define('a-markdown', AMarkdown);
}
