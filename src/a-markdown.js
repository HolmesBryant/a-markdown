export default class AMarkdown extends HTMLElement {

  #file;

  #abortController;
  #container;
  #slot;
  #spaces = 100;

  static rex = {
    header: /^(#{1,6})\s+(.*)$/,
    list: /^(\s*)([-*+]|\d+\.)\s+(.*)$/,
    codeBlock: /^```([a-z0-9-]*)$/i,
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
      </style>
      <div id="container"></div>
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
      break;
    }
  }

  connectedCallback() {
    this.#abortController = new AbortController();
    this._addListeners();
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
    }, { signal: this.#abortController.signal });
  }

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
   * Escapes dangerous characters.
   */
  escapeHTML(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return text.replace(/[&<>"']/g, match => map[match]);
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
        const lang = match[1] ? ` class="lang-${this.escapeHTML(match[1])}"` : '';
        state.buffer.push(`<pre><code${lang}>`);
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
      state.buffer.push(`<h${level}>${content}</h${level}>`);
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
    state.buffer.push(`<li>${parsedContent}</li>`);
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
      state.buffer.push(`<${listType}>`);
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
      return `<input type="checkbox" ${checked}disabled> ${rest}`;
    });
  }

  /**
   * Process images
   */
  processImages(text) {
    return text.replace(AMarkdown.rex.image, (match, alt, url) => {
      return `<img src="${this.sanitizeURL(url)}" alt="${alt}">`;
    });
  }

  /**
   * Process links
   */
  processLinks(text) {
    return text.replace(AMarkdown.rex.link, (match, text, url) => {
      // Note: Since Images run first, Image markdown won't accidentally trigger link markdown
      return `<a href="${this.sanitizeURL(url)}">${text}</a>`;
    });
  }

  /**
   * Process inline code
   */
  processInlineCode(text) {
    return text.replace(AMarkdown.rex.inlineCode, '<code>$1</code>');
  }

  /**
   * Process bold
   */
  processBold(text) {
    return text
      .replace(AMarkdown.rex.boldAsterisk, '<strong>$1</strong>')
      .replace(AMarkdown.rex.boldUnderscore, '<strong>$1</strong>');
  }

  /**
   * Process italic
   */
  processItalic(text) {
    return text
      .replace(AMarkdown.rex.italicAsterisk, '<em>$1</em>')
      .replace(AMarkdown.rex.italicUnderscore, '<em>$1</em>');
  }

  // --- Getters / Setters ---

  get file() { return this.#file }
  set file(value) { this.setAttribute('file', value) }
}

if (!customElements.get('a-markdown')) customElements.define('a-markdown', AMarkdown);
