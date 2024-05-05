
  

## Note #1

Please note that versioning of this project at the moment is difficult as it has just way too many independent components.
Sometimes the version may be bumped but nothing actually changed in the core.
That is why its good to look at the changes actually made in an update so you know if upgrading is worth it for you.

Bumping the version usually means that all the cache gets invalidated and everything has to be redownloaded - meaning it may be quite expensive.

This may change in the future to a more flexible system.

## Note #2

For nearly 3+ YEARS, the changelog has not been documented.
That means that enormous amounts of changes are understandably lost.

Some historical versions are captured (excluding the earliest and the early component-based ones),
but old versions in general are difficult to put together, as they were never backed up.

This framework is constantly evolving and improoving.


# Version 3.0.48 (Unreleased)

### (This version is yet to be released; Below are expected changes)

### CSS:
- Changed the way buttons are styled, so now \<input> buttons and [role=button] elements will also behave like a button.
- Improoved keyboard navigation and accessibility of buttons and modals
- 


# Version 3.0.47

### CSS:
- Added dynamic amoled theme
- Added a light version to all accent colors
- Added many new default accent colors, along with an improved accent system
- Added full support for checkboxes and radio buttons
- Improoved button classes: .elevated, .pill, .circle
- Improoved how segmented buttons/inputs work
- Pushed ls-box into the stable release!
- Deprecated some old CSS code. (To temporarily add it back, include ls/css.deprecated)

### JS:

- LS.Color has 2 new methods: setColor and setTheme
- Enhanced LS.Toast
- Added LS.Native in alpha!
    LS.Native is a bridge that makes the creation of native-like apps easy across platforms.
	Currently Android is supported with a Java library that enables cross-events, and access to some system APIs from your JS frontend.
	- You may historically remember it as aHTMLx.