var webpack = require('webpack');

module.exports = {
	mode: 'production',
	entry: './Gadget-arquivarPEs.js',
    target: ["web", "es5"],
    plugins: [
        new webpack.BannerPlugin( `
ArquivarPEs - Arquivar Páginas a eliminar

Adiciona um link (um "Arquivar" na linha de ferramentas da PE)
para administradores e eliminadores nas páginas para eliminar
que faz as ações de fechamento automaticamente.

Essa versão foi construída com webpack e Babel.
Podes encontrar o código original no GitHub:

https://github.com/chicocvenancio/arquivarPEs

Lá também é o aonde é feito o desenvolvimento,
por favor não edite a essa página diretamente.

This version was built with webpack and Babel.
You can find the original source code on GitHub:

https://github.com/chicocvenancio/arquivarPEs

That is also where development happens –
please do not edit this page directly.
` ),
    ],
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
                loader: 'babel-loader',
					options: {
						presets: [
							[
								'@babel/preset-env',
								{
									include: [
										'@babel/plugin-transform-arrow-functions',
									],
									targets: [
										'last 2 Chrome versions',
										'IE 11',
										'last 2 Firefox versions',
										'Safari 5.1',
										'Opera 15',
										'iOS 6.1',
										'Android 4.1',
									],
									useBuiltIns: 'usage',
									corejs: '3',
									exclude: [
										'es.promise', // polyfilled via es6-promise ResourceLoader module instead
                                        // supported everywhere, we don’t care about the subtle edge cases that core-js polyfills:
										'es.array.filter',
										'es.array.index-of', // not actually used, false positive from page.indexOf( '|' ) where page is a String, not an Array
										'es.array.map',
										'es.array.reduce',
										'es.array.slice',
										'es.array.some',
										'es.array.splice',
										'es.string.replace',
										'es.string.split',
                                        'es.regexp.exec',
                                        'es.parse-int', // we always specify radix
                                        'es.array.concat',

									],
								},
							],
						],
					},
            },
		],
	},
};
