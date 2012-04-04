# Repl-Rainbow
Hop aboard the rainbow. Have some colors. I found all existing libs out there either not adequate for my needs and usually lacking most of the tools I wanted.

## Goals

* provide easy translating between core color spaces of RGB and HSL and 256 color Ansi
* translate from any one to any other with ease and terse syntax
* provide baseline tools for generating sets of colors like gradients and nearest colors
* transform arrays of colors at at a single time

## Basic Usage

The api is designed to be very easy to use. The base exports is the Rainbow function which attempts to determine from given inputs what type of color you're providing. All colors are translated to xterm-256 colors internally first. The returned value is a function that can then be called on text to escape it. In this way the Ansi function objects act as both storage for settings and as text transformers.

```javascript
var R = require('repl-rainbow');

//red background, white foreground, underlined, with one space padding on either side
var red = R('#f00').fg('#fff').under().pad();

//now red can be used on text to escape it
console.log(red('Check me out'));
```

## Utilities

* __Rainbow.gradient(colors, lengthPer)__: Generate multiple interpolated gradients for all colors in the provided array. Length per is how many items each gradient should have, defaulting to 15.
* __Rainbow.spectrum()__: Preset gradient generator that will produce the spectrum, no configuration needed!



## Detailed Usage

* __closest(n)__: return the `n` closest colors using HSL to measure.
* __gradient(c,n)__: returns an array of `n` length with colors interpolating to `c` using HSL to measure.


* __basic(bg)__: convert to the nearest of the basic 16 colors for downgrading. Set `bg` to true to get the bg escape
* __style()__: Set multiple other styles at once, like italic, etc.
* __child()__: Return a new function that inherits from this one so it can be customized
* __fg()__: Specify another color as the foreground for this. Causes this color to become the bg.
* __bg()__: Specify another color as the background, making this the foreground. /* bg and fg are mutually exclusive */
* __ital()__: Toggles this `italic` property.
* __inv()__: Toggles this `inverse` property.
* __under()__: Toggles this `underline` property.
* __pad(n)__: Pads text when escaped to `n`. If no `n` is provided then it will cycle from 0 to 4 and back eac .pad().


* __rgb()__: return an rgb array for the color
* __hsl()__: return an hsl array for the color
* __ansi()__: return the ansi code for the color
* __hex()__: return the HTML hex code for the color


## Arrays

The return type for operations that return sets is `ColorSet`. A ColorSet is just an array with a bit of extra functionality. All the Array functions that return new arrays are wrapped so that you always get back a ColorSet. This allows you to do multiple filters and mappings and still have a ColorSet.

* __hsl()__: maps the ColorSet to another ColorSet where all the values have been converted to hsl's
* __rgb()__: same for rgb
* __ansi()__: same for ansi