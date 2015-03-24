# handlebars.phrase

    {{phrase key}}

Internationalisation helper for [Handlebars](http://handlebarsjs.com)

handlebars.phrase is handlebars [all the way down](http://en.wikipedia.org/wiki/Turtles_all_the_way_down) so its phrase strings can be templates containing other phrases, variables or helpers.

### Version

1.0.0

### Installation

    npm install handlebars.phrase

### Registering the helper

    var Handlebars = require("handlebars");
    var Phrase = require("handlebars.phrase");
    Phrase.registerHelpers(Handlebars);

### Setting the languages

    Phrase.setLanguages({
        en: {
            "foo": "Foo",
            "bar": "Bar {{x}}",
            "wibble": "{{phrase 'wobble'}}",
            "wobble": "Wibble Wobble",
            "baz.qux": "Baz Qux"
        },
        fr: {
            "foo": "Un Foo",
            ...
        }
    });

### Setting the default locale

    Phrase.locale("en");

### Using the helper

*The following examples assume the above languages and locale have been set and a context of `{ x: "X" }`*

Output a phrase using a key

    {{phrase "foo"}}                 → «Foo»

Output a phrase, interpolating a variable from the context

    {{phrase "bar"}}                 → «Bar X»

Explicitly interpolate a variable

    {{phrase "bar" x="Y"}}           → «Bar Y»

Output a phrase that contains a nested phrase

    {{phrase "wibble"}}              → «{{phrase 'wobble'}}» → «Wibble Wobble»

Output a phrase for a particular locale

    {{phrase "foo" "fr"}}
    {{phrase "foo" locale="fr"}}     → «Mon foo»

Output a phrase for a key appended with a suffix

    {{phrase "baz" _append="qux"}}   → «Baz Qux»

Output a phrase for a key prepended with a prefix

    {{phrase "qux" _prepend="baz"}}  → «Baz Qux»

Output a phrase wrapped in html for debugging purposes

    {{phrase "foo" _debug=true}}     → «<phrase data-phrase-key="foo">Foo</phrase>»

### Alternative shorter syntax

    ((foo))                          → «Foo»
    ((bar x="Y"))                    → «Bar Y»

### Additional methods

#### Phrase.get

    var str = Phrase.get(key, params);

Returns a Handlebars SafeString for key

#### Phrase.getString

    var str = Phrase.getString(key, params);

Returns string for key

#### Phrase.locale

    Phrase.locale([loc]);

Get (or set) Phrase’s current locale

#### Phrase.setLanguages

    Phrase.setLanguages(langs, options);

Sets languages to be used

#### Phrase.setLanguage

    Phrase.setLanguages(lang, phrases);

Sets individual language

### Tests

To run the tests, cd to the handlebars.phrase directory

    npm install && npm test

### Unlicense

handlebars.phrase is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors of this software dedicate any and all copyright interest in the software to the public domain. We make this dedication for the benefit of the public at large and to the detriment of our heirs and successors. We intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to http://unlicense.org