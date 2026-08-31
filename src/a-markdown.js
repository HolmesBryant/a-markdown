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
 * Supports headers, bold, italic, unordered lists, ordered lists, inline code, code blocks, links, images, checkboxes.
 * @class AMarkdown
 * @extends HTMLElement
 */
export default class AMarkdown extends HTMLElement {

  // -- Attributes --
  _file;
  _highlight = false;

  // -- Properties
  _abortController;
  _connected = false;
  _container;
  _highlighters = [];
  _slot;
  _spaces = 100;

  static observedAttributes = [
    'file',
    'highlight'
  ]

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
    this._container = this.shadowRoot.getElementById('container');
    this._slot = this.shadowRoot.getElementById('slot');
  }

  // -- Lifecycle Methods --

  attributeChangedCallback(attr, oldval, newval) {
    if (newval === oldval) return;
    switch (attr) {
    case 'file':
      this._file = newval;
      break;

    case 'highlight':
      this._highlight = this.hasAttribute('highlight');
      break;
    }
  }

  connectedCallback() {
    this._abortController = new AbortController();
    this._addListeners();
    this._connected = true;
  }

  disconnectedCallback() {
    // this._destroyHighlights();

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // --- Private Methods ---

  _addListeners() {
    this._slot.addEventListener('slotchange', event => {
      this._container.innerHTML = this._parse(this.innerHTML);
    }, { signal: this._abortController.signal });
  }

  /**
   * Adds an escaped line of text inside a code block.
   */
  _addCodeLine(line, state) {
    state.buffer.push(this._escapeHTML(line));
  }

  /**
   * Empties the list stack when lists end.
   */
  _closeOpenLists(state) {
    while (state.listStack.length > 0) {
      state.buffer.push(`</${state.listStack.pop().type}>`);
    }
  }

  /**
   * Escapes dangerous characters.
   */
  _escapeHTML(text) {
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
   * Toggles block state and writes <pre><code> wrapper.
   */
  _handleCodeBlock(line, state) {
    const working = line.trim();
    const match = working.match(AMarkdown.rex.codeBlock);
    if (!match) return false;

    if (state.inCodeBlock) {
      state.buffer.push('</code></pre>');
      state.inCodeBlock = false;
    } else {
      this._closeOpenLists(state);
      const lang = match[1] ? `lang-${match[1]}` : '';
      state.buffer.push(`<pre part="pre"><code class="${lang}" part="pre code ${lang}">`);
      state.inCodeBlock = true;
    }
    return true;
  }

  /**
   * Identifies list items and triggers stack synchronization.
   */
  _handleList(line, state) {
    const match = line.match(AMarkdown.rex.list);
    if (!match) return false;

    const indent = match[1].replace(/\t/g, '    ').length; // Normalize tabs to 4 spaces
    const marker = match[2];
    const content = match[3];
    const listType = /^\d/.test(marker) ? 'ol' : 'ul';

    this._syncListStack(state, indent, listType);

    const parsedContent = this._routeInlineElements(content);
    state.buffer.push(`<li part="li ${listType}-li">${parsedContent}</li>`);
    return true;
  }

  /**
   * Wraps lines of standard text.
   */
  _handleParagraphs(line, state) {
    const content = this._routeInlineElements(line);
    state.buffer.push(`<p>${content}</p>`);
  }

  /**
   * Orchestrates the parsing of the full Markdown document.
   */
  _parse(markdown) {
    if (!markdown) return '';

    const lines = markdown.split('\n');
    const state = {
      inBlockquote: false,
      inCodeBlock: false,
      listStack: [],
      buffer: []
    };

    lines.forEach( line => {
      this._routeLine(line, state);
    });

    this._closeOpenLists(state);
    const spaceRex = new RegExp(`[ \\t]{${this._spaces + 1}}`, 'g');
    const html = state.buffer.join('\n');
    return html.replace(spaceRex, '');
  }

  /**
   * Parses and wraps blockquote elements.
   */
  /**
 * Parses and wraps header elements (H1 - H6).
 */
_processHeaders(line, state) {
  const working = line.trim();
  const match = working.match(AMarkdown.rex.header);
  if (match) {
    const level = match[1].length;
    const content = this._routeInlineElements(match[2]);
    state.buffer.push(`<h${level} part="h${level}">${content}</h${level}>`);
    return true;
  }
  return false;
}

/**
 * Parses and wraps blockquote elements.
 */
_processBlockquotes(line, state) {
  const working = line.trim();
  // const match = working.match(AMarkdown.rex.blockquote);
  const test = AMarkdown.rex.blockquote.test(working);
  if (!test && !state.inBlockquote) return false;

  if (!test && state.inBlockquote) {
    state.buffer.push('</blockquote>');
    state.inBlockquote = false;
  } else {
    this._closeOpenLists(state);
    state.buffer.push('<blockquote part="blockquote">');
    state.inBlockquote = true;
  }
  return true;
}


  /*_processBlockquotes(line, state) {
    const working = line.trim();

    // supports nested quotes like >> or >>>
    if (AMarkdown.rex.blockquote.test(working)) {
      const match = working.match(AMarkdown.rex.blockquote);
      if (match) {
        const indentLevel = match[1].length / 4;
        const content = this._routeInlineElements(match[2]);

        state.buffer.push(`<blockquote part="blockquote">${content}</blockquote>`);
        return true;
      }
    }

    return false;
  }*/

  /**
   * Process bold
   */
  _processBold(text) {
    return text
      .replace(AMarkdown.rex.boldAsterisk, '<strong part="strong">$1</strong>')
      .replace(AMarkdown.rex.boldUnderscore, '<strong part="strong">$1</strong>');
  }

  /**
   * Process checkboxes
   */
  _processCheckboxes(text) {
    const working = text.trim();
    return working.replace(AMarkdown.rex.checkbox, (match, state, rest) => {
      const checked = state.toLowerCase() === 'x' ? 'checked ' : '';
      return `<input type="checkbox" ${checked} disabled part="checkbox ${checked}"> ${this._escapeHTML(rest)}`;
    });
  }

  /**
   * Parses and wraps header elements (H1 - H6).
   */
  _processHeaders(line, state) {
    const working = line.trim();
    const match = working.match(AMarkdown.rex.header);
    if (match) {
      const level = match[1].length;
      const content = this._routeInlineElements(match[2]);
      state.buffer.push(`<h${level} part="h${level}">${content}</h${level}>`);
      return true;
    }
    return false;
  }

  /**
   * Process images.
   */
  _processImages(text) {
    const match = text.match(AMarkdown.rex.image);
    return text.replace(AMarkdown.rex.image, (match, alt, url) => {
      return `<img src="${this._sanitizeURL(url)}" alt="${this._escapeHTML(alt)}" part="img">`;
    });
  }

  /**
   * Process inline code
   */
  _processInlineCode(text) {
    text = this._escapeHTML(text);
    return text.replace(AMarkdown.rex.inlineCode, '<code part="code">$1</code>');
  }

  /**
   * Process italic
   */
  _processItalic(text) {
    return text
      .replace(AMarkdown.rex.italicAsterisk, '<em part="em">$1</em>')
      .replace(AMarkdown.rex.italicUnderscore, '<em part="em">$1</em>');
  }

  /**
   * Process links.
   */
  _processLinks(text) {
    return text.replace(AMarkdown.rex.link, (match, text, url) => {
      return `<a href="${this._sanitizeURL(url)}" part="a" target="_blank">${this._escapeHTML(text)}</a>`;
    });
  }

  /**
   * Orchestrates the processing of inline items.
   * Note: Sequence order matters.
   */
  _routeInlineElements(text) {
    let html = text;
    html = this._processInlineCode(html);
    html = this._processCheckboxes(html);
    html = this._processImages(html);
    html = this._processLinks(html);
    html = this._processBold(html);
    html = this._processItalic(html);

    return html;
  }

  /**
   * Routes a single line to the appropriate structural handler.
   */
  _routeLine(line, state) {
    const spaces = line.match(/[ \t]+/);
    if (spaces && spaces[0].length < this._spaces) this._spaces = spaces[0].length;

    if (this._handleCodeBlock(line, state)) return;
    if (state.inCodeBlock) {
      this._addCodeLine(line, state);
      return;
    }

    if (this._processBlockquotes(line, state)) {
      line = line.trim();
      const test = AMarkdown.rex.blockquote.test(line);
      if (test) {
        state.buffer.push(line);
      } else {
        state.buffer.push('</blockquote>');
      }
      return;
    }

    if (line.trim() === '') {
      this._closeOpenLists(state);
      return;
    }

    if (this._handleList(line, state)) return;

    //Close lists if a non-list item appears
    this._closeOpenLists(state);

    if (this._processHeaders(line, state)) return;
    this._handleParagraphs(line, state);
  }

  /**
   * Prevents javascript: and data: URI XSS attacks in links and images.
   */
  _sanitizeURL(url) {
    const sanitized = url.replace(/[\x00-\x1F\x7F]/g, '').trim();
    // Block unsafe protocols
    if (/^(javascript|vbscript|data):/i.test(sanitized)) {
      return '#';
    }

    // Ensure attributes remain safe
    return this._escapeHTML(sanitized);
  }

  /**
   * Opens and closes <ul> / <ol> elements to match indentation depth.
   */
  _syncListStack(state, indent, listType) {
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

  get file() { return this._file }
  set file(value) { this.setAttribute('file', value) }

  get highlight() { return this._highlight }
  set highlight(value) { this.toggleAttribute('highlight', value != null && value !== false) }
}

if (!customElements.get('a-markdown')) customElements.define('a-markdown', AMarkdown);
