# Example B

`<script> alert("inline javascript")</script>`

`<p>Inline HTML</p>`

```
<script> alert("inline javascript")</script>
```

```html
<!-- some html -->
<div>A div</div>
```

```javascript
// some javascript
function foo() {
	return 'foo';
}
```

```css
/* Some CSS */
div {
	border: 1px solid black;
	padding: 1rem;
}
```

```python
# Some python
#!/usr/bin/env python3

def item_cost(name):
	costs = {"sword": 50, "potion": 10}
	if name in costs: return costs[name]
	else: return 0

result = item_cost("sword")
print(result)
```

```php
// Some php
function damage($type, $level) {
	if ($type === 'fire') {
		return $level * 2;
	} elseif ($type === 'ice') {
		return $level * 3;
	} else {
		return $level;
	}
}
```
