var Log = require("log");
var log = new Log(process.env.loglevel || "error");

var Handlebars = require("handlebars");
var Phrase = require("../handlebars.phrase");
Phrase.registerHelper(Handlebars);

var langs = {
    "en": {
        'test.string': 'a aa',
        'test.interpolate': 'b {{x}} bb',
        'test.nested': 'c {{phrase "test.string"}} cc',
        'test.nested.interpolate': 'd {{phrase "test.interpolate"}} dd',
        'test.nested.interpolate.override': 'e {{x}} {{phrase "test.interpolate" x=y}} ee',
        'test.pend.more': 'more aaaa',
        'test.pend.more.andmore': 'and more aaaaa',
        'test~pend~more~andmore': 'and twiddle more aaaaa',
        'test.munge.span': 'f ##FF## ff',
        'test.htmlstring': '<span>{{x}}</span>',
        'test.alt.syntax': '((test.string)) ((test.htmlstring x="A")) (((test.htmlstring)))',
        'test.value': '((test.symlink))',
        'test.symlink': '((test.linkedvalue)) ((test.anotherlinkedvalue))',
        'test.linkedvalue': "EN linked value",
        'test.nestedvalue': "EN nested value",
        'test.anotherlinkedvalue': "EN another linked value ((test.nestedvalue))",
        'test.simple': '((test.woot))',
        'test.woot': 'Wooty EN'
    },
    "fr": {
        'test.string': 'à àà',
        'test.linkedvalue': "FR valeur liée",
        'test.nestedvalue': "FR valeur imbriquée",
        'test.simple': '((test.woot))',
        'test.woot': 'Wooty FR'
    }
};

Phrase.locale("en");
Phrase.addLanguages(langs);


function template (tmpl, data) {
    var urtemplate = Handlebars.compile(tmpl);
    var output = urtemplate(data || {});
    log.info("\n================================", "\n"+tmpl, "\n---------------------------------\n", output, "\n");
    return output;
}
function get (key, params, context, locale) {
    var output = Phrase.get(key, params, context, locale).toString();
    log.info("\n================================", "\n"+key, "\n---------------------------------\n", output, "\n");
    return output;
}
function getString (key, params, context, locale) {
    var output = Phrase.getString(key, params, context, locale);
    log.info("\n================================", "\n"+key, "\n---------------------------------\n", output, "\n");
    return output;
}


describe("Phrase helper", function() {

    it("should output simple strings", function () {
        expect(template('{{phrase "test.string"}}')).toBe("a aa");
    });

    it("should interpolate simple strings", function () {
        expect(template('{{phrase "test.interpolate"}}', {x: "XX"})).toBe("b XX bb");
        expect(template('{{phrase "test.interpolate" x="XxX"}}', {x: "XX"})).toBe("b XxX bb");
    });

    it("should output nested phrases", function () {
        expect(template('{{phrase "test.nested"}}')).toBe("c a aa cc");
    });

    it("should interpolate in nested phrases", function () {
        expect(template('{{phrase "test.nested.interpolate"}}', {x: "XX"})).toBe("d b XX bb dd");
        expect(template('{{phrase "test.nested.interpolate.override"}}', {x: "XX", y: "YY"})).toBe("e XX b YY bb ee");
        expect(template('{{phrase "test.nested.interpolate.override" x="XxX"}}', {x: "XX", y: "YY"})).toBe("e XxX b YY bb ee");
    });

    it("should return key for non-existent values", function () {
        expect(template('{{phrase "test.nonexistent"}}')).toBe("test.nonexistent");
    });

    it("should handle alternative simpler syntax", function () {
        expect(template('{{phrase "test.alt.syntax"}}', {x: "X"})).toBe('a aa <span>A</span> <span>X</span>');
        expect(template('((test.alt.syntax))', {x: "X"})).toBe('a aa <span>A</span> <span>X</span>');
        expect(template('((test.alt.syntax x="Y"))')).toBe('a aa <span>A</span> <span>Y</span>');
    });

    it("should allow empty values if specified", function () {
        expect(template('{{phrase "test.nonexistent" _allow-empty=true}}')).toBe("");
    });

    it("should handle internationalisation", function () {
        expect(template('{{phrase "test.string" "default"}}')).toBe("a aa");
        expect(template('{{phrase "test.string" ""}}')).toBe("a aa");
        expect(template('{{phrase "test.string" "en"}}')).toBe("a aa");
        expect(template('{{phrase "test.string" "fr"}}')).toBe("à àà");
        expect(template('{{phrase "test.string" locale="fr"}}')).toBe("à àà");
        expect(template('{{phrase "test.string" locale="default"}}')).toBe("a aa");
        expect(template('{{phrase "test.string" "en" locale="fr"}}')).toBe("a aa");
        Phrase.locale("fr");
        expect(template('{{phrase "test.string"}}')).toBe("à àà");
        expect(template('{{phrase "test.interpolate"}}', {x: "XX"})).toBe("test.interpolate");
        Phrase.locale("en");
        Phrase.setLanguages(null, {localefallback: true});
        expect(template('{{phrase "test.interpolate"}}', {x: "XX"})).toBe("b XX bb");
        expect(template('{{phrase "test.interpolate" "fr"}}', {x: "XX"})).toBe("b XX bb");
        expect(template('{{phrase "test.value"}}')).toBe("EN linked value EN another linked value EN nested value");
        expect(template('{{phrase "test.value" "fr"}}')).toBe("FR valeur liée EN another linked value FR valeur imbriquée");
        expect(template('{{phrase "test.simple"}}')).toBe("Wooty EN");
        expect(template('{{phrase "test.simple" "fr"}}')).toBe("Wooty FR");
    });

    it("should append and prepend supplied values to key", function () {
        expect(template('{{phrase "test.pend" _append="more"}}')).toBe("more aaaa");
        expect(template('{{phrase "test.pend" _append="more" _appendix="andmore"}}')).toBe("and more aaaaa");
        expect(template('{{phrase "pend.more" _prepend="test"}}')).toBe("more aaaa");
        expect(template('{{phrase "more" _prependix="test" _prepend="pend"}}')).toBe("more aaaa");
        expect(template('{{phrase "pend" _prepend="test"  _append="more" _appendix="andmore"}}')).toBe("and more aaaaa");
        Phrase.setLanguages(null, {penddelimiter: "~"});
        expect(template('{{phrase "pend" _prepend="test"  _append="more" _appendix="andmore"}}')).toBe("and twiddle more aaaaa");
    });

    it("should output debug value if specified", function () {
        expect(template('{{phrase "test.string" _debug=true}}')).toBe('<phrase data-phrase-key="test.string">a aa</phrase>');
    });
});

describe("Phrase.get", function() {
    it("should return same value as helper", function () {
        expect(get("test.string")).toBe('a aa');
        expect(get("test.nested.interpolate.override", {x: "XX", y: "YY"})).toBe('e XX b YY bb ee');
        expect(get("test.string", {}, {}, "fr")).toBe('à àà');
    });
});

describe("Phrase.getString", function() {
    it("should return same value as helper", function () {
        expect(getString("test.string")).toBe('a aa');
        expect(getString("test.nested.interpolate.override", {x: "XX", y: "YY"})).toBe('e XX b YY bb ee');
        expect(getString("test.string", {}, {}, "fr")).toBe('à àà');
    });
});

describe("Phrase.setFilter", function() {
    it("should not apply phrase filter if none set", function () {
        expect(template('{{phrase "test.munge.span"}}')).toBe('f ##FF## ff');
    });
    it("should apply phrase filter if set", function () {
        Phrase.setFilter(function (str) {
            return str.replace(/##(.*?)##/g, "<span>$1</span>");
        });
        expect(template('{{phrase "test.munge.span"}}')).toBe('f <span>FF</span> ff');
        Phrase.setFilter(null);
    });
});

describe("Phrase.addLanguages", function() {
    it("should add keys", function () {
        Phrase.addLanguages({en:{wibble:"dibble"}});
        expect(template('{{phrase "wibble"}}')).toBe('dibble');
    });
});

describe("Phrase.addLanguage", function() {
    it("should add keys", function () {
        Phrase.addLanguage("en", {wonkey:"donkey"});
        expect(template('{{phrase "wonkey"}}')).toBe('donkey');
    });
});

log.info("Described tests");
