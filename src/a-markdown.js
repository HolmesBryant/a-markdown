/**
 * @file src/a-markdown.js
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 2.0
 */

import Highlighter from './Highlighter.js';
import styles from './a-markdown-shadow.css' with {type: 'css'};

const abindUpdate = Symbol.for('abind.update');

/**
 * A custom element that converts Markdown syntax to HTML.
 * Supports headers, bold, italic, lists (ul, ol), inline code, code blocks, links, images, blockquotes and checkboxes.
 * @class AMarkdown
 * @extends HTMLElement
 */
export default class AMarkdown extends HTMLElement {

  // --- Attributes ---

  /**
   * The URL of the Markdown file to fetch. If not set, uses innerHTML.
   * @type {string}
   * @private
   */
  #file;

  /**
   * Flag indicating whether code highlighting is enabled.
   * @type {boolean}
   * @private
   */
  #highlight = false;

  // -- Properties ---

  /**
   * AbortController for managing event listeners.
   * @type {AbortController|null}
   * @private
   */
  #abortController;

  /**
   * Flag indicating if the element is currently connected to the DOM.
   * @type {boolean}
   * @private
   */
  #connected = false;

  /**
   * The container div where parsed HTML is rendered.
   * @type {HTMLElement|null}
   * @private
   */
  #container;

  /**
   * Array of active Highlighter instances for syntax highlighting.
   * @type {Array<Highlighter>}
   * @private
   */
  #highlighters = [];

  /**
   * Reference to the slot element within shadow DOM.
   * @type {HTMLSlotElement|null}
   * @private
   */
  #slot;

  /**
   * Threshold for indentation spaces before closing lists (default 100).
   * @type {number}
   * @private
   */
  #spaces = 100;

  static observedAttributes = [
    'file',
    'highlight'
  ]

  /**
   * Regular expressions for parsing Markdown syntax.
   * @typedef {Object<string, RegExp>} rex
   */
  static rex = {
    blockquote: /^((?:>|&gt;)+)\s+(.*)/,
    boldAsterisk: /\*\*([^*]+)\*\*/g,
    boldUnderscore: /__([^_]+)__/g,
    checkbox: /^\[([ xX]?)\]\s+(.*)$/,
    codeBlock: /^```([a-z0-9-]*)$/i,
    escapedTag: /\\</g,
    header: /^(#{1,6})\s+(.*)$/,
    image: /!\[([^\]]*)\]\(([^)]+)\)/g,
    inlineCode: /`([^`]+)`/g,
    italicAsterisk: /\*([^*]+)\*/g,
    italicUnderscore: /_([^_]+)_/g,
    link: /\[([^\]]*)\]\(([^)]+)\)/g,
    list: /^(\s*)([-*+]|\d+\.)\s+(.*)/,
  }

  static template = document.createElement('template');

  /**
   * Static initializer for the shadow DOM template.
   */
  static {
    this.template.innerHTML = `
      <div id="container" part="html"></div>
      <slot hidden id="slot"></slot>
    `;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styles];
    this.shadowRoot.append(AMarkdown.template.content.cloneNode(true));
    this.#container = this.shadowRoot.getElementById('container');
    this.#slot = this.shadowRoot.getElementById('slot');
  }

  // -- Lifecycle Methods --

  attributeChangedCallback(attr, oldval, newval) {
    if (newval === oldval) return;
    switch (attr) {
    case 'file':
      this.#file = newval;
      if (this.#connected) this.#fetchFile(newval);
      break;

    case 'highlight':
      this.#highlight = this.hasAttribute('highlight');
      if (this.#connected) {
        if (this.#highlight) {
          this.#highlightCode();
        } else {
          this.#destroyHighlights();
        }
      }
      break;
    }

    /**
     * Triggers global update listener for reactive bindings.
     */
    globalThis[abindUpdate]?.(this, attr, this[attr]);
  }

  connectedCallback() {
    this.#abortController = new AbortController();

    this.#slot.addEventListener('slotchange', event => {
      this.#container.innerHTML = this.parse(this.innerHTML);
      if (this.#highlight) this.#highlightCode();
    }, { signal: this.#abortController.signal });

    if (this.#file) this.#fetchFile(this.#file);
    this.#connected = true;
  }

  disconnectedCallback() {
    this.#destroyHighlights();

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // --- Public Methods ---

  /**
   * Orchestrates the parsing of the full Markdown document into HTML.
   * @param {string} markdown - The raw Markdown string to parse.
   * @returns {string} The resulting HTML string.
   */
  parse(markdown) {
    if (!markdown) return '';

    const lines = markdown.split('\n');
    const state = {
      inBlockquote: false,
      inCodeBlock: false,
      listStack: [],
      buffer: []
    };

    lines.forEach( line => {
      this.#routeLine(line, state);
    });

    this.#closeOpenLists(state);
    const spaceRex = new RegExp(`[ \\t]{${this.#spaces + 1}}`, 'g');
    const html = state.buffer.join('\n');
    return html.replace(spaceRex, '');
  }

  // --- Private Methods ---

  /**
   * Adds an escaped line of text inside a code block.
   * @param {string} line - The raw line from the markdown source.
   * @param {Object} state - The current parsing state object.
   */
  #addCodeLine(line, state) {
    state.buffer.push(this.#escapeHTML(line));
  }

  /**
   * Empties the list stack when lists end.
   * @param {Object} state - The current parsing state object.
   */
  #closeOpenLists(state) {
    while (state.listStack.length > 0) {
      state.buffer.push(`</${state.listStack.pop().type}>`);
    }
  }

  /**
   * Destroys the active highlighter instances and cleans up artifacts.
   */
  #destroyHighlights() {
    if (this.#highlighters.length === 0) return;

    try {
      this.#highlighters.forEach( item => {
        item.destroy();
      });
    } catch (error) {
      console.error("a-markdown.destroyHighlights(): Error destroying Highlighter:", error);
    }

    this.#highlighters = [];
  }

  /**
   * Escapes dangerous characters in text.
   * @param {string} text - The raw text to escape.
   * @returns {string} The escaped HTML string.
   */
  #escapeHTML(text) {
    // if (this._escaped) return text;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '\\<': '&lt;',
      '\\>': '&gt;'
    };
    return text.replace(/[&<>"']|\\<|\\>/g, match => map[match]);
  }

  /**
   * fetches a markdown file, parses it and (optionally) performs syntax highlighting.
   *
   * @param {string} url - The url or path to the file
   */
  async #fetchFile(url) {
    let content;

    if (!url) {
      content = this.innerHTML;
      if (content.trim() === '') return;
    } else {
      const response = await fetch(url);
      if (response.ok) {
        const contentType = response.headers.get('Content-Type');

        if (contentType && !contentType.startsWith('text/markdown')) {
          throw new Error(`a-markdown: Server responded, but not with a Markdown file. Make sure ${url} exists and is a Markdown file.`);
        }

        content = await response.text();
      } else {
        throw new Error(`a-markdown: Unable to fetch markdown file: ${this.#file}`);
      }
    }

    this.#destroyHighlights();
    this.#container.innerHTML = this.parse(content);
    if (this.#highlight) this.#highlightCode();
  }

  /**
   * Parses and wraps blockquote elements.
   * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {boolean} True if a blockquote was started or ended, false otherwise.
   */
  #handleBlockquotes(line, state) {
    const working = line.trim();
    const match = working.match(AMarkdown.rex.blockquote);

    if (match && !state.inBlockquote) {
      state.buffer.push('<blockquote part="blockquote">' + this.#escapeHTML(match[2]));
      state.inBlockquote = true;
      return true;
    } else if (!match && state.inBlockquote) {
      state.buffer.push('</blockquote>');
      state.inBlockquote = false;
      return false;
    } else if (match) {
      state.buffer.push(this.#escapeHTML(match[2]));
      return true;
    }
  }

  /**
   * Toggles block state and writes <pre><code> wrapper for code blocks.
   * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {boolean} True if a code block was started or ended, false otherwise.
   */
  #handleCodeBlocks(line, state) {
    const working = line.trim();
    const match = working.match(AMarkdown.rex.codeBlock);
    if (!match) return false;

    if (state.inCodeBlock) {
      state.buffer.push('</code></pre>');
      state.inCodeBlock = false;
    } else {
      this.#closeOpenLists(state);
      const lang = match[1] ? `lang-${match[1]}` : '';
      state.buffer.push(`<pre part="pre"><code class="${lang}" part="pre code ${lang}">`);
      state.inCodeBlock = true;
    }
    return true;
  }

  /**
   * Identifies list items and triggers stack synchronization.
   *
   * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {boolean} True if a list was started or ended, false otherwise.
   */
  #handleList(line, state) {
    const match = line.match(AMarkdown.rex.list);
    if (!match) return false;

    const indent = match[1].replace(/\t/g, '    ').length; // Normalize tabs to 4 spaces
    const marker = match[2];
    const content = match[3];
    const listType = /^\d/.test(marker) ? 'ol' : 'ul';

    this.#syncListStack(state, indent, listType);

    const parsedContent = this.#routeInlineElements(content);
    state.buffer.push(`<li part="li ${listType}-li">${parsedContent}</li>`);
    return true;
  }

  /**
   * Wraps lines of standard text.
   *
   * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {void}
   */
  #handleParagraphs(line, state) {
    const content = this.#routeInlineElements(line);
    state.buffer.push(`<p>${content}</p>`);
  }

  /**
   * Finds all code blocks in the container and applies highlighting.
   * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {void}
   */
  #highlightCode() {
    const codeBlocks = this.#container.querySelectorAll('pre[part="pre"] code');
    if (!codeBlocks.length) return;

    for (const block of codeBlocks) {
      let syntax;
      const cssClass = [...block.classList].find(item => item.startsWith('lang-'));

      if (!cssClass || cssClass.toLowerCase() === 'lang-css') {
        syntax = 'html';
      } else {
        syntax = cssClass.split('-')[1];
      }

      const highlighter = new Highlighter(this, syntax, null);
      this.#highlighters.push(highlighter);

      try {
        const textNode = Array
        .from(block.childNodes)
        .find(n => n.nodeType === Node.TEXT_NODE);

        if (textNode) highlighter.highlight(textNode);
      } catch (error) {
        console.error('a-markdown.highlight(): Highlighting failed', error);
      }
    }
  }

  /**
   * Process bold markup
   * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {string} - The processed text
   */
  #processBold(text) {
    return text
      .replace(AMarkdown.rex.boldAsterisk, '<strong part="strong">$1</strong>')
      .replace(AMarkdown.rex.boldUnderscore, '<strong part="strong">$1</strong>');
  }

  /**
   * Process checkboxes
   * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {string} - The processed text
   */
  #processCheckboxes(text) {
    const working = text.trim();
    return working.replace(AMarkdown.rex.checkbox, (match, state, rest) => {
      const checked = state.toLowerCase() === 'x' ? 'checked ' : '';
      return `<input type="checkbox" ${checked} disabled part="checkbox ${checked}"> ${this.#escapeHTML(rest)}`;
    });
  }

  /**
   * Parses and wraps header elements (H1 - H6).
   * * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {boolean} - true if header present, false otherwise
   */
  #processHeaders(line, state) {
    const working = line.trim();
    const match = working.match(AMarkdown.rex.header);
    if (match) {
      const level = match[1].length;
      const content = this.#routeInlineElements(match[2]);
      state.buffer.push(`<h${level} part="h${level}">${content}</h${level}>`);
      return true;
    }
    return false;
  }

  /**
   * Process images.
   * @param {string} line - The current line being processed.
   * @returns {string} - The processed text
   */
  #processImages(line) {
    const match = line.match(AMarkdown.rex.image);
    return line.replace(AMarkdown.rex.image, (match, alt, url) => {
      return `<img src="${this.#sanitizeURL(url)}" alt="${this.#escapeHTML(alt)}" part="img">`;
    });
  }

  /**
   * Process inline code
   * @param {string} line - The current line being processed.
   * @returns {string} - The processed text
   */
  #processInlineCode(line) {
    line = this.#escapeHTML(line);
    return line.replace(AMarkdown.rex.inlineCode, '<code part="code">$1</code>');
  }

  /**
   * Process italic
   * @param {string} line - The current line being processed.
   * @returns {string} - The processed text
   */
  #processItalic(line) {
    return line
      .replace(AMarkdown.rex.italicAsterisk, '<em part="em">$1</em>')
      .replace(AMarkdown.rex.italicUnderscore, '<em part="em">$1</em>');
  }

  /**
   * Process links.
   * @param {string} line - The current line being processed.
   * @returns {string} - The processed text
   */
  #processLinks(line) {
    return line.replace(AMarkdown.rex.link, (match, line, url) => {
      return `<a href="${this.#sanitizeURL(url)}" part="a" target="_blank">${this.#escapeHTML(line)}</a>`;
    });
  }

  /**
   * Orchestrates the processing of inline items.
   * Note: Sequence order matters.
   *
   * @param {string} line - The current line being processed.
   * @returns {string} - The processed text
   */
  #routeInlineElements(line) {
    let html = line;
    html = this.#processInlineCode(html);
    html = this.#processCheckboxes(html);
    html = this.#processImages(html);
    html = this.#processLinks(html);
    html = this.#processBold(html);
    html = this.#processItalic(html);

    return html;
  }

  /**
   * Routes a single line to the appropriate structural handler.
   * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {void}
   */
  #routeLine(line, state) {
    const spaces = line.match(/[ \t]+/);
    if (spaces && spaces[0].length < this.#spaces) this.#spaces = spaces[0].length;

    if (this.#handleCodeBlocks(line, state)) return;
    if (state.inCodeBlock) {
      this.#addCodeLine(line, state);
      return;
    }

    if (this.#handleBlockquotes(line, state)) return;

    if (line.trim() === '') {
      this.#closeOpenLists(state);
      return;
    }

    if (this.#handleList(line, state)) return;

    //Close lists if a non-list item appears
    this.#closeOpenLists(state);

    if (this.#processHeaders(line, state)) return;
    this.#handleParagraphs(line, state);
  }

  /**
   * Prevents javascript: and data: URI XSS attacks in links and images.
   *
   * @param {string} url - A path or url
   * @returns {string} The sanitized string
   */
  #sanitizeURL(url) {
    const sanitized = url.replace(/[\x00-\x1F\x7F]/g, '').trim();
    // Block unsafe protocols
    if (/^(javascript|vbscript|data):/i.test(sanitized)) {
      return '#';
    }

    // Ensure attributes remain safe
    return this.#escapeHTML(sanitized);
  }

  /**
   * Opens and closes <ul> / <ol> elements to match indentation depth.
   * @param {Object} state - The current parsing state object.
   * @param {number} indent - The amount of indenting to perform.
   * @param {string} listType - ol or ul
   * @returns {string} - The processed text
   */
  #syncListStack(state, indent, listType) {
    const stack = state.listStack;

    while (stack.length > 0 && indent < stack[stack.length - 1].indent) {
      state.buffer.push(`</${stack.pop().type}>`);
    }

    if (stack.length > 0 && indent === stack[stack.length - 1].indent && stack[stack.length - 1].type !== listType) {
      state.buffer.push(`</${stack.pop().type}>`);
    }

    if (stack.length === 0 || indent > stack[stack.length - 1].indent) {
      stack.push({ type: listType, indent: indent });
      state.buffer.push(`<${listType} part="${listType}">`);
    }
  }

  // --- Getters / Setters ---

  get file() { return this.#file }
  set file(value) { this.setAttribute('file', value) }

  get highlight() { return this.#highlight }
  set highlight(value) { this.toggleAttribute('highlight', value != null && value !== false) }
}

if (!customElements.get('a-markdown')) customElements.define('a-markdown', AMarkdown);
