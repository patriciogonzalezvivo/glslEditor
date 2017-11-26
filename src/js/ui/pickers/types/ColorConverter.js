var valueRanges = {
    rgb: { r: [0, 255], g: [0, 255], b: [0, 255] },
    hsv: { h: [0, 1], s: [0, 1], v: [0, 255] },
    hsl: { h: [0, 360], s: [0, 100], l: [0, 100] },
    cmy: { c: [0, 100], m: [0, 100], y: [0, 100] },
    cmyk: { c: [0, 100], m: [0, 100], y: [0, 100], k: [0, 100] },
    Lab: { L: [0, 100], a: [-128, 127], b: [-128, 127] },
    XYZ: { X: [0, 100], Y: [0, 100], Z: [0, 100] },
    vec: { v: [0, 1], e: [0, 1], c: [0, 1] },
    alpha: { alpha: [0, 1] },
    HEX: { HEX: [0, 16777215] } // maybe we don't need this
};

// http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html for more
var XYZMatrix = { // Observer = 2° (CIE 1931), Illuminant = D65
    X: [0.4124564, 0.3575761, 0.1804375],
    Y: [0.2126729, 0.7151522, 0.0721750],
    Z: [0.0193339, 0.1191920, 0.9503041],
    R: [3.2404542, -1.5371385, -0.4985314],
    G: [-0.9692660, 1.8760108, 0.0415560],
    B: [0.0556434, -0.2040259, 1.0572252]
};

var XYZReference = {
    X: XYZMatrix.X[0] + XYZMatrix.X[1] + XYZMatrix.X[2],
    Y: XYZMatrix.Y[0] + XYZMatrix.Y[1] + XYZMatrix.Y[2],
    Z: XYZMatrix.Z[0] + XYZMatrix.Z[1] + XYZMatrix.Z[2]
};

var luminance = { r: 0.2126, g: 0.7152, b: 0.0722 }; // W3C 2.0

var _colors;

export default class ColorConverter {
    // ------------------------ VEC ------------------------ //
    static vec2rgb (vec) {
        return {
            r: vec.v * valueRanges['rgb']['r'][1],
            g: vec.e * valueRanges['rgb']['g'][1],
            b: vec.c * valueRanges['rgb']['b'][1]
        };
    }

    static rgb2vec (rgb) {
        return {
            v: rgb.r / valueRanges['rgb']['r'][1],
            e: rgb.g / valueRanges['rgb']['g'][1],
            c: rgb.b / valueRanges['rgb']['b'][1]
        };
    }

    // ------------------------ HEX ------------------------ //

    static RGB2HEX (rgb) {
        return (
            (rgb.r < 16 ? '0' : '') + rgb.r.toString(16) +
            (rgb.g < 16 ? '0' : '') + rgb.g.toString(16) +
            (rgb.b < 16 ? '0' : '') + rgb.b.toString(16)
        ).toUpperCase();
    }

    static HEX2rgb (HEX) {
        HEX = HEX.split(''); // IE7
        return {
            r: parseInt(HEX[0] + HEX[HEX[3] ? 1 : 0], 16) / 255,
            g: parseInt(HEX[HEX[3] ? 2 : 1] + (HEX[3] || HEX[1]), 16) / 255,
            b: parseInt((HEX[4] || HEX[2]) + (HEX[5] || HEX[2]), 16) / 255
        };
    }

    // ------------------------ HUE ------------------------ //

    static hue2RGB (hue) {
        var h = hue * 6,
            // mod = ~~h % 6, // Math.floor(h) -> faster in most browsers
            mod = Math.floor(h),
            i = h === 6 ? 0 : (h - mod);
        return {
            r: Math.round([1, 1 - i, 0, 0, i, 1][mod] * 255),
            g: Math.round([i, 1, 1, 1 - i, 0, 0][mod] * 255),
            b: Math.round([0, 0, i, 1, 1, 1 - i][mod] * 255)
        };
    }

    // ------------------------ HSV ------------------------ //

    static rgb2hsv (rgb) { // faster
        var r = rgb.r,
            g = rgb.g,
            b = rgb.b,
            k = 0,
            chroma,
            min,
            s;

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
    }

    static hsv2rgb (hsv) {
        var h = hsv.h * 6,
            s = hsv.s,
            v = hsv.v,
            // i = ~~h, // Math.floor(h) -> faster in most browsers
            i = Math.floor(h),
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
    }

    // ------------------------ HSL ------------------------ //

    static hsv2hsl (hsv) {
        var l = (2 - hsv.s) * hsv.v,
            s = hsv.s * hsv.v;

        s = !hsv.s ? 0 : l < 1 ? (l ? s / l : 0) : s / (2 - l);

        return {
            h: hsv.h,
            s: !hsv.v && !s ? ((_colors && _colors.hsl && _colors.hsl.s) || 0) : s, // ???
            l: l / 2
        };
    }

    static rgb2hsl (rgb, dependent) { // not used in Color
        var hsv = ColorConverter.rgb2hsv(rgb);

        return ColorConverter.hsv2hsl(dependent ? hsv : (_colors.hsv = hsv));
    }

    static hsl2rgb (hsl) {
        var h = hsl.h * 6,
            s = hsl.s,
            l = hsl.l,
            v = l < 0.5 ? l * (1 + s) : (l + s) - (s * l),
            m = l + l - v,
            sv = v ? ((v - m) / v) : 0,
            // sextant = ~~h, // Math.floor(h) -> faster in most browsers
            sextant = Math.floor(h),
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
    }

    // ------------------------ CMYK ------------------------ //
    // Quote from Wikipedia:
    // 'Since RGB and CMYK spaces are both device-dependent spaces, there is no
    // simple or general conversion formula that converts between them.
    // Conversions are generally done through color management systems, using
    // color profiles that describe the spaces being converted. Nevertheless, the
    // conversions cannot be exact, since these spaces have very different gamuts.'
    // Translation: the following are just simple RGB to CMY(K) and visa versa conversion functions.

    static rgb2cmy (rgb) {
        return {
            c: 1 - rgb.r,
            m: 1 - rgb.g,
            y: 1 - rgb.b
        };
    }

    static cmy2cmyk (cmy) {
        var k = Math.min(Math.min(cmy.c, cmy.m), cmy.y),
            t = 1 - k || 1e-20;

        return { // regular
            c: (cmy.c - k) / t,
            m: (cmy.m - k) / t,
            y: (cmy.y - k) / t,
            k: k
        };
    }

    static cmyk2cmy (cmyk) {
        var k = cmyk.k;

        return { // regular
            c: cmyk.c * (1 - k) + k,
            m: cmyk.m * (1 - k) + k,
            y: cmyk.y * (1 - k) + k
        };
    }

    static cmy2rgb (cmy) {
        return {
            r: 1 - cmy.c,
            g: 1 - cmy.m,
            b: 1 - cmy.y
        };
    }

    static rgb2cmyk (rgb) {
        var cmy = ColorConverter.rgb2cmy(rgb); // doppelt??
        return ColorConverter.cmy2cmyk(cmy);
    }

    static cmyk2rgb (cmyk) {
        var cmy = ColorConverter.cmyk2cmy(cmyk); // doppelt??
        return ColorConverter.cmy2rgb(cmy);
    }

    // ------------------------ LAB ------------------------ //

    static XYZ2rgb (XYZ) {
        var M = XYZMatrix,
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

        return {
            r: limitValue(r, 0, 1),
            g: limitValue(g, 0, 1),
            b: limitValue(b, 0, 1)
        };
    }

    static rgb2XYZ (rgb) {
        var M = XYZMatrix,
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
    }

    static XYZ2Lab (XYZ) {
        var R = XYZReference,
            X = XYZ.X / R.X,
            Y = XYZ.Y / R.Y,
            Z = XYZ.Z / R.Z,
            N = 16 / 116,
            M = 1 / 3,
            K = 0.008856,
            L = 7.787037;

        X = X > K ? Math.pow(X, M) : (L * X) + N;
        Y = Y > K ? Math.pow(Y, M) : (L * Y) + N;
        Z = Z > K ? Math.pow(Z, M) : (L * Z) + N;

        return {
            L: (116 * Y) - 16,
            a: 500 * (X - Y),
            b: 200 * (Y - Z)
        };
    }

    static Lab2XYZ (Lab) {
        var R = XYZReference,
            Y = (Lab.L + 16) / 116,
            X = Lab.a / 500 + Y,
            Z = Y - Lab.b / 200,
            X3 = Math.pow(X, 3),
            Y3 = Math.pow(Y, 3),
            Z3 = Math.pow(Z, 3),
            N = 16 / 116,
            K = 0.008856,
            L = 7.787037;

        return {
            X: (X3 > K ? X3 : (X - N) / L) * R.X,
            Y: (Y3 > K ? Y3 : (Y - N) / L) * R.Y,
            Z: (Z3 > K ? Z3 : (Z - N) / L) * R.Z
        };
    }

    static rgb2Lab (rgb) {
        var XYZ = ColorConverter.rgb2XYZ(rgb);

        return ColorConverter.XYZ2Lab(XYZ);
    }

    static Lab2rgb (Lab) {
        var XYZ = ColorConverter.Lab2XYZ(Lab);

        return ColorConverter.XYZ2rgb(XYZ);
    }
}

export function limitValue(value, min, max) {
    // return Math.max(min, Math.min(max, value)); // faster??
    return (value > max ? max : value < min ? min : value);
}

export function getLuminance(rgb, normalized) {
    var div = normalized ? 1 : 255,
        RGB = [rgb.r / div, rgb.g / div, rgb.b / div];

    for (var i = RGB.length; i--;) {
        RGB[i] = RGB[i] <= 0.03928 ? RGB[i] / 12.92 : Math.pow(((RGB[i] + 0.055) / 1.055), 2.4);
    }
    return ((luminance.r * RGB[0]) + (luminance.g * RGB[1]) + (luminance.b * RGB[2]));
}

export function getColorAsRGB (color) {
    // Create a test element to apply a CSS color and retrieve
    // a normalized value from.
    let test = document.createElement('div');
    test.style.backgroundColor = color;

    // Chrome requires the element to be in DOM for styles to be computed.
    document.body.appendChild(test);

    // Get the computed style from the browser, in the format of
    // rgb(x, x, x)
    let normalized = window.getComputedStyle(test).backgroundColor;

    // In certain cases getComputedStyle() may return
    // 'transparent' as a value, which is useless(?) for the current
    // color picker. According to specifications, transparent
    // is a black with 0 alpha - rgba(0, 0, 0, 0) - but because
    // the picker does not currently handle alpha, we return the
    // black value.
    if (normalized === 'transparent') {
        normalized = 'rgb(0, 0, 0)';
    }

    // Garbage collection
    test.parentNode.removeChild(test);

    return normalized;
}

export function getValueRanges(type) {
    if (!type) {
        return valueRanges;
    }
    else {
        return valueRanges[type];
    }
}
