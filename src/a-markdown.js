/**
 * @file A flexible web component that renders Markdown text as HTML.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @version 1.0.0
 * @license MIT
 */
export default class AMarkdown extends HTMLElement {

  // Attributes (have public getters / setters)

  /**
   * Logs several variables to the console if true
   * @type {boolean}
   * @default false
   */
  debug = false;

  /**
   * How to display the content. Can be 'converted', 'markdown', or 'html'.
   * @private
   * @type {string}
   * @default 'converted'
   */
  #display = 'converted';

  /**
   * The URL of the markdown file to fetch.
   * @private
   * @type {string | undefined}
   */
  #file;

  /**
   * Options to pass to the Showdown converter.
   * @private
   * @type {object}
   * @default {tables: true}
   * @see https://github.com/showdownjs/showdown#options
   */
  #options = {
    ellipsis: true,
    encodeEmails: true,
    ghCodeBlocks: true,
    ghCompatibleHeaderId: true,
    ghMentions: true,
    parseImgDimensions: true,
    tables: true,
  };

  /**
   * Whether to sanitize the converted HTML using DOMPurify.
   * @private
   * @type {boolean}
   * @default false
   */
  #sanitize = false;

  ////// Private Properties //////

  /**
   * The Showdown converter instance.
   * @private
   * @type {object | undefined}
   */
  #converter;

  /**
   * The timer ID for the debounce render
   * @private
   * @type {number | null}
   */
  #debounceTimer = null;

  /**
   * Whether to remove leading whitespace from the markdown content.
   * When processing inline Markdown, this is set to true
   * @private
   * @type {boolean}
   * @default true
   */
  #dedent = false;

  /**
   * The DOMPurify instance.
   * @private
   * @type {DOMPurify}
   */
  #dompurify;

  /**
   * The rendered HTML
   * @private
   * @type {string}
   */
  #html;

  /**
   * The fetched markdown content.
   * @private
   * @type {string | undefined}
   */
  #markdown;

  /**
   * The Showdown instance
   * @private
   * @type {Showdown}
   */
  #showdown;

  /**
   * Flag to indicate if the component has finished its initial asynchronous setup.
   * @private
   * @type {boolean}
   */
  #isReady = false;

  ////// Public Properties //////

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

  ////// Static Properties //////

  /**
   * Holds the Showdown library module. Can be set globally.
   * @static
   */
  static Showdown;

  /**
   * Holds the DOMPurify library module. Can be set globally.
   * @static
   */
  static DOMPurify;

  static observedAttributes = [
    'debug',
    'display',
    'file',
    'options',
    'sanitize',
    'backslashEscapesHTMLTags',
    'completeHTMLDocument',
    'disableForced4SpacesIndentedSublists',
    'ellipsis',
    'emoji',
    'encodeEmails',
    'excludeTrailingPunctuationFromURLs',
    'ghCodeBlocks',
    'ghCompatibleHeaderId',
    'ghMentions',
    'ghMentionsLink',
    'headerLevelStart',
    'literalMidWordAsterisks',
    'literalMidWordUnderscores',
    'metadata',
    'noHeaderId',
    'omitExtraWLInCodeBlocks',
    'openLinksInNewWindow',
    'parseImgDimensions',
    'prefixHeaderId',
    'rawPrefixHeaderId',
    'rawHeaderId',
    'requireSpaceBeforeHeadingText',
    'simpleLineBreaks',
    'simplifiedAutoLink',
    'smartIndentationFix',
    'smoothLivePreview',
    'splitAdjacentBlockquotes',
    'strikethrough',
    'tables',
    'tablesHeaderId',
    'tasklists',
    'underline',
  ]

  constructor() {
    super();
  }

  // Lifecycle Methods

  attributeChangedCallback(attr, oldval, newval) {
    if (oldval === newval) return;
    const isBoolean = !(attr in {display:1, file:1, options:1, ghMentionsLink:1});
    const value = isBoolean ? newval !== null && newval !== 'false' : newval;

    if (isBoolean) {
      // For Showdown options, use the centralized setter
      this.#setOption(attr, value);
    } else {
      // Handle the component's own attributes
      switch (attr) {
        case 'debug':
          this.debug = value;
          break;
        case 'display':
          this.#display = value;
          break;
        case 'file':
          this.#file = value;
          break;
        case 'options':
          try {
            // Merge new options with existing ones
            const newOptions = JSON.parse(newval);
            this.#options = { ...this.#options, ...newOptions };
            if (this.#isReady) this.#init(); // Re-initialize if ready
          } catch (error) {
            console.error('Error: Failed to parse options.', error);
          }
          break;
        case 'sanitize':
          this.#sanitize = value;
          this.#getSanitizer();
          break;
      }
    }
  }

  connectedCallback() {
    this.#init();
  }

  disconnectedCallback() {
    clearTimeout(this.#debounceTimer);
    this.#converter = null;
    this.#showdown = null;
    this.#dompurify = null;
    if (this.#file instanceof URL) {
      URL.revokeObjectURL(this.#file);
    }
    this.#file = null;
  }

  // Private Methods

  /**
   * Updates the internal options object immediately.
   * If the component is ready, it also updates the live converter and re-renders.
   * @private
   * @param {string} key The option name.
   * @param {*} value The option value.
   */
  #setOption(key, value) {
    this.#options[key] = value;
    if (this.#isReady) {
      this.#converter.setOption(key, value);
      this.#debouncedRender();
    }
  }

  /**
   * Helper to normalize boolean values from attributes/properties.
   * @private
   */
  #toBool(value) {
    return value !== false && value !== 'false';
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
    const sanitizer = await this.#getSanitizer();
    return sanitizer.sanitize(html);
  }

  /**
   * Lazily loads and returns the DOMPurify sanitizer instance.
   * Returns the instance-level sanitizer if it has already been loaded.
   * Uses `AMarkdown.DOMPurify` if it was provided by the user (for NPM-based projects).
   * Dynamically imports the module, attempting a bare package import ('dompurify') first,
   *    and falling back to the `dompurifyUrl` (CDN) if that fails.
   *
   * Once loaded, it caches the module on the static `AMarkdown.DOMPurify` property to prevent
   * redundant loads by other instances of the component.
   *
   * @private
   * @async
   * @returns {Promise<DOMPurify>} A promise that resolves with the loaded DOMPurify module/instance.
   */
  async #getSanitizer() {
    // 1. Check if DOMPurify was already loaded and stored
    if (this.#dompurify) return this.#dompurify;
    // 2. Check if it was set statically by the user
    if (AMarkdown.DOMPurify) {
        this.#dompurify = AMarkdown.DOMPurify;
        return this.#dompurify;
    }
    // 3. Load it dynamically (NPM with CDN fallback)
    const mods = await this.#loadModule('dompurify', this.dompurifyUrl);
    this.#dompurify = mods.default;
    // Also store it statically for other instances to use
    AMarkdown.DOMPurify = this.#dompurify;
    return this.#dompurify;
  }

  /**
   * Dynamically loads a module, trying a package name first (for NPM)
   * and falling back to a URL (for CDN).
   * @private
   * @param {string} pkgName - The npm package name.
   * @param {string} url - The CDN URL to fall back to.
   * @returns {Promise<object>} The loaded module.
   */
  async #loadModule(pkgName, url) {
    try {
      // First, try to import using the package name. Bundlers will resolve this.
      return await import(pkgName);
    } catch (error) {
      // console.warn(`Could not load module '${pkgName}'. Falling back to CDN: ${url}`);
      // If that fails, import from the CDN URL.
      return await import(url);
    }
  }

  /**
   * Asynchronously loads all necessary assets for the component.
   *
   * Checks if a `Showdown` module has been provided (`AMarkdown.Showdown`).
   * If not, it proceeds to load it dynamically, attempting an NPM import before falling back to the CDN URL.
   *
   * If the `sanitize` property is true, it calls the `#getSanitizer()` method to ensure DOMPurify is loaded.
   *
   * Fetches the markdown source. If the `file` attribute is present, it fetches from that URL.
   * Otherwise, it creates a Blob from the element's `textContent` and fetches from the resulting object URL.
   *
   * @private
   * @async
   * @returns {Promise<void>} A promise that resolves when all assets have been fetched and processed.
   * @throws {Error} Throws an error if the Showdown library fails to load, as it is a critical dependency.
   */
  async #setAssets() {
    let file;
    const promises = [];

    // --- Load Showdown ---
    // Check if it was set statically first
    if (AMarkdown.Showdown) {
      this.#showdown = AMarkdown.Showdown;
    } else {
      // Otherwise, load it dynamically (NPM -> CDN)
      const showdownModule = this.#loadModule('showdown', this.showdownUrl).then(mods => {
        this.#showdown = mods.default;
        AMarkdown.Showdown = this.#showdown; // Cache for other instances
      });
      promises.push(showdownModule);
    }


    // --- Load DOMPurify (if needed) ---
    if (this.#sanitize) {
        // The getSanitizer method now handles the loading logic
        const dompurifyModule = this.#getSanitizer();
        promises.push(dompurifyModule);
    }

    // --- Fetch Markdown Content ---
    if (this.hasAttribute('file')) {
      file = fetch(this.#file);
      this.#dedent = false;
      promises.push(file);
    } else if (this.textContent.trim().length > 0) {
      this.#dedent = true;
      const blob = new Blob([this.textContent], { type: 'text/markdown' });
      file = fetch(URL.createObjectURL(blob));
    }

    // --- Await all concurrent tasks ---
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`Failed to load a required asset.`, result.reason);
      }
    }

    if (file) {
        const markdown = await (await file).text();
        this.#markdown = this.#dedent ? this.#doDedent(markdown) : markdown;
    } else {
        this.#markdown = '';
    }

    if (!this.#showdown) {
        throw new Error('Showdown library could not be loaded.');
    }
  }

  /**
   * Initializes the component.
   * Now uses the #options object that may have been populated before init completes.
   */
  async #init() {
    await this.#setAssets();
    // Use the centrally managed #options object for instantiation
    this.#converter = new this.#showdown.Converter(this.#options);

    await this.#render();

    // Set the ready flag. Any setters called after this point will trigger a re-render.
    this.#isReady = true;
  }

  /**
   * Debounces the render function to prevent rapid updates.
   * @private
   */
  #debouncedRender() {
    clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(() => this.#render(), this.renderDebounce);
  }

  /**
   * Converts markdown and updates the element's content.
   *
   * Transforms the internal markdown string to HTML using the Showdown converter.
   * It then populates the element's DOM based on the current `display` mode
   * ('converted', 'markdown', or 'html').
   *
   * @private
   * @async
   * @returns {Promise<void>} Resolves when rendering is complete.
   * @throws {Error} If Showdown converter is not initialized.
   */
  async #render() {
    if (!this.#showdown) throw new Error('Showdown library not found!');
    if (!this.#converter) throw new Error('Showdown converter not initialized!');
    this.html = await this.#toHtml(this.#converter, this.#markdown);
    if (this.#display === 'markdown') {
      this.textContent = this.#markdown;
    } else if (this.#display === 'html') {
      this.textContent = this.#html;
    } else {
      this.innerHTML = this.#html;
    }
  }

  /**
   * Transforms markdown to HTML.
   * @async
   * @private
   * @returns {Promise<string>} The converted HTML.
  */
  async #toHtml() {
    const content = this.#markdown;
    try {
      let html = this.#converter.makeHtml(content);
      if (this.#sanitize) html = await this.#doSanitize(html);
      return html;
    } catch (error) {
      throw new Error(`Error transforming markdown: ${error.message}`, { cause: error });
    }
  }

  // Getters / Setters

  get display() { return this.#display }
  set display(value) {
    this.setAttribute('display', value);
    this.#display = value; // Update internal state
    if (this.#isReady) this.#debouncedRender(); // Re-render if ready
  }

  get file() { return this.#file }
  set file(value) {
    this.setAttribute('file', value);
    this.#file = value;
    this.#init(); // Changing the file requires a full re-initialization
  }

  get html() { return this.#html }
  set html(value) {
    this.#html = value;
  }

  get markdown() { return this.#markdown }
  set markdown(value) {
    this.#markdown = value;
    // If the component is ready, render the new markdown.
    // If not, #init will pick up this new value when it runs.
    if (this.#isReady) {
      this.#debouncedRender();
    }
  }

  get options() { return this.#options }
  set options(value) {
    this.setAttribute('options', JSON.stringify(value));
  }

  get sanitize() { return this.#sanitize }
  set sanitize(value) {
    const boolValue = this.#toBool(value);
    this.setAttribute('sanitize', boolValue);
    this.#sanitize = boolValue;
    if (this.#isReady) this.#debouncedRender();
  }

  /**************************************************************
  * Showdown Options
  *************************************************************/

  get backslashEscapesHTMLTags() { return this.#options.backslashEscapesHTMLTags }
  set backslashEscapesHTMLTags(value) {
    if (window.abind) abind.update(this, 'backslashEscapesHTMLTags', value);
    this.#setOption('backslashEscapesHTMLTags', this.#toBool(value));
  }

  get completeHTMLDocument() { return this.#options.completeHTMLDocument }
  set completeHTMLDocument(value) {
    if (window.abind) abind.update(this, 'completeHTMLDocument', value);
    this.#setOption('completeHTMLDocument', this.#toBool(value));
  }

  get disableForced4SpacesIndentedSublists() { return this.#options.XXX }
  set disableForced4SpacesIndentedSublists(value) {
    if (window.abind) abind.update(this, 'disableForced4SpacesIndentedSublists', value);
    this.#setOption('disableForced4SpacesIndentedSublists', this.#toBool(value));
  }

  get ellipsis() { return this.#options.ellipsis }
  set ellipsis(value) {
    if (window.abind) abind.update(this, 'ellipsis', value);
    this.#setOption('ellipsis', this.#toBool(value));
  }

  get emoji() { return this.#options.emoji }
  set emoji(value) {
    if (window.abind) abind.update(this, 'emoji', value);
    this.#setOption('emoji', this.#toBool(value));
  }

  get encodeEmails() { return this.#options.encodeEmails }
  set encodeEmails(value) {
    if (window.abind) abind.update(this, 'encodeEmails', value);
    this.#setOption('encodeEmails', this.#toBool(value));
  }

  get excludeTrailingPunctuationFromURLs() { return this.#options.excludeTrailingPunctuationFromURLs }
  set excludeTrailingPunctuationFromURLs(value) {
    if (window.abind) abind.update(this, 'excludeTrailingPunctuationFromURLs', value);
    this.#setOption('excludeTrailingPunctuationFromURLs', this.#toBool(value));
  }

  get ghCodeBlocks() { return this.#options.ghCodeBlocks }
  set ghCodeBlocks(value) {
    if (window.abind) abind.update(this, 'ghCodeBlocks', value);
    this.#setOption('ghCodeBlocks', this.#toBool(value));
  }

  get ghCompatibleHeaderId() { return this.#options.ghCompatibleHeaderId }
  set ghCompatibleHeaderId(value) {
    if (window.abind) abind.update(this, 'ghCompatibleHeaderId', value);
    this.#setOption('ghCompatibleHeaderId', this.#toBool(value));
  }

  get ghMentions() { return this.#options.ghMentions }
  set ghMentions(value) {
    if (window.abind) abind.update(this, 'ghMentions', value);
    this.#setOption('ghMentions', this.#toBool(value));
  }

  get ghMentionsLink() { return this.#options.ghMentionsLink }
  set ghMentionsLink(value) {
    if (window.abind) abind.update(this, 'ghMentionsLink', value);
    this.#setOption('ghMentionsLink', this.#toBool(value));
  }

  get headerLevelStart() { return this.#options.headerLevelStart }
  set headerLevelStart(value) {
    if (window.abind) abind.update(this, 'headerLevelStart', value);
    this.#setOption('headerLevelStart', this.#toBool(value));
  }

  get literalMidWordAsterisks() { return this.#options.literalMidWordAsterisks }
  set literalMidWordAsterisks(value) {
    if (window.abind) abind.update(this, 'literalMidWordAsterisks', value);
    this.#setOption('literalMidWordAsterisks', this.#toBool(value));
  }

  get literalMidWordUnderscores() { return this.#options.literalMidWordUnderscores }
  set literalMidWordUnderscores(value) {
    if (window.abind) abind.update(this, 'literalMidWordUnderscores', value);
    this.#setOption('literalMidWordUnderscores', this.#toBool(value));
  }

  get metadata() { return this.#options.metadata }
  set metadata(value) {
    if (window.abind) abind.update(this, 'metadata', value);
    this.#setOption('metadata', this.#toBool(value));
  }

  get noHeaderId() { return this.#options.noHeaderId }
  set noHeaderId(value) {
    if (window.abind) abind.update(this, 'noHeaderId', value);
    this.#setOption('noHeaderId', this.#toBool(value));
  }

  get omitExtraWLInCodeBlocks() { return this.#options.omitExtraWLInCodeBlocks }
  set omitExtraWLInCodeBlocks(value) {
    if (window.abind) abind.update(this, 'omitExtraWLInCodeBlocks', value);
    this.#setOption('omitExtraWLInCodeBlocks', this.#toBool(value));
  }

  get openLinksInNewWindow() { return this.#options.openLinksInNewWindow }
  set openLinksInNewWindow(value) {
    if (window.abind) abind.update(this, 'openLinksInNewWindow', value);
    this.#setOption('openLinksInNewWindow', this.#toBool(value));
  }

  get parseImgDimensions() { return this.#options.parseImgDimensions }
  set parseImgDimensions(value) {
    if (window.abind) abind.update(this, 'parseImgDimensions', value);
    this.#setOption('parseImgDimensions', this.#toBool(value));
  }

  get prefixHeaderId() { return this.#options.prefixHeaderId }
  set prefixHeaderId(value) {
    if (window.abind) abind.update(this, 'prefixHeaderId', value);
    this.#setOption('prefixHeaderId', this.#toBool(value));
  }

  get rawPrefixHeaderId() { return this.#options.rawPrefixHeaderId }
  set rawPrefixHeaderId(value) {
    if (window.abind) abind.update(this, 'rawPrefixHeaderId', value);
    this.#setOption('rawPrefixHeaderId', this.#toBool(value));
  }

  get rawHeaderId() { return this.#options.rawHeaderId }
  set rawHeaderId(value) {
    if (window.abind) abind.update(this, 'rawHeaderId', value);
    this.#setOption('rawHeaderId', this.#toBool(value));
  }

  get requireSpaceBeforeHeadingText() { return this.#options.requireSpaceBeforeHeadingText }
  set requireSpaceBeforeHeadingText(value) {
    if (window.abind) abind.update(this, 'requireSpaceBeforeHeadingText', value);
    this.#setOption('requireSpaceBeforeHeadingText', this.#toBool(value));
  }

  get simpleLineBreaks() { return this.#options.simpleLineBreaks }
  set simpleLineBreaks(value) {
    if (window.abind) abind.update(this, 'simpleLineBreaks', value);
    this.#setOption('simpleLineBreaks', this.#toBool(value));
  }

  get simplifiedAutoLink() { return this.#options.simplifiedAutoLink }
  set simplifiedAutoLink(value) {
    if (window.abind) abind.update(this, 'simplifiedAutoLink', value);
    this.#setOption('simplifiedAutoLink', this.#toBool(value));
  }

  get smartIndentationFix() { return this.#options.smartIndentationFix }
  set smartIndentationFix(value) {
    if (window.abind) abind.update(this, 'smartIndentationFix', value);
    this.#setOption('smartIndentationFix', this.#toBool(value));
  }

  get smoothLivePreview() { return this.#options.smoothLivePreview }
  set smoothLivePreview(value) {
    if (window.abind) abind.update(this, 'smoothLivePreview', value);
    this.#setOption('smoothLivePreview', this.#toBool(value));
  }

  get splitAdjacentBlockquotes() { return this.#options.splitAdjacentBlockquotes }
  set splitAdjacentBlockquotes(value) {
    if (window.abind) abind.update(this, 'splitAdjacentBlockquotes', value);
    this.#setOption('splitAdjacentBlockquotes', this.#toBool(value));
  }

  get strikethrough() { return this.#options.strikethrough }
  set strikethrough(value) {
    if (window.abind) abind.update(this, 'strikethrough', value);
    this.#setOption('strikethrough', this.#toBool(value));
  }

  get tables() { return this.#options.tables }
  set tables(value) {
    if (window.abind) abind.update(this, 'tables', value);
    this.#setOption('tables', this.#toBool(value));
  }

  get tablesHeaderId() { return this.#options.tablesHeaderId }
  set tablesHeaderId(value) {
    if (window.abind) abind.update(this, 'tablesHeaderId', value);
    this.#setOption('tablesHeaderId', this.#toBool(value));
  }

  get tasklists() { return this.#options.tasklists }
  set tasklists(value) {
    if (window.abind) abind.update(this, 'tasklists', value);
    this.#setOption('tasklists', this.#toBool(value));
  }

  get underline() { return this.#options.underline; }
  set underline(value) {
    this.#setOption('underline', this.#toBool(value));
  }
}

if (!customElements.get('a-markdown')) customElements.define('a-markdown', AMarkdown);
