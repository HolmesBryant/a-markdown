/**
 * @file src/a-markdown.js
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 2.0
 */

/**
 * @file syntax.html.js
 * html syntax definition file for Highlighter module.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 */
var HTMLDefs = {
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
 * @file syntax.css.js
 * css syntax definition file for Highlighter module.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 */
var CSSDefs = {
	argument: /(?<=\()[^)]+(?=\))/g,
  operator: /[>~+*|=^$]/g,
  property: /(?<!@)\b[\w-]+(?=:)/g,
  number: /[+-]?\b\d*\.?\d+(?:e[+-]?\d+)?(?:%|[a-z]{1,4})?\b/ig,
  tag: null,
  string: /(["'])(?:\\.|[^\\])*?\1/g,
  comment: /(\/\*)([\s\S]*?)(\*\/)/g,
  keyword: /@[\w]+\b/g,
  variable: /--[\w\d]+-?[\w\d]*/g,
  function: /[\w-]+\s*(?=\()/g,
};

/**
 * @file syntax.javascript.js
 * javascript syntax definition file for Highlighter module.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 */
var JAVASCRIPTDefs = {
	argument: function(string, node) {
		const ranges = [];
		const regex = /\(\s*[\w]+(?:\s*,\s*([\w]+))*\s*\)/g;
		const matches = string.matchAll(regex);

		for (const match of matches) {
			const idx = match.index;
			const items = match[0].split(',').map (item => item.replace(/[()]/g, '').trim());
			for (const item of items) {
				// avoid partial matches which indexOf would trip on
				const re = new RegExp('\\b' + item + '\\b');
				const start = idx + match[0].search(re);
				const range = new Range();
				range.setStart(node, start);
				range.setEnd(node, start + item.length);
				ranges.push(range);
			}
		}
		return ranges;
	},
	operator: /\+|-|(?<!(\/|\/\*{1,}|\n\s*))\*(?!\/)|(?<![\/\*])\/(?![\/\*])|%|===|!==|>=|<=|>|<|!=|=|&&|\|\||(?<!#)!/g,
	number: /[+.-]?\d+[\^\b\.\w]*/g,
	function: /(?<=\(|\b)\w+\s*\(|\(|\)/g,
	tag: /<\/?[\w-]+|(?<=[\w"])>/g,
	keyword: [
    // --- Control Flow & Reserved Words ---
    'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'from', 'function', 'get', 'if', 'implements',
    'import', 'in', 'instanceof', 'interface', 'let', 'new', 'null', 'of',
    'package', 'private', 'protected', 'public', 'return', 'set', 'static',
    'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined',
    'var', 'void', 'while', 'with', 'yield',

    // --- Core ECMA Global Objects & Types ---
    'AggregateError', 'Array', 'ArrayBuffer', 'AsyncFunction', 'Atomics',
    'BigInt', 'BigInt64Array', 'BigUint64Array', 'Boolean', 'DataView',
    'Date', 'Error', 'EvalError', 'FinalizationRegistry', 'Float32Array',
    'Float64Array', 'Function', 'Generator', 'GeneratorFunction', 'Infinity',
    'Int16Array', 'Int32Array', 'Int8Array', 'InternalError', 'Intl', 'JSON',
    'Map', 'Math', 'NaN', 'Number', 'Object', 'Promise', 'Proxy', 'RangeError',
    'ReferenceError', 'Reflect', 'RegExp', 'Set', 'SharedArrayBuffer', 'String',
    'Symbol', 'SyntaxError', 'TypeError', 'Uint16Array', 'Uint32Array',
    'Uint8Array', 'Uint8ClampedArray', 'URIError', 'WeakMap', 'WeakRef',
    'WeakSet', 'WebAssembly',

    // --- Common Web API Globals (Instances) ---
    'alert', 'caches', 'clearInterval', 'clearTimeout', 'console', 'crypto',
    'document', 'fetch', 'globalThis', 'history', 'indexedDB', 'localStorage',
    'location', 'matchMedia', 'module', 'navigator', 'performance', 'process',
    'prompt', 'queueMicrotask', 'requestAnimationFrame', 'require', 'screen',
    'sessionStorage', 'setInterval', 'setTimeout', 'window',

    // --- Common DOM Interfaces & Constructors ---
    'AbortController', 'AbortSignal', 'Audio', 'AudioTrack', 'AudioTrackList',
    'Blob', 'BroadcastChannel', 'ByteLengthQueuingStrategy', 'CanvasGradient',
    'CanvasPattern', 'CanvasRenderingContext2D', 'CharacterData', 'CloseWatcher',
    'Comment', 'CountQueuingStrategy', 'crypto', 'CustomElementRegistry',
    'CustomEvent', 'DataTransfer', 'DataTransferItem', 'DataTransferItemList',
    'Document', 'DOMException', 'DOMMatrix', 'DOMMatrixReadOnly', 'DOMParser',
    'DOMPoint', 'DOMPointReadOnly', 'DOMQuad', 'DOMRect', 'DOMRectReadOnly',
    'DOMStringList', 'DOMStringMap', 'DOMTokenList', 'DragEvent', 'Element',
    'ElementInternals', 'Event', 'EventSource', 'EventTarget', 'File', 'FileList',
    'FileReader', 'FormData', 'FormDataEvent', 'HashChangeEvent', 'Headers',
    'History', 'HTMLAllCollection', 'HTMLAnchorElement', 'HTMLAreaElement',
    'HTMLAudioElement', 'HTMLBaseElement', 'HTMLBodyElement', 'HTMLBRElement',
    'HTMLButtonElement', 'HTMLCanvasElement', 'HTMLCollection', 'HTMLDataElement',
    'HTMLDataListElement', 'HTMLDetailsElement', 'HTMLDialogElement',
    'HTMLDirectoryElement', 'HTMLDivElement', 'HTMLDListElement', 'HTMLElement',
    'HTMLEmbedElement', 'HTMLFieldSetElement', 'HTMLFontElement',
    'HTMLFormControlsCollection', 'HTMLFormElement', 'HTMLFrameElement',
    'HTMLFrameSetElement', 'HTMLHeadElement', 'HTMLHeadingElement', 'HTMLHRElement',
    'HTMLHtmlElement', 'HTMLIFrameElement', 'HTMLImageElement', 'HTMLInputElement',
    'HTMLLabelElement', 'HTMLLegendElement', 'HTMLLIElement', 'HTMLLinkElement',
    'HTMLMapElement', 'HTMLMarqueeElement', 'HTMLMediaElement', 'HTMLMenuElement',
    'HTMLMetaElement', 'HTMLMeterElement', 'HTMLModElement', 'HTMLObjectElement',
    'HTMLOListElement', 'HTMLOptGroupElement', 'HTMLOptionElement',
    'HTMLOptionsCollection', 'HTMLOutputElement', 'HTMLParagraphElement',
    'HTMLParamElement', 'HTMLPictureElement', 'HTMLPreElement', 'HTMLProgressElement',
    'HTMLQuoteElement', 'HTMLScriptElement', 'HTMLSelectElement', 'HTMLSlotElement',
    'HTMLSourceElement', 'HTMLSpanElement', 'HTMLStyleElement',
    'HTMLTableCaptionElement', 'HTMLTableCellElement', 'HTMLTableColElement',
    'HTMLTableElement', 'HTMLTableRowElement', 'HTMLTableSectionElement',
    'HTMLTemplateElement', 'HTMLTextAreaElement', 'HTMLTimeElement',
    'HTMLTitleElement', 'HTMLTrackElement', 'HTMLUListElement',
    'HTMLUnknownElement', 'HTMLVideoElement', 'Image', 'ImageBitmap',
    'ImageBitmapRenderingContext', 'ImageData', 'IntersectionObserver',
    'IntersectionObserverEntry', 'KeyboardEvent', 'Location', 'MediaError',
    'MessageChannel', 'MessageEvent', 'MessagePort', 'MimeType', 'MimeTypeArray',
    'MouseEvent', 'MutationObserver', 'MutationRecord', 'NamedNodeMap',
    'NavigateEvent', 'Navigation', 'NavigationActivation', 'NavigationCurrentEntryChangeEvent',
    'NavigationDestination', 'NavigationHistoryEntry', 'NavigationTransition',
    'Navigator', 'Node', 'NodeIterator', 'NodeList', 'OffscreenCanvas',
    'OffscreenCanvasRenderingContext2D', 'PageRevealEvent', 'PageTransitionEvent',
    'Path2D', 'Performance', 'PerformanceEntry', 'PerformanceMark', 'PerformanceMeasure',
    'PerformanceObserver', 'PerformanceObserverEntryList', 'PerformanceResourceTiming',
    'Plugin', 'PluginArray', 'PopStateEvent', 'PromiseRejectionEvent', 'RadioNodeList',
    'Range', 'ReadableStream', 'Request', 'ResizeObserver', 'ResizeObserverEntry',
    'Response', 'Screen', 'ShadowRoot', 'SharedWorker', 'SharedWorkerGlobalScope',
    'Storage', 'StorageEvent', 'SubmitEvent', 'SVGImageElement',
    'TextDecoder', 'TextEncoder', 'TextMetrics', 'TextTrack', 'TextTrackCue',
    'TextTrackCueList', 'TextTrackList', 'TimeRanges', 'ToggleEvent', 'Touch',
    'TouchEvent', 'TouchList', 'TrackEvent', 'TreeWalker', 'UIEvent', 'URL',
    'URLSearchParams', 'UserActivation', 'ValidityState', 'VideoTrack',
    'VideoTrackList', 'VisibilityStateEntry', 'WebSocket', 'Window', 'Worker',
    'WorkerGlobalScope', 'WorkerLocation', 'WorkerNavigator', 'Worklet',
    'WorkletGlobalScope', 'WritableStream', 'XMLHttpRequest', 'XMLSerializer'
	],
	string: /['"][^'"\n]*['"]|`[^`]*`/g,
	variable: /\$\s*{[^}]+}/g,
	comment: /\#\!.*|\/\/.*|\/\*(?!\*\/)[\s\S]+?\*\//gm,
};

/**
 * @file syntax.php.js
 * PHP syntax definition file for Highlighter module.
 */
var PHPDefs = {
  argument: function(string, node) {
    const ranges = [];

    // Regex to find the start of a function definition.
    // Matches "function", optional whitespace, optional name, whitespace, and opening "("
    // This handles both named functions: "function foo(" and anonymous: "function ("
    const defRegex = /function\s+(?:[a-zA-Z_\x80-\xff]\w*\s*)?\(/g;
    const matches = string.matchAll(defRegex);

    for (const match of matches) {
      // The index where the argument list starts - immediately after the opening '('
      const startSearchIndex = match.index + match[0].length;

      // State tracking
      let depthParen = 1; // Start inside the function parentheses
      let depthBracket = 0; // [] (arrays in default values)
      let depthBrace = 0; // {}
      let quoteChar = null; // ' or "

      let currentArgStart = startSearchIndex;

      for (let i = startSearchIndex; i < string.length; i++) {
        const char = string[i];

        // Handle Quotes (Strings within default values, e.g. function($a = ")") )
        if (quoteChar) {
          if (char === quoteChar && string[i - 1] !== '\\') {
            quoteChar = null;
          }
          continue;
        } else if (char === '"' || char === "'") {
          quoteChar = char;
          continue;
        }

        // Handle Nesting
        if (char === '(') depthParen++;
        else if (char === ')') depthParen--;
        else if (char === '[') depthBracket++;
        else if (char === ']') depthBracket--;
        else if (char === '{') depthBrace++;
        else if (char === '}') depthBrace--;

        // Check for End of Argument (Comma) or End of Function Def (Closing Paren)
        const isComma = char === ',' && depthParen === 1 && depthBracket === 0 && depthBrace === 0;
        const isEnd = depthParen === 0;

        if (isComma || isEnd) {
          // Extract raw argument, e.g., "int &$count = 0"
          const rawArg = string.substring(currentArgStart, i);

          if (rawArg.trim()) {
            // Logic to isolate the variable name ($var)
            // 1. We stop looking if we hit an '=' (default value assignment)
            // 2. We look for the pattern starting with $
            const equalsIndex = rawArg.indexOf('=');
            const searchPart = equalsIndex > -1 ? rawArg.substring(0, equalsIndex) : rawArg;

            // Regex matches:
            // 1. Optional reference (&) or variadic (...)
            // 2. The variable starting with $
            const varMatch = searchPart.match(/((?:&|\.\.\.)?\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/);

            if (varMatch) {
              const fullMatchString = varMatch[0]; // e.g. "&$count"

              // Calculate offset relative to the raw argument string
              const matchIndex = searchPart.indexOf(fullMatchString);

              // Absolute start index in the text node
              const start = currentArgStart + matchIndex;
              const end = start + fullMatchString.length;

              try {
                const range = new Range();
                range.setStart(node, start);
                range.setEnd(node, end);
                ranges.push(range);
              } catch (e) {
                console.warn("Could not create range for argument", fullMatchString, e);
              }
            }
          }

          if (isEnd) break;
          currentArgStart = i + 1;
        }
      }
    }

    return ranges;
  },

  // Matches PHP variables: starts with $ followed by valid chars
  variable: /\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/g,

  // Matches standard operators, arrow (->), double arrow (=>), scope (::), and comparison
  operator: /\.|->|=>|::|\?|\?\?|!|\+|-|\*|\/|%|\*\*|=|==|!=|===|!==|<|>|<=|>=|&|\||\^|~|<<|>>|(?<!\w)new(?!\w)|(?<!\w)instanceof(?!\w)/g,

  // Matches Hex, Binary, Octal, Floats, and Integers
  number: /\b0b[01]+\b|\b0x[\da-f]+\b|\b0o[0-7]+\b|\b\d*\.?\d+(?:e[+-]?\d+)?\b/ig,

  // Matches function definitions (after 'function') AND function calls (before '(')
  function: /(?<=function\s+)[a-zA-Z_\x80-\xff]\w*|(?<=\b)[a-zA-Z_\x80-\xff]\w*(?=\s*\()/g,

  // Matches PHP open/close tags
  tag: /<\?(?:php|=)?|\?>/gi,

  keyword: [
    // Control Flow
    'if', 'else', 'elseif', 'endif',
    'while', 'do', 'for', 'foreach', 'as', 'endwhile', 'endfor', 'endforeach',
    'switch', 'case', 'default', 'break', 'continue', 'endswitch', 'match',
    'return', 'goto',

    // Exception Handling
    'try', 'catch', 'finally', 'throw',

    // Definitions & Scope
    'function', 'fn', 'class', 'interface', 'trait', 'enum',
    'extends', 'implements', 'abstract', 'final', 'const',
    'public', 'protected', 'private', 'static', 'var', 'global', 'readonly',
    'namespace', 'use', 'insteadof',

    // Language Constructs
    'echo', 'print', 'include', 'include_once', 'require', 'require_once',
    'isset', 'empty', 'unset', 'die', 'exit', 'eval', 'list', 'clone', 'declare',

    // Types (Scalar & Compound)
    'array', 'string', 'int', 'float', 'bool', 'object', 'callable', 'iterable', 'void', 'mixed', 'never', 'null', 'false', 'true',

    // Magic Constants
    '__LINE__', '__FILE__', '__DIR__', '__FUNCTION__', '__CLASS__', '__TRAIT__', '__METHOD__', '__NAMESPACE__',

    // --- Predefined Interfaces ---
    'Traversable', 'Iterator', 'IteratorAggregate', 'Throwable', 'ArrayAccess',
    'Serializable', 'Countable', 'Stringable', 'UnitEnum', 'BackedEnum',
    'JsonSerializable', 'Reflector', 'DateTimeInterface', 'SessionHandlerInterface', 'InternalIterator',

    // --- Common SPL (Standard PHP Library) Interfaces ---
    'OuterIterator', 'RecursiveIterator', 'SeekableIterator', 'SplObserver', 'SplSubject',

    // --- Superglobals (Global Variables) ---
    '$GLOBALS', '$_SERVER', '$_GET', '$_POST', '$_FILES',
    '$_COOKIE', '$_SESSION', '$_REQUEST', '$_ENV',

    // --- Other Standard Globals ---
    '$argc', '$argv', '$this'
  ],

  // Matches Double quotes, Single quotes, and Backticks (Execution operator)
  // Note: Does not currently handle complex Heredoc/Nowdoc syntaxes
  string: /(["'`])(?:\\.|[^\\])*?\1/g,

  // Matches Single line (//, #) and Multi-line (/* ... */) comments
  comment: /\/\*[\s\S]*?\*\/|(?:\/\/|#).*/g
};

/**
 * @file syntax.python.js
 * python syntax definition file for Highlighter module.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 */
var PYTHONDefs = {
  argument: function(string, node) {
    const ranges = [];

    // Regex to find the start of a function definition:
    // Matches "def", whitespace, function name, and opening "("
    const defRegex = /def\s+[a-zA-Z_]\w*\s*\(/g;
    const matches = string.matchAll(defRegex);

    for (const match of matches) {
      const startSearchIndex = match.index + match[0].length;

      let depthParen = 1; // start inside the first definition parenthesis
      let depthBracket = 0; // []
      let depthBrace = 0; // {}
      let quoteChar = null; // ' or "

      let currentArgStart = startSearchIndex;

      // Iterate through the string starting after "def name("
      for (let i = startSearchIndex; i < string.length; i++) {
        const char = string[i];

        // Handle Quotes (Strings within default values, e.g. a=",")
        if (quoteChar) {
          if (char === quoteChar && string[i - 1] !== '\\') {
            quoteChar = null; // End of string
          }
          // Skip processing characters inside strings
          continue;
        } else if (char === '"' || char === "'") {
          // Start of string
          quoteChar = char;
          continue;
        }

        // Handle Nesting (Type hints or Default values containing brackets)
        if (char === '(') depthParen++;
        else if (char === ')') depthParen--;
        else if (char === '[') depthBracket++;
        else if (char === ']') depthBracket--;
        else if (char === '{') depthBrace++;
        else if (char === '}') depthBrace--;

        // Check for End of Argument (Comma) or End of Function Def (Closing Paren)
        // Only split if we are at the top level of the argument list
        const isComma = char === ',' && depthParen === 1 && depthBracket === 0 && depthBrace === 0;
        const isEnd = depthParen === 0;

        if (isComma || isEnd) {
          // Extract the raw argument string, e.g., "  a: int = 10  " or " *args "
          const rawArg = string.substring(currentArgStart, i);

          // --- Argument Extraction Logic ---
          if (rawArg.trim()) {
          // Regex to capture optional stars (* or **) and the name
          // Stops before type hints (:) or defaults (=)
          const nameMatch = rawArg.match(/^\s*(\*{0,2})([a-zA-Z_]\w*)/);

            if (nameMatch && nameMatch[2]) {
              const argName = nameMatch[2];

              // Calculate offset:
              // nameMatch[0] is the full matched prefix (e.g. "  *args")
              // Find the last occurrence of the name within that prefix to handle spaces/stars correctly.
              const nameOffsetInMatch = nameMatch[0].lastIndexOf(argName);

              // Absolute start index in the original text node
              const start = currentArgStart + nameMatch.index + nameOffsetInMatch;
              const end = start + argName.length;

              try {
                const range = new Range();
                range.setStart(node, start);
                range.setEnd(node, end);
                ranges.push(range);
              } catch (e) {
                console.warn("Could not create range for argument", argName, e);
              }
            }
          }

          // ---------------------------------

          if (isEnd) break; // Finished parsing this function
          currentArgStart = i + 1; // Move start to character after comma
        }
      }
    }

    return ranges;
  },
  // Matches standard operators, bitwise, comparison, assignment, and delimiter colons/dots
  operator: /\+|-|\*|\/|%|\*\*|\/\/|=|==|!=|<=|>=|<|>|&|\||\^|~|!|:|(?<![a-zA-Z0-9_])\.(?![a-zA-Z0-9_])/g,

  // Matches Hex, Binary, Octal, Floats, Integers, and Complex numbers
  number: /\b0x[\da-f]+\b|\b0b[01]+\b|\b0o[0-7]+\b|\b\d+\.?\d*(?:e[+-]?\d+)?j?\b/ig,

  // Matches function definitions (after 'def') AND function calls (before '(')
  function: /(?<=def\s+)\w+|(?<=\b)\w+(?=\s*\()/g,

  // Repurposed to match Decorators (e.g. @classmethod, @app.route)
  tag: /@\s*[\w.]+/g,

  keyword: [
    // --- Logic & Flow ---
    'and', 'or', 'not', 'is', 'in',
    'if', 'elif', 'else',
    'for', 'while', 'break', 'continue',
    'try', 'except', 'finally', 'raise', 'assert',
    'with', 'as', 'pass',
    'return', 'yield', 'lambda',
    'match', 'case', // Python 3.10+

    // --- Definition & Scope ---
    'def', 'class', 'global', 'nonlocal', 'del',
    'import', 'from',

    // --- Async ---
    'async', 'await',

    // --- Constants ---
    'True', 'False', 'None',
    'Ellipsis', 'NotImplemented', '__debug__',

    // --- Built-in Types ---
    'bool', 'int', 'float', 'complex',
    'str', 'bytes', 'bytearray',
    'list', 'tuple', 'set', 'frozenset', 'dict',
    'object', 'type',

    // --- Built-in Functions ---
    'abs', 'aiter', 'all', 'any', 'anext', 'ascii', 'bin', 'breakpoint',
    'callable', 'chr', 'classmethod', 'compile', 'delattr', 'dir', 'divmod',
    'enumerate', 'eval', 'exec', 'filter', 'format', 'getattr', 'globals',
    'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'isinstance', 'issubclass',
    'iter', 'len', 'locals', 'map', 'max', 'memoryview', 'min', 'next',
    'oct', 'open', 'ord', 'pow', 'print', 'property', 'range', 'repr',
    'reversed', 'round', 'setattr', 'slice', 'sorted', 'staticmethod',
    'sum', 'super', 'vars', 'zip', '__import__',

    // --- Built-in Exceptions ---
    'BaseException', 'Exception', 'ArithmeticError', 'BufferError', 'LookupError',
    'AssertionError', 'AttributeError', 'EOFError', 'FloatingPointError',
    'GeneratorExit', 'ImportError', 'ModuleNotFoundError', 'IndexError',
    'KeyError', 'KeyboardInterrupt', 'MemoryError', 'NameError',
    'NotImplementedError', 'OSError', 'OverflowError', 'RecursionError',
    'ReferenceError', 'RuntimeError', 'StopIteration', 'StopAsyncIteration',
    'SyntaxError', 'IndentationError', 'TabError', 'SystemError', 'SystemExit',
    'TypeError', 'UnboundLocalError', 'UnicodeError', 'UnicodeEncodeError',
    'UnicodeDecodeError', 'UnicodeTranslateError', 'ValueError',
    'ZeroDivisionError', 'BlockingIOError', 'ChildProcessError',
    'ConnectionError', 'BrokenPipeError', 'ConnectionAbortedError',
    'ConnectionRefusedError', 'ConnectionResetError', 'FileExistsError',
    'FileNotFoundError', 'InterruptedError', 'IsADirectoryError',
    'NotADirectoryError', 'PermissionError', 'ProcessLookupError',
    'TimeoutError', 'Warning', 'UserWarning', 'DeprecationWarning',
    'PendingDeprecationWarning', 'SyntaxWarning', 'RuntimeWarning',
    'FutureWarning', 'ImportWarning', 'UnicodeWarning', 'BytesWarning',
    'ResourceWarning',

    // --- Special Attributes ---
    '__name__', '__file__', '__doc__', '__package__',
    '__loader__', '__spec__', '__annotations__', '__builtins__',

    // --- ABC Interfaces (collections.abc / typing) ---
    'Container', 'Hashable', 'Iterable', 'Iterator', 'Reversible', 'Generator',
    'Sized', 'Callable', 'Collection', 'Sequence', 'MutableSequence',
    'ByteString', 'Set', 'MutableSet', 'Mapping', 'MutableMapping',
    'MappingView', 'ItemsView', 'KeysView', 'ValuesView',
    'Awaitable', 'Coroutine', 'AsyncIterable', 'AsyncIterator', 'AsyncGenerator'
  ],

  // Matches Triple quotes (double/single) then Single quotes (double/single), handling prefixes (f, r, b, u)
  string: /(?:r|u|f|b|fr|rf)?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/gi,

  // Repurposed for "Self", "Cls", and Dunder (Magic) methods
  variable: /\bself\b|\bcls\b|\b__[a-z_]+__\b/g,

  comment: /#.*/g
};

/**
 * @file src/Highlighter.js
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 2.5
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
class Highlighter {
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

    // Attach styles to `element` shadow root to avoid global pollution
    try {
      const shadow = element.shadowRoot || element.attachShadow({ mode: 'open' });
      shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, this.#style];
    } catch (error) {
      throw new Error(`The element passed to the Highlighter constructor must be able to have a shadow DOM. The element given (${element.localName}) cannot have one.`, { cause: error });
    }
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

    try {
      CSS.highlights.set(highlightName, highlight);
    } catch (error) {
      console.error('Highlighter.applyHighlight(): Error setting CSS Highlights', error);
    }
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
    if (!syntax) return this.#defaultSyntaxDefs;

    if (syntaxCache.has(syntax)) {
      return syntaxCache.get(syntax);
    }

    if (typeof syntax === "object") {
      syntaxCache.set("custom", syntax);
      return syntax;
    }

    let def;

    switch (syntax) {
      case 'css':
        def = CSSDefs;
        break;
      case 'html':
        def = HTMLDefs;
        break;
      case 'javascript':
      case 'js':
        def = JAVASCRIPTDefs;
        break;
      case 'php':
        def = PHPDefs;
        break;
      case 'python':
        def = PYTHONDefs;
        break;
    }

    if (def) return def;

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

const sheet = new CSSStyleSheet();
          sheet.replaceSync(":host { --code-background: white; --text-color: black; --blockquote-pad: 1rem; --list-indent: 1.5rem; --block-tab-size: 4; color: var(--text-color); display: block; overflow: auto; tab-size: var(--block-tab-size); white-space: wrap;}blockquote { white-space: pre-wrap }code { background: var(--code-background); padding: 0 5px;}ol, ul { list-style-position: inside; padding: 0;}ol ol, ul ul { margin-left: var(--list-indent) }pre { background: var(--code-background); overflow: auto; padding: 0 0 var(--blockquote-pad) var(--blockquote-pad);}#container { overflow: auto; padding: 0 1rem;}@media (prefers-color-scheme: dark) { :host { --code-background: rgb(20,20,20); --text-color: white; }}");

/**
 * @file src/a-markdown.js
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 2.0
 */


const abindUpdate = Symbol.for('abind.update');

/**
 * A custom element that converts Markdown syntax to HTML.
 * Supports headers, bold, italic, lists (ul, ol), inline code, code blocks, links, images, blockquotes, horizontal rules and checkboxes.
 * @class AMarkdown
 * @extends HTMLElement
 */
class AMarkdown extends HTMLElement {

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

  #palette = 'default';

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
   * The most current markdown content
   * @type {string}
   * @private
   */
  #markdown;

  #noescape = false;

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

  #trim = 0;

  static observedAttributes = [
    'debug',
    'file',
    'highlight',
    'palette'
  ]

  /**
   * Regular expressions for parsing Markdown syntax.
   * @typedef {Object<string, RegExp>} rex
   */
  static rex = {
    blockquote: /^((?:>|&gt;)+)\s+(.*)/,
    boldAsterisk: /\*{2}([^*]+)\*{2}/g,
    boldUnderscore: /__([^*]+)__/g,
    checkbox: /\[([ xX]?)\]\s+(.*)$/,
    codeBlock: /^```([a-z0-9-]*)$/i,
    header: /^(#{1,6})\s+(.*)$/,
    horizontalRule: /^(\r?\n|^)([*_-]{3,})(\r?\n|$)/,
    image: /!\[([^\]]*)\]\(([^)]+)\)/g,
    inlineCode: /`([^`]+)`/g,
    italicAsterisk: /(^|\s+)\*([^*]+)\*/g,
    italicUnderscore: /(^|\s+)_([^_]+)_/g,
    link: /\[([^\]]*)\]\(([^)]+)\)/g,
    list: /^(\s*)([-*+]|\d+\.)\s+(.*)/,
    trim: /^\s+/,
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
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.shadowRoot.append(AMarkdown.template.content.cloneNode(true));
    this.#container = this.shadowRoot.getElementById('container');
    this.#slot = this.shadowRoot.getElementById('slot');
  }

  // -- Lifecycle Methods --

  attributeChangedCallback(attr, oldval, newval) {
    if (newval === oldval) return;
    switch (attr) {
    case 'debug':
      this.debug = this.hasAttribute('debug');
      break;
    case 'file':
      this.#file = (newval) ? newval : null;
      if (this.#connected) {
        if (this.#file) {
          this.#noescape = false;
          this.#fetchFile(newval);
        } else if (this.#markdown) {
          // no file, check default (inline) markdown
          let markdown;
          if (this.#markdown.trim().startsWith('<textarea>')) {
            const frag = document.createRange().createContextualFragment(this.#markdown);
            markdown = frag.children[0].innerHTML;
            this.#noescape = true;
          } else {
            markdown = this.#markdown;
            this.#noescape = false;
          }
          this.render(markdown);
        }
      }
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

    case 'palette':
      this.#palette = newval;
      if (this.#connected) this.#highlightCode();
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
      let markdown;
      if (this.children[0]?.localName === 'textarea') {
        markdown = this.children[0].innerHTML;
        if (!this.#file) this.#noescape = true;
      } else {
        markdown = this.innerHTML;
      }

      this.#markdown = this.innerHTML;
      if (this.#file) return;
      this.render(markdown);
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
    const leadingSpaces = markdown.match(AMarkdown.rex.trim) || 0;
    markdown = markdown.trim();

    const lines = markdown.split('\n');
    const state = {
      inBlockquote: false,
      inCodeBlock: false,
      listStack: [],
      buffer: []
    };

    if (
      lines[0].match(AMarkdown.rex.list) ||
      lines[0].match(AMarkdown.rex.codeBlock)
    ) {
      lines[0] = (leadingSpaces[0] + lines[0]).replace(/\n/g, '');
    }

    lines.forEach( (line, index) => {
      this.#routeLine(line, state);
    });

    this.#closeOpenLists(state);
    return state.buffer.join('\n');
  }

  /**
   * Renders the parsed markdown into this.#container
   *
   * @param {string} markdown - The Markdown to render.
   */
  render(markdown) {
    const html = this.parse(markdown);
    this.#container.innerHTML = html;
    if (this.#highlight) this.#highlightCode();
    this.#trim = 0;
  }

  // --- Private Methods ---

  /**
   * Adds an escaped line of text inside a code block.
   * @param {string} line - The raw line from the markdown source.
   * @param {Object} state - The current parsing state object.
   */
  #addCodeLine(line, state) {
    line = line.slice(this.#trim);
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
    if (this.#noescape) return text;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']|\\<|\\>/g, match => map[match]);
  }

  /**
   * fetches a markdown file, parses it and (optionally) performs syntax highlighting.
   *
   * @param {string} url - The url or path to the file
   */
  async #fetchFile(url) {
    if (!url) {
      console.error('a-markdown.fetchFile(url): no URL was provided.', this);
      return;
    }
    const response = await fetch(url);
    if (response.ok) {
      const contentType = response.headers.get('Content-Type');

      if (contentType && !contentType.startsWith('text/markdown')) {
        throw new Error(`a-markdown: Server responded, but not with a Markdown file. Make sure ${url} exists and is a Markdown file.`);
      }

    this.#destroyHighlights();
    this.render(await response.text());
    } else {
      throw new Error(`a-markdown: Unable to fetch markdown file: ${this.#file}`);
    }
  }

  async #getPalette(value) {
    if (value instanceof Map) return value;

    if (typeof value !== 'string') {
      console.warn('a-markdown.getPalette: param must be a string.', value);
      return;
    }

    let palette;

    if (value.endsWith('.json')) {
      try {
        const response = await fetch (value);
        const json = await response.json();
        palette = new Map(json);
      } catch (error) {
        console.warn(`Cannot fetch ${value}. Using default palette.`, error, this);
      }
    } else if (value.trim().toLowerCase() === 'default') {
      palette = null;
    } else {
      // "property:value, property:value" etc
      try {
        const props = value.split(',')
        .map( member => member.trim() )
        .map(
          prop => prop.split(':')
          .map( item => item.trim())
        );

        palette = JSON.stringify(props);
      } catch (error) {
        console.error(error);
      }
    }

    return palette;
  }

  #getSyntax(codeBlock) {
    const cssClass = [...codeBlock.classList].find(item => item.startsWith('lang-'));
    return (cssClass) ? cssClass.split('-')[1] : null;
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
      state.buffer.push('<blockquote part="blockquote">' + match[2]);
      state.inBlockquote = true;
      return true;
    } else if (!match && state.inBlockquote) {
      state.buffer.push('</blockquote>');
      state.inBlockquote = false;
      return false;
    } else if (match) {
      state.buffer.push(match[2]);
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
      const spaces = line.match(AMarkdown.rex.trim);
      if (spaces) this.#trim = spaces[0].length;
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

    // Normalize tabs to 4 spaces
    const indent = match[1].replace(/\t/g, '    ').length;
    const marker = match[2];
    const content = match[3];
    const listType = /^\d/.test(marker) ? 'ol' : 'ul';

    this.#syncListStack(state, indent, listType);

    const parsedContent = this.#routeInlineElements(content, state);
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
    const content = this.#routeInlineElements(line, state);
    state.buffer.push(`<p>${content}</p>`);
  }

  /**
   * Finds all code blocks in the container and applies highlighting.
   * @param {string} line - The current line being processed.
   * @param {Object} state - The current parsing state object.
   * @returns {void}
   */
  async #highlightCode() {
    const codeBlocks = this.#container.querySelectorAll('pre[part="pre"] code');
    if (!codeBlocks.length) return;

    const palette = await this.#getPalette(this.#palette);

    for (const block of codeBlocks) {
      const syntax = this.#getSyntax(block);
      const highlighter = new Highlighter(this, syntax, palette);
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
      return `<input type="checkbox" ${checked} disabled part="checkbox ${checked}"> ${rest}`;
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
      const content = this.#routeInlineElements(match[2], state);
      state.buffer.push(`<h${level} part="h${level}">${content}</h${level}>`);
      return true;
    }
    return false;
  }

  #processHorizontalRule(line, state) {
    line = line.trim();
    const match = line.match(AMarkdown.rex.horizontalRule);
    if (match) {
      state.buffer.push(line.replace(AMarkdown.rex.horizontalRule, '<hr>'));
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
    if (line.includes('<code')) return line;
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
    const match = line.match(AMarkdown.rex.inlineCode);
    if (!match) return line;
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
      .replace(AMarkdown.rex.italicAsterisk, '<em part="em">$2</em>')
      .replace(AMarkdown.rex.italicUnderscore, ' <em part="em">$2</em>');
  }

  /**
   * Process links.
   * @param {string} line - The current line being processed.
   * @returns {string} - The processed text
   */
  #processLinks(line) {
    if (line.includes('<code')) return line;
    return line.replace(AMarkdown.rex.link, (match, line, url) => {
      return `<a href="${this.#sanitizeURL(url)}" part="link" target="_blank">${this.#escapeHTML(line)}</a>`;
    });
  }

  /**
   * Orchestrates the processing of inline items.
   * Note: Sequence order matters.
   *
   * @param {string} line - The current line being processed.
   * @returns {string} - The processed text
   */
  #routeInlineElements(line, state) {
    if (state.inCodeBlock) return this.#escapeHTML(line);
    let html = line;
    html = this.#processInlineCode(html);
    html = this.#processCheckboxes(html, state);
    html = this.#processImages(html, state);
    html = this.#processLinks(html, state);
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
    if (this.#processHorizontalRule(line, state)) return;
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
  set file(value) { this.setAttribute('file', value); }

  get highlight() { return this.#highlight }
  set highlight(value) { this.toggleAttribute('highlight', value != null && value !== false); }

  get palette() { return this.#palette }
  set palette(value) {
    if (typeof value === 'string') {
      this.setAttribute('palette', value);
    } else if (value instanceof Map) {
      this.#palette = value;
      this.#highlightCode();
    }
  }
}

if (!customElements.get('a-markdown')) customElements.define('a-markdown', AMarkdown);

export { AMarkdown as default };
