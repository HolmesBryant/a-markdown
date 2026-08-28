/**
 * @file src/a-markdown.js
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 2.0
 */

import Highlighter from './Highlighter.js';

/**
 * A custom element that converts Markdown syntax to HTML.
 * Supports headers, bold, italic, unordered lists, ordered lists, inline code, code blocks, links, images, checkboxes.
 * @class AMarkdown
 * @extends HTMLElement
 */
export default class AMarkdown extends HTMLElement {

  #file;
  #highlight = false;

  #abortController;
  #connected = false;
  #container;
  #highlighters;
  #slot;
  #spaces = 100;

  static observedAttributes = [
    'file',
    'highlight'
  ]

  static rex = {
    header: /^(#{1,6})\s+(.*)$/,
    list: /^(\s*)([-*+]|\d+\.)\s+(.*)$/,
    codeBlock: /^```([a-z0-9-]*)$/i,
    escapedTag: /\\</g,
    image: /!\[([^\]]*)\]\(([^)]+)\)/g,
    link: /\[([^\]]*)\]\(([^)]+)\)/g,
    inlineCode: /`([^`]+)`/g,
    boldAsterisk: /\*\*([^*]+)\*\*/g,
    boldUnderscore: /__([^_]+)__/g,
    italicAsterisk: /\*([^*]+)\*/g,
    italicUnderscore: /_([^_]+)_/g,
    checkbox: /^\[([ xX]?)\]\s+(.*)$/
  }

  static template = document.createElement('template');
  static {
    this.template.innerHTML = `
      <style>
        :host {
          --code-background: gainsboro;
          --block-pad: .5rem;
          --list-indent: 1.5rem;
          --block-indent: 2;

          display: block;
          tab-size: var(--block-indent);
        }

        code {
          background: var(--code-background);
          padding: 0 2px;
        }

        pre:has(code) {
          padding: 0 0 var(--block-pad) var(--block-pad);
        }

        ol, ul {
          padding-left: var(--list-indent);
        }

        pre {
          background: var(--code-background);
        }

        @media (prefers-color-scheme: dark) {
          :host {
            --code-background: rgb(20,20,20);
          }
        }
      </style>
      <div id="container" part="html"></div>
      <slot hidden id="slot"></slot>
    `;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(AMarkdown.template.content.cloneNode(true));
    this.#container = this.shadowRoot.getElementById('container');
    this.#slot = this.shadowRoot.getElementById('slot');
  }

  attributeChangedCallback(attr, oldval, newval) {
    if (newval === oldval) return;
    switch (attr) {
    case 'file':
      this.#file = newval;

      if (this.#highlight && this.#connected) {
        // setTimeout(() => this._highlight(), 0);
        }
      break;
    case 'highlight':
      this.#highlight = this.hasAttribute('highlight');
      if (this.#connected) {
        if (this.#highlight) {
          this._highlight();
        } else {
          this._destroyHighlights();
        }
      }
      break;
    }
  }

  connectedCallback() {
    this.#abortController = new AbortController();
    this._addListeners();
    /*if (this.#highlight) {
      setTimeout(() => this._highlight(), 0);
    }*/

    this.#connected = true;
  }

  disconnectedCallback() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // --- Private Methods ---

  _addListeners() {
    this.#slot.addEventListener('slotchange', event => {
      this.#container.innerHTML = this.parse(this.innerHTML);

      if (this.#highlight) {
        this._highlight();
      } else {
        this._destroyHighlights();
      }
    }, { signal: this.#abortController.signal });
  }

  /**
   * Destroys the current highlighter instance and cleans up artifacts.
   *
   * @private
   */
  _destroyHighlights() {
    if (Object.keys(this.#highlighters).length === 0) return;
    console.trace(this.#highlighters);
    /*try {
      if (this.#highlighters != null) {
        Object.values(this.#highlighters).forEach(h => h.destroy());
        this.#highlighters = null;
      }
    } catch (error) {
      console.error("a-markdown.destroyHighlights(): Error destroying Highlighter:", error);
    }*/
  }

  /**
   * Escapes dangerous characters.
   */
  escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '\\<': '&lt;'
    };
    return text.replace(/[&<>"']|\\</g, match => map[match]);
  }

  /**
   * Finds all code blocks in the container and applies highlighting.
   */
  _highlight() {
    const codeBlocks = this.#container.querySelectorAll('pre[part="pre"] code');
    if (!codeBlocks.length) return;
    if (!this.#highlighters) this.#highlighters = new Map();

    for (const block of codeBlocks) {
      let syntax, highlighter;
      const cssClass = [...block.classList].find(item => item.startsWith('lang-'));

      if (!cssClass) {
        syntax = 'html';
      } else {
        syntax = cssClass.split('-')[1];
      }

      if (this.#highlighters.has(syntax)) {
        highlighter = this.#highlighters.get(syntax);
      } else {
        highlighter = new Highlighter(this, syntax, null);
        this.#highlighters.set(syntax, highlighter);
      }

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
   * Initializes the syntax highlighter.
   *
   * @private
   * @param {string|boolean} [syntax=this.#highlight] - The syntax language to highlight.
   * @param {Object|null} [palette=this.palette] - The color palette to use.
   */
  /*
  _highlightCode(node, syntax, palette) {
    if (!node) return;
    if (this.#highlighter) this.#highlighter.destroy();
    // if (syntax === 'false' || syntax === false) return;
    if (!syntax) syntax = 'html';
    this.highlighter = new Highlighter(this, syntax, palette);

    try {
      const textNode = Array
        .from(node.childNodes)
        .find(n => n.nodeType === Node.TEXT_NODE);

      if (textNode) this.highlighter.highlight(textNode);

    } catch (error) {
      console.error("Highlighting failed", error);
    }
  }*/

  /**
   * Orchestrates the parsing of the full Markdown document.
   */
  parse(markdown) {
    if (!markdown) return '';

    const lines = markdown.split('\n');
    const state = {
      inCodeBlock: false,
      listStack: [],
      buffer: []
    };

    for (let i = 0; i < lines.length; i++) {
      this.processLine(lines[i], state);
    }

    this.closeOpenLists(state);
    const spaceRex = new RegExp(`[ \\t]{${this.#spaces + 1}}`, 'g');
    const html = state.buffer.join('\n');
    return html.replace(spaceRex, '');
  }

  /**
   * Routes a single line to the appropriate structural handler.
   */
  processLine(line, state) {
    const spaces = line.match(/[ \t]+/);
    if (spaces && spaces[0].length < this.#spaces) this.#spaces = spaces[0].length;

    if (this.handleCodeBlocks(line, state)) return;
    if (state.inCodeBlock) {
      this.addCodeLine(line, state);
      return;
    }

    if (line.trim() === '') {
      this.closeOpenLists(state);
      // ignore empty lines
      return;
    }

    if (this.handleLists(line, state)) return;

    // Close lists if a non-list item appears
    this.closeOpenLists(state);

    if (this.handleHeaders(line, state)) return;

    this.handleParagraph(line, state);
  }

  /**
   * Prevents javascript: and data: URI XSS attacks in links and images.
   */
  sanitizeURL(url) {
    const sanitized = url.replace(/[\x00-\x1F\x7F]/g, '').trim();
    if (/^(javascript|vbscript|data):/i.test(sanitized)) {
      return '#'; // Block unsafe protocols
    }
    return this.escapeHTML(sanitized); // Ensure attributes remain safe
  }

  /**
   * Toggles block state and writes <pre><code> wrappers.
   */
  handleCodeBlocks(line, state) {
    const working = line.trim();
    const match = working.match(AMarkdown.rex.codeBlock);
    if (match) {
      if (state.inCodeBlock) {
        state.buffer.push('</code></pre>');
        state.inCodeBlock = false;
      } else {
        this.closeOpenLists(state);
        const lang = match[1] ? 'lang-' + this.escapeHTML(match[1]) : '';
        state.buffer.push(`<pre part="pre"><code class="${lang}" part="pre code ${lang}">`);
        state.inCodeBlock = true;
      }
      return true;
    }
    return false;
  }

  /**
   * Adds an escaped line of text inside a code block.
   */
  addCodeLine(line, state) {
    state.buffer.push(this.escapeHTML(line));
  }

  /**
   * Parses and wraps header elements (H1 - H6).
   */
  handleHeaders(line, state) {
    const working = line.trim();
    const match = working.match(AMarkdown.rex.header);
    if (match) {
      const level = match[1].length;
      const content = this.processInlineElements(match[2]);
      state.buffer.push(`<h${level} part="h${level}">${content}</h${level}>`);
      return true;
    }
    return false;
  }

  /**
   * Identifies list items and triggers stack synchronization.
   */
  handleLists(line, state) {
    const match = line.match(AMarkdown.rex.list);
    if (!match) return false;

    const indent = match[1].replace(/\t/g, '    ').length; // Normalize tabs to 4 spaces
    const marker = match[2];
    const content = match[3];
    const listType = /^\d/.test(marker) ? 'ol' : 'ul';

    this.syncListStack(state, indent, listType);

    const parsedContent = this.processInlineElements(content);
    state.buffer.push(`<li part="li ${listType}-li">${parsedContent}</li>`);
    return true;
  }

  /**
   * Opens and closes <ul> / <ol> elements to match indentation depth.
   */
  syncListStack(state, indent, listType) {
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

  /**
   * Empties the list stack when lists end.
   */
  closeOpenLists(state) {
    while (state.listStack.length > 0) {
      state.buffer.push(`</${state.listStack.pop().type}>`);
    }
  }

  /**
   * Wraps lines of standard text.
   */
  handleParagraph(line, state) {
    const content = this.processInlineElements(line);
    state.buffer.push(`<p>${content}</p>`);
  }

  /**
   * Orchestrates the processing of inline items.
   * Note: Sequence order matters.
   */
  processInlineElements(text) {
    let html = this.escapeHTML(text);

    html = this.processCheckboxes(html);
    // Images must precede links to avoid regex collisions
    html = this.processImages(html);
    html = this.processLinks(html);
    html = this.processEscapedTags(html);
    html = this.processInlineCode(html);
    html = this.processBold(html);
    html = this.processItalic(html);

    return html;
  }

  /**
   * Process checkboxes
   */
  processCheckboxes(text) {
    const working = text.trim();
    return working.replace(AMarkdown.rex.checkbox, (match, state, rest) => {
      const checked = state.toLowerCase() === 'x' ? 'checked ' : '';
      return `<input type="checkbox" ${checked}disabled part="checkbox ${checked}"> ${rest}`;
    });
  }

  processEscapedTags(text) {
    return text;
    // const match = text.match(/\\</);
    // console.log(text)
    // return text.replace(AMarkdown.rex.escapedTag, "&lt;");
  }

  /**
   * Process images
   */
  processImages(text) {
    return text.replace(AMarkdown.rex.image, (match, alt, url) => {
      return `<img src="${this.sanitizeURL(url)}" alt="${alt}" part="img">`;
    });
  }

  /**
   * Process links
   */
  processLinks(text) {
    return text.replace(AMarkdown.rex.link, (match, text, url) => {
      // Note: Since Images run first, Image markdown won't accidentally trigger link markdown
      return `<a href="${this.sanitizeURL(url)}" part="a">${text}</a>`;
    });
  }

  /**
   * Process inline code
   */
  processInlineCode(text) {
    return text.replace(AMarkdown.rex.inlineCode, '<code part="code">$1</code>');
  }

  /**
   * Process bold
   */
  processBold(text) {
    return text
      .replace(AMarkdown.rex.boldAsterisk, '<strong part="strong">$1</strong>')
      .replace(AMarkdown.rex.boldUnderscore, '<strong part="strong">$1</strong>');
  }

  /**
   * Process italic
   */
  processItalic(text) {
    return text
      .replace(AMarkdown.rex.italicAsterisk, '<em part="em">$1</em>')
      .replace(AMarkdown.rex.italicUnderscore, '<em part="em">$1</em>');
  }

  // --- Getters / Setters ---

  get file() { return this.#file }
  set file(value) { this.setAttribute('file', value) }

  get highlight() { return this.#highlight }
  set highlight(value) { this.toggleAttribute('highlight', value != null && value !== false) }
}

if (!customElements.get('a-markdown')) customElements.define('a-markdown', AMarkdown);
