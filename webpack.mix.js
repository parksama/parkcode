const path = require('path');
let mix = require('laravel-mix');

mix
	.js('src/js/app.js', './assets')
	.sass('src/css/style.scss', './assets')
	.react()
	.options({
		processCssUrls: false,
	})
	.sourceMaps(false, 'source-map')
	.version()
	.setPublicPath('./')
	;
