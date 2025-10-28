# a-markdown Web Component

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://mit-license.org/)

A standards-based web component that fetches, parses, and renders Markdown content in any HTML page. It uses the powerful [Showdown.js](https://github.com/showdownjs/showdown) library for conversion.


## Change Log

- v2.0 Completely rewritten to use the Showdown library
- v1.0 Initial version


This Javascript code defines a custom HTML element called <a-markdown> that can fetch, convert, and display Markdown content as HTML.

Here's a breakdown of what the code does:

Core Functionality
The <a-markdown> element provides a convenient way to include Markdown content in a web page.

It can:

Fetch external Markdown files: You can specify a URL to a .md file, and the element will fetch and render its content.

Use inline Markdown: You can write Markdown directly within the <a-markdown> tags.

Convert Markdown to HTML: It uses the Showdown library to perform the conversion.[1][2][3][4][5]

Sanitize HTML: For security, it can use the DOMPurify library to clean the converted HTML and prevent cross-site scripting (XSS) attacks.

Control the display: You can choose to display the content as converted HTML, the original Markdown source, or the raw HTML output.

How it Works: A Look at the Code
The code is structured as a JavaScript class AMarkdown that extends HTMLElement. This is the standard way to create custom elements.

Key Properties and Attributes:

debug: A boolean attribute that, when set to true, logs debugging information to the console.
display: Controls how the content is displayed. It can be set to:
'converted' (default): Renders the Markdown as HTML.

'markdown': Displays the raw Markdown text.
'html': Shows the generated HTML code as text.
file: A string attribute that specifies the URL of the Markdown file to load.

options: A JSON string attribute that allows you to pass a configuration object to the Showdown converter. This lets you customize the Markdown conversion, for example, by enabling or disabling features like tables or emoji support.

sanitize: A boolean attribute that, when set to true, enables HTML sanitization using DOMPurify.

Lifecycle Callbacks:

The code uses standard custom element lifecycle callbacks:

constructor(): Initializes the element.
connectedCallback(): Called when the element is added to the DOM. This is where the main initialization, including fetching assets and rendering, begins.

disconnectedCallback(): Called when the element is removed from the DOM. It cleans up resources like aborting any ongoing fetch requests.
attributeChangedCallback(): Called whenever one of the observed attributes (debug, display, file, options, sanitize) is changed. This allows the element to react to changes in its configuration dynamically.
Core Methods:

#init(): This asynchronous method orchestrates the setup process. It calls #setAssets() to load the necessary libraries and Markdown content, and then it initializes the Showdown converter and triggers the initial rendering.

#setAssets(): This method handles the loading of the Showdown and DOMPurify libraries from a CDN. It also fetches the Markdown content, either from the file attribute or from the element's inline text content.

#render(): This asynchronous method is responsible for converting the Markdown to HTML and then updating the element's content based on the display attribute.

#toHtml(): An asynchronous method that performs the core conversion from Markdown to HTML using the Showdown library. If sanitization is enabled, it also calls #doSanitize().

#doSanitize(): An asynchronous method that uses DOMPurify to sanitize the generated HTML.
#doDedent(): A utility method to remove leading whitespace from the Markdown content, which is useful for cleaning up indented Markdown in the HTML source.

Showdown Options as Properties:

A large portion of the code is dedicated to getters and setters for the various options available in the Showdown library. This provides a convenient way to configure the Markdown conversion directly on the <a-markdown> element as properties in JavaScript. For example, you could enable GitHub-flavored code blocks like this:

```
const myMarkdownElement = document.querySelector('a-markdown');
myMarkdownElement.ghCodeBlocks = true;
```

Each of these setters will automatically re-render the content when the option is changed.
How to Use It
Here are a couple of examples of how you might use this custom element in an HTML file:

1. Loading from an external file:

```
<a-markdown file="/path/to/your/markdown.md" sanitize="true"></a-markdown>
```

2. Using inline Markdown:

```
<a-markdown options='{"tables": true, "emoji": true}'>
  # This is a heading

  | Syntax      | Description |
  | ----------- | ----------- |
  | Header      | Title       |
  | Paragraph   | Text        |

  Here's an emoji: :tada:
</a-markdown>
```

Option 1: Using a CDN (No Build Step)
For users who want to drop the component into a simple HTML page, the instructions are the same as before.
HTML:
code
Html
<!DOCTYPE html>
<html>
<head>
  <title>AMarkdown CDN Example</title>
</head>
<body>

  <a-markdown sanitize="true">
    # Hello, World!

    This is loaded from a CDN.

    *   Showdown is fetched dynamically.
    *   DOMPurify is also fetched because `sanitize` is true.
  </a-markdown>

  <script type="module" src="./a-markdown.js"></script>
</body>
</html>
In this scenario, your component will automatically detect that showdown and dompurify are not available and will fetch them from the CDN URLs.
Option 2: Using NPM/Yarn (With a Build Step)
For developers using a bundler like Vite, Webpack, or Rollup, they can install the dependencies themselves.
1. Install the packages:
code
Bash
npm install showdown dompurify
2. Import and configure in your main JavaScript file:
This is the recommended approach for this environment. By importing the libraries and setting them on the AMarkdown class, you give the bundler full control.
code
JavaScript
// main.js or app.js
import Showdown from 'showdown';
import DOMPurify from 'dompurify';
import AMarkdown from './a-markdown.js'; // Assuming the component is in the same folder

// Make the libraries available to all a-markdown elements
AMarkdown.Showdown = Showdown;
AMarkdown.DOMPurify = DOMPurify;

// The custom element is now ready to be used in your HTML
// and will not make any CDN requests for these libraries.
HTML (in an NPM project):
code
Html
<!-- index.html -->
<body>
  <a-markdown sanitize="true">
    # Hello from an NPM project!

    The `showdown` and `dompurify` libraries were bundled with the application.
  </a-markdown>

  <script type="module" src="./main.js"></script>
</body>

## Styling

The results are rendered as direct children of `<a-markdown>`. That means you can style the rendered content the same way you apply styles to anything else in your page.
