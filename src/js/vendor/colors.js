;(function(window, undefined){
	"use strict"

	var _valueRanges = {
			rgb:   {r: [0, 255], g: [0, 255], b: [0, 255]},
			hsv:   {h: [0, 360], s: [0, 100], v: [0, 100]},
			hsl:   {h: [0, 360], s: [0, 100], l: [0, 100]},
			cmy:   {c: [0, 100], m: [0, 100], y: [0, 100]},
			cmyk:  {c: [0, 100], m: [0, 100], y: [0, 100], k: [0, 100]},
			Lab:   {L: [0, 100], a: [-128, 127], b: [-128, 127]},
			XYZ:   {X: [0, 100], Y: [0, 100], Z: [0, 100]},
			alpha: {alpha: [0, 1]},
			HEX:   {HEX: [0, 16777215]} // maybe we don't need this
		},

		_instance = {},
		_colors = {},

		// http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html for more
		XYZMatrix = { // Observer = 2° (CIE 1931), Illuminant = D65 
			X: [ 0.4124564,  0.3575761,  0.1804375],
			Y: [ 0.2126729,  0.7151522,  0.0721750],
			Z: [ 0.0193339,  0.1191920,  0.9503041],
			R: [ 3.2404542, -1.5371385, -0.4985314],
			G: [-0.9692660,  1.8760108,  0.0415560],
			B: [ 0.0556434, -0.2040259,  1.0572252]
		},
		grey = {r: 0.298954, g: 0.586434, b: 0.114612}, // CIE-XYZ 1931
		luminance = {r: 0.2126, g: 0.7152, b: 0.0722}, // W3C 2.0

		Colors = window.Colors = function(options) {
			this.colors = {RND: {}};
			this.options = {
				color: 'rgba(204, 82, 37, 0.8)', // init value(s)...
				XYZMatrix: XYZMatrix,
				// XYZReference: {},
				grey: grey,
				luminance: luminance,
				valueRanges: _valueRanges
				// customBG: '#808080'
				// convertCallback: undefined,
				// allMixDetails: false
			};
			initInstance(this, options || {});
		},
		initInstance = function(THIS, options) {
			var matrix,
				importColor,
				_options = THIS.options,
				customBG;

			focusInstance(THIS);
			for (var option in options) {
				if (options[option] !== undefined) _options[option] = options[option];
			}
			matrix = _options.XYZMatrix;
			if (!options.XYZReference) _options.XYZReference = {
				X: matrix.X[0] + matrix.X[1] + matrix.X[2],
				Y: matrix.Y[0] + matrix.Y[1] + matrix.Y[2],
				Z: matrix.Z[0] + matrix.Z[1] + matrix.Z[2]
			};
			customBG = _options.customBG;
			_options.customBG = (typeof customBG === 'string') ? ColorConverter.txt2color(customBG).rgb : customBG;
			_colors = setColor(THIS.colors, _options.color, undefined, true); // THIS.colors = _colors = 
		},
		focusInstance = function(THIS) {
			if (_instance !== THIS) {
				_instance = THIS;
				_colors = THIS.colors;
			}
		};

	Colors.prototype.setColor = function(newCol, type, alpha) {
		focusInstance(this);
		if (newCol) {
			return setColor(this.colors, newCol, type, undefined, alpha);
		} else {
			if (alpha !== undefined) {
				this.colors.alpha = alpha;
			}
			return convertColors(type);
		}
	};

	Colors.prototype.getColor = function(type) {
		var result = this.colors, n = 0;

		if (type) {
			type = type.split('.');
			while (result[type[n]]) {
				result = result[type[n++]];
			}
			if (type.length !== n) {
				result = undefined;
			}
		}
		return result;
	};

	Colors.prototype.setCustomBackground = function(col) { // wild gues,... check again...
		focusInstance(this); // needed???
		this.options.customBG = (typeof col === 'string') ? ColorConverter.txt2color(col).rgb : col;
		// return setColor(this.colors, this.options.customBG, 'rgb', true); // !!!!RGB
		return setColor(this.colors, undefined, 'rgb'); // just recalculate existing
	};

	Colors.prototype.saveAsBackground = function() { // alpha
		focusInstance(this); // needed???
		// return setColor(this.colors, this.colors.RND.rgb, 'rgb', true);
		return setColor(this.colors, undefined, 'rgb', true);
	};

	Colors.prototype.convertColor = function(color, type) {
		var convert = ColorConverter,
			ranges = _valueRanges,
			types = type.split('2'),
			fromType = types[0],	
			toType = types[1],
			test = /(?:RG|HS|CM|LA)/,
			normalizeFrom = test.test(fromType),
			normalizeTo = test.test(toType),
			exceptions = {LAB: 'Lab'},
			normalize = function(color, type, reverse) {
				var result = {},
					Lab = type === 'Lab' ? 1 : 0;

				for (var n in color) { // faster (but bigger) way: if/else outside 2 for loops
					result[n] = reverse ?
						Math.round(color[n] * (Lab || ranges[type][n][1])) :
						color[n] / (Lab || ranges[type][n][1]);
				}
				
				return result;
			};

		fromType = ranges[fromType] ? fromType : exceptions[fromType] || fromType.toLowerCase();
		toType = ranges[toType] ? toType : exceptions[toType] || toType.toLowerCase();

		if (normalizeFrom && type !== 'RGB2HEX') { // from ABC to abc
			color = normalize(color, fromType);
		}
		color = fromType === toType ? color : ( // same type; returns same/normalized version
			convert[fromType + '2' + toType] ? convert[fromType + '2' + toType](color, true) : // existing converter
			toType === 'HEX' ? convert.RGB2HEX(type === 'RGB2HEX' ? color : normalize(fromType === 'rgb' ? color : 
				convert[fromType + '2rgb'](color, true), 'rgb', true)) :
 			convert['rgb2' + toType](convert[fromType + '2rgb'](color, true), true) // not in ColorConverter
		);
		if (normalizeTo) { // from abc to ABC
			color = normalize(color, toType, true);
		}

		return color;
	};

	// ------------------------------------------------------ //
	// ---------- Color calculation related stuff  ---------- //
	// -------------------------------------------------------//

	function setColor(colors, color, type, save, alpha) { // color only full range
		if (typeof color === 'string') {
			var color = ColorConverter.txt2color(color); // new object
			type = color.type;
			_colors[type] = color[type];
			alpha = alpha !== undefined ? alpha : color.alpha;
		} else if (color) {
			for (var n in color) {
				colors[type][n] = limitValue(color[n] / _valueRanges[type][n][1], 0 , 1);
			}
		}
		if (alpha !== undefined) {
			colors.alpha = +alpha;
		}
		return convertColors(type, save ? colors : undefined);
	}

	function saveAsBackground(RGB, rgb, alpha) {
		var grey = _instance.options.grey,
			color = {};

		color.RGB = {r: RGB.r, g: RGB.g, b: RGB.b};
		color.rgb = {r: rgb.r, g: rgb.g, b: rgb.b};
		color.alpha = alpha;
		// color.RGBLuminance = getLuminance(RGB);
		color.equivalentGrey = Math.round(grey.r * RGB.r + grey.g * RGB.g + grey.b * RGB.b);

		color.rgbaMixBlack = mixColors(rgb, {r: 0, g: 0, b: 0}, alpha, 1);
		color.rgbaMixWhite = mixColors(rgb, {r: 1, g: 1, b: 1}, alpha, 1);
		color.rgbaMixBlack.luminance = getLuminance(color.rgbaMixBlack, true);
		color.rgbaMixWhite.luminance = getLuminance(color.rgbaMixWhite, true);

		if (_instance.options.customBG) {
			color.rgbaMixCustom = mixColors(rgb, _instance.options.customBG, alpha, 1);
			color.rgbaMixCustom.luminance = getLuminance(color.rgbaMixCustom, true);
			_instance.options.customBG.luminance = getLuminance(_instance.options.customBG, true);
		}

		return color;
	}

	function convertColors(type, colorObj) {
		// console.time('convertColors');
		var colors = colorObj || _colors,
			convert = ColorConverter,
			options = _instance.options,
			ranges = _valueRanges,
			RND = colors.RND,
			// type = colorType, // || _mode.type,
			modes, mode = '', from = '', // value = '',
			exceptions = {hsl: 'hsv', cmyk: 'cmy', rgb: type},
			RGB = RND.rgb, SAVE, SMART;

		if (type !== 'alpha') {
			for (var typ in ranges) {
				if (!ranges[typ][typ]) { // no alpha|HEX
					if (type !== typ && typ !== 'XYZ') {
						from = exceptions[typ] || 'rgb';
						colors[typ] = convert[from + '2' + typ](colors[from]);
					}

					if (!RND[typ]) RND[typ] = {};
					modes = colors[typ];
					for(mode in modes) {
						RND[typ][mode] = Math.round(modes[mode] * (typ === 'Lab' ? 1 : ranges[typ][mode][1]));
					}
				}
			}
			if (type !== 'Lab') {
				delete colors._rgb;
			}

			RGB = RND.rgb;
			colors.HEX = convert.RGB2HEX(RGB);
			colors.equivalentGrey =
				options.grey.r * colors.rgb.r +
				options.grey.g * colors.rgb.g +
				options.grey.b * colors.rgb.b;
			colors.webSave = SAVE = getClosestWebColor(RGB, 51);
			// colors.webSave.HEX = convert.RGB2HEX(colors.webSave);
			colors.webSmart = SMART = getClosestWebColor(RGB, 17);
			// colors.webSmart.HEX = convert.RGB2HEX(colors.webSmart);
			colors.saveColor =
				RGB.r === SAVE.r && RGB.g === SAVE.g && RGB.b === SAVE.b  ? 'web save' :
				RGB.r === SMART.r && RGB.g === SMART.g && RGB.b === SMART.b  ? 'web smart' : '';
			colors.hueRGB = ColorConverter.hue2RGB(colors.hsv.h);

			if (colorObj) {
				colors.background = saveAsBackground(RGB, colors.rgb, colors.alpha);
			}
		} // else RGB = RND.rgb;

		var rgb = colors.rgb, // for better minification...
			alpha = colors.alpha,
			luminance = 'luminance',
			background = colors.background,
			rgbaMixBlack, rgbaMixWhite, rgbaMixCustom, 
			rgbaMixBG, rgbaMixBGMixBlack, rgbaMixBGMixWhite, rgbaMixBGMixCustom;

		rgbaMixBlack = mixColors(rgb, {r: 0, g: 0, b: 0}, alpha, 1);
		rgbaMixBlack[luminance] = getLuminance(rgbaMixBlack, true);
		colors.rgbaMixBlack = rgbaMixBlack;

		rgbaMixWhite = mixColors(rgb, {r: 1, g: 1, b: 1}, alpha, 1);
		rgbaMixWhite[luminance] = getLuminance(rgbaMixWhite, true);
		colors.rgbaMixWhite = rgbaMixWhite;

		if (options.allMixDetails) {
			rgbaMixBlack.WCAG2Ratio = getWCAG2Ratio(rgbaMixBlack[luminance], 0);
			rgbaMixWhite.WCAG2Ratio = getWCAG2Ratio(rgbaMixWhite[luminance], 1);

			if (options.customBG) {
				rgbaMixCustom = mixColors(rgb, options.customBG, alpha, 1);
				rgbaMixCustom[luminance] = getLuminance(rgbaMixCustom, true);
				rgbaMixCustom.WCAG2Ratio = getWCAG2Ratio(rgbaMixCustom[luminance], options.customBG[luminance]);
				colors.rgbaMixCustom = rgbaMixCustom;
			}

			rgbaMixBG = mixColors(rgb, background.rgb, alpha, background.alpha);
			rgbaMixBG[luminance] = getLuminance(rgbaMixBG, true); // ?? do we need this?
			colors.rgbaMixBG = rgbaMixBG;

			rgbaMixBGMixBlack = mixColors(rgb, background.rgbaMixBlack, alpha, 1);
			rgbaMixBGMixBlack[luminance] = getLuminance(rgbaMixBGMixBlack, true);
			rgbaMixBGMixBlack.WCAG2Ratio = getWCAG2Ratio(rgbaMixBGMixBlack[luminance],
				background.rgbaMixBlack[luminance]);
			/* ------ */
			rgbaMixBGMixBlack.luminanceDelta = Math.abs(
				rgbaMixBGMixBlack[luminance] - background.rgbaMixBlack[luminance]);
			rgbaMixBGMixBlack.hueDelta = getHueDelta(background.rgbaMixBlack, rgbaMixBGMixBlack, true);
			/* ------ */
			colors.rgbaMixBGMixBlack = rgbaMixBGMixBlack;

			rgbaMixBGMixWhite = mixColors(rgb, background.rgbaMixWhite, alpha, 1);
			rgbaMixBGMixWhite[luminance] = getLuminance(rgbaMixBGMixWhite, true);
			rgbaMixBGMixWhite.WCAG2Ratio = getWCAG2Ratio(rgbaMixBGMixWhite[luminance],
				background.rgbaMixWhite[luminance]);
			/* ------ */
			rgbaMixBGMixWhite.luminanceDelta = Math.abs(
				rgbaMixBGMixWhite[luminance] - background.rgbaMixWhite[luminance]);
			rgbaMixBGMixWhite.hueDelta = getHueDelta(background.rgbaMixWhite, rgbaMixBGMixWhite, true);
			/* ------ */
			colors.rgbaMixBGMixWhite = rgbaMixBGMixWhite;
		}

		if (options.customBG) {
			rgbaMixBGMixCustom = mixColors(rgb, background.rgbaMixCustom, alpha, 1);
			rgbaMixBGMixCustom[luminance] = getLuminance(rgbaMixBGMixCustom, true);
			rgbaMixBGMixCustom.WCAG2Ratio = getWCAG2Ratio(rgbaMixBGMixCustom[luminance],
				background.rgbaMixCustom[luminance]);
			colors.rgbaMixBGMixCustom = rgbaMixBGMixCustom;
			/* ------ */
			rgbaMixBGMixCustom.luminanceDelta = Math.abs(
				rgbaMixBGMixCustom[luminance] - background.rgbaMixCustom[luminance]);
			rgbaMixBGMixCustom.hueDelta = getHueDelta(background.rgbaMixCustom, rgbaMixBGMixCustom, true);
			/* ------ */
		}

		colors.RGBLuminance = getLuminance(RGB);
		colors.HUELuminance = getLuminance(colors.hueRGB);

		// renderVars.readyToRender = true;
		if (options.convertCallback) {
			options.convertCallback(colors, type); //, convert); //, _mode);
		}

		// console.timeEnd('convertColors')
		// if (colorObj)
		return colors;
	}


	// ------------------------------------------------------ //
	// ------------------ color conversion ------------------ //
	// -------------------------------------------------------//

	var ColorConverter = {
		txt2color: function(txt) {
			var color = {},
				parts = txt.replace(/(?:#|\)|%)/g, '').split('('),
				values = (parts[1] || '').split(/,\s*/),
				type = parts[1] ? parts[0].substr(0, 3) : 'rgb',
				m = '';

			color.type = type;
			color[type] = {};
			if (parts[1]) {
				for (var n = 3; n--; ) {
					m = type[n] || type.charAt(n); // IE7
					color[type][m] = +values[n] / _valueRanges[type][m][1];
				}
			} else {
				color.rgb = ColorConverter.HEX2rgb(parts[0]);
			}
			// color.color = color[type];
			color.alpha = values[3] ? +values[3] : 1;

			return color;
		},

		RGB2HEX: function(RGB) {
			return (
				(RGB.r < 16 ? '0' : '') + RGB.r.toString(16) +
				(RGB.g < 16 ? '0' : '') + RGB.g.toString(16) +
				(RGB.b < 16 ? '0' : '') + RGB.b.toString(16)
			).toUpperCase();
		},

		HEX2rgb: function(HEX) {
			HEX = HEX.split(''); // IE7
			return {
				r: parseInt(HEX[0] + HEX[HEX[3] ? 1 : 0], 16) / 255,
				g: parseInt(HEX[HEX[3] ? 2 : 1] + (HEX[3] || HEX[1]), 16) / 255,
				b: parseInt((HEX[4] || HEX[2]) + (HEX[5] || HEX[2]), 16) / 255
			};
		},

		hue2RGB: function(hue) {
			var h = hue * 6,
				mod = ~~h % 6, // Math.floor(h) -> faster in most browsers
				i = h === 6 ? 0 : (h - mod);

			return {
				r: Math.round([1, 1 - i, 0, 0, i, 1][mod] * 255),
				g: Math.round([i, 1, 1, 1 - i, 0, 0][mod] * 255),
				b: Math.round([0, 0, i, 1, 1, 1 - i][mod] * 255)
			};
		},

		// ------------------------ HSV ------------------------ //

		rgb2hsv: function(rgb) { // faster
			var r = rgb.r,
				g = rgb.g,
				b = rgb.b,
				k = 0, chroma, min, s;

			if (g < b) {
				g = b + (b = g, 0);
				k = -1;
			}
			min = b;
			if (r < g) {
				r = g + (g = r, 0);
				k = -2 / 6 - k;
				min = Math.min(g, b); // g < b ? g : b; ???
			}
			chroma = r - min;
			s = r ? (chroma / r) : 0;
			return {
				h: s < 1e-15 ? ((_colors && _colors.hsl && _colors.hsl.h) || 0) :
					chroma ? Math.abs(k + (g - b) / (6 * chroma)) : 0,
				s: r ? (chroma / r) : ((_colors && _colors.hsv && _colors.hsv.s) || 0), // ??_colors.hsv.s || 0
				v: r
			};
		},

		hsv2rgb: function(hsv) {
			var h = hsv.h * 6,
				s = hsv.s,
				v = hsv.v,
				i = ~~h, // Math.floor(h) -> faster in most browsers
				f = h - i,
				p = v * (1 - s),
				q = v * (1 - f * s),
				t = v * (1 - (1 - f) * s),
				mod = i % 6;

			return {
				r: [v, q, p, p, t, v][mod],
				g: [t, v, v, q, p, p][mod],
				b: [p, p, t, v, v, q][mod]
			};
		},

		// ------------------------ HSL ------------------------ //

		hsv2hsl: function(hsv) {
			var l = (2 - hsv.s) * hsv.v,
				s = hsv.s * hsv.v;

			s = !hsv.s ? 0 : l < 1 ? (l ? s / l : 0) : s / (2 - l);

			return {
				h: hsv.h,
				s: !hsv.v && !s ? ((_colors && _colors.hsl && _colors.hsl.s) || 0) : s, // ???
				l: l / 2
			};
		},

		rgb2hsl: function(rgb, dependent) { // not used in Color
			var hsv = ColorConverter.rgb2hsv(rgb);

			return ColorConverter.hsv2hsl(dependent ? hsv : (_colors.hsv = hsv));
		},

		hsl2rgb: function(hsl) {
			var h = hsl.h * 6,
				s = hsl.s,
				l = hsl.l,
				v = l < 0.5 ? l * (1 + s) : (l + s) - (s * l),
				m = l + l - v,
				sv = v ? ((v - m) / v) : 0,
				sextant = ~~h, // Math.floor(h) -> faster in most browsers
				fract = h - sextant,
				vsf = v * sv * fract,
				t = m + vsf,
				q = v - vsf,
				mod = sextant % 6;

			return {
				r: [v, q, m, m, t, v][mod],
				g: [t, v, v, q, m, m][mod],
				b: [m, m, t, v, v, q][mod]
			};
		},

		// ------------------------ CMYK ------------------------ //
		// Quote from Wikipedia:
		// "Since RGB and CMYK spaces are both device-dependent spaces, there is no 
		// simple or general conversion formula that converts between them.  
		// Conversions are generally done through color management systems, using 
		// color profiles that describe the spaces being converted. Nevertheless, the 
		// conversions cannot be exact, since these spaces have very different gamuts."
		// Translation: the following are just simple RGB to CMY(K) and visa versa conversion functions.

		rgb2cmy: function(rgb) {
			return {
				c: 1 - rgb.r,
				m: 1 - rgb.g,
				y: 1 - rgb.b
			};
		},

		cmy2cmyk: function(cmy) {
			var k = Math.min(Math.min(cmy.c, cmy.m), cmy.y),
				t = 1 - k || 1e-20;

			return { // regular
				c: (cmy.c - k) / t,
				m: (cmy.m - k) / t,
				y: (cmy.y - k) / t,
				k: k
			};
		},

		cmyk2cmy: function(cmyk) {
			var k = cmyk.k;

			return { // regular
				c: cmyk.c * (1 - k) + k,
				m: cmyk.m * (1 - k) + k,
				y: cmyk.y * (1 - k) + k
			};
		},

		cmy2rgb: function(cmy) {
			return {
				r: 1 - cmy.c,
				g: 1 - cmy.m,
				b: 1 - cmy.y
			};
		},

		rgb2cmyk: function(rgb, dependent) {
			var cmy = ColorConverter.rgb2cmy(rgb); // doppelt??

			return ColorConverter.cmy2cmyk(dependent ? cmy : (_colors.cmy = cmy));
		},

		cmyk2rgb: function(cmyk, dependent) {
			var cmy = ColorConverter.cmyk2cmy(cmyk); // doppelt??

			return ColorConverter.cmy2rgb(dependent ? cmy : (_colors.cmy = cmy));
		},

		// ------------------------ LAB ------------------------ //

		XYZ2rgb: function(XYZ, skip) {
			var M = _instance.options.XYZMatrix,
				X = XYZ.X,
				Y = XYZ.Y,
				Z = XYZ.Z,
				r = X * M.R[0] + Y * M.R[1] + Z * M.R[2],
				g = X * M.G[0] + Y * M.G[1] + Z * M.G[2],
				b = X * M.B[0] + Y * M.B[1] + Z * M.B[2],
				N = 1 / 2.4;

			M = 0.0031308;

			r = (r > M ? 1.055 * Math.pow(r, N) - 0.055 : 12.92 * r);
			g = (g > M ? 1.055 * Math.pow(g, N) - 0.055 : 12.92 * g);
			b = (b > M ? 1.055 * Math.pow(b, N) - 0.055 : 12.92 * b);

			if (!skip) { // out of gammut
				_colors._rgb = {r: r, g: g, b: b};
			}

			return {
				r: limitValue(r, 0, 1),
				g: limitValue(g, 0, 1),
				b: limitValue(b, 0, 1)
			};
		},

		rgb2XYZ: function(rgb) {
			var M = _instance.options.XYZMatrix,
				r = rgb.r,
				g = rgb.g,
				b = rgb.b,
				N = 0.04045;

			r = (r > N ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92);
			g = (g > N ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92);
			b = (b > N ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92);

			return {
				X: r * M.X[0] + g * M.X[1] + b * M.X[2],
				Y: r * M.Y[0] + g * M.Y[1] + b * M.Y[2],
				Z: r * M.Z[0] + g * M.Z[1] + b * M.Z[2]
			};
		},

		XYZ2Lab: function(XYZ) {
			var R = _instance.options.XYZReference,
				X = XYZ.X / R.X,
				Y = XYZ.Y / R.Y,
				Z = XYZ.Z / R.Z,
				N = 16 / 116, M = 1 / 3, K = 0.008856, L = 7.787037;

			X = X > K ? Math.pow(X, M) : (L * X) + N;
			Y = Y > K ? Math.pow(Y, M) : (L * Y) + N;
			Z = Z > K ? Math.pow(Z, M) : (L * Z) + N;

			return {
				L: (116 * Y) - 16,
				a: 500 * (X - Y),
				b: 200 * (Y - Z)
			};
		},

		Lab2XYZ: function(Lab) {
			var R = _instance.options.XYZReference,
				Y = (Lab.L + 16) / 116,
				X = Lab.a / 500 + Y,
				Z = Y - Lab.b / 200,
				X3 = Math.pow(X, 3),
				Y3 = Math.pow(Y, 3),
				Z3 = Math.pow(Z, 3),
				N = 16 / 116, K = 0.008856, L = 7.787037;

			return {
				X: (X3 > K ? X3 : (X - N) / L) * R.X,
				Y: (Y3 > K ? Y3 : (Y - N) / L) * R.Y,
				Z: (Z3 > K ? Z3 : (Z - N) / L) * R.Z
			};
		},

		rgb2Lab: function(rgb, dependent) {
			var XYZ = ColorConverter.rgb2XYZ(rgb);

			return ColorConverter.XYZ2Lab(dependent ? XYZ : (_colors.XYZ = XYZ));
		},

		Lab2rgb: function(Lab, dependent) {
			var XYZ = ColorConverter.Lab2XYZ(Lab);

			return ColorConverter.XYZ2rgb(dependent ? XYZ : (_colors.XYZ = XYZ), dependent);
		}
	};

	// ------------------------------------------------------ //
	// ------------------ helper functions ------------------ //
	// -------------------------------------------------------//

	function getClosestWebColor(RGB, val) {
		var out = {},
			tmp = 0,
			half = val / 2;

		for (var n in RGB) {
			tmp = RGB[n] % val; // 51 = 'web save', 17 = 'web smart'
			out[n] = RGB[n] + (tmp > half ? val - tmp : -tmp);
		}
		return out;
	}

	function getHueDelta(rgb1, rgb2, nominal) {
		return (Math.max(rgb1.r - rgb2.r, rgb2.r - rgb1.r) +
				Math.max(rgb1.g - rgb2.g, rgb2.g - rgb1.g) +
				Math.max(rgb1.b - rgb2.b, rgb2.b - rgb1.b)) * (nominal ? 255 : 1) / 765;
	}

	function getLuminance(rgb, normalized) {
		var div = normalized ? 1 : 255,
			RGB = [rgb.r / div, rgb.g / div, rgb.b / div],
			luminance = _instance.options.luminance;

		for (var i = RGB.length; i--; ) {
			RGB[i] = RGB[i] <= 0.03928 ? RGB[i] / 12.92 : Math.pow(((RGB[i] + 0.055) / 1.055), 2.4);
		}
		return ((luminance.r * RGB[0]) + (luminance.g * RGB[1]) + (luminance.b * RGB[2]));
	}

	function mixColors(topColor, bottomColor, topAlpha, bottomAlpha) {
		var newColor = {},
			alphaTop = (topAlpha !== undefined ? topAlpha : 1),
			alphaBottom = (bottomAlpha !== undefined ? bottomAlpha : 1),
			alpha = alphaTop + alphaBottom * (1 - alphaTop); // 1 - (1 - alphaTop) * (1 - alphaBottom);

		for(var n in topColor) {
			newColor[n] = (topColor[n] * alphaTop + bottomColor[n] * alphaBottom * (1 - alphaTop)) / alpha;
		}
		newColor.a = alpha;
		return newColor;
	}

	function getWCAG2Ratio(lum1, lum2) {
		var ratio = 1;

		if (lum1 >= lum2) {
			ratio = (lum1 + 0.05) / (lum2 + 0.05);
		} else {
			ratio = (lum2 + 0.05) / (lum1 + 0.05);
		}
		return Math.round(ratio * 100) / 100;
	}

	function limitValue(value, min, max) {
		// return Math.max(min, Math.min(max, value)); // faster??
		return (value > max ? max : value < min ? min : value);
	}
})(window);