/**
 * Created by Jinhwan on 2017-07-19.
 */

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncIterator) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator];
    return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });

const streams_1 = require('polymer-build/lib/streams');
const osPath = require("path");

class JekyllSplitter {
    constructor() {
        this._jekyllTagMap = new Map();
    }

    split() {
        return new JekyllSplit(this);
    }

    rejoin() {
        return new JekyllJoin(this);
    }


    getJekyllTag(key) {
        return this._jekyllTagMap.get(key);
    }

    setJekyllTag(key, value) {
        this._jekyllTagMap.set(key, value);
    }
}
exports.JekyllSplitter = JekyllSplitter;

class JekyllSplit extends streams_1.AsyncTransformStream {
    constructor(splitter) {
        super({ objectMode: true });
        this._state = splitter;
    }
    _transformIter(files) {
        return __asyncGenerator(this, arguments, function* _transformIter_1() {
            try {
                for (var files_1 = __asyncValues(files), files_1_1; files_1_1 = yield __await(files_1.next()), !files_1_1.done;) {
                    const file = yield __await(files_1_1.value);
                    const filePath = osPath.normalize(file.path);
                    if (!(file.contents && filePath.endsWith('.html'))) {
                        yield file;
                        continue;
                    }
                    let contents = yield __await(streams_1.getFileContents(file));
                    const jekyllTag = getJekyllTag(contents);
                    this._state.setJekyllTag(file.path, jekyllTag);
                    if (jekyllTag) {
                        contents = contents.substring(jekyllTag.length);
                    }
                    file.contents = new Buffer(contents);

                    yield file;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (files_1_1 && !files_1_1.done && (_a = files_1.return)) yield __await(_a.call(files_1));
                }
                finally { if (e_1) throw e_1.error; }
            }
            var e_1, _a;
        });
    }
}

class JekyllJoin extends streams_1.AsyncTransformStream {
    constructor(splitter) {
        super({ objectMode: true });
        this._state = splitter;
    }
    _transformIter(files) {
        return __asyncGenerator(this, arguments, function* _transformIter_1() {
            try {
                for (var files_1 = __asyncValues(files), files_1_1; files_1_1 = yield __await(files_1.next()), !files_1_1.done;) {
                    const file = yield __await(files_1_1.value);
                    const filePath = osPath.normalize(file.path);
                    if (!(file.contents && filePath.endsWith('.html'))) {
                        yield file;
                        continue;
                    }
                    let contents = yield __await(streams_1.getFileContents(file));
                    const jekyllTag = this._state.getJekyllTag(file.path);
                    if (jekyllTag) {
                        contents = jekyllTag + '\n' + contents;
                        file.contents = new Buffer(contents);
                    }
                    yield file;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (files_1_1 && !files_1_1.done && (_a = files_1.return)) yield __await(_a.call(files_1));
                }
                finally { if (e_1) throw e_1.error; }
            }
            var e_1, _a;
        });
    }
}

const jekyllTagRegex = /^---(\n|\r|\n\r|\r\n)(\w*\:.*.(\n|\r|\n\r|\r\n))*---/;
exports.jekyllTagRegex = jekyllTagRegex;

function getJekyllTag(html) {
    const jekyllTag = html.match(jekyllTagRegex);
    if (jekyllTag) {
        return jekyllTag[0];
    }
    return null;
}

exports.getJekyllTag = getJekyllTag;