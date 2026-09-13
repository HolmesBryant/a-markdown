/**
 * @file syntax.html.js
 * html syntax definition file for Highlighter module.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 */
export default {
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
}

