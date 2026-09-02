# a-markdown

A custom HTML element that fetches, converts, and displays Markdown content as HTML.

Demo: [https://holmesbryant.github.io/a-markdown/](https://holmesbryant.github.io/a-markdown/)

## Features

* No dependencies for basic usage.

* **Flexible Content Sources**: Renders Markdown from inline content within the `<a-markdown>` tags or from a remote `.md` file specified in the `file` attribute.

* **Secure**: Built-in sanitization to prevent XSS attacks.

* **Code Highlighting:** Can highlight the code in code blocks by using the `highlight` attribute. See the section on Code Highlighting for more info.

* **Supports:** headers, bold, italic, lists (ul, ol), inline code, code blocks, links, images, blockquotes, horizontal rules and checkboxes.

## Installation

Include the script in your HTML file. Make sure to include `type="module"`.

```html
<script type="module" src="a-markdown.min.js"></script>
```
## Basic Usage

### Inline Markdown

To render inline Markdown, place it directly inside the `<a-markdown>` tags.

```html
  <a-markdown>
    # Hello, World!
  </a-markdown>
```
### From a File

To render a Markdown file, use the file attribute.

```
<a-markdown file="path/to/document.md"></a-markdown>
```

## Attributes and Properties

All attributes can also be set as properties in JavaScript. For boolean attributes, the presence of the attribute sets it to true.

- **file** (*string*)
  - Default: `undefined`
  - The path to the Markdown (.md) file you want to render.

- **highlight** (*boolean*)
  - Default: `false`
  - When this attribute is present, the component performs syntax highlighting on all code blocks. See the section on Syntax Highlighting.

- **safe** (*boolean*)
  - Default: `false`
  - When this attribute is present, entities and html tags which are potentially dangerous are escaped. Add this attribute when you are rendering content from an untrusted source.

## Supported Markdown Features

### Headers (h1 - h6)

**Markdown:**
```
# Title
## Subtitle
```

**HTML Result:**
```
<h1>Title</h1>
<h2>Subtitle</h2>
```

---

### Bold Text

**Markdown:**
```
**Strong Text** or __Strong Text__
```

**HTML Result:** `<strong>Strong Text</strong>`

---

### Italic Text

**Markdown:**
```
*Emphasized Text* or _Emphasized Text_
```

**HTML Result:** `<em>Emphasized Text</em>`

---

### Inline Code

**Markdown:** ``code snippet``

**HTML Result:** `<code>code snippet</code>`

---

### Code Blocks

**Markdown:**

```
<!-- remove backslashes -->
\```
A block of code.
\```
```

**HTML Result:**
```
<pre><code>
A block of code.
</code></pre>
```

---

### Unordered Lists

**Markdown:**
`- List Item`
`* List Item`
`+ List Item`

**HTML Result:**
```
<ul>
  <li>List Item</li>
</ul>
```

---

### Ordered Lists

**Markdown:** `1. Ordered List Item`

**HTML Result:**
```
<ol>
  <li>Ordered List Item</li>
</ol>
```

---

### Links

**Markdown:** `[A Link](http://foo.com)`

**HTML Result:** `<a href="http://foo.com" target="_blank">A Link</a>`

---

### Images

**Markdown:** `![Alt Text](extra/pic.png)`

**HTML Result**: `<img src="extra/pic.png" alt="Alt Text">`

---

### Checkboxes

**Markdown:**
`- [] Pending Task`
`- [x] Completed Task`

**HTML Result:**
`<input disabled type="checkbox">`
`<input disabled checked type="checkbox">`

---


## Syntax Highlighting

If you have code blocks in your Markdown and you want syntax highlighting, add the `highlight` attribute. `<a-markdown highlight>...</a-markdown>`

The module contains a default color palette and syntax definitions for HTML/CSS, javascript, php and python. If your code is something else you may need to create a custom syntax definition file.

A syntax definition file is a file which contains regular expressions, functions and/or arrays of keywords which tell the highlighter what to highlight.

The component will look for a file named 'syntax.your-custom-name.js' in the same directory as a-markdown.min.js (or a-markdown.js).

There is a sample syntax definition file in the `dist` folder.

For more information about creating your own syntax definition file and creating your own color palette, see the documentation for [a-code](https://github.com/HolmesBryant/a-code).

### Highlighting HTML / CSS

```
<!-- Omit the backslashes -->
<a-markdown highlight>
  \```html
    <div>some html</div>
  \```
</a-markdown>
```

### Highlighting Javascript

```
<!-- Omit the backslashes -->
<a-markdown highlight>
  \```javascript
    function foo() { return 'foo'; }
  \```
</a-markdown>
```

### Using a Custom Definition File

Make sure you have `syntax.custom-def.js` in the same directory as `a-markdown.min.js`.

```
<!-- Omit the backslashes -->
<a-markdown highlight>
  \```custom-def
    println "Hello, World!"
  \```
</a-markdown>
```


# Change Log

- v2
  - Complete rewrite
  - Removed dependence on Showdown and DOMPurify.
  - It now works offline.
  - Added optional syntax highlighting for code blocks.
  - removed 'src' attribute because it is a reserved HTML attribute name.

- v1.1:

  - added 'src' attribute as an alias of 'file';
  - improved asset loading (dynamic Showdown/DOMPurify imports with CDN fallback).
  - imporved sanitizer handling.
  - centralized options management.
  - improved file/src attribute handling.
  - improved dedent logic.
  - added debounced rendering and a readiness flag.

- v1.0 wooHoo!
