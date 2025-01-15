## Note

For nearly 3+ years, the changelog has not been documented.

Some historical versions are captured (excluding the earliest and the early component-based ones),
but old versions in general are difficult to put together, or lost to time.


# Version 5.0.0
Major update!
- Licence of the project changed to GPLv3
- 🚀 Performance and resource efficiency boosts
- Various bugfixes
- More clear and consistent code quality standards
- Completely redefined CSS structure, with more consistent styling, consistent layouts etc.
- Bundled Normalize.css for more consistent cross-browser styling.

### Events
The event API has had major updates, namely in performance and usage.
To get the most out of the new event system:
```js
const events = new LS.EventHandler;

// Note: the constructor takes two arguments; first is an object of any type, second is an options object.
// The first one is the "target" of the handler - if set, this will expose some methods on it (on, once, emit, _events).

// Subscribing to events is simple and convinient.
events.on("event-name", data => {
  console.log(data);
})

// Only fire once
events.once("event-name", data => {
  console.log(data);
})

// Remove listener
events.off("event-name", listener);

// Flush all events and listeners (clear memory)
events.flush();

// This method will mark the event as "completed" - which calls all current AND future listeners immidiately as they are added.
// Useful for events like "onload" to ensure listeners are called when your operation is finished. 
events.completed("event-name");

// Alias an event
events.alias("event-name", "another-name");

// Get or create event object directly
events.prepare("event-name");

// Old method (currently still works):
// It is deprecated and also the slowest. Still 43x faster than v4.
events.invoke("event-name", ...data) // deprecated!

// A new way to fire events is the emit method:
// This one offers a more robust API, more flexibility and is up to 120x faster than v4.
events.emit("event-name", [ data ], options)

// Options that the emit function takes are:
// break: if true, when a listener returns false, the emit is aborted.
// results: if true, will collect return values and return them as an array (else returns null).


// You can also reference events directly:
// This is the fastest method and is even up to 200x faster than v4.
const myEvent = events.prepare("event-name");
events.emit(myEvent, data);

// There is also a "rapidFire" method that is technically even faster (300x) as it removes all extra overhead, but is not a proper emit implementation - it does not respect any options including "once" events, error handling, etc.
// It is not intended for actual use in projects - it is only there for some very specific needs where you know exactly where and who registers event listeners (eg. if you use events privately and just need to quickly transfer data).
// It only accepts an event object and data.
events.rapidFire(myEvent, data);
```

# Version 4.0.0
V4 has become a ✨ *special* ✨ one.
> [!NOTE]
> Where or what is version 4.0.0? The v5 release should have actually been v4, but due to a personal oversight, Ive accidentaly released v3.6 as v4.0.. <br>
> So instead, I have decided to make v4 kind of the LTS version of v3. <br>
> v4.x.x versions are essentially the most recent v3 versions, with minor enhancements and future support to maintain old projects that depend on older LS versions.

## Version 4.0.1
- Added a console note to suggest upgrading to v5
- Minor API bugfixes
- Add version information to LS.version and LS.v

## Version 3.5
### Welcome a new component - AutomationGraphEditor!
![Screenshot from 2024-08-22 22-47-28](https://github.com/user-attachments/assets/175c8ab3-d00f-4467-bb96-066df234c46b)<br>
This new component allows you to easily include a beautiful and fully customizeable graph editor, primarily intended for automations (eg. gain on an audio oscillator), but is great for any other possible usage scenarios.<br>
It uses SVG for rendering, offers an easy way to scale, has a simple API with efficient instancing etc.<br><br>
In this update, LS.EventResolver (as component) was deprecated in favor of LS.EventHandler (as a standalone class) - compatibility is retained at this moment.

## Version 3.4.5
### 1) Colors
The color system was updated, with many new presets, new shades in CSS, more customization, and upgraded LS.Color API:
![Screenshot from 2024-06-08 11-23-38](https://github.com/TheLSTV/LS/assets/62482747/33a132f4-9005-4e36-b389-9f637cab944f)
### 2) Timeline
![Screenshot from 2024-06-08 11-28-17](https://github.com/TheLSTV/LS/assets/62482747/197cd03c-a65a-4229-afef-26d8a2392653)



- CDN backend will get a makeover with version control and new tree-shaking *(not live yet)*
- Optimisations, bugfixes and cleanups all across the framework
- Migrated to SCSS and separated components in source


### New components in 3.4.0:
### 1. PatchBay
![Screenshot from 2024-08-22 22-54-44](https://github.com/user-attachments/assets/304e3c10-fd38-482a-afcb-fe62487fe7ca)

An extensive component adding the full functionality of a patch bay, with an infinite workspace.
### 2. MultiSelect
![Screenshot from 2023-11-06 23-49-35](https://github.com/TheLSTV/LS/assets/62482747/ee4ea8ad-ab20-430d-b50b-fde609383e7c)

Allows you to easily enable mutiselect on any element.
### 3. Knob
![Screenshot from 2023-11-06 23-40-57](https://github.com/TheLSTV/LS/assets/62482747/c56903c0-3659-4d73-be18-cb32390b4b6b)

![Screenshot from 2023-11-09 22-52-58](https://github.com/TheLSTV/LS/assets/62482747/b3cd69a3-3872-4621-851d-8e0b015f4d36)


Allows you to create fully customizable, beautiful and responsive knobs. Provides arc functionality, and a lot more to allow you to make any knob you need.
### 4. Color
With this component, you can finally add custom accents and manage colors + themes.
### 5. ToolBox
![Screenshot from 2023-11-09 22-49-17](https://github.com/TheLSTV/LS/assets/62482747/7d77712c-2bc7-4062-9f31-36c8307a5692)

![Screenshot from 2023-11-06 23-55-04](https://github.com/TheLSTV/LS/assets/62482747/22a791fc-760c-423d-94fc-2e159722f36a)

A full-on bash simulator and debugger, instantly accessible on any website with LS.
### 6. Resize
![Screenshot from 2023-11-06 23-57-18](https://github.com/TheLSTV/LS/assets/62482747/8408a217-ae4a-4c50-9227-58cffb02926c)

With this component, you can easily add resizing functionality to any element in all 8 directions. Supports absolute and static modes for different position types, or can be used just for value reporting for an entirely custom implementation.
### 7. GraphGL
![Screenshot from 2023-11-07 00-00-17](https://github.com/TheLSTV/LS/assets/62482747/c621ceb4-6dac-4962-b6f7-71eee46c5256)

A beautiful linear graph renderer
### 7. Progress & Seeker
![Screenshot from 2023-11-07 00-03-43](https://github.com/TheLSTV/LS/assets/62482747/8603819c-ff94-49d5-9d8f-b0e1c166b0ec)
![Screenshot from 2024-08-22 22-58-12](https://github.com/user-attachments/assets/37b07c21-4451-4e41-84d2-647436421c3c)

Progress & range components.

..and almost every other component was greatly improved.


## Version 3.0.47
- Added dynamic amoled theme
- Added a light version to all accent colors
- Added many new default accent colors, along with an improved accent system
- Added full support for checkboxes and radio buttons
- Improoved button classes: .elevated, .pill, .circle
- Improoved how segmented buttons/inputs work
- Pushed ls-box into the stable release!
- Deprecated some old CSS code. (To temporarily add it back, include ls/css.deprecated)
- LS.Color has 2 new methods: setColor and setTheme
- Enhanced LS.Toast
- Added LS.Native in alpha!
    LS.Native is a bridge that makes the creation of native-like apps easy across platforms.
	Currently Android is supported with a Java library that enables cross-events, and access to some system APIs from your JS frontend.
	- You may historically remember it as aHTMLx.

# Following is old / outdated content (LS v1 and v2 and possibly pre-LS (Tiny));


## Component system
LS has a rich component system that allows you to create, manage and use components with ease.<br>
It automatically adds things like events and takes care of managing instances.<br>
![image](https://user-images.githubusercontent.com/62482747/225786140-c0a25483-f230-4529-80c1-33a5bc0d47ed.png)

### Warning: The following text about Tiny is very out of date and mostly deprecated. Many of the methods below no longer exist in the latest releases.
## Tiny
Tiny was originally it's own thing, but was later merged into LS.<br>
Tiny is a set of single-letter super-helpful and efficiency-improoving utilities.<br>
There could be a whole chapter about it, but here are some basic samples:<br>
- `Q` Is the element selector, that also adds new methods to elements.<br>
  `Q("something")` will select all "something" elements, and all affected elements will be given some cool prototypes. There is a lot of them, here is a few:<br>
    - `attr` lists all attributes as an object with names and their values. If a first argument is set, returns the value of the specifed attribute. If a second argument is set, it changes the attribute value.
    - `class` lists classes, if a first argument is set (either a string or an array), it adds classes to the element. If second arg is either 0 or "remove", it removes classes.
    - `add` Adds new elements to the element. Can be either an array, single value or list of arguments, where each value can be either an HTML string or an element. By default, it appends at the end, but you can also use "addBefore" or "addAfter". "addOnce" adds the element only if there isn't an element with the same ID attribute.
    - `set` Same as add but clears the element first.
    - `get` Gets first element inside the element by its query selector. getAll gets all elements.
    - `has` Check if the element has elements by their selector. Returns a boolean.
    - `query` Generates a queryselector/path to the element.<br>
    ... there are many more, feel free to discover them.
- `O` Is same as "Q" but gets the first element. If no selector provided returns body.
- `N` Is the element builder. Accepts 2 args, the tag and options. For example `N("div")` makes a new empty div. `N("div","innerHTML")` works, just as `N("div",{inner:"..."})` does. The options can do a whole lot more - "inner" is the same as "add" explained above, aka it can be an array of elements or HTML code. There is also "attr", "class", "style", and many more things you can set. If you omit the first arg, it'l default to div, so `N({class:"test"})` is also valid.
- `S` Is a style utility. If you provide an element as the first arg, it'l return it's computed styles. If you provide a second arg, it'l apply styles from either an object or a string. If the first arg is an object, it'l turn it into a inline style string.
- `E` Is an element observer. First arg is the element to observe for node changes and the second is the callback function.
- `T` Is a short version of try{}catch(e){}
- `U` Is the URL utility. `U("...").goTo()` for example, will go to that url. `U().params()` returns an object with the url parameters as keys with their values, etc. First arg defaults to the current URL.
- `M` Is a misc utility collection. For example `M.x` and `M.y` will always corespond to the mouse position relative to the document, `M.GlobalID` returns a short but unique ID that will never repeat on the page's instance, `M.on` is the stackable equivalent of window.addEventListener and so on.

<br><br>All of those are by default "globalised" to the window, and accessible trough `LS.Tiny`.
## Random examples:
Here are some randomly-picked examples of what LS can do, out-of-the-box.<br>Of course there is a lot more, but you gotta explore that yourself.


### 1. Default design styles
`ls-flat`, `ls-fluent`, `ls-sharp`<br><br>
![styles](https://user-images.githubusercontent.com/62482747/225784871-e1ee9427-a468-49c1-943e-aebd4d0731ea.png)<br>
![dialogs](https://user-images.githubusercontent.com/62482747/225974145-afdb6f8c-0bb5-4806-b85f-d279c61f631e.png)
![image](https://user-images.githubusercontent.com/62482747/225974327-bfa2f75c-b679-48e6-afb8-6d270ce09281.png)<br>
Of course you can create your own from scratch, simply create your own style in CSS.<br>
To apply the style, add an "`ls`" attribute to the element where you want to apply it to (can be body), and also an attribute with which style you want, like "`ls-fluent`".<br>
Theres also a **color system**, add "ls-[color]" (like `ls-blue`, `ls-yellow`...) attribute to the parent element to apply an accent color. CSS variables will be available, like `--accent`, `--accent-dark` and `--color-bg` (text color to be used when using accent as a background). For transparency, use `rgba(var(--accent-raw), 200)`, replacing "80" with the value you want (0-255, 255 being fully opaic).

### 2. Improoved select
![image](https://user-images.githubusercontent.com/62482747/225783797-8414c3f1-198a-405b-83fb-6bd3452c6092.png)
<br>Synchronizes with a regular \<select> element, supports \<optgroup>, the "disabled" attribute and a lot more.<br>To set-up: `LS.Select("id", ...element)` (defaults to the first select element it founds. `LS.Select.batch("select")` does this to all select elements, `LS.Select.observe("select")` applies it to all current and later added elements.)

### 3. Automatic navbar builder
![image](https://user-images.githubusercontent.com/62482747/225785677-6be925e6-997f-4a12-8362-74f0c80795a1.png)<br>
Structure would be, for example:<br>
![navbar-struct-code](https://user-images.githubusercontent.com/62482747/225785573-422dc651-48cb-4605-8060-9bd2d6f81a2f.png)<br>

### 4. Wizzards
You can create awesome automated wizzards with `LS.Steps`<br>
![image](https://user-images.githubusercontent.com/62482747/225785875-24090b6d-faa2-4fde-97d6-0121e960dc48.png)<br>
![image](https://user-images.githubusercontent.com/62482747/225785979-1f5888d7-1e4e-4cc3-85da-59be4012d692.png)<br>

### 5. Console/Terminal emulator
`LS.Console` is a component that adds an interactive & highly customizable console to your app.<br>It has 2 major modes, "terminal" and "debug console".<br>
<br>Debug console usage example: (from Hastrell playground)<br>
![image](https://user-images.githubusercontent.com/62482747/225791720-291d8b85-9840-42c6-8ad2-ebbd3190289c.png)<br>
<br>Terminal usage example: (from ExtraGon panel)<br>
![image](https://user-images.githubusercontent.com/62482747/225791727-0694a058-7138-4095-8b09-df9e4d94649b.png)<br>
Notable features:
- ANSI \\esc parsing, allowing you to directly pass it terminal output and get all the crazy rainbow stuff.<br>

### 6. Special elements, like groups
Code<br>
![image](https://user-images.githubusercontent.com/62482747/225992621-b6512e1c-cf5c-43c9-b69b-1c58de4ce250.png)<br>
Will result in:<br>
![image](https://user-images.githubusercontent.com/62482747/225992611-9abfb49f-dddd-4946-9300-2b158a5fd0e9.png)<br><br>
Tabs are also super simple to setup:
```html
<ls-tabs>
  <ls-tab tab-title="my tab">
    ...
  </ls-tab>
  <ls-tab tab-title="hello world"> ... </ls-tab>
  ...
</ls-tabs>
```
Result:<br>
![image](https://user-images.githubusercontent.com/62482747/225993488-c81a587c-d9af-415f-ad82-2331ecc8950f.png)<br>
(Same applies to steps, but with `<steps>` and `<step>`, and you can also set an "if" attribute on a `<step>` element to add a condition under which it will be visible, like if="field=value" only displays that step if a field "field" is equal to "value")<br>
Those are all designed to be as simple to use and use as little boilerplate as possible.
