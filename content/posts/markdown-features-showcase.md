+++
date = '2025-09-14T14:20:00+02:00'
draft = false
title = 'Markdown Features Showcase'
tags = ['markdown', 'writing', 'formatting']
+++

This post demonstrates various Markdown features supported by Hugo, including tables, images, code blocks, and more formatting options.

<!--more-->

## Headers and Text Formatting

Markdown supports multiple levels of headers and various text formatting options:

### Emphasis

- *Italic text* using single asterisks
- **Bold text** using double asterisks
- ***Bold and italic*** using triple asterisks
- ~~Strikethrough~~ using double tildes

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Ordered Lists

1. First numbered item
2. Second numbered item
   1. Nested numbered item
   2. Another nested numbered item
3. Third numbered item

## Tables

Here's a comparison table of static site generators:

| Generator | Language | Build Speed | Learning Curve |
|-----------|----------|-------------|----------------|
| Hugo | Go | Very Fast | Medium |
| Jekyll | Ruby | Slow | Easy |
| Gatsby | JavaScript | Medium | Hard |
| Next.js | JavaScript | Medium | Medium |

## Code Examples

### Inline Code

You can use `inline code` by wrapping text in backticks.

### Code Blocks

Here's a Python example:

```python
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Generate first 10 Fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
```

And here's some HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sample Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a sample HTML page.</p>
</body>
</html>
```

## Blockquotes

> Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents.
> 
> — John Gruber, creator of Markdown

## Links and References

You can create links in several ways:

- [Direct link to Hugo documentation](https://gohugo.io/documentation/)
- [Reference-style link][hugo-ref]
- Automatic link: https://gohugo.io

[hugo-ref]: https://gohugo.io

## Images

Here's how you can embed images in Markdown:

![Placeholder Image](https://via.placeholder.com/600x300/4a90e2/ffffff?text=Sample+Blog+Image)

*Caption: This is a placeholder image demonstrating image embedding in Markdown*

## Special Characters and Escaping

Sometimes you need to display special characters:

- Asterisk: \*
- Underscore: \_
- Backtick: \`
- Hash: \#

## Horizontal Rules

You can create horizontal rules using three or more hyphens:

---

## Mathematical Expressions

While basic Markdown doesn't support math, you can write mathematical concepts in plain text:

- The quadratic formula: x = (-b ± √(b²-4ac)) / 2a
- Einstein's famous equation: E = mc²
- The area of a circle: A = πr²

## Conclusion

Markdown provides a simple yet powerful way to format text for the web. This showcase demonstrates just some of the formatting options available, making it perfect for blog posts, documentation, and other content creation needs.

