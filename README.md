# Repl-Rainbow
Hop aboard the rainbow. Have some colors. I found all existing libs out there either not adequate for my needs and usually lacking most of the tools I wanted.

## Goals

* provide easy translating between core color spaces of RGB and HSL and 256 color Ansi
* translate from any one to any other with ease and terse syntax
* provide baseline tools for generating sets of colors like gradients and nearest colors
* transform arrays of colors at at a single time

## Basic Usage

The api is designed to be very easy to use. The base exports is the Rainbow function which attempts to determine from given inputs what type of color you want.

```javascript
var rainbow = require('repl-rainbow');

// explicit
rainbow('hsl', 180, 1, 0.5);

// guessing from numbers
rainbow(255,0,0); //rgb
rainbow(50) //ansi

// arrays work
rainbow([255,0,0]);

```

## Detailed Usage

Aside from the main function there's also a direct function for each. They all have identical methods. RGB has an rgb method that returns itself, for example, for the sake of consistency.

The differences are:

* __rainbow.RGB__ has `r`, `g`, `b`
* __rainbow.HSL__ has `h`, `s`, `l`
* __rainbow.Ansi__ has `code`

The common api is:

* __rgb()__: return an rgb instance for the color
* __hsl()__: return an hsl instance for the color
* __ansi()__: return an ansi instance for the color
* __hex()__: return the HTML hex code for the color as rgb
* __closest(n)__: return the n closest colors, using that color space's rules
* __gradient(c,n)__: returns an array of `n` length with colors interpolating to `c` in that color space

A few bonus extras are avaiable on Ansi types

* __basic(bg)__: convert to the nearest of the basic 16 colors for downgradging. Set `bg` to true to get the bg escape
* __escape(text, type)__: escapes the text with the full ansi escape sequence for the color. Set `bg` to true for the bg escape


## Arrays

The return type for operations that return sets is `ColorSet`. A ColorSet is just an array with a bit of extra functionality. All the Array functions that return new arrays are wrapped so that you always get back a ColorSet. This allows you to do multiple filters and mappings and still have a ColorSet.

* __hsl()__: maps the ColorSet to another ColorSet where all the values have been converted to hsl's
* __rgb()__: same for rgb
* __ansi()__: same for ansi