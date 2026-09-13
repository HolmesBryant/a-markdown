# a-markdown

A custom HTML element that fetches, converts, and displays Markdown content as HTML.

Demo: [https://holmesbryant.github.io/a-markdown/](https://holmesbryant.github.io/a-markdown/)

## Features

* No dependencies.

* **Flexible Content Sources**: Renders Markdown from inline content within the `<a-markdown>` tags or from a `.md` file specified in the `file` attribute.

* **Code Highlighting:** Can highlight the code in code blocks by using the `highlight` attribute. See the section on Code Highlighting.

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

If your Markdown contains HTML you don't want the browser to process/execute, wrap it inside a `<textarea>`.

```html
<a-markdown>
  <textarea>
    <custom-element>...</custom-element>
    <script>alert("I'm Evil!")</script>
  </textarea>
</a-markdown>
```

### From a File

To render a Markdown file, use the file attribute.

```html
<a-markdown file="path/to/document.md"></a-markdown>
```

## Attributes and Properties

All attributes can also be set as properties in JavaScript. For boolean attributes, the presence of the attribute sets it to true.

- **file** ( *string* )
  - Default: `undefined`
  - The path to the Markdown (.md) file you want to render.

- **highlight** ( *boolean* )
  - Default: `false`
  - When this attribute is present, the component performs syntax highlighting on all code blocks. See the section on Syntax Highlighting.

- **Palette** ( *string|map* )
  - Default: `null`
  - Used for customizing the colors used for highlighting code blocks.
  - See the section on **Custom Color Palettes**

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

### Blockquotes

**Markdown:**

```
> I'm a blockquote

> I am a
> multiline blockquote
```

**HTML Result:**

```html
<blockquote part="blockquote">I'm a blockquote</blockquote>

<blockquote part="blockquote">I am a
multiline blockquote
</blockquote>
```

---

### Inline Code

**Markdown:** ``code snippet``

**HTML Result:** `<code>code snippet</code>`

---

### Code Blocks

**Markdown:**

> &grave;&grave;&grave;
> A block of code
> &grave;&grave;&grave;

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

Checkboxes are rendered as disabled HTML inputs for visual representation only.

**Markdown:**

```
- [] Pending Task
- [x] Completed Task
```

**HTML Result:**

```
<input disabled type="checkbox">`
<input disabled checked type="checkbox">
```

---

## Syntax Highlighting

If you have code blocks in your Markdown and you want syntax highlighting, add the `highlight` attribute. `<a-markdown highlight>...</a-markdown>`

The module contains a default color palette and also syntax definitions for html, css, javascript, php and python. If your code is something else you may need to create a custom syntax definition file (see the section on **Custom Syntax Definitions**.

### Using the default color palette

> &lt;a-markdown highlight>
>  &grave;``
>    &lt;div>some html&lt;/div>
>  &grave;``
> &lt;/a-markdown>

### Highlighting Javascript

> &lt;a-markdown highlight>
>   &grave;``javascript
>   function foo() { return 'foo'; }
>   &grave;``
> &lt;/a-markdown>

### Custom Color Palettes

You can customize the colors used for highlighting by passing a palette. This can be done via the `palette` attribute or property.

Default Token Types: argument, comment, function, keyword, number, operator, property, string, variable, tag.

Unless your syntax definition file adds new key words, you can just use the default keys. You do not have to include every key, the properties/values are merged into the default scheme, so any keys you omit will take the default color.

Examples:

```javascript
customElements.whenDefined( 'a-markdown' )
.then (() => {
  const instance = document.querySelector( 'a-markdown' );
  const colors = new Map();
  colors.set( "argument", "orange" );
  colors.set( "comment", "gray" );
  colors.set( "function", "dodgerblue" );
  colors.set( "keyword", "purple" );
  colors.set( "number", "darksalmon" );
  colors.set( "operator", "darkred" );
  colors.set( "property", "orchid" );
  colors.set( "string", "darkgreen" );
  colors.set( "tag", "olive" );
  colors.set( "variable", "darkkhaki" );
  // assign Map to palette
  instance.palette = colors;
});
```

Using a JSON file

```html
  <!-- custom-palette.json -->
  [
    ["argument", "lime"],
    ["comment", "gray"],
    ["function", "tan"],
    ["keyword", "darksalmon"],
    ["number", "tomato"],
    ["operator", "firebrick"],
    ["property", "gold"],
    ["string", "darkkhaki"],
    ["tag", "slategray"],
    ["variable", "orange"]
  ]

  <!-- index.html -->
  <a-markdown highlight palette="custom-palette.json">
  </a-markdown>
```

Defining colors directly in the palette attribute

```html
<a-markdown highlight palette="keyword:pink, tag:lime">
</a-markdown>
```

### Custom Syntax Definitions

To support a new language, create a syntax definition file (e.g., syntax.custom.js). A syntax definition file is a file which contains regular expressions, functions and/or arrays of keywords which tell the highlighter what to highlight.

The naming scheme for this file is "syntax.[language_name].js", so if you want to create a syntax file for Groovy, the file name would be "syntax.groovy.js".

This file must reside in the same directory as the a-markdown script.

A syntax file must use `export default {...}` to export an object where keys are token names and values are Regular Expressions (with global flag), Arrays of keywords, or Functions.

Refer to `syntax.custom.js` in the `dist` folder to help you get started writing your own syntax definition file.

> &lt;a-markdown highlight>
>  &grave;``custom
>    println "Hello, World!"
>  &grave;``
> &lt;/a-markdown>

A syntax definition file consists of a single exported object containing several properties. You must define this object as the default export.

```javascript
// syntax.example.js
  export default {
    argument: ... ,
    comment: ... ,
    function ... ,
    keyword: ... ,
    number: ... ,
    operator: ...,
    string: ...,
    tag: ...,
    variable: ...
  };
```

Each property corresponds to a CSS Custom Highlight API css rule.

The property names are the same as those desctribed in **Custom Color Palettes**.

If you add a new property name, you must add a new color palette entry which includes the new property name and a color.

```javascript
//syntax.example.js
export default {
  ...
  newProperty: ...
}
```

```html
<a-markdown highligh palette="newProperty:lemonChiffon">
</a-markdown>
```

#### Definition Types

The value for each property can be an Array, Function, RexExp or null.

**Arrays** are useful for defining things like keywords.

```javascript
export default {
  keywords: ['some', 'key', 'words'],
  ...
}
```

**Regular Expressions** are useful for simple matches that do not require extra processing or capture groups.
The RexExp **must** include the "g" flag.
Do not put quotes around the expression.

```javascript
  export default {
    number: /\b\d+\b/g,
    ...
  }
```

**Functions** are useful for more complex processing.
Each function takes two arguments (string, node) and must return a flat array of Range objects.

 - `node` is the node containing the textContent of everything inside the component's start/end tags.
   - Use `node` when invoking range.setStart(node, index) and range.setEnd(node, index).

 - `string` is the actual content. It includes spaces, tabs, line breaks etc.

```javascript
export default {
  tag: function ( string, node ) {
    let match, range;
    const ranges = [];
    const regex = /<\/?[^>]+>/g;
    while( match = regex.exec( string ) ) {
      range = new Range();
      range.setStart( node, match.index );
      range.setEnd( node, match.index + match[0].length );
      ranges.push( range );
    }

    // return flat array of Range objects
    return ranges;
  },
  ...
}
```

**Null** is used when you want to include a property, but don't really have a use for it at the moment.

```javascript
export default {
  keywords: null,
  ...
}
```

**It is important to note that the effect of each following item supercedes the effect of the previous one.**

In the following example, the "tag" definition will match everyting between and including angle brackets (including strings), but since the "string" definition follows it, any strings within the angle brackets will be colored according to the string color, not the tag color.

```javascript
// example
export default {
  tag: /<[^>]+>/g,
  string: /['"].*['"]/g,
  ...
}
```

Under the hood, the component takes the ranges from a supplied Function, or creates ranges from a supplied RexExp or Array, and passes those ranges to [an instance of Highlight](https://developer.mozilla.org/en-US/docs/Web/API/Highlight).

The Highlight instance is then passed to the global [CSS:highlights static property](https://developer.mozilla.org/en-US/docs/Web/API/CSS/highlights_static).


# Change Log

- v2
  - Complete rewrite
  - Removed dependence on Showdown and DOMPurify.
  - It now works offline.
  - Added optional syntax highlighting for code blocks.
  - removed 'src' attribute.

- v1.1:

  - added 'src' attribute as an alias of 'file';
  - improved asset loading (dynamic Showdown/DOMPurify imports with CDN fallback).
  - imporved sanitizer handling.
  - centralized options management.
  - improved file/src attribute handling.
  - improved dedent logic.
  - added debounced rendering and a readiness flag.

- v1.0 wooHoo!
