import ATestRunner from './ATestRunner.js';
import '../src/a-markdown.js';

const runner = new ATestRunner(import.meta.url);
runner.output = 'console';
const { test, when, run, info } = runner;

// Helper function to create and append the element to the DOM
function createMarkdownElement(markdown, file) {
  const el = document.createElement('a-markdown');
  if (markdown) el.innerHTML = markdown;
  if (file) el.setAttribute('file', file);
  document.body.append(el);
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
  const el = createMarkdownElement('**Hello World**');
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
    const el = createMarkdownElement(null, 'test.md');
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
    const el = createMarkdownElement('*italic*');
    // wait for initial render
    await when(() => el.innerHTML.includes('<p>'));
    el.display = 'markdown';
    await when(() => el.textContent === '*italic*');
    const content = el.textContent;
    el.remove();
    return content;
  },
  '*italic*'
);

test(
'Should display HTML source when display="html"',
  async () => {
    const el = createMarkdownElement('__underline__');
    el.underline = true;
    // Wait for initial render
    await when(() => el.innerHTML.includes('<u>'));
    el.display = 'html';
    // Wait for re-render
    await when(() => el.textContent === '<p><u>underline</u></p>');
    const content = el.textContent;
    el.remove();
    return content;
  },
  '<p><u>underline</u></p>'
);

test(
'Should sanitize script tags when "sanitize" attribute is present',
  async () => {
    const el = createMarkdownElement('<script>alert("danger")</script>');
    el.setAttribute('sanitize', 'true');
    await when(() => el.innerHTML === '');
    const result = el.innerHTML;
    el.remove();
    return result;
  },
  '<p>alert("danger")</p>'
);

test(
'Should NOT sanitize script tags by default',
  async () => {
    const el = createMarkdownElement('<script>alert("danger")</script>');
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
    const el = createMarkdownElement('~~deleted~~');
    const options = { strikethrough: true };
    el.setAttribute('options', JSON.stringify(options));
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
    const el = createMarkdownElement('`initial`');
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
    const el = createMarkdownElement('| a | b |\n|---|---|\n| 1 | 2 |');
    el.tables = false; // Initially disable tables
    await when(() => !el.innerHTML.includes('<table>'));
    const initialRender = el.innerHTML;
    el.tables = true;
    await when(() => el.innerHTML.includes('<table>'));
    const finalRender = el.innerHTML;

    el.remove();
    return !initialRender.includes('<table>') && finalRender.includes('<table>');
  },
  true
);

run();
