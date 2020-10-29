module.exports = {
	mode: 'production',
	entry: './Gadget-arquivarPEs.js',
    target: ["web", "es5"],
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

									],
								},
							],
						],
					},
            },
		],
	},
};
