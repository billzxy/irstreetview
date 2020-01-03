const rewireReactHotLoader = require("react-app-rewire-hot-loader");
const {
	override,
	addDecoratorsLegacy,
	disableEsLint,
	fixBabelImports,
	addWebpackAlias
} = require("customize-cra");
const path = require("path");

module.exports = override(
	addDecoratorsLegacy(),
	// disable eslint in webpack
	disableEsLint(),
	// add an alias for "@" imports
	addWebpackAlias({
		["@"]: path.resolve(__dirname, "src")
	}),
	config => {
		config = rewireReactHotLoader(config, config.mode);

		if (config.mode === "development") {
			config.resolve.alias = {
				...config.resolve.alias,
				"react-dom": "@hot-loader/react-dom"
			};
		}

		return config;
	}
);
