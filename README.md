# jwalker

Drop-in HTML5 canvas background effect. Draws a decorative X across any element with the class `jwalker`.

## Usage

Add the class to any container and include the script:

```html
<main class="jwalker">
  <!-- your content -->
</main>

<script src="jwalker.min.js"></script>
```

The canvas is injected automatically, sits behind your content, and redraws on resize.

## Build

```sh
npm install
npm run build
```

Outputs `jwalker.min.js`.
