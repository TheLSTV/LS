# LS "Framework"
LS is a powerful "framework", "component manager", and what not.<br>It improoves your efficiency and offers many great tools for you to use in your web development journey, all in a singular, clean object.

In just 21kb (all components!) it contains a big set of useful utilities, a full UI library with 3 styles and a color scheme system, tabs, modal & dialog, steps (wizzard system), navbar, select (improoved \<select>), chips, tree, notification ui, and a full-blown terminal emulator, console, and a code editor components. And there is way more to come.<br>
All this, while being super lightweight - it is being served on a dynamic CDN with segments, aka you can simply just choose which components to include and which not, other simply won't be sent to save bandwidth and speed. This is both for CSS and JS.

## Component system
LS has a rich component system that allows you to create, manage and use components with ease.<br>
It automatically adds things like events and takes care of managing instances.<br>
![image](https://user-images.githubusercontent.com/62482747/225786140-c0a25483-f230-4529-80c1-33a5bc0d47ed.png)
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

### 2. Improoved select
![image](https://user-images.githubusercontent.com/62482747/225783797-8414c3f1-198a-405b-83fb-6bd3452c6092.png)
<br>Synchronizes with a regular \<select> element, supports \<optgroup>, the "disabled" attribute and a lot more.<br>To set-up: `LS.Select("id", ...element)` (defaults to the first select element it founds. `LS.Select.batch("select")` does this to all select elements, `LS.Select.observe("select")` applies it to all current and later added elements.)

### 3. Automatic navbar builder
![image](https://user-images.githubusercontent.com/62482747/225785677-6be925e6-997f-4a12-8362-74f0c80795a1.png)<br>
Structure would be, for example:<br>
![navbar-struct-code](https://user-images.githubusercontent.com/62482747/225785573-422dc651-48cb-4605-8060-9bd2d6f81a2f.png)<br>

### 4. Wizzards
You can create awesome automatic wizzards with `LS.Steps`<br>
![image](https://user-images.githubusercontent.com/62482747/225785875-24090b6d-faa2-4fde-97d6-0121e960dc48.png)<br>
![image](https://user-images.githubusercontent.com/62482747/225785979-1f5888d7-1e4e-4cc3-85da-59be4012d692.png)<br>

### 5. Console/Terminal emulator
`LS.Console` is a component that adds an interactive & highly customizable console to your app.<br>It has 2 major modes, "terminal" and "debug console".<br>
<br>Debug console usage example: (from Hastrell playground)<br>
![image](https://user-images.githubusercontent.com/62482747/225791720-291d8b85-9840-42c6-8ad2-ebbd3190289c.png)<br>
<br>Terminal usage example: (from ExtraGon panel)<br>
![image](https://user-images.githubusercontent.com/62482747/225791727-0694a058-7138-4095-8b09-df9e4d94649b.png)<br>
Notable features:
- ANSI \\esc parsing, allowing you to directly pass it terminal output and get all the crazy blinking rainbow stuff.
- Handome
- Likes carrots

<br><br>
## There is also more, like global custom events and such, but i'll need to make a proper documentation for them.<br>This readme serves more as a showcase that i put together half-asleep at 3AM rather than a tutorial, so if you need to explain something, do not hesitate to contact me. Or wait till i finish puredocs and then this documentation.
## Also, this isn't the main source - i do not update the source that often on GitHub (that may change when i automate that in WSDK), overall almost none of my work is on GitHub or is not updated here, so to make sure you are using the latest, check the CDN, where there's always the most recent version.
More stuff is about to come, too.
