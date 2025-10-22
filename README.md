# a-markdown Web Component

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://mit-license.org/)

A standards-based web component that fetches, parses, and renders Markdown content in any HTML page. It uses the powerful [Showdown.js](https://github.com/showdownjs/showdown) library for conversion.


## Change Log

- v2.0 Completely rewritten to use the Showdown library
- v1.0 Initial version

## Features

*   **Simple to Use**: Just add the `<a-markdown>` tag to your HTML and point it to a Markdown file.
*   **Cacheable**: Fetched files are cached by default to reduce network requests. Caching can be disabled.
*   **Customizable**:
    *   Easily change the Showdown.js library URL to use a different version.
    *   Style the rendered content the same way you apply styles to anything else in your page.
*   **Error Handling**: Displays clear error messages if a file cannot be found or the converter fails to load.

## Installation

Include the script in your HTML page. You must add the attribute `type="module"`.

```html
<script type="module" src="path/to/a-markdown.js"></script>
```

## Basic Usage

Once the script is included in your page, you can use the `<a-markdown>` custom element.

The `file` attribute ( required ) is the url to the Markdown file you want to display.

`<a-markdown file="./file.md"></a-markdown>`

## Disabling the Cache

By default, the component caches the HTML output of a fetched file. To disable this behavior and force a fresh fetch every time, add the `nocache` attribute.

```html
	<a-markdown
		nocache
		file="./file.md">
	</a-markdown>
```
## Using a Different Showdown Version

You can specify a different Showdown.js ESM (ECMAScript Module) URL using the `showdown-url` attribute. This is useful for pinning a specific version or testing a new one.

NOTE: You must use the ESM version of Showdown. The code will not import if it is not a proper module.

```html
	<a-markdown
	  file="/path/to/content.md"
	  showdown-url="https://cdn.jsdelivr.net/npm/showdown@2.0.0/+esm">
	</a-markdown>
```

## Attributes

| Attribute             | Type          | Default                                          | Description                                      |
| :-------------------- | :------------ | :----------------------------------------------- | :----------------------------------------------- |
| `file` **Required**   |  string       | null                                             | The URL of the markdown file to render.          |
| `nocache`             |  boolean      | false                                            | If present, disables caching of the fetched file.|
| `showdown-url`        |  string       | https://cdn.jsdelivr.net/npm/showdown@2.1.0/+esm | The URL to the Showdown.js ES Module             |

## Styling

The results are rendered as direct children of `<a-markdown>`. That means you can style the rendered content the same way you apply styles to anything else in your page.
