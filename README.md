![Logo](https://github.com/user-attachments/assets/d2800b99-d5e9-4474-b8e0-22f563237bfa)

# LS v5.0.0
Welcome the next big iteration of LS, LS v5.<br>
### What's new?
- ✨ New, modern API remade from scratch
- 📔 New component system
- 🚀 Significantly improved performance all around
- 💾 Optimized for memory efficiency
- 💼 Smaller size
- 💻 Reworked UI framework

<br>

> [!WARNING]
> If you are migrating from earlier LS versions, please review the migration notes. As this is a major release of LS, API compatibility is not guaranteed and a lot of things were changed or removed. Namely all previously deprecated methods were removed and many methods have changed.

## Getting started
Import LS to your site with
```html
<!-- Note this imports *all* parts and components. -->
<script src="https://cdn.extragon.cloud/ls/5.0.0/*/index.min.js"></script>
<link href="https://cdn.extragon.cloud/ls/5.0.0/*/index.min.css" rel="stylesheet">
```

And you can start using LS right away!
```js
LS.Create({
  inner: "Hello world!"
})
```

## Creating components
You can register components to use across your code!
```js
LS.LoadComponent(class myComponent extends LS.Component {
  constructor() {
    super()
  }
}, { global: true })
```

```js
const instance = new LS.myComponent()

// Events are available on all components by default
instance.on("event", console.log)
instance.invoke("event", "Hello world!")
```
> [!NOTE]
> Components are no longer sored uniquely with an ID in LS version 5 and up - previously, you were required to supply an ID when creating an instance and LS would manage instances for you. This is no longer the case and you need to manage your own component references now.

## Hosting
You can either simply use the static files in /dist/, but if you want version management, on-the-fly code compression, and tree-shaking modules from an URL, you can host the API in /backend/api.js, which is the same API used by the official ExtraGon CDN links.<br>

To host it, you will need [akeno](https://github.com/the-lstv/Akeno) on your server.