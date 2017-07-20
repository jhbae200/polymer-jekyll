/**
 * Created by Jinhwan on 2017-07-19.
 */

const stream_1 = require("stream");

const bundleRegex = /<html>/;
const rawRegex = /{%( )?raw( )?%}/;
const jekyllTagRegex = require("./jekyllSplitter").jekyllTagRegex;

class AppendRawTransform extends stream_1.Transform {
    constructor(optimizerName, optimizer, optimizerOptions) {
        super({ objectMode: true });
        this.optimizer = optimizer;
        this.optimizerName = optimizerName;
        this.optimizerOptions = optimizerOptions || {};
    }
    _transform(file, _encoding, callback) {
        if (file.contents) {
            try {
                let contents = file.contents.toString();
                if (contents.search(jekyllTagRegex) === -1 || contents.search(rawRegex) === -1) {
                    callback(null, file);
                    return;
                }
                contents = contents.replace(rawRegex, '{% endraw %}{% raw %}').replace(bundleRegex, '{% raw %}<html>');
                file.contents = new Buffer(contents);
            }
            catch (error) {
                logger.warn(`${this.optimizerName}: Unable to optimize ${file.path}`, { err: error.message || error });
            }
        }
        callback(null, file);
    }
}
exports.AppendRawTransform = AppendRawTransform;