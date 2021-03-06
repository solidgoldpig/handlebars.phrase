(function (moduleFactory) {
    if(typeof exports === "object") {
        module.exports = moduleFactory(require("lodash"));
    } else if (typeof define === "function" && define.amd) {
        define(["lodash"], moduleFactory);
    }
}(function (_) {
/**
 * @module handlebars%phrase
 * @description  Provides helper to allow strings to be externalised
 * 
 *      var Handlebars = require("handlebars");
 *      var Phrase = require("handlebars.phrase");
 *      Phrase.registerHelpers(Handlebars);
 *      Phrase.setLanguages(langs);
 *      Phrase.locale(lang);
 * @returns {object} Phrase instance
 */
    var Handlebars;

    var languageRegister;
    var phraseRegister = {};
    var phraseStrings = {}; // raw lang strings that can be returned as is
    var phraseTemplates = {}; // compiled lang template cache
    var locale = "default";
    var pendDelimiter = ".";
    var defaultLocaleProvidesFallback = false;
    var phraseFilter;

    var Phrase = (function () {
        /**
         * @template phrase
         * @block helper
         * @description  Outputs a phrase corresponding to key provided
         *
         *     {{phrase key}}
         *
         * Output a phrase, interpolating a variable from the context
         * 
         *     {{phrase key var=var}}
         *
         * Output a phrase for a particular locale
         * 
         *     {{phrase key lang}}
         *     {{phrase key locale=lang}}
         *
         * Output a phrase for an appended key
         * 
         *     {{phrase key _append=append}}
         *     {{phrase key _append=append _appendix=appendix}}
         *
         * Output a phrase for an prepended key
         * 
         *     {{phrase key _prepend=prepend}}
         *     {{phrase key _prepend=prepend _prependix=prependix}}
         *
         * Output a phrase for debugging purposes
         * 
         *     {{phrase key _debug=true}}
         *
         * Use simpliflied syntax
         *     ((key))
         *     ((key var=var))
         *
         */
        var PhraseHelper = function () {
            var args = Array.prototype.slice.call(arguments);
            var isGet = false;
            if (args[0] === "get") {
                isGet = true;
                args.shift();
            }
            // if we don't pass key, how can we tell that arg isn't a locale?
            var key = args[0];
            var originalKey = key;
            var params = {};
            var options = args[args.length-1];

            // allow helper context to be overridden
            try {
                // add in this before opions.hash.params
                // however, that means all vars rampage through all scopes
                params = _.extend({}, (options.hash.params || {}), options.hash);
                delete options.hash.params;
            } catch (e) {
                console.log(e, options, arguments);
            }

            // Determine which locale is in effect
            var tmpLocale;
            if (args.length === 3) {
                tmpLocale = args[1];
            } else {
                tmpLocale = params.locale;
            }
            if (!tmpLocale && !isGet) {
                tmpLocale = this.locale;
            }
            if (!tmpLocale || tmpLocale === "default") {
                tmpLocale = locale;
            }

            // ensure phraseRegister entries exists for locale and tmpLocale
            if (!phraseRegister[locale]) {
                phraseRegister[locale] = {};
                phraseStrings[locale] = {};
                phraseTemplates[locale] = {};
            }
            if (!phraseRegister[tmpLocale]) {
                phraseRegister[tmpLocale] = {};
                phraseStrings[tmpLocale] = {};
                phraseTemplates[tmpLocale] = {};
            }

            if (params._append) {
                key += pendDelimiter + params._append;
                if (params._appendix) {
                    key += pendDelimiter + params._appendix;
                }
            }
            if (params._prepend) {
                key = params._prepend + pendDelimiter + key;
                if (params._prependix) {
                    key = params._prependix + pendDelimiter + key;
                }
            }

            if (!phraseRegister[tmpLocale][key]) {
                var templateString = languageRegister[tmpLocale][key];
                if (templateString === undefined && tmpLocale !== locale) {
                    languageRegister[tmpLocale][key] = languageRegister[locale][key];
                    templateString = languageRegister[tmpLocale][key];
                }
                if (templateString !== undefined) {
                    if (templateString.indexOf("{{") === -1 && templateString.indexOf("((") === -1) {
                        phraseStrings[tmpLocale][key] = templateString;
                        // possible to cache if compilable but
                        // just reference to another static phrase?
                    } else {
                        phraseTemplates[tmpLocale][key] = Handlebars.compile(templateString);
                    }
                }
                phraseRegister[tmpLocale][key] = true;
            }

            var langValue;
            //  || (defaultLocaleProvidesFallback && phraseStrings[locale][key])
            if (phraseStrings[tmpLocale][key]) {
                langValue = phraseStrings[tmpLocale][key];
            } else if (phraseTemplates[tmpLocale][key]) {
                // could possibly cache the output using key created from input
                // but would that be any quicker?

                // ensure that tmpLocale gets passed on to nested phrases
                params.locale = tmpLocale;
                var data = _.extend({}, this, params);
                var template = phraseTemplates[tmpLocale][key];
                langValue = template.call(this, data);
            } else {
                if (!isGet && !params["_allow-empty"]) {
                    // return the key itself
                    langValue = key;
                }
            }
            if (langValue && params._debug) {
                // output a value for debugging
                langValue = '<phrase data-phrase-key="' + key + '">' + langValue + "</phrase>";
            }
            if (langValue && phraseFilter) {
                // apply any filter that has been set
                langValue = phraseFilter(langValue);
            }
            return langValue ? new Handlebars.SafeString(langValue) : "";
        };

        var external = {
            /**
             * @method locale
             * @static
             * @param {string} [loc] Locale to change to
             * @description Get or set default locale used by Phrase
             *
             * If called without loc parameter, returns locale
             *
             * If called with loc parameter, sets locale
             *
             * @returns {string} Phrase’s locale
             */
            locale: function (loc) {
                if (loc) {
                    locale = loc;
                }
                return locale;
            },
            /**
             * @method get
             * @static
             * @param {object} phrase Lookup key
             * @param {object} args Any arguments to pass to phrase
             * @param {object} context Specific context to use
             * @param {string} [locale] Locale to use
             * @description Get HandlebarsSafeString object for a key
             *
             * @returns {HandlebarsSafeString} phrase
             */
            get: function (phrase, args, context, locale) {
                if (!args) {
                    args = {};
                }
                context = context || this;
                var params = ["get", phrase, {hash: args}];
                if (locale) {
                    params.splice(2, 0, locale);
                }
                return PhraseHelper.apply(context, params);
            },
            /**
             * @method getString
             * @static
             * @param {object} phrase Lookup key
             * @param {object} args Any arguments to pass to phrase
             * @param {object} context Specific context to use
             * @param {string} [locale] Locale to use
             * @description Get phrase value for a key
             *
             * @returns {string} phrase
             */
            getString: function (phrase, args, context, locale) {
                var value = external.get(phrase, args, context, locale);
                return value ? value.toString() : undefined;
            },
            /**
             * @method setLanguages
             * @static
             * @param {object} [languages] Object of language phrases
             * @param {object} [options]
             * @param {boolean} [options.localefallback=false] Whether default language should provide missing values for other languages
             * @param {string} [options.penddelimiter=.] Delimiter to use when appending or prepending keys
             * @description Set languages object without which Phrase cannot work
             *
             * Clears any previously set languages
             *
             */
            setLanguages: function (languages, options) {
                options = options || {};
                phraseRegister = {};
                phraseStrings = {};
                phraseTemplates = {};
                if (languages) {
                    languageRegister = languages;
                }
                if (options.penddelimiter) {
                    pendDelimiter = options.penddelimiter;
                }
                if (options.localefallback !== undefined) {
                    defaultLocaleProvidesFallback = !!options.localefallback;
                }
            },
            /**
             * @method addLanguages
             * @static
             * @param {object} [languages] Object of language phrases
             * @description Add keys to existing languages object
             *
             * Clears any previously cached strings or templates for languages passed
             */
            addLanguages: function (languages) {
                languageRegister = languageRegister || {};
                if (languages) {
                    for (var lang in languages) {
                        phraseRegister[lang] = {};
                        phraseStrings[lang] = {};
                        phraseTemplates[lang] = {};
                        languageRegister[lang] = _.extend({}, languageRegister[lang], languages[lang]);
                    }
                }
            },
            /**
             * @method setLanguage
             * @static
             * @param {string} lang Language to be set
             * @param {object} phrases Phrases object for the language
             * @description Set language individually
             *
             * Clears any previously cached strings or templates for language
             *
             */
            setLanguage: function (lang, phrases) {
                languageRegister = languageRegister || {};
                phraseRegister[lang] = {};
                phraseStrings[lang] = {};
                phraseTemplates[lang] = {};
                languageRegister[lang] = phrases;
            },
            /**
             * @method addLanguage
             * @static
             * @param {string} lang Language to add to
             * @param {object} phrases Phrases object for the language
             * @description Add phrases to individual language
             *
             * Clears any previously cached strings or templates for language
             *
             */
            addLanguage: function (lang, phrases) {
                languageRegister = languageRegister || {};
                phraseRegister[lang] = {};
                phraseStrings[lang] = {};
                phraseTemplates[lang] = {};
                languageRegister[lang] = _.extend({}, languageRegister[lang], phrases);
            },
            /**
             * @method registerHelper
             * @static
             * @param {object} hbars Handlebars instance
             * @description Register Phrase helper with Handlebars
             *
             * - {@link template:phrase}
             */
            registerHelper: function (hbars) {
                Handlebars = hbars;
                Handlebars.registerHelper("phrase", PhraseHelper);
                var Hparse = Handlebars.parse;
                Handlebars.parse = function (input) {
                    input = input.replace(/\(\(\(([^ ]+?)( .+?)*\)\)\)/g, function (m, m1, m2) {
                        return '{{{phrase "' + m1 + '"' + (m2 ? m2 : "") + '}}}';
                    });
                    input = input.replace(/\(\(([^ ]+?)( .+?)*\)\)/g, function (m, m1, m2) {
                        return '{{phrase "' + m1 + '"' + (m2 ? m2 : "") + '}}';
                    });
                    return Hparse(input);
                };
            },
            /**
             * @method setFilter
             * @static
             * @param {function} fn
             * @description Sets a filter to apply to all returned output
             */
            setFilter: function (fn) {
                phraseFilter = fn;
            }

        };
        // alias plural form
        external.registerHelpers = external.registerHelper;

        return external;
    })();

    return Phrase;

}));