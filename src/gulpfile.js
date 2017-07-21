/**
 * Created by Jinhwan on 2017-07-18.
 */
'use strict';
const path = require('path');
const del = require('del');
const gulp = require('gulp');
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');

const polymerJson = require('./polymer.json');
const options = polymerJson.builds[0];
const optimizeOptions = {
    css: options.css,
    js: options.js,
    html: options.html
};
const polymerProject = new polymerBuild.PolymerProject(polymerJson);
const buildDirectory = 'build';
const getOptimizeStreams = require('../lib/optimize-stream').getOptimizeStreams;
const JekyllSplitter = require('../lib/jekyllSplitter').JekyllSplitter;
const AppendRawTransform = require("../lib/appendRaw").AppendRawTransform;

/**
 * Waits for the given ReadableStream
 */
function waitFor(stream) {
    return new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
    });
}

function pipeStreams(streams) {
    return Array.prototype.concat.apply([], streams)
        .reduce((a, b) => {
            return a.pipe(b);
        });
}

function build() {
    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

        // Okay, so first thing we do is clear the build directory
        console.log(`Deleting ${buildDirectory} directory...`);
        del([buildDirectory])
            .then(() => {
                const stream = gulp.src(options.passingPattern, {base: '.'}).pipe(gulp.dest(buildDirectory));
                return waitFor(stream);
            })
            .then(() => {
                // Let's start by getting your source files. These are all the files
                // in your `src/` directory, or those that match your polymer.json
                // "sources"  property if you provided one.
                const sourcesStream = polymerBuild.forkStream(polymerProject.sources());
                const depsStream = polymerBuild.forkStream(polymerProject.dependencies());
                const htmlSplitter = new polymerBuild.HtmlSplitter();
                const jekyllSplitter = new JekyllSplitter();

                let buildStream = pipeStreams([
                    mergeStream(sourcesStream, depsStream),
                    jekyllSplitter.split(),
                    htmlSplitter.split(),
                    getOptimizeStreams(optimizeOptions),
                    htmlSplitter.rejoin(),
                ])
                    .once('data', () => {
                        console.log('building...');
                    });


                const compiledToES5 = !!(optimizeOptions.js && optimizeOptions.js.compile);
                if (compiledToES5) {
                    buildStream = buildStream.pipe(polymerProject.addBabelHelpersInEntrypoint())
                        .pipe(polymerProject.addCustomElementsEs5Adapter());
                }

                const bundled = !!(options.bundle);
                if (bundled && typeof options.bundle === 'object') {
                    buildStream = buildStream.pipe(polymerProject.bundler(options.bundle));
                } else if (bundled) {
                    buildStream = buildStream.pipe(polymerProject.bundler());
                }

                if (options.addPushManifest) {
                    buildStream = buildStream.pipe(polymerProject.addPushManifest());
                }

                buildStream = buildStream.pipe(jekyllSplitter.rejoin());
                buildStream = buildStream.pipe(new AppendRawTransform());

                buildStream = buildStream.pipe(gulp.dest(buildDirectory));
                return waitFor(buildStream);
            })
            .then(() => {
                if (options.addServiceWorker) {
                  const swPrecacheConfigPath = path.resolve(
                      polymerProject.config.root,
                      options.swPrecacheConfig || 'sw-precache-config.js');
                  let swConfig = null;
                  if (options.addServiceWorker) {
                    swConfig = require(swPrecacheConfigPath);
                  }
                    // Okay, now let's generate the Service Worker
                    console.log('Generating the Service Worker...');
                    return polymerBuild.addServiceWorker({
                        project: polymerProject,
                        buildRoot: buildDirectory,
                        bundled: !!(options.bundle),
                        swPrecacheConfig: swConfig
                    });
                }
            })
            .then(() => {
                // You did it!
                console.log('Build complete!');
                resolve();
            });
    });
}

gulp.task('build', build);
