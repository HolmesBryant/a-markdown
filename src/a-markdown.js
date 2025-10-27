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

  debug = false;
  #dedent = true;
  #display = 'converted';
  #file;
  #options = {tables: true};
  #sanitize = false;

  // Private

  #abortController;
  #converter;
  #html;
  #markdown;
  #showdown;
  #dompurify;

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
    'debug',
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
    const bin = newval !== false && newval !== 'false';
    if (oldval === newval) return;

    switch (attr) {
    case 'debug':
      this.debug = bin;
    case 'dedent':
      this.#dedent = bin;
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
      this.#sanitize = bin;
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
      const blob = new Blob([this.textContent], { type: 'text/markdown' });
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

    const markdown = await file.text();
    this.markdown = this.#dedent ? this.#doDedent(markdown) : markdown;
    this.#showdown = showdown.default;
    if (dompurify) this.#dompurify = dompurify.default;
  }

  async #init() {
    await this.#setAssets();
    this.#converter = new this.#showdown.Converter(this.#options);

    await this.#render();
    const options = this.#converter.getOptions();

    for (const option in options) {
      this[option] = options[option];
    }
  }

  async #render() {
    if (!this.#showdown) throw new Error('Showdown library not found!');
    if (!this.#converter) throw new Error('Showdown converter not initialized!');
    this.html = await this.#toHtml(this.#converter, this.#markdown);
    if (this.#display === 'markdown') {
      this.textContent = this.#markdown;
    } else if (this.#display === 'html') {
      this.textContent = this.#html;
      if (this.debug) console.log(this.innerHTML)
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

  get dedent() { return this.#dedent }
  set dedent(value) {
    this.setAttribute('dedent', value !== 'false' && value !== 'false');
  }

  get display() { return this.#display }
  set display(value) {
    this.setAttribute('display', value);
    if (window.abind) abind.update(this, 'display', value);
    this.#render();
  }

  get file() { return this.#file }
  set file(value) { this.setAttribute('file', value) }

  get html() { return this.#html }
  set html(value) {
    this.#html = value;
    if (window.abind) abind.update(this, 'html', value);
  }

  get markdown() { return this.#markdown }
  set markdown(value) {
    this.#markdown = value;
    if (window.abind) abind.update(this, 'markdown', value);
  }

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

  /**************************************************************
  * Showdown Options
  *************************************************************/

  get backslashEscapesHTMLTags() { return this.#converter?.getOption('backslashEscapesHTMLTags') }
  set backslashEscapesHTMLTags(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'backslashEscapesHTMLTags', value);
    if (value === this.#converter.getOption('backslashEscapesHTMLTags')) return;
    this.#converter.setOption('backslashEscapesHTMLTags', value);
    this.#render();
  }

  get completeHTMLDocument() { return this.#converter?.getOption('completeHTMLDocument') }
  set completeHTMLDocument(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'completeHTMLDocument', value);
    if (value === this.#converter.getOption('completeHTMLDocument')) return;
    this.#converter.setOption('completeHTMLDocument', value);
    this.#render();
  }

  get disableForced4SpacesIndentedSublists() { return this.#converter?.getOption('disableForced4SpacesIndentedSublists') }
  set disableForced4SpacesIndentedSublists(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'disableForced4SpacesIndentedSublists', value);
    if (value === this.#converter.getOption('disableForced4SpacesIndentedSublists')) return;
    this.#converter.setOption('disableForced4SpacesIndentedSublists', value);
    this.#render();
  }

  get ellipsis() { return this.#converter?.getOption('ellipsis'); }
  set ellipsis(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'ellipsis', value);
    if (value === this.#converter.getOption('ellipsis')) return;
    this.#converter.setOption('ellipsis', value);
    this.#render();
  }

  get emoji() { return this.#converter?.getOption('emoji') }
  set emoji(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'emoji', value);
    if (value === this.#converter.getOption('emoji')) return;
    this.#converter.setOption('emoji', value);
    this.#render();
  }

  get encodeEmails() { return this.#converter?.getOption('encodeEmails') }
  set encodeEmails(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'encodeEmails', value);
    if (value === this.#converter.getOption('encodeEmails')) return;
    this.#converter.setOption('encodeEmails', value);
    this.#render();
  }

  get excludeTrailingPunctuationFromURLs() { return this.#converter?.getOption('excludeTrailingPunctuationFromURLs') }
  set excludeTrailingPunctuationFromURLs(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'excludeTrailingPunctuationFromURLs', value);
    if (value === this.#converter.getOption('excludeTrailingPunctuationFromURLs')) return;
    this.#converter.setOption('excludeTrailingPunctuationFromURLs', value);
    this.#render();
  }

  get ghCodeBlocks() { return this.#converter?.getOption('ghCodeBlocks') }
  set ghCodeBlocks(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'ghCodeBlocks', value);
    if (value === this.#converter.getOption('ghCodeBlocks')) return;
    this.#converter.setOption('ghCodeBlocks', value);
    this.#render();
  }

  get ghCompatibleHeaderId() { return this.#converter?.getOption('ghCompatibleHeaderId') }
  set ghCompatibleHeaderId(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'ghCompatibleHeaderId', value);
    if (value === this.#converter.getOption('ghCompatibleHeaderId')) return;
    this.#converter.setOption('ghCompatibleHeaderId', value);
    this.#render();
  }

  get ghMentions() { return this.#converter?.getOption('ghMentions') }
  set ghMentions(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'ghMentions', value);
    if (value === this.#converter.getOption('ghMentions')) return;
    this.#converter.setOption('ghMentions', value);
    this.#render();
  }

  get ghMentionsLink() { return this.#converter?.getOption('ghMentionsLink') }
  set ghMentionsLink(value) {
    if (!this.#converter) return;
    if (window.abind) abind.update(this, 'ghMentionsLink', value);
    if (value === this.#converter.getOption('ghMentionsLink')) return;
    this.#converter.setOption('ghMentionsLink', value);
    this.#render();
  }

  get headerLevelStart() { return this.#converter?.getOption('headerLevelStart') }
  set headerLevelStart(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'headerLevelStart', value);
    if (value === this.#converter.getOption('headerLevelStart')) return;
    this.#converter.setOption('headerLevelStart', value);
    this.#render();
  }

  get literalMidWordAsterisks() { return this.#converter?.getOption('literalMidWordAsterisks') }
  set literalMidWordAsterisks(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'literalMidWordAsterisks', value);
    if (value === this.#converter.getOption('literalMidWordAsterisks')) return;
    this.#converter.setOption('literalMidWordAsterisks', value);
    this.#render();
  }

  get literalMidWordUnderscores() { return this.#converter?.getOption('literalMidWordUnderscores') }
  set literalMidWordUnderscores(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'literalMidWordUnderscores', value);
    if (value === this.#converter.getOption('literalMidWordUnderscores')) return;
    this.#converter.setOption('literalMidWordUnderscores', value);
    this.#render();
  }

  get metadata() { return this.#converter?.getOption('metadata') }
  set metadata(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'metadata', value);
    if (value === this.#converter.getOption('metadata')) return;
    this.#converter.setOption('metadata', value);
    this.#render();
  }

  get noHeaderId() { return this.#converter?.getOption('noHeaderId') }
  set noHeaderId(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'noHeaderId', value);
    if (value === this.#converter.getOption('noHeaderId')) return;
    this.#converter.setOption('noHeaderId', value);
    this.#render();
  }

  get omitExtraWLInCodeBlocks() { return this.#converter?.getOption('omitExtraWLInCodeBlocks') }
  set omitExtraWLInCodeBlocks(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'omitExtraWLInCodeBlocks', value);
    if (value === this.#converter.getOption('omitExtraWLInCodeBlocks')) return;
    this.#converter.setOption('omitExtraWLInCodeBlocks', value);
    this.#render();
  }

  get openLinksInNewWindow() { return this.#converter?.getOption('openLinksInNewWindow') }
  set openLinksInNewWindow(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'openLinksInNewWindow', value);
    if (value === this.#converter.getOption('openLinksInNewWindow')) return;
    this.#converter.setOption('openLinksInNewWindow', value);
    this.#render();
  }

  get parseImgDimensions() { return this.#converter?.getOption('parseImgDimensions') }
  set parseImgDimensions(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'parseImgDimensions', value);
    if (value === this.#converter.getOption('parseImgDimensions')) return;
    this.#converter.setOption('parseImgDimensions', value);
    this.#render();
  }

  get prefixHeaderId() { return this.#converter?.getOption('prefixHeaderId') }
  set prefixHeaderId(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'prefixHeaderId', value);
    if (value === this.#converter.getOption('prefixHeaderId')) return;
    this.#converter.setOption('prefixHeaderId', value);
    this.#render();
  }

  get rawPrefixHeaderId() { return this.#converter?.getOption('rawPrefixHeaderId') }
  set rawPrefixHeaderId(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'rawPrefixHeaderId', value);
    if (value === this.#converter.getOption('rawPrefixHeaderId')) return;
    this.#converter.setOption('rawPrefixHeaderId', value);
    this.#render();
  }

  get rawHeaderId() { return this.#converter?.getOption('rawHeaderId') }
  set rawHeaderId(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'rawHeaderId', value);
    if (value === this.#converter.getOption('rawHeaderId')) return;
    this.#converter.setOption('rawHeaderId', value);
    this.#render();
  }

  get requireSpaceBeforeHeadingText() { return this.#converter?.getOption('requireSpaceBeforeHeadingText') }
  set requireSpaceBeforeHeadingText(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'requireSpaceBeforeHeadingText', value);
    if (value === this.#converter.getOption('requireSpaceBeforeHeadingText')) return;
    this.#converter.setOption('requireSpaceBeforeHeadingText', value);
    this.#render();
  }

  get simpleLineBreaks() { return this.#converter?.getOption('simpleLineBreaks') }
  set simpleLineBreaks(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'simpleLineBreaks', value);
    if (value === this.#converter.getOption('simpleLineBreaks')) return;
    this.#converter.setOption('simpleLineBreaks', value);
    this.#render();
  }

  get simplifiedAutoLink() { return this.#converter?.getOption('simplifiedAutoLink') }
  set simplifiedAutoLink(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'simplifiedAutoLink', value);
    if (value === this.#converter.getOption('simplifiedAutoLink')) return;
    this.#converter.setOption('simplifiedAutoLink', value);
    this.#render();
  }

  get smartIndentationFix() { return this.#converter?.getOption('smartIndentationFix') }
  set smartIndentationFix(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'smartIndentationFix', value);
    if (value === this.#converter.getOption('smartIndentationFix')) return;
    this.#converter.setOption('smartIndentationFix', value);
    this.#render();
  }

  get smoothLivePreview() { return this.#converter?.getOption('smoothLivePreview') }
  set smoothLivePreview(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'smoothLivePreview', value);
    if (value === this.#converter.getOption('smoothLivePreview')) return;
    this.#converter.setOption('smoothLivePreview', value);
    this.#render();
  }

  get strikethrough() { return this.#converter?.getOption('strikethrough') }
  set strikethrough(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'strikethrough', value);
    if (value === this.#converter.getOption('strikethrough')) return;
    this.#converter.setOption('strikethrough', value);
    this.#render();
  }

  get tables() { return this.#converter?.getOption('tables') }
  set tables(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'tables', value);
    if (value === this.#converter.getOption('tables')) return;
    this.#converter.setOption('tables', value);
    this.#render();
  }

  get tablesHeaderId() { return this.#converter?.getOption('tablesHeaderId') }
  set tablesHeaderId(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'tablesHeaderId', value);
    if (value === this.#converter.getOption('tablesHeaderId')) return;
    this.#converter.setOption('tablesHeaderId', value);
    this.#render();
  }

  get tasklists() { return this.#converter?.getOption('tasklists') }
  set tasklists(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'tasklists', value);
    if (value === this.#converter.getOption('tasklists')) return;
    this.#converter.setOption('tasklists', value);
    this.#render();
  }

  get underline() { return this.#converter?.getOption('underline') }
  set underline(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'underline', value);
    if (value === this.#converter.getOption('underline')) return;
    this.#converter.setOption('underline', value);
    this.#render();
  }

  get splitAdjacentBlockquotes() { return this.#converter?.getOption('splitAdjacentBlockquotes') }
  set splitAdjacentBlockquotes(value) {
    if (!this.#converter) return;
    value = value !== false && value !== 'false';
    if (window.abind) abind.update(this, 'splitAdjacentBlockquotes', value);
    if (value === this.#converter.getOption('splitAdjacentBlockquotes')) return;
    this.#converter.setOption('splitAdjacentBlockquotes', value);
    this.#render();
  }

}

if (!customElements.get('a-markdown')) customElements.define('a-markdown', AMarkdown);
