# Macro-Project
dollar bills

## Part 2: Currency Design Creation

Open `currency-designs.html` in a browser to see the front and back of all six redesigned notes ($1, $5, $10, $20, $50, $100), the feature key, the design consistency answers, production notes and the final checklist.

### PNG images

`png/` holds a 3120 × 1320 PNG of the front and back of every note. To regenerate them, run:

```
NODE_PATH=$(npm root -g) node generator/render.cjs
```
