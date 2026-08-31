# a-markdown

A custom HTML element that fetches, converts, and displays Markdown content as HTML.

Demo: [https://holmesbryant.github.io/a-markdown/](https://holmesbryant.github.io/a-markdown/)

## Features

* No dependencies for basic usage.

* **Flexible Content Sources**: Renders Markdown from inline content within the `<a-markdown>` tags or from a remote `.md` file specified in the `file` attribute.

* **Secure**: Built-in sanitization to prevent XSS attacks.

* **Code Highlighting** Can highlight the code in code blocks by using the `highlight` attribute. See the section on Code Highlighting for more info.

## Installation

Simply include the script in your HTML file. Make sure to include `type="module"`.

```html
<script type="module" src="a-markdown.min.js"></script>
```
## Basic Usage

### Inline Markdown

To render inline Markdown, place it directly inside the `<a-markdown>` tags.

```html
  \<a-markdown>
    # Hello, World!

    This is a paragraph with **bold** and *italic* text.

    - List item 1
    - List item 2
  \</a-markdown>
```
### From a File

To render a Markdown file, use the file attribute.

`<a-markdown file="path/to/document.md"></a-markdown>`

## Attributes and Properties

All attributes can also be set as properties in JavaScript. For boolean attributes, the presence of the attribute sets it to true.

- file (string)
  - Default: undefined
  - The path to the Markdown (.md) file you want to render.

- highlight (boolean)
  - Default: false
  - When this attribute is present, the component performs syntax highlighting on all code blocks. See the section on Syntax Highlighting.

## Examples


# Change Log

- v1.1:

  - added 'src' attribute as an alias of 'file';
  - improved asset loading (dynamic Showdown/DOMPurify imports with CDN fallback).
  - imporved sanitizer handling.
  - centralized options management.
  - improved file/src attribute handling.
  - improved dedent logic.
  - added debounced rendering and a readiness flag.

- v1.0 wooHoo!
