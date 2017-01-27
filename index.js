'use strict';

var es = require('event-stream');
var gutil = require('gulp-util');
var postcss = require('postcss');
var PluginError = gutil.PluginError;
var scopeSelector;
var scope;

const PLUGIN_NAME = 'gulp-no-conflict-css';

function escapeRegExp(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
function replaceAll(str, find, replace) {
	return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

scope = postcss(function(css) {
	css.walkRules(function(rule) {
		rule.selectors = rule.selectors.map(function(selector) {
			if (selector.trim().toLowerCase() === 'body') {
				return scopeSelector;
			} else {
				return replaceAll(selector, '.', '.' + scopeSelector + '-');
			}
		});
	});
});


module.exports = function cssPrefixer(scopeSelectorOption) {
	scopeSelector = scopeSelectorOption;

	if (!scopeSelector) {
		throw new PluginError(PLUGIN_NAME, 'Missing a css prefix!');
	}

	return es.map(function(file, callback) {
		if (file.isNull()) {
			return cb(null, file);
		}
		if (file.isBuffer()) {
			file.contents = new Buffer(scope.process(file.contents).css);
		}
		if (file.isStream()) {
			var through = es.through();
			var wait = es.wait(function(err, contents) {
				through.write(scope.process(contents).css);
				through.end();
			});

			file.contents.pipe(wait);
			file.contents = through;
		}
		callback(null, file);
	})
};
