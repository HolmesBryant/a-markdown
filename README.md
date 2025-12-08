# a-markdown

A standards-based, highly configurable custom HTML element that fetches, converts, and displays Markdown content as HTML.

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0).

Demo: [https://holmesbryant.github.io/a-markdown/](https://holmesbryant.github.io/a-markdown/)

## Features

* No need to install any packages. It dynamically loads Showdown.js and DOMPurify from a CDN.

* **Option to Install Dependencies**: For developers using a bundler like Vite, Webpack, or Rollup, they can install the dependencies themselves using NPM or Yarn. [Using NPM/Yarn](#usingnpmyarn)

* **Flexible Content Sources**: Renders Markdown from inline content within the `<a-markdown>` tags or from a remote `.md` file specified in the `file` attribute.

* **Secure**: Built-in sanitization using DOMPurify to prevent XSS attacks. This is an opt-in feature via the `sanitize` attribute.

* **Highly Configurable**: All Showdown options are exposed as attributes or properties for fine-grained control over the Markdown conversion.

* **Dynamic and Reactive**: Programmatically update the Markdown content or any Showdown option and the element will automatically re-render.

## Installation

There is no installation step required. Simply include the `a-markdown.js` script in your HTML file.

```html
<script type="module" src="a-markdown.js"></script>
```
## Basic Usage

### Inline Markdown

To render inline Markdown, place it directly inside the `<a-markdown>` tags.

```html
  <a-markdown>
    # Hello, World!

    This is a paragraph with **bold** and *italic* text.

    - List item 1
    - List item 2
  </a-markdown>
```
### From a File

To render a Markdown file, use the file attribute.

`<a-markdown file="path/to/your/document.md"></a-markdown>`

### With Sanitation

For security, especially with user-provided content, enable sanitization with the sanitize attribute. This will strip out potentially harmful HTML, like `<script>` tags.

```html
<a-markdown sanitize>
  This is safe.
  <script>alert('This script will be removed.')</script>
</a-markdown>
```

## Attributes and Properties

All attributes can also be set as properties in JavaScript. For boolean attributes, the presence of the attribute sets it to true.

### Core Attributes

| Attribute | Property | Type    | Default        | Description |
| :-------: | :------: | :-----: | :-------:      | :----------:|
| file      | file     | string  | undefined      | The URL of the markdown file to fetch and render. |
| sanitize  | sanitize | boolean | false          | If true, the rendered HTML is sanitized using DOMPurify. |
| display   | display  | string  | 'converted'    | Controls the output. Can be 'converted' (renders HTML), 'markdown' (shows raw Markdown text), or 'html' (shows the converted HTML source code as text). |
| options   | options  | object  | {tables: true} | A JSON string of options to pass to the Showdown converter. |
| debug     | debug    | boolean | false          | If true, logs internal state and variables to the console. |

### Showdown Options

a-markdown exposes many of Showdown's options as attributes. For example, to enable emoji support, you can set the emoji attribute.

```html
<a-markdown emoji>
  I :heart: Markdown!
</a-markdown>
```
The options which this component exposes are listed at the end of this document. [Available Options](#availableoptions)

For a full list of available options, please refer to the Showdown Options Documentation.

[Showdown Options Documentation](https://www.google.com/url?sa=E&q=https://github.com/showdownjs/showdown/options)

## Examples

### Enabling GitHub Flavored Markdown Features

You can enable multiple features at once. This example enables GitHub-style code blocks, task lists, and strikethrough.

```html
    <a-markdown ghCodeBlocks tasklists strikethrough>
      ```javascript
      console.log("Hello, GitHub!");

      - [x] Write the code

      - [] Write the tests

      This is ~~not~~ awesome.
    </a-markdown>
```
### Using the `options` Attribute

For more complex configurations, you can pass a JSON object to the `options` attribute.

```html
<a-markdown
  options='{"tables": true, "strikethrough": true, "ghCompatibleHeaderId": true}'>
  ...
</a-markdown>
```

## Dynamic Updates with Javascript

You can interact with the a-markdown element programmatically.

```html
<a-markdown id="my-markdown"></a-markdown>

<script>
  const myMarkdown = document.getElementById('my-markdown');

  // Set initial content
  myMarkdown.markdown = '# Initial Header';

  // Update the content after 3 seconds
  setTimeout(() => {
    myMarkdown.markdown = '## Updated Header';
  }, 3000);

  // Enable an option
  myMarkdown.simplifiedAutoLink = true;
</script>
```

## Security

When rendering Markdown from an untrusted source, it is **strongly recommended** to use the sanitize attribute. This will prevent Cross-Site Scripting (XSS) vulnerabilities by removing any potentially malicious code.

`
<a-markdown sanitize file="untrusted-user-content.md"></a-markdown>
`

## Dependencies

[Showdown.js](https://github.com/showdownjs/showdown) : For Markdown to HTML conversion.

[DOMPurify](https://github.com/cure53/DOMPurify) : For HTML sanitization.

These libraries are loaded dynamically from a CDN and do not need to be manually included.

### Using NPM/Yarn

For developers using a bundler like Vite, Webpack, or Rollup, they can install the dependencies themselves.

1. Install the packages:

`npm install showdown dompurify`

2. Import and configure in your main JavaScript file:

This is the recommended approach for this environment. By importing the libraries and setting them on the AMarkdown class, you give the bundler full control.

```javascript
// main.js or app.js

import Showdown from 'showdown';
import DOMPurify from 'dompurify';

// Assuming the component is in the same folder
import AMarkdown from './a-markdown.js';

// Make the libraries available to all a-markdown elements
AMarkdown.Showdown = Showdown;
AMarkdown.DOMPurify = DOMPurify;
```

The custom element is now ready to be used in your HTML and will not make any CDN requests for these libraries.

## Available Options

 - backslashEscapesHTMLTags
 - completeHTMLDocument
 - disableForced4SpacesIndentedSublists
 - ellipsis
 - emoji
 - encodeEmails
 - excludeTrailingPunctuationFromURLs
 - ghCodeBlocks
 - ghCompatibleHeaderId
 - ghMentions
 - ghMentionsLink
 - headerLevelStart
 - literalMidWordAsterisks
 - literalMidWordUnderscores
 - metadata
 - noHeaderId
 - omitExtraWLInCodeBlocks
 - openLinksInNewWindow
 - parseImgDimensions
 - prefixHeaderId
 - rawPrefixHeaderId
 - rawHeaderId
 - requireSpaceBeforeHeadingText
 - simpleLineBreaks
 - simplifiedAutoLink
 - smartIndentationFix
 - smoothLivePreview
 - splitAdjacentBlockquotes
 - strikethrough
 - tables
 - tablesHeaderId
 - tasklists
 - underline
