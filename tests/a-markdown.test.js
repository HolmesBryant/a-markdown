import ATestRunner from './ATestRunner.js';
import '../src/a-markdown.js';

const runner = new ATestRunner(import.meta.url);
runner.output = 'console';
const { test, when, run, info } = runner;

// Helper function to create and append the element to the DOM
function createMarkdownElement() {
  const el = document.createElement('a-markdown');
  document.body.appendChild(el);
  return el;
}

// Helper function to wait for the next render cycle
function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

info('Testing <a-markdown> custom element');

// Test Suite
test(
  'Element should be defined',
  () => customElements.get('a-markdown') !== undefined,
  true
);

test(
  'Should render inline markdown content by default',
  async () => {
    const el = createMarkdownElement();
    el.innerHTML = `**Hello World**`;
    await when(() => el.innerHTML.includes('<strong>Hello World</strong>'));
    const result = el.innerHTML;
    el.remove();
    return result;
  },
  '<p><strong>Hello World</strong></p>'
);

test(
  'Should fetch and render a markdown file from the "file" attribute',
  async () => {
    const el = createMarkdownElement();
    el.setAttribute('file', 'test.md');
    await when(() => el.querySelector('h1'));
    const h1Content = el.querySelector('h1').textContent;
    el.remove();
    return h1Content;
  },
  'Test Header'
);

test(
  'Should display raw markdown when display="markdown"',
  async () => {
    const el = createMarkdownElement();
    el.innerHTML = `*italic*`;
    await when(() => el.innerHTML.includes('<p>')); // Wait for initial render
    el.display = 'markdown';
    await nextFrame(); // Wait for re-render
    const content = el.textContent;
    el.remove();
    return content;
  },
  '*italic*'
);

test(
  'Should display HTML source when display="html"',
  async () => {
    const el = createMarkdownElement();
    el.innerHTML = `__underline__`;
    el.underline = true;
    await when(() => el.innerHTML.includes('<u>')); // Wait for initial render
    el.display = 'html';
    await nextFrame(); // Wait for re-render
    const content = el.textContent;
    el.remove();
    return content;
  },
  '<p><u>underline</u></p>'
);

test(
  'Should sanitize script tags when "sanitize" attribute is present',
  async () => {
    const el = createMarkdownElement();
    el.setAttribute('sanitize', 'true');
    el.innerHTML = `<script>alert('danger')</script>`;
    await when(() => el.innerHTML === ''); // DOMPurify removes the script tag entirely
    const result = el.innerHTML;
    el.remove();
    return result;
  },
  ''
);

test(
  'Should NOT sanitize script tags by default',
  async () => {
    const el = createMarkdownElement();
    el.innerHTML = `<script>alert('danger')</script>`;
    await when(() => el.querySelector('script'));
    const hasScript = el.querySelector('script') !== null;
    el.remove();
    return hasScript;
  },
  true
);

test(
  'Should correctly parse showdown options from the "options" attribute',
  async () => {
    const el = createMarkdownElement();
    const options = { strikethrough: true };
    el.setAttribute('options', JSON.stringify(options));
    el.innerHTML = `~~deleted~~`;
    await when(() => el.innerHTML.includes('<del>'));
    const result = el.innerHTML;
    el.remove();
    return result;
  },
  '<p><del>deleted</del></p>'
);

test(
  'Should update content dynamically when the "markdown" property is set',
  async () => {
    const el = createMarkdownElement();
    el.markdown = '`initial`';
    await when(() => el.innerHTML.includes('<code>'));
    el.markdown = '`updated`';
    await when(() => el.innerHTML.includes('updated'));
    const result = el.innerHTML;
    el.remove();
    return result;
  },
  '<p><code>updated</code></p>'
);

test(
  'Should toggle tables option programmatically',
  async () => {
    const el = createMarkdownElement();
    const tableMarkdown = `| a | b |\n|---|---|\n| 1 | 2 |`;
    el.markdown = tableMarkdown;
    el.tables = false; // Initially disable tables
    await when(() => !el.innerHTML.includes('<table>'));

    const initialRender = el.innerHTML;
    el.tables = true; // Enable tables
    await when(() => el.innerHTML.includes('<table>'));
    const finalRender = el.innerHTML;

    el.remove();
    return !initialRender.includes('<table>') && finalRender.includes('<table>');
  },
  true
);

// Run all the tests
run();
