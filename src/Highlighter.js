/**
 * @file src/Highlighter.js
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 2.0
 */

/**
 * Caches syntax definitions.
 * @type {Map<string, Object>}
 */
const syntaxCache = new Map();

/**
 * Manages syntax highlighting using the CSS Custom Highlight API.
 * @class Highlighter
 */
export default class Highlighter {
  /** @private */ #syntax = null;
  /** @private */ #defs = {};
  /** @private */ #id;
  /** @private */ #palette;
  /** @private */ #style;
  /** @private */ #element;
  /** @private */ #textNode;
  /** @private */ #latestRequestId = 0;

  /**
   * Default regular expressions for syntax tokens.
   * @private
   */
  #defaultSyntaxDefs = {
    argument: /(?<=\()[^)]+(?=\))/g,
    operator: /[>~+*|=^$]/g,
    property: /(?<!@)\b[\w-]+(?=:)/g,
    number: /[+-]?\b\d*\.?\d+(?:e[+-]?\d+)?(?:%|[a-z]{1,4})?\b/ig,
    tag: /<\/?[\w-]+|\/>|(?<=[\w"'])>/g,
    string: /(["'])(?:\\.|[^\\])*?\1/g,
    comment: /(<!--|\/\*)([\s\S]*?)(-->|\*\/)/g,
    keyword: /@[\w]+\b/g,
    variable: /--[\w\d]+-?[\w\d]*/g,
    function: /[\w-]+\s*(?=\()/g,
  };

  /**
   * Default color palette mapping token types to colors.
   * @private
   */
  #defaultPalette = new Map([
    ["argument", "hsl(32, 93%, 66%)"],
    ["comment", "hsl(221, 12%, 69%)"],
    ["function", "hsl(210, 50%, 60%)"],
    ["keyword", "deeppink"],
    ["number", "hsl(32, 93%, 50%)"],
    ["operator", "red"],
    ["property", "orchid"],
    ["string", "hsl(114, 31%, 68%)"],
    ["variable", "darkkhaki"],
    ["tag", "indianred"],
  ]);

  /**
   * Creates an instance of Highlighter.
   *
   * @param {HTMLElement} element - The host element containing the code. Element must support attachShadow().
   * @param {string} syntax - The syntax language identifier.
   * @param {Object|string} palette - The color palette definition.
   * @param {string} [id] - A unique identifier for the highlighter instance.
   * @throws {Error} If the passed element is not an HTMLElement.
   */
  constructor(element, syntax, palette, id) {
    if (!(element instanceof HTMLElement)) {
      throw new Error("Element passed to Highlighter must be an HTML element");
    }
    this.#element = element;
    this.#syntax = syntax;
    this.setPalette(palette);
    this.#id = id || Math.random().toString(36).substring(2, 9);

    this.#style = this.#createStyles();

    // Attach styles to the component's shadow root to avoid global pollution
    const shadow = element.shadowRoot || element.attachShadow({ mode: 'open' });
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, this.#style];
  }

  // --- Public Methods ---

  /**
   * Cleans up the highlighter, removing styles and references.
   */
  destroy() {
    this.#deleteCssHighlights();

    if (this.#element && this.#element.shadowRoot) {
      this.#element.shadowRoot.adoptedStyleSheets =
        this.#element.shadowRoot.adoptedStyleSheets.filter(s => s !== this.#style);
    }

    this.#element = null;
    this.#textNode = null;
  }

  /**
   * Performs the syntax highlighting on the specified text node.
   *
   * @async
   * @param {Node} textNode - The text node containing the code.
   */
  async highlight(textNode) {
    if (textNode && textNode.nodeType !== Node.TEXT_NODE) {
      if(textNode.childNodes.length > 0) {
         textNode = Array.from(textNode.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
      }
      if (!textNode) textNode = document.createTextNode("");
    }

    if (!(this.#textNode = textNode || this.#textNode)) return;
    const currentRequestId = ++this.#latestRequestId;
    const defs = await this.#getSyntaxDefs(this.#syntax);

    if (currentRequestId !== this.#latestRequestId) return;
    this.#defs = defs;

    try {
      this.#doHighlights(this.#defs, this.#textNode);
    } catch (error) {
      console.error("Error highlighting code:", error);
    }
  }

  /**
   * Updates the color palette and regenerates styles.
   *
   * @param {Map|string} palette - The new palette configuration.
   */
  setPalette(palette) {
    let map;
    if (palette instanceof Map) {
      map = palette;
    } else if (typeof palette === 'string') {
        if (palette === 'default') {
            map = this.#defaultPalette;
        } else {
            try {
                map = new Map(JSON.parse(palette));
            } catch (e) {
                console.warn("Invalid palette JSON string, using default.", this.#element);
                map = this.#defaultPalette;
            }
        }
    } else {
        map = this.#defaultPalette;
    }

    this.#palette = map;

    if (this.#style) {
        const newSheet = this.#createStyles();
        this.#style.replaceSync(newSheet.cssRules[0]?.cssText ? Array.from(newSheet.cssRules).map(r=>r.cssText).join(' ') : '');
    }
  }

  // --- Private Methods

  /**
   * Creates a CSS Highlight for a specific token type and set of ranges.
   *
   * @private
   * @param {Set<Range>} ranges - The ranges to highlight.
   * @param {string} key - The token type key (e.g., 'keyword').
   */
  #applyHighlight(ranges, key) {
    if (!ranges || ranges.size === 0) return;
    const highlightName = `${key}-${this.#id}`;
    const highlight = new Highlight(...ranges);
    CSS.highlights.set(highlightName, highlight);
  }

  /**
   * Generates the CSSStyleSheet for the current palette.
   *
   * @private
   * @returns {CSSStyleSheet}
   */
  #createStyles() {
    const sheet = new CSSStyleSheet();
    let rules = "";
    this.#palette.forEach((color, key) => {
      const highlightName = `${key}-${this.#id}`;
      rules += `::highlight(${highlightName}) { color: ${color}; } `;
    });
    sheet.replaceSync(rules);
    return sheet;
  }

  /**
   * Removes all CSS Custom Highlights associated with this instance.
   */
  #deleteCssHighlights() {
    if (!this.#defs) return;
    for (const key of Object.keys(this.#defs)) {
      const highlightName = `${key}-${this.#id}`;
      CSS.highlights.delete(highlightName);
    }
  }

  /**
   * Applies highlights to the text node based on the syntax object.
   *
   * @private
   * @param {Object} syntaxObj - The syntax definitions.
   * @param {Node} textNode - The text node to highlight.
   * @returns {number} The size of the CSS highlights set.
   */
  #doHighlights(syntaxObj, textNode) {
    if (textNode.nodeType !== Node.TEXT_NODE) return 0;

    const string = textNode.textContent;

    for (const [prop, value] of Object.entries(syntaxObj)) {
      let ranges;

      if (!value) {
        continue;
      } else if (Array.isArray(value)) {
        const words = [...new Set(value)].map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");
        const regex = new RegExp(`\\b(${words})\\b`, "g");
        ranges = this.#setRanges(regex, string, textNode);
      } else if (typeof value === 'function') {
        ranges = new Set(value(string, textNode));
      } else if (value instanceof RegExp) {
        ranges = this.#setRanges(value, string, textNode);
      } else {
        console.warn(`Invalid syntax definition for ${prop}`);
        continue;
      }

      this.#applyHighlight(ranges, prop);
    }

    return CSS.highlights.size;
  }

  /**
   * Retrieves syntax definitions, loading them dynamically if necessary.
   *
   * @private
   * @param {string|Object} syntax - The syntax identifier or definition object.
   * @returns {Promise<Object>} The syntax definition object.
   */
  async #getSyntaxDefs(syntax) {
    if (!syntax || syntax === 'html') return this.#defaultSyntaxDefs;

    if (typeof syntax === "object") {
        syntaxCache.set("custom", syntax);
        return syntax;
    }

    if (syntaxCache.has(syntax)) {
      return syntaxCache.get(syntax);
    }

    let url = syntax;
    if (!/^(http|\.|\/)/.test(syntax)) url = `./syntax.${syntax}.js`;

    try {
      const module = await import(url);
      const defs = module.default;
      syntaxCache.set(syntax, defs);
      return defs;
    } catch (error) {
      console.warn(`Could not load syntax file: ${url}. Reverting to default.`, error);
      return this.#defaultSyntaxDefs;
    }
  }

  /**
   * Finds all matches for a regex in a string and creates Ranges.
   *
   * @private
   * @param {RegExp} regex - The regular expression to match.
   * @param {string} string - The text content.
   * @param {Node} node - The text node.
   * @returns {Set<Range>} A set of Range objects.
   */
  #setRanges(regex, string, node) {
    const ranges = new Set();
    const matches = string.matchAll(regex);

    for (const match of matches) {
      if (match[0].length === 0) continue;
      try {
        const range = new Range();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        ranges.add(range);
      } catch (e) { /* ignore range errors */ }
    }
    return ranges;
  }
}
