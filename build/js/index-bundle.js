(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
 * accounting.js v0.4.1
 * Copyright 2014 Open Exchange Rates
 *
 * Freely distributable under the MIT license.
 * Portions of accounting.js are inspired or borrowed from underscore.js
 *
 * Full details and documentation:
 * http://openexchangerates.github.io/accounting.js/
 */

(function(root, undefined) {

	/* --- Setup --- */

	// Create the local library object, to be exported or referenced globally later
	var lib = {};

	// Current version
	lib.version = '0.4.1';


	/* --- Exposed settings --- */

	// The library's settings configuration object. Contains default parameters for
	// currency and number formatting
	lib.settings = {
		currency: {
			symbol : "$",		// default currency symbol is '$'
			format : "%s%v",	// controls output: %s = symbol, %v = value (can be object, see docs)
			decimal : ".",		// decimal point separator
			thousand : ",",		// thousands separator
			precision : 2,		// decimal places
			grouping : 3		// digit grouping (not implemented yet)
		},
		number: {
			precision : 0,		// default precision on numbers is 0
			grouping : 3,		// digit grouping (not implemented yet)
			thousand : ",",
			decimal : "."
		}
	};


	/* --- Internal Helper Methods --- */

	// Store reference to possibly-available ECMAScript 5 methods for later
	var nativeMap = Array.prototype.map,
		nativeIsArray = Array.isArray,
		toString = Object.prototype.toString;

	/**
	 * Tests whether supplied parameter is a string
	 * from underscore.js
	 */
	function isString(obj) {
		return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
	}

	/**
	 * Tests whether supplied parameter is a string
	 * from underscore.js, delegates to ECMA5's native Array.isArray
	 */
	function isArray(obj) {
		return nativeIsArray ? nativeIsArray(obj) : toString.call(obj) === '[object Array]';
	}

	/**
	 * Tests whether supplied parameter is a true object
	 */
	function isObject(obj) {
		return obj && toString.call(obj) === '[object Object]';
	}

	/**
	 * Extends an object with a defaults object, similar to underscore's _.defaults
	 *
	 * Used for abstracting parameter handling from API methods
	 */
	function defaults(object, defs) {
		var key;
		object = object || {};
		defs = defs || {};
		// Iterate over object non-prototype properties:
		for (key in defs) {
			if (defs.hasOwnProperty(key)) {
				// Replace values with defaults only if undefined (allow empty/zero values):
				if (object[key] == null) object[key] = defs[key];
			}
		}
		return object;
	}

	/**
	 * Implementation of `Array.map()` for iteration loops
	 *
	 * Returns a new Array as a result of calling `iterator` on each array value.
	 * Defers to native Array.map if available
	 */
	function map(obj, iterator, context) {
		var results = [], i, j;

		if (!obj) return results;

		// Use native .map method if it exists:
		if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);

		// Fallback for native .map:
		for (i = 0, j = obj.length; i < j; i++ ) {
			results[i] = iterator.call(context, obj[i], i, obj);
		}
		return results;
	}

	/**
	 * Check and normalise the value of precision (must be positive integer)
	 */
	function checkPrecision(val, base) {
		val = Math.round(Math.abs(val));
		return isNaN(val)? base : val;
	}


	/**
	 * Parses a format string or object and returns format obj for use in rendering
	 *
	 * `format` is either a string with the default (positive) format, or object
	 * containing `pos` (required), `neg` and `zero` values (or a function returning
	 * either a string or object)
	 *
	 * Either string or format.pos must contain "%v" (value) to be valid
	 */
	function checkCurrencyFormat(format) {
		var defaults = lib.settings.currency.format;

		// Allow function as format parameter (should return string or object):
		if ( typeof format === "function" ) format = format();

		// Format can be a string, in which case `value` ("%v") must be present:
		if ( isString( format ) && format.match("%v") ) {

			// Create and return positive, negative and zero formats:
			return {
				pos : format,
				neg : format.replace("-", "").replace("%v", "-%v"),
				zero : format
			};

		// If no format, or object is missing valid positive value, use defaults:
		} else if ( !format || !format.pos || !format.pos.match("%v") ) {

			// If defaults is a string, casts it to an object for faster checking next time:
			return ( !isString( defaults ) ) ? defaults : lib.settings.currency.format = {
				pos : defaults,
				neg : defaults.replace("%v", "-%v"),
				zero : defaults
			};

		}
		// Otherwise, assume format was fine:
		return format;
	}


	/* --- API Methods --- */

	/**
	 * Takes a string/array of strings, removes all formatting/cruft and returns the raw float value
	 * Alias: `accounting.parse(string)`
	 *
	 * Decimal must be included in the regular expression to match floats (defaults to
	 * accounting.settings.number.decimal), so if the number uses a non-standard decimal 
	 * separator, provide it as the second argument.
	 *
	 * Also matches bracketed negatives (eg. "$ (1.99)" => -1.99)
	 *
	 * Doesn't throw any errors (`NaN`s become 0) but this may change in future
	 */
	var unformat = lib.unformat = lib.parse = function(value, decimal) {
		// Recursively unformat arrays:
		if (isArray(value)) {
			return map(value, function(val) {
				return unformat(val, decimal);
			});
		}

		// Fails silently (need decent errors):
		value = value || 0;

		// Return the value as-is if it's already a number:
		if (typeof value === "number") return value;

		// Default decimal point comes from settings, but could be set to eg. "," in opts:
		decimal = decimal || lib.settings.number.decimal;

		 // Build regex to strip out everything except digits, decimal point and minus sign:
		var regex = new RegExp("[^0-9-" + decimal + "]", ["g"]),
			unformatted = parseFloat(
				("" + value)
				.replace(/\((.*)\)/, "-$1") // replace bracketed values with negatives
				.replace(regex, '')         // strip out any cruft
				.replace(decimal, '.')      // make sure decimal point is standard
			);

		// This will fail silently which may cause trouble, let's wait and see:
		return !isNaN(unformatted) ? unformatted : 0;
	};


	/**
	 * Implementation of toFixed() that treats floats more like decimals
	 *
	 * Fixes binary rounding issues (eg. (0.615).toFixed(2) === "0.61") that present
	 * problems for accounting- and finance-related software.
	 */
	var toFixed = lib.toFixed = function(value, precision) {
		precision = checkPrecision(precision, lib.settings.number.precision);
		var power = Math.pow(10, precision);

		// Multiply up by precision, round accurately, then divide and use native toFixed():
		return (Math.round(lib.unformat(value) * power) / power).toFixed(precision);
	};


	/**
	 * Format a number, with comma-separated thousands and custom precision/decimal places
	 * Alias: `accounting.format()`
	 *
	 * Localise by overriding the precision and thousand / decimal separators
	 * 2nd parameter `precision` can be an object matching `settings.number`
	 */
	var formatNumber = lib.formatNumber = lib.format = function(number, precision, thousand, decimal) {
		// Resursively format arrays:
		if (isArray(number)) {
			return map(number, function(val) {
				return formatNumber(val, precision, thousand, decimal);
			});
		}

		// Clean up number:
		number = unformat(number);

		// Build options object from second param (if object) or all params, extending defaults:
		var opts = defaults(
				(isObject(precision) ? precision : {
					precision : precision,
					thousand : thousand,
					decimal : decimal
				}),
				lib.settings.number
			),

			// Clean up precision
			usePrecision = checkPrecision(opts.precision),

			// Do some calc:
			negative = number < 0 ? "-" : "",
			base = parseInt(toFixed(Math.abs(number || 0), usePrecision), 10) + "",
			mod = base.length > 3 ? base.length % 3 : 0;

		// Format the number:
		return negative + (mod ? base.substr(0, mod) + opts.thousand : "") + base.substr(mod).replace(/(\d{3})(?=\d)/g, "$1" + opts.thousand) + (usePrecision ? opts.decimal + toFixed(Math.abs(number), usePrecision).split('.')[1] : "");
	};


	/**
	 * Format a number into currency
	 *
	 * Usage: accounting.formatMoney(number, symbol, precision, thousandsSep, decimalSep, format)
	 * defaults: (0, "$", 2, ",", ".", "%s%v")
	 *
	 * Localise by overriding the symbol, precision, thousand / decimal separators and format
	 * Second param can be an object matching `settings.currency` which is the easiest way.
	 *
	 * To do: tidy up the parameters
	 */
	var formatMoney = lib.formatMoney = function(number, symbol, precision, thousand, decimal, format) {
		// Resursively format arrays:
		if (isArray(number)) {
			return map(number, function(val){
				return formatMoney(val, symbol, precision, thousand, decimal, format);
			});
		}

		// Clean up number:
		number = unformat(number);

		// Build options object from second param (if object) or all params, extending defaults:
		var opts = defaults(
				(isObject(symbol) ? symbol : {
					symbol : symbol,
					precision : precision,
					thousand : thousand,
					decimal : decimal,
					format : format
				}),
				lib.settings.currency
			),

			// Check format (returns object with pos, neg and zero):
			formats = checkCurrencyFormat(opts.format),

			// Choose which format to use for this value:
			useFormat = number > 0 ? formats.pos : number < 0 ? formats.neg : formats.zero;

		// Return with currency symbol added:
		return useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(number), checkPrecision(opts.precision), opts.thousand, opts.decimal));
	};


	/**
	 * Format a list of numbers into an accounting column, padding with whitespace
	 * to line up currency symbols, thousand separators and decimals places
	 *
	 * List should be an array of numbers
	 * Second parameter can be an object containing keys that match the params
	 *
	 * Returns array of accouting-formatted number strings of same length
	 *
	 * NB: `white-space:pre` CSS rule is required on the list container to prevent
	 * browsers from collapsing the whitespace in the output strings.
	 */
	lib.formatColumn = function(list, symbol, precision, thousand, decimal, format) {
		if (!list) return [];

		// Build options object from second param (if object) or all params, extending defaults:
		var opts = defaults(
				(isObject(symbol) ? symbol : {
					symbol : symbol,
					precision : precision,
					thousand : thousand,
					decimal : decimal,
					format : format
				}),
				lib.settings.currency
			),

			// Check format (returns object with pos, neg and zero), only need pos for now:
			formats = checkCurrencyFormat(opts.format),

			// Whether to pad at start of string or after currency symbol:
			padAfterSymbol = formats.pos.indexOf("%s") < formats.pos.indexOf("%v") ? true : false,

			// Store value for the length of the longest string in the column:
			maxLength = 0,

			// Format the list according to options, store the length of the longest string:
			formatted = map(list, function(val, i) {
				if (isArray(val)) {
					// Recursively format columns if list is a multi-dimensional array:
					return lib.formatColumn(val, opts);
				} else {
					// Clean up the value
					val = unformat(val);

					// Choose which format to use for this value (pos, neg or zero):
					var useFormat = val > 0 ? formats.pos : val < 0 ? formats.neg : formats.zero,

						// Format this value, push into formatted list and save the length:
						fVal = useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(val), checkPrecision(opts.precision), opts.thousand, opts.decimal));

					if (fVal.length > maxLength) maxLength = fVal.length;
					return fVal;
				}
			});

		// Pad each number in the list and send back the column of numbers:
		return map(formatted, function(val, i) {
			// Only if this is a string (not a nested array, which would have already been padded):
			if (isString(val) && val.length < maxLength) {
				// Depending on symbol position, pad after symbol or at index 0:
				return padAfterSymbol ? val.replace(opts.symbol, opts.symbol+(new Array(maxLength - val.length + 1).join(" "))) : (new Array(maxLength - val.length + 1).join(" ")) + val;
			}
			return val;
		});
	};


	/* --- Module Definition --- */

	// Export accounting for CommonJS. If being loaded as an AMD module, define it as such.
	// Otherwise, just add `accounting` to the global object
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = lib;
		}
		exports.accounting = lib;
	} else if (typeof define === 'function' && define.amd) {
		// Return the library as an AMD module:
		define([], function() {
			return lib;
		});
	} else {
		// Use accounting.noConflict to restore `accounting` back to its original value.
		// Returns a reference to the library's `accounting` object;
		// e.g. `var numbers = accounting.noConflict();`
		lib.noConflict = (function(oldAccounting) {
			return function() {
				// Reset the value of the root's `accounting` variable:
				root.accounting = oldAccounting;
				// Delete the noConflict method:
				lib.noConflict = undefined;
				// Return reference to the library to re-assign it:
				return lib;
			};
		})(root.accounting);

		// Declare `fx` on the root (global/window) object:
		root['accounting'] = lib;
	}

	// Root will be `window` in browser or `global` on the server:
}(this));

},{}],2:[function(require,module,exports){
(function (global){
const jQuery = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
global.I18n = require('./lib/i18n-common.js');
global.AbiManager = require('./lib/contract/abimanager.js');
global._hopsettings = require('./lib/utils/settings.js');
const BrowserUtil = require('./lib/utils/browserutil.js');
let ua = window.navigator.userAgent;
global._bw = new BrowserUtil(ua);
global.DAppUtils = require('./lib/dapp-utils.js');

global.AccFormatter = require('accounting');

global.TxListGroup = require('./lib/ui/tx-listgroup.js');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./lib/contract/abimanager.js":3,"./lib/dapp-utils.js":4,"./lib/i18n-common.js":5,"./lib/ui/tx-listgroup.js":6,"./lib/utils/browserutil.js":7,"./lib/utils/settings.js":8,"accounting":1}],3:[function(require,module,exports){
const CONTRACT_CTX = {
  "master":{
    main_address:"0x55c75f509fC620cA1c33E313dBBD5f73aB86ba5B",
    abi:[{"constant":false,"inputs":[{"internalType":"uint256","name":"price","type":"uint256"}],"name":"changeServicePrice","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"addr","type":"bytes32"}],"name":"check","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"TokenNoForOneUser","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"addr","type":"bytes32"}],"name":"unbind","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"addr","type":"bytes32"}],"name":"bind","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"EtherCounter","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"PangolinUserRecord","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"userAddr","type":"address"}],"name":"bindingInfo","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"TokenDecimal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token","outputs":[{"internalType":"contract ERC20","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenAddr","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"}]    
  }
}

module.exports = {
  getMaster:()=>{
    return CONTRACT_CTX.master || {};
  },
  getContract:name =>{
    return CONTRACT_CTX[name] || {};
  }
};
},{}],4:[function(require,module,exports){
function GetNetwork(versionId){
  if(typeof versionId ==='undefined')return '';
  switch(versionId){
    case "1":
      return "mainnet";
    case "3":
      return "ropsten";
    case "4":
      return "rinkeby";
    case "42":
      return "kovan";
    case "5":
      return "goerli";
    default:
      return versionId;
  }
}

function ValidRootAddress(addr) {
  return addr == "0x0000000000000000000000000000000000000000";
}

function ValidPirateAddres(id){
  return /^[a-zA-Z0-9]{45}$/.test(id.trim());
}

module.exports = {
  getNetwork:GetNetwork,
  validBinded:ValidRootAddress,
  validHop:ValidRootAddress
}
},{}],5:[function(require,module,exports){

'use strict';

const V = "0.1.0";
const CDEF = {
	i18nSelector:".i18n",
	imgSrc:"src",
	aHref:"url",
	langSelector:"span.sel-lg",
	langActiveClazz:"lang-active"
};

class I18n {

	constructor (options) {
		let _ctx = Object.assign({},CDEF);
	 	if(typeof options === 'object'){
	 		_ctx = Object.assign(_ctx,options);
		}else if(typeof options ==='string'){
			_ctx.deflang = options;
		}

		if(!_ctx.deflang || (_ctx.deflang !='cn' && _ctx.deflang != 'en')){
			_ctx.deflang = "en";
		}

		this.ctx = _ctx;
	}

	indexInit(){
		
		let _ctx = this.ctx;
		let that = this;

		$(_ctx.langSelector).on('click',function(event){
			let curLg = $(this).data('lg');
			let activeClz = _ctx.langActiveClazz || CDEF.langActiveClazz;
			if(!$(this).hasClass(activeClz)){
				$(_ctx.i18nSelector).removeClass(activeClz);
				$(this).addClass(activeClz);
				that.setLang(curLg);
			}
		});

		this.setLang(_ctx.deflang);
	}

	setLang(lg){
		let that = this;
		$(that.ctx.i18nSelector).each((index,el) => {
			let text = $(el).data(''+lg);

			if(text){
				$(el).text(text);
			}
			let imgSrc = $(el).data(lg+that.ctx.imgSrc);
			if(imgSrc){
				$(el).attr('src',imgSrc);
			}

			let hrefUrl = $(el).data(lg+that.ctx.aHref);
			if(hrefUrl){
				$(el).attr('href',hrefUrl);
			}
		});
	}

};


module.exports = I18n;
},{}],6:[function(require,module,exports){
const D = {
  containerID:"table-container",
  defaultState:"pending",
  defaultLang:"en",
  etherscan:{
    en:"https://etherscan.io/",
    cn:"https://cn.etherscan.com/"
  }
}
/**
 * Tx: hash,created (number),from (address),state(pending,confirm)
 */
class TxListgroup {
  constructor(){
    this.lg = D.defaultLang;
    this.TxStore = [];
  }

  clearTxStore(){
    this.TxStore = [];
  }

  addTx(obj){
    let r = this.validTx(obj);
    if(r){
      this.TxStore.push(r);
      return true;
    }else{
      return false;
    }
  }

  appendTx($container,obj){
    let r = this.validTx(obj);
    if($container instanceof jQuery && r){
      this.TxStore.push(r);
      let html = this.buildItemHtml(r);

      $container.append(html);
    }
  }

  validTx(obj){
    if(!obj.hash || !obj.from)return false;

    if(!obj.state)obj.state=D.defaultState;
    if(!obj.created)obj.created = new Date().getTime();
    return obj;
  }

  setLang(lg){
    if(!lg || (lg!="cn" && lg !="en"))lg=D.defaultLang;
    this.lang = lg;
  }

  getEtherscan(lg) {
    if(!lg || (lg!="cn" && lg !="en"))lg=D.defaultLang;
    return D.etherscan[lg];
  }

  buildItemHtml(txItem) {
    let txHash = txItem.hash;
    let aHref = this.getEtherscan(this.lang) + "tx/" + txHash;
    let html = '';
    html += '<a class="list-group-item tx-item text-muted" ' 
      + ' data-tx="'+txHash+'"' +' data-created="'+txItem.created +'" '
      + ' href="'+aHref+'" target="etherscan" alt="View On Etherscan" >';


    let timeStr = formatTime(txItem.created,'{y}-{m}-{d} {h}:{i}:{s}');
    html += '<div class="d-flex w-100 justify-content-between" >'
      + '<h6 class="tx-h-item">Transaction Info</h6>'
      + '<small class="tx-created">'+timeStr+'</small></div>';

    // p tx hash
    html += '<p class="mb-1">Transation Hash: '+txHash+'</p>';

    //bottom state
    html += '<div class="d-flex w-100 justify-content-between">'
        +'      <div></div>'
        +'      <span class="tx-state">' + txItem.state + '</span>'
        +'</div>';

    html += '</a>'
    return html;
  }
}

function formatTime(time,cFormat){
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
  let date

  if (typeof time === 'object') {
    date = time
  } else {
    if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
      time = parseInt(time)
    }
    if ((typeof time === 'number') && (time.toString().length === 10)) {
      time = time * 1000
    }
    date = new Date(time)
  }

  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }

  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let val = formatObj[key]

    if (key === 'a') {
      return ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'][val]
    }

    if (result.length > 0 && val < 10) {
      val = '0' + val
    }

    return val || 0
  })

  return time_str
}

module.exports = TxListgroup;
},{}],7:[function(require,module,exports){
class BrowserUtil {
  constructor(uAgent){
    this.ua = uAgent;
    this.Info = {};
    this.initDetect();
  }
  initDetect(){
    let de = this.parseUaserAgent();
    if(de)this.Info = Object.assign({},this.Info,de);
  }
  supportMetaMask(){
    if(this.Info && this.Info.name){
      let bname = this.Info.name.toLowerCase();
      if(bname =='chrome' || bname =='firefox' || bname =='opera'){
        return true;
      }
    }
    return false;
  }
  detectOS(){
    if(!this.ua)return null;
    let _ua = this.ua;
    let rules = getOperatingSystemRules();
    let detected = rules.filter(function(os) {
      return os.rule && os.rule.test(_ua);
    })[0];

    this.Info.detectOS = detected ? detected.name : null;
    return this.Info.detectOS; 
  }
  parseUaserAgent(){
    let browsers = getBrowserRules();
    if(!this.ua)return null;
    let _ua = this.ua;
    let detected = browsers.map(browser => {
      var match = browser.rule.exec(_ua);
      var version = match && match[1].split(/[._]/).slice(0,3);

      if(version && version.length <3){
        version = version.concat(version.length == 1 ? [0,0]:[0]);
      }
      return match && {
        name:browser.name,
        version:version.join('.')
      };
    }).filter(Boolean)[0] || null;

    if(detected){
      detected.os = this.detectOS(_ua);
    }
    return detected;
  }

  getMetaMaskHref(options){
    if(typeof options !=='object' || !this.Info.name)return null;
    let key = this.Info.name.toLowerCase();
    return options[key]||null;
  }
}

/**
 * @DateTime 2019-10-19
 * @return   {[type]}   [description]
 */
function getBrowserRules(){
  return buildRules([
    [ 'edge', /Edge\/([0-9\._]+)/ ],
    [ 'yandexbrowser', /YaBrowser\/([0-9\._]+)/ ],
    [ 'vivaldi', /Vivaldi\/([0-9\.]+)/ ],
    [ 'kakaotalk', /KAKAOTALK\s([0-9\.]+)/ ],
    [ 'chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/ ],
    [ 'phantomjs', /PhantomJS\/([0-9\.]+)(:?\s|$)/ ],
    [ 'crios', /CriOS\/([0-9\.]+)(:?\s|$)/ ],
    [ 'firefox', /Firefox\/([0-9\.]+)(?:\s|$)/ ],
    [ 'fxios', /FxiOS\/([0-9\.]+)/ ],
    [ 'opera', /Opera\/([0-9\.]+)(?:\s|$)/ ],
    [ 'opera', /OPR\/([0-9\.]+)(:?\s|$)$/ ],
    [ 'ie', /Trident\/7\.0.*rv\:([0-9\.]+).*\).*Gecko$/ ],
    [ 'ie', /MSIE\s([0-9\.]+);.*Trident\/[4-7].0/ ],
    [ 'ie', /MSIE\s(7\.0)/ ],
    [ 'bb10', /BB10;\sTouch.*Version\/([0-9\.]+)/ ],
    [ 'android', /Android\s([0-9\.]+)/ ],
    [ 'ios', /Version\/([0-9\._]+).*Mobile.*Safari.*/ ],
    [ 'safari', /Version\/([0-9\._]+).*Safari/ ]
  ]);
}

/**
 * @DateTime 2019-10-19
 * @return   {[type]}   [description]
 */
function getOperatingSystemRules(){
  return buildRules([
    [ 'iOS', /iP(hone|od|ad)/ ],
    [ 'Android OS', /Android/ ],
    [ 'BlackBerry OS', /BlackBerry|BB10/ ],
    [ 'Windows Mobile', /IEMobile/ ],
    [ 'Amazon OS', /Kindle/ ],
    [ 'Windows 3.11', /Win16/ ],
    [ 'Windows 95', /(Windows 95)|(Win95)|(Windows_95)/ ],
    [ 'Windows 98', /(Windows 98)|(Win98)/ ],
    [ 'Windows 2000', /(Windows NT 5.0)|(Windows 2000)/ ],
    [ 'Windows XP', /(Windows NT 5.1)|(Windows XP)/ ],
    [ 'Windows Server 2003', /(Windows NT 5.2)/ ],
    [ 'Windows Vista', /(Windows NT 6.0)/ ],
    [ 'Windows 7', /(Windows NT 6.1)/ ],
    [ 'Windows 8', /(Windows NT 6.2)/ ],
    [ 'Windows 8.1', /(Windows NT 6.3)/ ],
    [ 'Windows 10', /(Windows NT 10.0)/ ],
    [ 'Windows ME', /Windows ME/ ],
    [ 'Open BSD', /OpenBSD/ ],
    [ 'Sun OS', /SunOS/ ],
    [ 'Linux', /(Linux)|(X11)/ ],
    [ 'Mac OS', /(Mac_PowerPC)|(Macintosh)/ ],
    [ 'QNX', /QNX/ ],
    [ 'BeOS', /BeOS/ ],
    [ 'OS/2', /OS\/2/ ],
    [ 'Search Bot', /(nuhk)|(Googlebot)|(Yammybot)|(Openbot)|(Slurp)|(MSNBot)|(Ask Jeeves\/Teoma)|(ia_archiver)/ ]
  ]);
}

function buildRules(ruleTuples){
  return ruleTuples.map(tuple =>{
    return {
      name:tuple[0],
      rule:tuple[1]
    }
  });
}

module.exports = BrowserUtil;
},{}],8:[function(require,module,exports){
module.exports = {
  metamask:{
    chrome:"https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
    firefox:"https://addons.mozilla.org/zh-CN/firefox/addon/ether-metamask/?src=search",
    opera:"https://addons.opera.com/zh-cn/extensions/details/metamask/"
  },
  precision:{
    "coin":4,
    "money":2
  },
  rootAddress:"0x0000000000000000000000000000000000000000"
}
},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYWNjb3VudGluZy9hY2NvdW50aW5nLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL2xpYi9jb250cmFjdC9hYmltYW5hZ2VyLmpzIiwic3JjL2xpYi9kYXBwLXV0aWxzLmpzIiwic3JjL2xpYi9pMThuLWNvbW1vbi5qcyIsInNyYy9saWIvdWkvdHgtbGlzdGdyb3VwLmpzIiwic3JjL2xpYi91dGlscy9icm93c2VydXRpbC5qcyIsInNyYy9saWIvdXRpbHMvc2V0dGluZ3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKiFcbiAqIGFjY291bnRpbmcuanMgdjAuNC4xXG4gKiBDb3B5cmlnaHQgMjAxNCBPcGVuIEV4Y2hhbmdlIFJhdGVzXG4gKlxuICogRnJlZWx5IGRpc3RyaWJ1dGFibGUgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICogUG9ydGlvbnMgb2YgYWNjb3VudGluZy5qcyBhcmUgaW5zcGlyZWQgb3IgYm9ycm93ZWQgZnJvbSB1bmRlcnNjb3JlLmpzXG4gKlxuICogRnVsbCBkZXRhaWxzIGFuZCBkb2N1bWVudGF0aW9uOlxuICogaHR0cDovL29wZW5leGNoYW5nZXJhdGVzLmdpdGh1Yi5pby9hY2NvdW50aW5nLmpzL1xuICovXG5cbihmdW5jdGlvbihyb290LCB1bmRlZmluZWQpIHtcblxuXHQvKiAtLS0gU2V0dXAgLS0tICovXG5cblx0Ly8gQ3JlYXRlIHRoZSBsb2NhbCBsaWJyYXJ5IG9iamVjdCwgdG8gYmUgZXhwb3J0ZWQgb3IgcmVmZXJlbmNlZCBnbG9iYWxseSBsYXRlclxuXHR2YXIgbGliID0ge307XG5cblx0Ly8gQ3VycmVudCB2ZXJzaW9uXG5cdGxpYi52ZXJzaW9uID0gJzAuNC4xJztcblxuXG5cdC8qIC0tLSBFeHBvc2VkIHNldHRpbmdzIC0tLSAqL1xuXG5cdC8vIFRoZSBsaWJyYXJ5J3Mgc2V0dGluZ3MgY29uZmlndXJhdGlvbiBvYmplY3QuIENvbnRhaW5zIGRlZmF1bHQgcGFyYW1ldGVycyBmb3Jcblx0Ly8gY3VycmVuY3kgYW5kIG51bWJlciBmb3JtYXR0aW5nXG5cdGxpYi5zZXR0aW5ncyA9IHtcblx0XHRjdXJyZW5jeToge1xuXHRcdFx0c3ltYm9sIDogXCIkXCIsXHRcdC8vIGRlZmF1bHQgY3VycmVuY3kgc3ltYm9sIGlzICckJ1xuXHRcdFx0Zm9ybWF0IDogXCIlcyV2XCIsXHQvLyBjb250cm9scyBvdXRwdXQ6ICVzID0gc3ltYm9sLCAldiA9IHZhbHVlIChjYW4gYmUgb2JqZWN0LCBzZWUgZG9jcylcblx0XHRcdGRlY2ltYWwgOiBcIi5cIixcdFx0Ly8gZGVjaW1hbCBwb2ludCBzZXBhcmF0b3Jcblx0XHRcdHRob3VzYW5kIDogXCIsXCIsXHRcdC8vIHRob3VzYW5kcyBzZXBhcmF0b3Jcblx0XHRcdHByZWNpc2lvbiA6IDIsXHRcdC8vIGRlY2ltYWwgcGxhY2VzXG5cdFx0XHRncm91cGluZyA6IDNcdFx0Ly8gZGlnaXQgZ3JvdXBpbmcgKG5vdCBpbXBsZW1lbnRlZCB5ZXQpXG5cdFx0fSxcblx0XHRudW1iZXI6IHtcblx0XHRcdHByZWNpc2lvbiA6IDAsXHRcdC8vIGRlZmF1bHQgcHJlY2lzaW9uIG9uIG51bWJlcnMgaXMgMFxuXHRcdFx0Z3JvdXBpbmcgOiAzLFx0XHQvLyBkaWdpdCBncm91cGluZyAobm90IGltcGxlbWVudGVkIHlldClcblx0XHRcdHRob3VzYW5kIDogXCIsXCIsXG5cdFx0XHRkZWNpbWFsIDogXCIuXCJcblx0XHR9XG5cdH07XG5cblxuXHQvKiAtLS0gSW50ZXJuYWwgSGVscGVyIE1ldGhvZHMgLS0tICovXG5cblx0Ly8gU3RvcmUgcmVmZXJlbmNlIHRvIHBvc3NpYmx5LWF2YWlsYWJsZSBFQ01BU2NyaXB0IDUgbWV0aG9kcyBmb3IgbGF0ZXJcblx0dmFyIG5hdGl2ZU1hcCA9IEFycmF5LnByb3RvdHlwZS5tYXAsXG5cdFx0bmF0aXZlSXNBcnJheSA9IEFycmF5LmlzQXJyYXksXG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5cdC8qKlxuXHQgKiBUZXN0cyB3aGV0aGVyIHN1cHBsaWVkIHBhcmFtZXRlciBpcyBhIHN0cmluZ1xuXHQgKiBmcm9tIHVuZGVyc2NvcmUuanNcblx0ICovXG5cdGZ1bmN0aW9uIGlzU3RyaW5nKG9iaikge1xuXHRcdHJldHVybiAhIShvYmogPT09ICcnIHx8IChvYmogJiYgb2JqLmNoYXJDb2RlQXQgJiYgb2JqLnN1YnN0cikpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRlc3RzIHdoZXRoZXIgc3VwcGxpZWQgcGFyYW1ldGVyIGlzIGEgc3RyaW5nXG5cdCAqIGZyb20gdW5kZXJzY29yZS5qcywgZGVsZWdhdGVzIHRvIEVDTUE1J3MgbmF0aXZlIEFycmF5LmlzQXJyYXlcblx0ICovXG5cdGZ1bmN0aW9uIGlzQXJyYXkob2JqKSB7XG5cdFx0cmV0dXJuIG5hdGl2ZUlzQXJyYXkgPyBuYXRpdmVJc0FycmF5KG9iaikgOiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG5cdH1cblxuXHQvKipcblx0ICogVGVzdHMgd2hldGhlciBzdXBwbGllZCBwYXJhbWV0ZXIgaXMgYSB0cnVlIG9iamVjdFxuXHQgKi9cblx0ZnVuY3Rpb24gaXNPYmplY3Qob2JqKSB7XG5cdFx0cmV0dXJuIG9iaiAmJiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xuXHR9XG5cblx0LyoqXG5cdCAqIEV4dGVuZHMgYW4gb2JqZWN0IHdpdGggYSBkZWZhdWx0cyBvYmplY3QsIHNpbWlsYXIgdG8gdW5kZXJzY29yZSdzIF8uZGVmYXVsdHNcblx0ICpcblx0ICogVXNlZCBmb3IgYWJzdHJhY3RpbmcgcGFyYW1ldGVyIGhhbmRsaW5nIGZyb20gQVBJIG1ldGhvZHNcblx0ICovXG5cdGZ1bmN0aW9uIGRlZmF1bHRzKG9iamVjdCwgZGVmcykge1xuXHRcdHZhciBrZXk7XG5cdFx0b2JqZWN0ID0gb2JqZWN0IHx8IHt9O1xuXHRcdGRlZnMgPSBkZWZzIHx8IHt9O1xuXHRcdC8vIEl0ZXJhdGUgb3ZlciBvYmplY3Qgbm9uLXByb3RvdHlwZSBwcm9wZXJ0aWVzOlxuXHRcdGZvciAoa2V5IGluIGRlZnMpIHtcblx0XHRcdGlmIChkZWZzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0Ly8gUmVwbGFjZSB2YWx1ZXMgd2l0aCBkZWZhdWx0cyBvbmx5IGlmIHVuZGVmaW5lZCAoYWxsb3cgZW1wdHkvemVybyB2YWx1ZXMpOlxuXHRcdFx0XHRpZiAob2JqZWN0W2tleV0gPT0gbnVsbCkgb2JqZWN0W2tleV0gPSBkZWZzW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblxuXHQvKipcblx0ICogSW1wbGVtZW50YXRpb24gb2YgYEFycmF5Lm1hcCgpYCBmb3IgaXRlcmF0aW9uIGxvb3BzXG5cdCAqXG5cdCAqIFJldHVybnMgYSBuZXcgQXJyYXkgYXMgYSByZXN1bHQgb2YgY2FsbGluZyBgaXRlcmF0b3JgIG9uIGVhY2ggYXJyYXkgdmFsdWUuXG5cdCAqIERlZmVycyB0byBuYXRpdmUgQXJyYXkubWFwIGlmIGF2YWlsYWJsZVxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcblx0XHR2YXIgcmVzdWx0cyA9IFtdLCBpLCBqO1xuXG5cdFx0aWYgKCFvYmopIHJldHVybiByZXN1bHRzO1xuXG5cdFx0Ly8gVXNlIG5hdGl2ZSAubWFwIG1ldGhvZCBpZiBpdCBleGlzdHM6XG5cdFx0aWYgKG5hdGl2ZU1hcCAmJiBvYmoubWFwID09PSBuYXRpdmVNYXApIHJldHVybiBvYmoubWFwKGl0ZXJhdG9yLCBjb250ZXh0KTtcblxuXHRcdC8vIEZhbGxiYWNrIGZvciBuYXRpdmUgLm1hcDpcblx0XHRmb3IgKGkgPSAwLCBqID0gb2JqLmxlbmd0aDsgaSA8IGo7IGkrKyApIHtcblx0XHRcdHJlc3VsdHNbaV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdHM7XG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2sgYW5kIG5vcm1hbGlzZSB0aGUgdmFsdWUgb2YgcHJlY2lzaW9uIChtdXN0IGJlIHBvc2l0aXZlIGludGVnZXIpXG5cdCAqL1xuXHRmdW5jdGlvbiBjaGVja1ByZWNpc2lvbih2YWwsIGJhc2UpIHtcblx0XHR2YWwgPSBNYXRoLnJvdW5kKE1hdGguYWJzKHZhbCkpO1xuXHRcdHJldHVybiBpc05hTih2YWwpPyBiYXNlIDogdmFsO1xuXHR9XG5cblxuXHQvKipcblx0ICogUGFyc2VzIGEgZm9ybWF0IHN0cmluZyBvciBvYmplY3QgYW5kIHJldHVybnMgZm9ybWF0IG9iaiBmb3IgdXNlIGluIHJlbmRlcmluZ1xuXHQgKlxuXHQgKiBgZm9ybWF0YCBpcyBlaXRoZXIgYSBzdHJpbmcgd2l0aCB0aGUgZGVmYXVsdCAocG9zaXRpdmUpIGZvcm1hdCwgb3Igb2JqZWN0XG5cdCAqIGNvbnRhaW5pbmcgYHBvc2AgKHJlcXVpcmVkKSwgYG5lZ2AgYW5kIGB6ZXJvYCB2YWx1ZXMgKG9yIGEgZnVuY3Rpb24gcmV0dXJuaW5nXG5cdCAqIGVpdGhlciBhIHN0cmluZyBvciBvYmplY3QpXG5cdCAqXG5cdCAqIEVpdGhlciBzdHJpbmcgb3IgZm9ybWF0LnBvcyBtdXN0IGNvbnRhaW4gXCIldlwiICh2YWx1ZSkgdG8gYmUgdmFsaWRcblx0ICovXG5cdGZ1bmN0aW9uIGNoZWNrQ3VycmVuY3lGb3JtYXQoZm9ybWF0KSB7XG5cdFx0dmFyIGRlZmF1bHRzID0gbGliLnNldHRpbmdzLmN1cnJlbmN5LmZvcm1hdDtcblxuXHRcdC8vIEFsbG93IGZ1bmN0aW9uIGFzIGZvcm1hdCBwYXJhbWV0ZXIgKHNob3VsZCByZXR1cm4gc3RyaW5nIG9yIG9iamVjdCk6XG5cdFx0aWYgKCB0eXBlb2YgZm9ybWF0ID09PSBcImZ1bmN0aW9uXCIgKSBmb3JtYXQgPSBmb3JtYXQoKTtcblxuXHRcdC8vIEZvcm1hdCBjYW4gYmUgYSBzdHJpbmcsIGluIHdoaWNoIGNhc2UgYHZhbHVlYCAoXCIldlwiKSBtdXN0IGJlIHByZXNlbnQ6XG5cdFx0aWYgKCBpc1N0cmluZyggZm9ybWF0ICkgJiYgZm9ybWF0Lm1hdGNoKFwiJXZcIikgKSB7XG5cblx0XHRcdC8vIENyZWF0ZSBhbmQgcmV0dXJuIHBvc2l0aXZlLCBuZWdhdGl2ZSBhbmQgemVybyBmb3JtYXRzOlxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cG9zIDogZm9ybWF0LFxuXHRcdFx0XHRuZWcgOiBmb3JtYXQucmVwbGFjZShcIi1cIiwgXCJcIikucmVwbGFjZShcIiV2XCIsIFwiLSV2XCIpLFxuXHRcdFx0XHR6ZXJvIDogZm9ybWF0XG5cdFx0XHR9O1xuXG5cdFx0Ly8gSWYgbm8gZm9ybWF0LCBvciBvYmplY3QgaXMgbWlzc2luZyB2YWxpZCBwb3NpdGl2ZSB2YWx1ZSwgdXNlIGRlZmF1bHRzOlxuXHRcdH0gZWxzZSBpZiAoICFmb3JtYXQgfHwgIWZvcm1hdC5wb3MgfHwgIWZvcm1hdC5wb3MubWF0Y2goXCIldlwiKSApIHtcblxuXHRcdFx0Ly8gSWYgZGVmYXVsdHMgaXMgYSBzdHJpbmcsIGNhc3RzIGl0IHRvIGFuIG9iamVjdCBmb3IgZmFzdGVyIGNoZWNraW5nIG5leHQgdGltZTpcblx0XHRcdHJldHVybiAoICFpc1N0cmluZyggZGVmYXVsdHMgKSApID8gZGVmYXVsdHMgOiBsaWIuc2V0dGluZ3MuY3VycmVuY3kuZm9ybWF0ID0ge1xuXHRcdFx0XHRwb3MgOiBkZWZhdWx0cyxcblx0XHRcdFx0bmVnIDogZGVmYXVsdHMucmVwbGFjZShcIiV2XCIsIFwiLSV2XCIpLFxuXHRcdFx0XHR6ZXJvIDogZGVmYXVsdHNcblx0XHRcdH07XG5cblx0XHR9XG5cdFx0Ly8gT3RoZXJ3aXNlLCBhc3N1bWUgZm9ybWF0IHdhcyBmaW5lOlxuXHRcdHJldHVybiBmb3JtYXQ7XG5cdH1cblxuXG5cdC8qIC0tLSBBUEkgTWV0aG9kcyAtLS0gKi9cblxuXHQvKipcblx0ICogVGFrZXMgYSBzdHJpbmcvYXJyYXkgb2Ygc3RyaW5ncywgcmVtb3ZlcyBhbGwgZm9ybWF0dGluZy9jcnVmdCBhbmQgcmV0dXJucyB0aGUgcmF3IGZsb2F0IHZhbHVlXG5cdCAqIEFsaWFzOiBgYWNjb3VudGluZy5wYXJzZShzdHJpbmcpYFxuXHQgKlxuXHQgKiBEZWNpbWFsIG11c3QgYmUgaW5jbHVkZWQgaW4gdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYXRjaCBmbG9hdHMgKGRlZmF1bHRzIHRvXG5cdCAqIGFjY291bnRpbmcuc2V0dGluZ3MubnVtYmVyLmRlY2ltYWwpLCBzbyBpZiB0aGUgbnVtYmVyIHVzZXMgYSBub24tc3RhbmRhcmQgZGVjaW1hbCBcblx0ICogc2VwYXJhdG9yLCBwcm92aWRlIGl0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cdCAqXG5cdCAqIEFsc28gbWF0Y2hlcyBicmFja2V0ZWQgbmVnYXRpdmVzIChlZy4gXCIkICgxLjk5KVwiID0+IC0xLjk5KVxuXHQgKlxuXHQgKiBEb2Vzbid0IHRocm93IGFueSBlcnJvcnMgKGBOYU5gcyBiZWNvbWUgMCkgYnV0IHRoaXMgbWF5IGNoYW5nZSBpbiBmdXR1cmVcblx0ICovXG5cdHZhciB1bmZvcm1hdCA9IGxpYi51bmZvcm1hdCA9IGxpYi5wYXJzZSA9IGZ1bmN0aW9uKHZhbHVlLCBkZWNpbWFsKSB7XG5cdFx0Ly8gUmVjdXJzaXZlbHkgdW5mb3JtYXQgYXJyYXlzOlxuXHRcdGlmIChpc0FycmF5KHZhbHVlKSkge1xuXHRcdFx0cmV0dXJuIG1hcCh2YWx1ZSwgZnVuY3Rpb24odmFsKSB7XG5cdFx0XHRcdHJldHVybiB1bmZvcm1hdCh2YWwsIGRlY2ltYWwpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gRmFpbHMgc2lsZW50bHkgKG5lZWQgZGVjZW50IGVycm9ycyk6XG5cdFx0dmFsdWUgPSB2YWx1ZSB8fCAwO1xuXG5cdFx0Ly8gUmV0dXJuIHRoZSB2YWx1ZSBhcy1pcyBpZiBpdCdzIGFscmVhZHkgYSBudW1iZXI6XG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHZhbHVlO1xuXG5cdFx0Ly8gRGVmYXVsdCBkZWNpbWFsIHBvaW50IGNvbWVzIGZyb20gc2V0dGluZ3MsIGJ1dCBjb3VsZCBiZSBzZXQgdG8gZWcuIFwiLFwiIGluIG9wdHM6XG5cdFx0ZGVjaW1hbCA9IGRlY2ltYWwgfHwgbGliLnNldHRpbmdzLm51bWJlci5kZWNpbWFsO1xuXG5cdFx0IC8vIEJ1aWxkIHJlZ2V4IHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGV4Y2VwdCBkaWdpdHMsIGRlY2ltYWwgcG9pbnQgYW5kIG1pbnVzIHNpZ246XG5cdFx0dmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChcIlteMC05LVwiICsgZGVjaW1hbCArIFwiXVwiLCBbXCJnXCJdKSxcblx0XHRcdHVuZm9ybWF0dGVkID0gcGFyc2VGbG9hdChcblx0XHRcdFx0KFwiXCIgKyB2YWx1ZSlcblx0XHRcdFx0LnJlcGxhY2UoL1xcKCguKilcXCkvLCBcIi0kMVwiKSAvLyByZXBsYWNlIGJyYWNrZXRlZCB2YWx1ZXMgd2l0aCBuZWdhdGl2ZXNcblx0XHRcdFx0LnJlcGxhY2UocmVnZXgsICcnKSAgICAgICAgIC8vIHN0cmlwIG91dCBhbnkgY3J1ZnRcblx0XHRcdFx0LnJlcGxhY2UoZGVjaW1hbCwgJy4nKSAgICAgIC8vIG1ha2Ugc3VyZSBkZWNpbWFsIHBvaW50IGlzIHN0YW5kYXJkXG5cdFx0XHQpO1xuXG5cdFx0Ly8gVGhpcyB3aWxsIGZhaWwgc2lsZW50bHkgd2hpY2ggbWF5IGNhdXNlIHRyb3VibGUsIGxldCdzIHdhaXQgYW5kIHNlZTpcblx0XHRyZXR1cm4gIWlzTmFOKHVuZm9ybWF0dGVkKSA/IHVuZm9ybWF0dGVkIDogMDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBJbXBsZW1lbnRhdGlvbiBvZiB0b0ZpeGVkKCkgdGhhdCB0cmVhdHMgZmxvYXRzIG1vcmUgbGlrZSBkZWNpbWFsc1xuXHQgKlxuXHQgKiBGaXhlcyBiaW5hcnkgcm91bmRpbmcgaXNzdWVzIChlZy4gKDAuNjE1KS50b0ZpeGVkKDIpID09PSBcIjAuNjFcIikgdGhhdCBwcmVzZW50XG5cdCAqIHByb2JsZW1zIGZvciBhY2NvdW50aW5nLSBhbmQgZmluYW5jZS1yZWxhdGVkIHNvZnR3YXJlLlxuXHQgKi9cblx0dmFyIHRvRml4ZWQgPSBsaWIudG9GaXhlZCA9IGZ1bmN0aW9uKHZhbHVlLCBwcmVjaXNpb24pIHtcblx0XHRwcmVjaXNpb24gPSBjaGVja1ByZWNpc2lvbihwcmVjaXNpb24sIGxpYi5zZXR0aW5ncy5udW1iZXIucHJlY2lzaW9uKTtcblx0XHR2YXIgcG93ZXIgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKTtcblxuXHRcdC8vIE11bHRpcGx5IHVwIGJ5IHByZWNpc2lvbiwgcm91bmQgYWNjdXJhdGVseSwgdGhlbiBkaXZpZGUgYW5kIHVzZSBuYXRpdmUgdG9GaXhlZCgpOlxuXHRcdHJldHVybiAoTWF0aC5yb3VuZChsaWIudW5mb3JtYXQodmFsdWUpICogcG93ZXIpIC8gcG93ZXIpLnRvRml4ZWQocHJlY2lzaW9uKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBGb3JtYXQgYSBudW1iZXIsIHdpdGggY29tbWEtc2VwYXJhdGVkIHRob3VzYW5kcyBhbmQgY3VzdG9tIHByZWNpc2lvbi9kZWNpbWFsIHBsYWNlc1xuXHQgKiBBbGlhczogYGFjY291bnRpbmcuZm9ybWF0KClgXG5cdCAqXG5cdCAqIExvY2FsaXNlIGJ5IG92ZXJyaWRpbmcgdGhlIHByZWNpc2lvbiBhbmQgdGhvdXNhbmQgLyBkZWNpbWFsIHNlcGFyYXRvcnNcblx0ICogMm5kIHBhcmFtZXRlciBgcHJlY2lzaW9uYCBjYW4gYmUgYW4gb2JqZWN0IG1hdGNoaW5nIGBzZXR0aW5ncy5udW1iZXJgXG5cdCAqL1xuXHR2YXIgZm9ybWF0TnVtYmVyID0gbGliLmZvcm1hdE51bWJlciA9IGxpYi5mb3JtYXQgPSBmdW5jdGlvbihudW1iZXIsIHByZWNpc2lvbiwgdGhvdXNhbmQsIGRlY2ltYWwpIHtcblx0XHQvLyBSZXN1cnNpdmVseSBmb3JtYXQgYXJyYXlzOlxuXHRcdGlmIChpc0FycmF5KG51bWJlcikpIHtcblx0XHRcdHJldHVybiBtYXAobnVtYmVyLCBmdW5jdGlvbih2YWwpIHtcblx0XHRcdFx0cmV0dXJuIGZvcm1hdE51bWJlcih2YWwsIHByZWNpc2lvbiwgdGhvdXNhbmQsIGRlY2ltYWwpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gQ2xlYW4gdXAgbnVtYmVyOlxuXHRcdG51bWJlciA9IHVuZm9ybWF0KG51bWJlcik7XG5cblx0XHQvLyBCdWlsZCBvcHRpb25zIG9iamVjdCBmcm9tIHNlY29uZCBwYXJhbSAoaWYgb2JqZWN0KSBvciBhbGwgcGFyYW1zLCBleHRlbmRpbmcgZGVmYXVsdHM6XG5cdFx0dmFyIG9wdHMgPSBkZWZhdWx0cyhcblx0XHRcdFx0KGlzT2JqZWN0KHByZWNpc2lvbikgPyBwcmVjaXNpb24gOiB7XG5cdFx0XHRcdFx0cHJlY2lzaW9uIDogcHJlY2lzaW9uLFxuXHRcdFx0XHRcdHRob3VzYW5kIDogdGhvdXNhbmQsXG5cdFx0XHRcdFx0ZGVjaW1hbCA6IGRlY2ltYWxcblx0XHRcdFx0fSksXG5cdFx0XHRcdGxpYi5zZXR0aW5ncy5udW1iZXJcblx0XHRcdCksXG5cblx0XHRcdC8vIENsZWFuIHVwIHByZWNpc2lvblxuXHRcdFx0dXNlUHJlY2lzaW9uID0gY2hlY2tQcmVjaXNpb24ob3B0cy5wcmVjaXNpb24pLFxuXG5cdFx0XHQvLyBEbyBzb21lIGNhbGM6XG5cdFx0XHRuZWdhdGl2ZSA9IG51bWJlciA8IDAgPyBcIi1cIiA6IFwiXCIsXG5cdFx0XHRiYXNlID0gcGFyc2VJbnQodG9GaXhlZChNYXRoLmFicyhudW1iZXIgfHwgMCksIHVzZVByZWNpc2lvbiksIDEwKSArIFwiXCIsXG5cdFx0XHRtb2QgPSBiYXNlLmxlbmd0aCA+IDMgPyBiYXNlLmxlbmd0aCAlIDMgOiAwO1xuXG5cdFx0Ly8gRm9ybWF0IHRoZSBudW1iZXI6XG5cdFx0cmV0dXJuIG5lZ2F0aXZlICsgKG1vZCA/IGJhc2Uuc3Vic3RyKDAsIG1vZCkgKyBvcHRzLnRob3VzYW5kIDogXCJcIikgKyBiYXNlLnN1YnN0cihtb2QpLnJlcGxhY2UoLyhcXGR7M30pKD89XFxkKS9nLCBcIiQxXCIgKyBvcHRzLnRob3VzYW5kKSArICh1c2VQcmVjaXNpb24gPyBvcHRzLmRlY2ltYWwgKyB0b0ZpeGVkKE1hdGguYWJzKG51bWJlciksIHVzZVByZWNpc2lvbikuc3BsaXQoJy4nKVsxXSA6IFwiXCIpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEZvcm1hdCBhIG51bWJlciBpbnRvIGN1cnJlbmN5XG5cdCAqXG5cdCAqIFVzYWdlOiBhY2NvdW50aW5nLmZvcm1hdE1vbmV5KG51bWJlciwgc3ltYm9sLCBwcmVjaXNpb24sIHRob3VzYW5kc1NlcCwgZGVjaW1hbFNlcCwgZm9ybWF0KVxuXHQgKiBkZWZhdWx0czogKDAsIFwiJFwiLCAyLCBcIixcIiwgXCIuXCIsIFwiJXMldlwiKVxuXHQgKlxuXHQgKiBMb2NhbGlzZSBieSBvdmVycmlkaW5nIHRoZSBzeW1ib2wsIHByZWNpc2lvbiwgdGhvdXNhbmQgLyBkZWNpbWFsIHNlcGFyYXRvcnMgYW5kIGZvcm1hdFxuXHQgKiBTZWNvbmQgcGFyYW0gY2FuIGJlIGFuIG9iamVjdCBtYXRjaGluZyBgc2V0dGluZ3MuY3VycmVuY3lgIHdoaWNoIGlzIHRoZSBlYXNpZXN0IHdheS5cblx0ICpcblx0ICogVG8gZG86IHRpZHkgdXAgdGhlIHBhcmFtZXRlcnNcblx0ICovXG5cdHZhciBmb3JtYXRNb25leSA9IGxpYi5mb3JtYXRNb25leSA9IGZ1bmN0aW9uKG51bWJlciwgc3ltYm9sLCBwcmVjaXNpb24sIHRob3VzYW5kLCBkZWNpbWFsLCBmb3JtYXQpIHtcblx0XHQvLyBSZXN1cnNpdmVseSBmb3JtYXQgYXJyYXlzOlxuXHRcdGlmIChpc0FycmF5KG51bWJlcikpIHtcblx0XHRcdHJldHVybiBtYXAobnVtYmVyLCBmdW5jdGlvbih2YWwpe1xuXHRcdFx0XHRyZXR1cm4gZm9ybWF0TW9uZXkodmFsLCBzeW1ib2wsIHByZWNpc2lvbiwgdGhvdXNhbmQsIGRlY2ltYWwsIGZvcm1hdCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBDbGVhbiB1cCBudW1iZXI6XG5cdFx0bnVtYmVyID0gdW5mb3JtYXQobnVtYmVyKTtcblxuXHRcdC8vIEJ1aWxkIG9wdGlvbnMgb2JqZWN0IGZyb20gc2Vjb25kIHBhcmFtIChpZiBvYmplY3QpIG9yIGFsbCBwYXJhbXMsIGV4dGVuZGluZyBkZWZhdWx0czpcblx0XHR2YXIgb3B0cyA9IGRlZmF1bHRzKFxuXHRcdFx0XHQoaXNPYmplY3Qoc3ltYm9sKSA/IHN5bWJvbCA6IHtcblx0XHRcdFx0XHRzeW1ib2wgOiBzeW1ib2wsXG5cdFx0XHRcdFx0cHJlY2lzaW9uIDogcHJlY2lzaW9uLFxuXHRcdFx0XHRcdHRob3VzYW5kIDogdGhvdXNhbmQsXG5cdFx0XHRcdFx0ZGVjaW1hbCA6IGRlY2ltYWwsXG5cdFx0XHRcdFx0Zm9ybWF0IDogZm9ybWF0XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRsaWIuc2V0dGluZ3MuY3VycmVuY3lcblx0XHRcdCksXG5cblx0XHRcdC8vIENoZWNrIGZvcm1hdCAocmV0dXJucyBvYmplY3Qgd2l0aCBwb3MsIG5lZyBhbmQgemVybyk6XG5cdFx0XHRmb3JtYXRzID0gY2hlY2tDdXJyZW5jeUZvcm1hdChvcHRzLmZvcm1hdCksXG5cblx0XHRcdC8vIENob29zZSB3aGljaCBmb3JtYXQgdG8gdXNlIGZvciB0aGlzIHZhbHVlOlxuXHRcdFx0dXNlRm9ybWF0ID0gbnVtYmVyID4gMCA/IGZvcm1hdHMucG9zIDogbnVtYmVyIDwgMCA/IGZvcm1hdHMubmVnIDogZm9ybWF0cy56ZXJvO1xuXG5cdFx0Ly8gUmV0dXJuIHdpdGggY3VycmVuY3kgc3ltYm9sIGFkZGVkOlxuXHRcdHJldHVybiB1c2VGb3JtYXQucmVwbGFjZSgnJXMnLCBvcHRzLnN5bWJvbCkucmVwbGFjZSgnJXYnLCBmb3JtYXROdW1iZXIoTWF0aC5hYnMobnVtYmVyKSwgY2hlY2tQcmVjaXNpb24ob3B0cy5wcmVjaXNpb24pLCBvcHRzLnRob3VzYW5kLCBvcHRzLmRlY2ltYWwpKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBGb3JtYXQgYSBsaXN0IG9mIG51bWJlcnMgaW50byBhbiBhY2NvdW50aW5nIGNvbHVtbiwgcGFkZGluZyB3aXRoIHdoaXRlc3BhY2Vcblx0ICogdG8gbGluZSB1cCBjdXJyZW5jeSBzeW1ib2xzLCB0aG91c2FuZCBzZXBhcmF0b3JzIGFuZCBkZWNpbWFscyBwbGFjZXNcblx0ICpcblx0ICogTGlzdCBzaG91bGQgYmUgYW4gYXJyYXkgb2YgbnVtYmVyc1xuXHQgKiBTZWNvbmQgcGFyYW1ldGVyIGNhbiBiZSBhbiBvYmplY3QgY29udGFpbmluZyBrZXlzIHRoYXQgbWF0Y2ggdGhlIHBhcmFtc1xuXHQgKlxuXHQgKiBSZXR1cm5zIGFycmF5IG9mIGFjY291dGluZy1mb3JtYXR0ZWQgbnVtYmVyIHN0cmluZ3Mgb2Ygc2FtZSBsZW5ndGhcblx0ICpcblx0ICogTkI6IGB3aGl0ZS1zcGFjZTpwcmVgIENTUyBydWxlIGlzIHJlcXVpcmVkIG9uIHRoZSBsaXN0IGNvbnRhaW5lciB0byBwcmV2ZW50XG5cdCAqIGJyb3dzZXJzIGZyb20gY29sbGFwc2luZyB0aGUgd2hpdGVzcGFjZSBpbiB0aGUgb3V0cHV0IHN0cmluZ3MuXG5cdCAqL1xuXHRsaWIuZm9ybWF0Q29sdW1uID0gZnVuY3Rpb24obGlzdCwgc3ltYm9sLCBwcmVjaXNpb24sIHRob3VzYW5kLCBkZWNpbWFsLCBmb3JtYXQpIHtcblx0XHRpZiAoIWxpc3QpIHJldHVybiBbXTtcblxuXHRcdC8vIEJ1aWxkIG9wdGlvbnMgb2JqZWN0IGZyb20gc2Vjb25kIHBhcmFtIChpZiBvYmplY3QpIG9yIGFsbCBwYXJhbXMsIGV4dGVuZGluZyBkZWZhdWx0czpcblx0XHR2YXIgb3B0cyA9IGRlZmF1bHRzKFxuXHRcdFx0XHQoaXNPYmplY3Qoc3ltYm9sKSA/IHN5bWJvbCA6IHtcblx0XHRcdFx0XHRzeW1ib2wgOiBzeW1ib2wsXG5cdFx0XHRcdFx0cHJlY2lzaW9uIDogcHJlY2lzaW9uLFxuXHRcdFx0XHRcdHRob3VzYW5kIDogdGhvdXNhbmQsXG5cdFx0XHRcdFx0ZGVjaW1hbCA6IGRlY2ltYWwsXG5cdFx0XHRcdFx0Zm9ybWF0IDogZm9ybWF0XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRsaWIuc2V0dGluZ3MuY3VycmVuY3lcblx0XHRcdCksXG5cblx0XHRcdC8vIENoZWNrIGZvcm1hdCAocmV0dXJucyBvYmplY3Qgd2l0aCBwb3MsIG5lZyBhbmQgemVybyksIG9ubHkgbmVlZCBwb3MgZm9yIG5vdzpcblx0XHRcdGZvcm1hdHMgPSBjaGVja0N1cnJlbmN5Rm9ybWF0KG9wdHMuZm9ybWF0KSxcblxuXHRcdFx0Ly8gV2hldGhlciB0byBwYWQgYXQgc3RhcnQgb2Ygc3RyaW5nIG9yIGFmdGVyIGN1cnJlbmN5IHN5bWJvbDpcblx0XHRcdHBhZEFmdGVyU3ltYm9sID0gZm9ybWF0cy5wb3MuaW5kZXhPZihcIiVzXCIpIDwgZm9ybWF0cy5wb3MuaW5kZXhPZihcIiV2XCIpID8gdHJ1ZSA6IGZhbHNlLFxuXG5cdFx0XHQvLyBTdG9yZSB2YWx1ZSBmb3IgdGhlIGxlbmd0aCBvZiB0aGUgbG9uZ2VzdCBzdHJpbmcgaW4gdGhlIGNvbHVtbjpcblx0XHRcdG1heExlbmd0aCA9IDAsXG5cblx0XHRcdC8vIEZvcm1hdCB0aGUgbGlzdCBhY2NvcmRpbmcgdG8gb3B0aW9ucywgc3RvcmUgdGhlIGxlbmd0aCBvZiB0aGUgbG9uZ2VzdCBzdHJpbmc6XG5cdFx0XHRmb3JtYXR0ZWQgPSBtYXAobGlzdCwgZnVuY3Rpb24odmFsLCBpKSB7XG5cdFx0XHRcdGlmIChpc0FycmF5KHZhbCkpIHtcblx0XHRcdFx0XHQvLyBSZWN1cnNpdmVseSBmb3JtYXQgY29sdW1ucyBpZiBsaXN0IGlzIGEgbXVsdGktZGltZW5zaW9uYWwgYXJyYXk6XG5cdFx0XHRcdFx0cmV0dXJuIGxpYi5mb3JtYXRDb2x1bW4odmFsLCBvcHRzKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBDbGVhbiB1cCB0aGUgdmFsdWVcblx0XHRcdFx0XHR2YWwgPSB1bmZvcm1hdCh2YWwpO1xuXG5cdFx0XHRcdFx0Ly8gQ2hvb3NlIHdoaWNoIGZvcm1hdCB0byB1c2UgZm9yIHRoaXMgdmFsdWUgKHBvcywgbmVnIG9yIHplcm8pOlxuXHRcdFx0XHRcdHZhciB1c2VGb3JtYXQgPSB2YWwgPiAwID8gZm9ybWF0cy5wb3MgOiB2YWwgPCAwID8gZm9ybWF0cy5uZWcgOiBmb3JtYXRzLnplcm8sXG5cblx0XHRcdFx0XHRcdC8vIEZvcm1hdCB0aGlzIHZhbHVlLCBwdXNoIGludG8gZm9ybWF0dGVkIGxpc3QgYW5kIHNhdmUgdGhlIGxlbmd0aDpcblx0XHRcdFx0XHRcdGZWYWwgPSB1c2VGb3JtYXQucmVwbGFjZSgnJXMnLCBvcHRzLnN5bWJvbCkucmVwbGFjZSgnJXYnLCBmb3JtYXROdW1iZXIoTWF0aC5hYnModmFsKSwgY2hlY2tQcmVjaXNpb24ob3B0cy5wcmVjaXNpb24pLCBvcHRzLnRob3VzYW5kLCBvcHRzLmRlY2ltYWwpKTtcblxuXHRcdFx0XHRcdGlmIChmVmFsLmxlbmd0aCA+IG1heExlbmd0aCkgbWF4TGVuZ3RoID0gZlZhbC5sZW5ndGg7XG5cdFx0XHRcdFx0cmV0dXJuIGZWYWw7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0Ly8gUGFkIGVhY2ggbnVtYmVyIGluIHRoZSBsaXN0IGFuZCBzZW5kIGJhY2sgdGhlIGNvbHVtbiBvZiBudW1iZXJzOlxuXHRcdHJldHVybiBtYXAoZm9ybWF0dGVkLCBmdW5jdGlvbih2YWwsIGkpIHtcblx0XHRcdC8vIE9ubHkgaWYgdGhpcyBpcyBhIHN0cmluZyAobm90IGEgbmVzdGVkIGFycmF5LCB3aGljaCB3b3VsZCBoYXZlIGFscmVhZHkgYmVlbiBwYWRkZWQpOlxuXHRcdFx0aWYgKGlzU3RyaW5nKHZhbCkgJiYgdmFsLmxlbmd0aCA8IG1heExlbmd0aCkge1xuXHRcdFx0XHQvLyBEZXBlbmRpbmcgb24gc3ltYm9sIHBvc2l0aW9uLCBwYWQgYWZ0ZXIgc3ltYm9sIG9yIGF0IGluZGV4IDA6XG5cdFx0XHRcdHJldHVybiBwYWRBZnRlclN5bWJvbCA/IHZhbC5yZXBsYWNlKG9wdHMuc3ltYm9sLCBvcHRzLnN5bWJvbCsobmV3IEFycmF5KG1heExlbmd0aCAtIHZhbC5sZW5ndGggKyAxKS5qb2luKFwiIFwiKSkpIDogKG5ldyBBcnJheShtYXhMZW5ndGggLSB2YWwubGVuZ3RoICsgMSkuam9pbihcIiBcIikpICsgdmFsO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbDtcblx0XHR9KTtcblx0fTtcblxuXG5cdC8qIC0tLSBNb2R1bGUgRGVmaW5pdGlvbiAtLS0gKi9cblxuXHQvLyBFeHBvcnQgYWNjb3VudGluZyBmb3IgQ29tbW9uSlMuIElmIGJlaW5nIGxvYWRlZCBhcyBhbiBBTUQgbW9kdWxlLCBkZWZpbmUgaXQgYXMgc3VjaC5cblx0Ly8gT3RoZXJ3aXNlLCBqdXN0IGFkZCBgYWNjb3VudGluZ2AgdG8gdGhlIGdsb2JhbCBvYmplY3Rcblx0aWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuXHRcdGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdFx0ZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gbGliO1xuXHRcdH1cblx0XHRleHBvcnRzLmFjY291bnRpbmcgPSBsaWI7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gUmV0dXJuIHRoZSBsaWJyYXJ5IGFzIGFuIEFNRCBtb2R1bGU6XG5cdFx0ZGVmaW5lKFtdLCBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBsaWI7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gVXNlIGFjY291bnRpbmcubm9Db25mbGljdCB0byByZXN0b3JlIGBhY2NvdW50aW5nYCBiYWNrIHRvIGl0cyBvcmlnaW5hbCB2YWx1ZS5cblx0XHQvLyBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBsaWJyYXJ5J3MgYGFjY291bnRpbmdgIG9iamVjdDtcblx0XHQvLyBlLmcuIGB2YXIgbnVtYmVycyA9IGFjY291bnRpbmcubm9Db25mbGljdCgpO2Bcblx0XHRsaWIubm9Db25mbGljdCA9IChmdW5jdGlvbihvbGRBY2NvdW50aW5nKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIFJlc2V0IHRoZSB2YWx1ZSBvZiB0aGUgcm9vdCdzIGBhY2NvdW50aW5nYCB2YXJpYWJsZTpcblx0XHRcdFx0cm9vdC5hY2NvdW50aW5nID0gb2xkQWNjb3VudGluZztcblx0XHRcdFx0Ly8gRGVsZXRlIHRoZSBub0NvbmZsaWN0IG1ldGhvZDpcblx0XHRcdFx0bGliLm5vQ29uZmxpY3QgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdC8vIFJldHVybiByZWZlcmVuY2UgdG8gdGhlIGxpYnJhcnkgdG8gcmUtYXNzaWduIGl0OlxuXHRcdFx0XHRyZXR1cm4gbGliO1xuXHRcdFx0fTtcblx0XHR9KShyb290LmFjY291bnRpbmcpO1xuXG5cdFx0Ly8gRGVjbGFyZSBgZnhgIG9uIHRoZSByb290IChnbG9iYWwvd2luZG93KSBvYmplY3Q6XG5cdFx0cm9vdFsnYWNjb3VudGluZyddID0gbGliO1xuXHR9XG5cblx0Ly8gUm9vdCB3aWxsIGJlIGB3aW5kb3dgIGluIGJyb3dzZXIgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlcjpcbn0odGhpcykpO1xuIiwiY29uc3QgalF1ZXJ5ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJyQnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJyQnXSA6IG51bGwpO1xuZ2xvYmFsLkkxOG4gPSByZXF1aXJlKCcuL2xpYi9pMThuLWNvbW1vbi5qcycpO1xuZ2xvYmFsLkFiaU1hbmFnZXIgPSByZXF1aXJlKCcuL2xpYi9jb250cmFjdC9hYmltYW5hZ2VyLmpzJyk7XG5nbG9iYWwuX2hvcHNldHRpbmdzID0gcmVxdWlyZSgnLi9saWIvdXRpbHMvc2V0dGluZ3MuanMnKTtcbmNvbnN0IEJyb3dzZXJVdGlsID0gcmVxdWlyZSgnLi9saWIvdXRpbHMvYnJvd3NlcnV0aWwuanMnKTtcbmxldCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xuZ2xvYmFsLl9idyA9IG5ldyBCcm93c2VyVXRpbCh1YSk7XG5nbG9iYWwuREFwcFV0aWxzID0gcmVxdWlyZSgnLi9saWIvZGFwcC11dGlscy5qcycpO1xuXG5nbG9iYWwuQWNjRm9ybWF0dGVyID0gcmVxdWlyZSgnYWNjb3VudGluZycpO1xuXG5nbG9iYWwuVHhMaXN0R3JvdXAgPSByZXF1aXJlKCcuL2xpYi91aS90eC1saXN0Z3JvdXAuanMnKTtcbiIsImNvbnN0IENPTlRSQUNUX0NUWCA9IHtcclxuICBcIm1hc3RlclwiOntcclxuICAgIG1haW5fYWRkcmVzczpcIjB4NTVjNzVmNTA5ZkM2MjBjQTFjMzNFMzEzZEJCRDVmNzNhQjg2YmE1QlwiLFxyXG4gICAgYWJpOlt7XCJjb25zdGFudFwiOmZhbHNlLFwiaW5wdXRzXCI6W3tcImludGVybmFsVHlwZVwiOlwidWludDI1NlwiLFwibmFtZVwiOlwicHJpY2VcIixcInR5cGVcIjpcInVpbnQyNTZcIn1dLFwibmFtZVwiOlwiY2hhbmdlU2VydmljZVByaWNlXCIsXCJvdXRwdXRzXCI6W10sXCJwYXlhYmxlXCI6ZmFsc2UsXCJzdGF0ZU11dGFiaWxpdHlcIjpcIm5vbnBheWFibGVcIixcInR5cGVcIjpcImZ1bmN0aW9uXCJ9LHtcImNvbnN0YW50XCI6dHJ1ZSxcImlucHV0c1wiOlt7XCJpbnRlcm5hbFR5cGVcIjpcImJ5dGVzMzJcIixcIm5hbWVcIjpcImFkZHJcIixcInR5cGVcIjpcImJ5dGVzMzJcIn1dLFwibmFtZVwiOlwiY2hlY2tcIixcIm91dHB1dHNcIjpbe1wiaW50ZXJuYWxUeXBlXCI6XCJhZGRyZXNzXCIsXCJuYW1lXCI6XCJcIixcInR5cGVcIjpcImFkZHJlc3NcIn0se1wiaW50ZXJuYWxUeXBlXCI6XCJ1aW50MjU2XCIsXCJuYW1lXCI6XCJcIixcInR5cGVcIjpcInVpbnQyNTZcIn0se1wiaW50ZXJuYWxUeXBlXCI6XCJ1aW50MjU2XCIsXCJuYW1lXCI6XCJcIixcInR5cGVcIjpcInVpbnQyNTZcIn1dLFwicGF5YWJsZVwiOmZhbHNlLFwic3RhdGVNdXRhYmlsaXR5XCI6XCJ2aWV3XCIsXCJ0eXBlXCI6XCJmdW5jdGlvblwifSx7XCJjb25zdGFudFwiOnRydWUsXCJpbnB1dHNcIjpbXSxcIm5hbWVcIjpcIlRva2VuTm9Gb3JPbmVVc2VyXCIsXCJvdXRwdXRzXCI6W3tcImludGVybmFsVHlwZVwiOlwidWludDI1NlwiLFwibmFtZVwiOlwiXCIsXCJ0eXBlXCI6XCJ1aW50MjU2XCJ9XSxcInBheWFibGVcIjpmYWxzZSxcInN0YXRlTXV0YWJpbGl0eVwiOlwidmlld1wiLFwidHlwZVwiOlwiZnVuY3Rpb25cIn0se1wiY29uc3RhbnRcIjpmYWxzZSxcImlucHV0c1wiOlt7XCJpbnRlcm5hbFR5cGVcIjpcImJ5dGVzMzJcIixcIm5hbWVcIjpcImFkZHJcIixcInR5cGVcIjpcImJ5dGVzMzJcIn1dLFwibmFtZVwiOlwidW5iaW5kXCIsXCJvdXRwdXRzXCI6W10sXCJwYXlhYmxlXCI6ZmFsc2UsXCJzdGF0ZU11dGFiaWxpdHlcIjpcIm5vbnBheWFibGVcIixcInR5cGVcIjpcImZ1bmN0aW9uXCJ9LHtcImNvbnN0YW50XCI6ZmFsc2UsXCJpbnB1dHNcIjpbe1wiaW50ZXJuYWxUeXBlXCI6XCJieXRlczMyXCIsXCJuYW1lXCI6XCJhZGRyXCIsXCJ0eXBlXCI6XCJieXRlczMyXCJ9XSxcIm5hbWVcIjpcImJpbmRcIixcIm91dHB1dHNcIjpbXSxcInBheWFibGVcIjpmYWxzZSxcInN0YXRlTXV0YWJpbGl0eVwiOlwibm9ucGF5YWJsZVwiLFwidHlwZVwiOlwiZnVuY3Rpb25cIn0se1wiY29uc3RhbnRcIjp0cnVlLFwiaW5wdXRzXCI6W10sXCJuYW1lXCI6XCJvd25lclwiLFwib3V0cHV0c1wiOlt7XCJpbnRlcm5hbFR5cGVcIjpcImFkZHJlc3NcIixcIm5hbWVcIjpcIlwiLFwidHlwZVwiOlwiYWRkcmVzc1wifV0sXCJwYXlhYmxlXCI6ZmFsc2UsXCJzdGF0ZU11dGFiaWxpdHlcIjpcInZpZXdcIixcInR5cGVcIjpcImZ1bmN0aW9uXCJ9LHtcImNvbnN0YW50XCI6dHJ1ZSxcImlucHV0c1wiOlt7XCJpbnRlcm5hbFR5cGVcIjpcImFkZHJlc3NcIixcIm5hbWVcIjpcIlwiLFwidHlwZVwiOlwiYWRkcmVzc1wifV0sXCJuYW1lXCI6XCJFdGhlckNvdW50ZXJcIixcIm91dHB1dHNcIjpbe1wiaW50ZXJuYWxUeXBlXCI6XCJ1aW50MjU2XCIsXCJuYW1lXCI6XCJcIixcInR5cGVcIjpcInVpbnQyNTZcIn1dLFwicGF5YWJsZVwiOmZhbHNlLFwic3RhdGVNdXRhYmlsaXR5XCI6XCJ2aWV3XCIsXCJ0eXBlXCI6XCJmdW5jdGlvblwifSx7XCJjb25zdGFudFwiOnRydWUsXCJpbnB1dHNcIjpbe1wiaW50ZXJuYWxUeXBlXCI6XCJieXRlczMyXCIsXCJuYW1lXCI6XCJcIixcInR5cGVcIjpcImJ5dGVzMzJcIn1dLFwibmFtZVwiOlwiUGFuZ29saW5Vc2VyUmVjb3JkXCIsXCJvdXRwdXRzXCI6W3tcImludGVybmFsVHlwZVwiOlwiYWRkcmVzc1wiLFwibmFtZVwiOlwiXCIsXCJ0eXBlXCI6XCJhZGRyZXNzXCJ9XSxcInBheWFibGVcIjpmYWxzZSxcInN0YXRlTXV0YWJpbGl0eVwiOlwidmlld1wiLFwidHlwZVwiOlwiZnVuY3Rpb25cIn0se1wiY29uc3RhbnRcIjp0cnVlLFwiaW5wdXRzXCI6W3tcImludGVybmFsVHlwZVwiOlwiYWRkcmVzc1wiLFwibmFtZVwiOlwidXNlckFkZHJcIixcInR5cGVcIjpcImFkZHJlc3NcIn1dLFwibmFtZVwiOlwiYmluZGluZ0luZm9cIixcIm91dHB1dHNcIjpbe1wiaW50ZXJuYWxUeXBlXCI6XCJ1aW50MjU2XCIsXCJuYW1lXCI6XCJcIixcInR5cGVcIjpcInVpbnQyNTZcIn0se1wiaW50ZXJuYWxUeXBlXCI6XCJ1aW50MjU2XCIsXCJuYW1lXCI6XCJcIixcInR5cGVcIjpcInVpbnQyNTZcIn0se1wiaW50ZXJuYWxUeXBlXCI6XCJ1aW50MjU2XCIsXCJuYW1lXCI6XCJcIixcInR5cGVcIjpcInVpbnQyNTZcIn1dLFwicGF5YWJsZVwiOmZhbHNlLFwic3RhdGVNdXRhYmlsaXR5XCI6XCJ2aWV3XCIsXCJ0eXBlXCI6XCJmdW5jdGlvblwifSx7XCJjb25zdGFudFwiOnRydWUsXCJpbnB1dHNcIjpbXSxcIm5hbWVcIjpcIlRva2VuRGVjaW1hbFwiLFwib3V0cHV0c1wiOlt7XCJpbnRlcm5hbFR5cGVcIjpcInVpbnQyNTZcIixcIm5hbWVcIjpcIlwiLFwidHlwZVwiOlwidWludDI1NlwifV0sXCJwYXlhYmxlXCI6ZmFsc2UsXCJzdGF0ZU11dGFiaWxpdHlcIjpcInZpZXdcIixcInR5cGVcIjpcImZ1bmN0aW9uXCJ9LHtcImNvbnN0YW50XCI6ZmFsc2UsXCJpbnB1dHNcIjpbe1wiaW50ZXJuYWxUeXBlXCI6XCJhZGRyZXNzXCIsXCJuYW1lXCI6XCJuZXdPd25lclwiLFwidHlwZVwiOlwiYWRkcmVzc1wifV0sXCJuYW1lXCI6XCJ0cmFuc2Zlck93bmVyc2hpcFwiLFwib3V0cHV0c1wiOltdLFwicGF5YWJsZVwiOmZhbHNlLFwic3RhdGVNdXRhYmlsaXR5XCI6XCJub25wYXlhYmxlXCIsXCJ0eXBlXCI6XCJmdW5jdGlvblwifSx7XCJjb25zdGFudFwiOnRydWUsXCJpbnB1dHNcIjpbXSxcIm5hbWVcIjpcInRva2VuXCIsXCJvdXRwdXRzXCI6W3tcImludGVybmFsVHlwZVwiOlwiY29udHJhY3QgRVJDMjBcIixcIm5hbWVcIjpcIlwiLFwidHlwZVwiOlwiYWRkcmVzc1wifV0sXCJwYXlhYmxlXCI6ZmFsc2UsXCJzdGF0ZU11dGFiaWxpdHlcIjpcInZpZXdcIixcInR5cGVcIjpcImZ1bmN0aW9uXCJ9LHtcImlucHV0c1wiOlt7XCJpbnRlcm5hbFR5cGVcIjpcImFkZHJlc3NcIixcIm5hbWVcIjpcInRva2VuQWRkclwiLFwidHlwZVwiOlwiYWRkcmVzc1wifV0sXCJwYXlhYmxlXCI6ZmFsc2UsXCJzdGF0ZU11dGFiaWxpdHlcIjpcIm5vbnBheWFibGVcIixcInR5cGVcIjpcImNvbnN0cnVjdG9yXCJ9XSAgICBcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGdldE1hc3RlcjooKT0+e1xyXG4gICAgcmV0dXJuIENPTlRSQUNUX0NUWC5tYXN0ZXIgfHwge307XHJcbiAgfSxcclxuICBnZXRDb250cmFjdDpuYW1lID0+e1xyXG4gICAgcmV0dXJuIENPTlRSQUNUX0NUWFtuYW1lXSB8fCB7fTtcclxuICB9XHJcbn07IiwiZnVuY3Rpb24gR2V0TmV0d29yayh2ZXJzaW9uSWQpe1xyXG4gIGlmKHR5cGVvZiB2ZXJzaW9uSWQgPT09J3VuZGVmaW5lZCcpcmV0dXJuICcnO1xyXG4gIHN3aXRjaCh2ZXJzaW9uSWQpe1xyXG4gICAgY2FzZSBcIjFcIjpcclxuICAgICAgcmV0dXJuIFwibWFpbm5ldFwiO1xyXG4gICAgY2FzZSBcIjNcIjpcclxuICAgICAgcmV0dXJuIFwicm9wc3RlblwiO1xyXG4gICAgY2FzZSBcIjRcIjpcclxuICAgICAgcmV0dXJuIFwicmlua2VieVwiO1xyXG4gICAgY2FzZSBcIjQyXCI6XHJcbiAgICAgIHJldHVybiBcImtvdmFuXCI7XHJcbiAgICBjYXNlIFwiNVwiOlxyXG4gICAgICByZXR1cm4gXCJnb2VybGlcIjtcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiB2ZXJzaW9uSWQ7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBWYWxpZFJvb3RBZGRyZXNzKGFkZHIpIHtcclxuICByZXR1cm4gYWRkciA9PSBcIjB4MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMFwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBWYWxpZFBpcmF0ZUFkZHJlcyhpZCl7XHJcbiAgcmV0dXJuIC9eW2EtekEtWjAtOV17NDV9JC8udGVzdChpZC50cmltKCkpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBnZXROZXR3b3JrOkdldE5ldHdvcmssXHJcbiAgdmFsaWRCaW5kZWQ6VmFsaWRSb290QWRkcmVzcyxcclxuICB2YWxpZEhvcDpWYWxpZFJvb3RBZGRyZXNzXHJcbn0iLCJcbid1c2Ugc3RyaWN0JztcblxuY29uc3QgViA9IFwiMC4xLjBcIjtcbmNvbnN0IENERUYgPSB7XG5cdGkxOG5TZWxlY3RvcjpcIi5pMThuXCIsXG5cdGltZ1NyYzpcInNyY1wiLFxuXHRhSHJlZjpcInVybFwiLFxuXHRsYW5nU2VsZWN0b3I6XCJzcGFuLnNlbC1sZ1wiLFxuXHRsYW5nQWN0aXZlQ2xheno6XCJsYW5nLWFjdGl2ZVwiXG59O1xuXG5jbGFzcyBJMThuIHtcblxuXHRjb25zdHJ1Y3RvciAob3B0aW9ucykge1xuXHRcdGxldCBfY3R4ID0gT2JqZWN0LmFzc2lnbih7fSxDREVGKTtcblx0IFx0aWYodHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnKXtcblx0IFx0XHRfY3R4ID0gT2JqZWN0LmFzc2lnbihfY3R4LG9wdGlvbnMpO1xuXHRcdH1lbHNlIGlmKHR5cGVvZiBvcHRpb25zID09PSdzdHJpbmcnKXtcblx0XHRcdF9jdHguZGVmbGFuZyA9IG9wdGlvbnM7XG5cdFx0fVxuXG5cdFx0aWYoIV9jdHguZGVmbGFuZyB8fCAoX2N0eC5kZWZsYW5nICE9J2NuJyAmJiBfY3R4LmRlZmxhbmcgIT0gJ2VuJykpe1xuXHRcdFx0X2N0eC5kZWZsYW5nID0gXCJlblwiO1xuXHRcdH1cblxuXHRcdHRoaXMuY3R4ID0gX2N0eDtcblx0fVxuXG5cdGluZGV4SW5pdCgpe1xuXHRcdFxuXHRcdGxldCBfY3R4ID0gdGhpcy5jdHg7XG5cdFx0bGV0IHRoYXQgPSB0aGlzO1xuXG5cdFx0JChfY3R4LmxhbmdTZWxlY3Rvcikub24oJ2NsaWNrJyxmdW5jdGlvbihldmVudCl7XG5cdFx0XHRsZXQgY3VyTGcgPSAkKHRoaXMpLmRhdGEoJ2xnJyk7XG5cdFx0XHRsZXQgYWN0aXZlQ2x6ID0gX2N0eC5sYW5nQWN0aXZlQ2xhenogfHwgQ0RFRi5sYW5nQWN0aXZlQ2xheno7XG5cdFx0XHRpZighJCh0aGlzKS5oYXNDbGFzcyhhY3RpdmVDbHopKXtcblx0XHRcdFx0JChfY3R4LmkxOG5TZWxlY3RvcikucmVtb3ZlQ2xhc3MoYWN0aXZlQ2x6KTtcblx0XHRcdFx0JCh0aGlzKS5hZGRDbGFzcyhhY3RpdmVDbHopO1xuXHRcdFx0XHR0aGF0LnNldExhbmcoY3VyTGcpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5zZXRMYW5nKF9jdHguZGVmbGFuZyk7XG5cdH1cblxuXHRzZXRMYW5nKGxnKXtcblx0XHRsZXQgdGhhdCA9IHRoaXM7XG5cdFx0JCh0aGF0LmN0eC5pMThuU2VsZWN0b3IpLmVhY2goKGluZGV4LGVsKSA9PiB7XG5cdFx0XHRsZXQgdGV4dCA9ICQoZWwpLmRhdGEoJycrbGcpO1xuXG5cdFx0XHRpZih0ZXh0KXtcblx0XHRcdFx0JChlbCkudGV4dCh0ZXh0KTtcblx0XHRcdH1cblx0XHRcdGxldCBpbWdTcmMgPSAkKGVsKS5kYXRhKGxnK3RoYXQuY3R4LmltZ1NyYyk7XG5cdFx0XHRpZihpbWdTcmMpe1xuXHRcdFx0XHQkKGVsKS5hdHRyKCdzcmMnLGltZ1NyYyk7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBocmVmVXJsID0gJChlbCkuZGF0YShsZyt0aGF0LmN0eC5hSHJlZik7XG5cdFx0XHRpZihocmVmVXJsKXtcblx0XHRcdFx0JChlbCkuYXR0cignaHJlZicsaHJlZlVybCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEkxOG47IiwiY29uc3QgRCA9IHtcclxuICBjb250YWluZXJJRDpcInRhYmxlLWNvbnRhaW5lclwiLFxyXG4gIGRlZmF1bHRTdGF0ZTpcInBlbmRpbmdcIixcclxuICBkZWZhdWx0TGFuZzpcImVuXCIsXHJcbiAgZXRoZXJzY2FuOntcclxuICAgIGVuOlwiaHR0cHM6Ly9ldGhlcnNjYW4uaW8vXCIsXHJcbiAgICBjbjpcImh0dHBzOi8vY24uZXRoZXJzY2FuLmNvbS9cIlxyXG4gIH1cclxufVxyXG4vKipcclxuICogVHg6IGhhc2gsY3JlYXRlZCAobnVtYmVyKSxmcm9tIChhZGRyZXNzKSxzdGF0ZShwZW5kaW5nLGNvbmZpcm0pXHJcbiAqL1xyXG5jbGFzcyBUeExpc3Rncm91cCB7XHJcbiAgY29uc3RydWN0b3IoKXtcclxuICAgIHRoaXMubGcgPSBELmRlZmF1bHRMYW5nO1xyXG4gICAgdGhpcy5UeFN0b3JlID0gW107XHJcbiAgfVxyXG5cclxuICBjbGVhclR4U3RvcmUoKXtcclxuICAgIHRoaXMuVHhTdG9yZSA9IFtdO1xyXG4gIH1cclxuXHJcbiAgYWRkVHgob2JqKXtcclxuICAgIGxldCByID0gdGhpcy52YWxpZFR4KG9iaik7XHJcbiAgICBpZihyKXtcclxuICAgICAgdGhpcy5UeFN0b3JlLnB1c2gocik7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFwcGVuZFR4KCRjb250YWluZXIsb2JqKXtcclxuICAgIGxldCByID0gdGhpcy52YWxpZFR4KG9iaik7XHJcbiAgICBpZigkY29udGFpbmVyIGluc3RhbmNlb2YgalF1ZXJ5ICYmIHIpe1xyXG4gICAgICB0aGlzLlR4U3RvcmUucHVzaChyKTtcclxuICAgICAgbGV0IGh0bWwgPSB0aGlzLmJ1aWxkSXRlbUh0bWwocik7XHJcblxyXG4gICAgICAkY29udGFpbmVyLmFwcGVuZChodG1sKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhbGlkVHgob2JqKXtcclxuICAgIGlmKCFvYmouaGFzaCB8fCAhb2JqLmZyb20pcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIGlmKCFvYmouc3RhdGUpb2JqLnN0YXRlPUQuZGVmYXVsdFN0YXRlO1xyXG4gICAgaWYoIW9iai5jcmVhdGVkKW9iai5jcmVhdGVkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICByZXR1cm4gb2JqO1xyXG4gIH1cclxuXHJcbiAgc2V0TGFuZyhsZyl7XHJcbiAgICBpZighbGcgfHwgKGxnIT1cImNuXCIgJiYgbGcgIT1cImVuXCIpKWxnPUQuZGVmYXVsdExhbmc7XHJcbiAgICB0aGlzLmxhbmcgPSBsZztcclxuICB9XHJcblxyXG4gIGdldEV0aGVyc2NhbihsZykge1xyXG4gICAgaWYoIWxnIHx8IChsZyE9XCJjblwiICYmIGxnICE9XCJlblwiKSlsZz1ELmRlZmF1bHRMYW5nO1xyXG4gICAgcmV0dXJuIEQuZXRoZXJzY2FuW2xnXTtcclxuICB9XHJcblxyXG4gIGJ1aWxkSXRlbUh0bWwodHhJdGVtKSB7XHJcbiAgICBsZXQgdHhIYXNoID0gdHhJdGVtLmhhc2g7XHJcbiAgICBsZXQgYUhyZWYgPSB0aGlzLmdldEV0aGVyc2Nhbih0aGlzLmxhbmcpICsgXCJ0eC9cIiArIHR4SGFzaDtcclxuICAgIGxldCBodG1sID0gJyc7XHJcbiAgICBodG1sICs9ICc8YSBjbGFzcz1cImxpc3QtZ3JvdXAtaXRlbSB0eC1pdGVtIHRleHQtbXV0ZWRcIiAnIFxyXG4gICAgICArICcgZGF0YS10eD1cIicrdHhIYXNoKydcIicgKycgZGF0YS1jcmVhdGVkPVwiJyt0eEl0ZW0uY3JlYXRlZCArJ1wiICdcclxuICAgICAgKyAnIGhyZWY9XCInK2FIcmVmKydcIiB0YXJnZXQ9XCJldGhlcnNjYW5cIiBhbHQ9XCJWaWV3IE9uIEV0aGVyc2NhblwiID4nO1xyXG5cclxuXHJcbiAgICBsZXQgdGltZVN0ciA9IGZvcm1hdFRpbWUodHhJdGVtLmNyZWF0ZWQsJ3t5fS17bX0te2R9IHtofTp7aX06e3N9Jyk7XHJcbiAgICBodG1sICs9ICc8ZGl2IGNsYXNzPVwiZC1mbGV4IHctMTAwIGp1c3RpZnktY29udGVudC1iZXR3ZWVuXCIgPidcclxuICAgICAgKyAnPGg2IGNsYXNzPVwidHgtaC1pdGVtXCI+VHJhbnNhY3Rpb24gSW5mbzwvaDY+J1xyXG4gICAgICArICc8c21hbGwgY2xhc3M9XCJ0eC1jcmVhdGVkXCI+Jyt0aW1lU3RyKyc8L3NtYWxsPjwvZGl2Pic7XHJcblxyXG4gICAgLy8gcCB0eCBoYXNoXHJcbiAgICBodG1sICs9ICc8cCBjbGFzcz1cIm1iLTFcIj5UcmFuc2F0aW9uIEhhc2g6ICcrdHhIYXNoKyc8L3A+JztcclxuXHJcbiAgICAvL2JvdHRvbSBzdGF0ZVxyXG4gICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cImQtZmxleCB3LTEwMCBqdXN0aWZ5LWNvbnRlbnQtYmV0d2VlblwiPidcclxuICAgICAgICArJyAgICAgIDxkaXY+PC9kaXY+J1xyXG4gICAgICAgICsnICAgICAgPHNwYW4gY2xhc3M9XCJ0eC1zdGF0ZVwiPicgKyB0eEl0ZW0uc3RhdGUgKyAnPC9zcGFuPidcclxuICAgICAgICArJzwvZGl2Pic7XHJcblxyXG4gICAgaHRtbCArPSAnPC9hPidcclxuICAgIHJldHVybiBodG1sO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZm9ybWF0VGltZSh0aW1lLGNGb3JtYXQpe1xyXG4gIGNvbnN0IGZvcm1hdCA9IGNGb3JtYXQgfHwgJ3t5fS17bX0te2R9IHtofTp7aX06e3N9J1xyXG4gIGxldCBkYXRlXHJcblxyXG4gIGlmICh0eXBlb2YgdGltZSA9PT0gJ29iamVjdCcpIHtcclxuICAgIGRhdGUgPSB0aW1lXHJcbiAgfSBlbHNlIHtcclxuICAgIGlmICgodHlwZW9mIHRpbWUgPT09ICdzdHJpbmcnKSAmJiAoL15bMC05XSskLy50ZXN0KHRpbWUpKSkge1xyXG4gICAgICB0aW1lID0gcGFyc2VJbnQodGltZSlcclxuICAgIH1cclxuICAgIGlmICgodHlwZW9mIHRpbWUgPT09ICdudW1iZXInKSAmJiAodGltZS50b1N0cmluZygpLmxlbmd0aCA9PT0gMTApKSB7XHJcbiAgICAgIHRpbWUgPSB0aW1lICogMTAwMFxyXG4gICAgfVxyXG4gICAgZGF0ZSA9IG5ldyBEYXRlKHRpbWUpXHJcbiAgfVxyXG5cclxuICBjb25zdCBmb3JtYXRPYmogPSB7XHJcbiAgICB5OiBkYXRlLmdldEZ1bGxZZWFyKCksXHJcbiAgICBtOiBkYXRlLmdldE1vbnRoKCkgKyAxLFxyXG4gICAgZDogZGF0ZS5nZXREYXRlKCksXHJcbiAgICBoOiBkYXRlLmdldEhvdXJzKCksXHJcbiAgICBpOiBkYXRlLmdldE1pbnV0ZXMoKSxcclxuICAgIHM6IGRhdGUuZ2V0U2Vjb25kcygpLFxyXG4gICAgYTogZGF0ZS5nZXREYXkoKVxyXG4gIH1cclxuXHJcbiAgY29uc3QgdGltZV9zdHIgPSBmb3JtYXQucmVwbGFjZSgveyh5fG18ZHxofGl8c3xhKSt9L2csIChyZXN1bHQsIGtleSkgPT4ge1xyXG4gICAgbGV0IHZhbCA9IGZvcm1hdE9ialtrZXldXHJcblxyXG4gICAgaWYgKGtleSA9PT0gJ2EnKSB7XHJcbiAgICAgIHJldHVybiBbJ1N1bicsICdNb24nLCAnVHVlcycsICdXZWQnLCAnVGh1cicsICdGcmknLCAnU2F0J11bdmFsXVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXN1bHQubGVuZ3RoID4gMCAmJiB2YWwgPCAxMCkge1xyXG4gICAgICB2YWwgPSAnMCcgKyB2YWxcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsIHx8IDBcclxuICB9KVxyXG5cclxuICByZXR1cm4gdGltZV9zdHJcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUeExpc3Rncm91cDsiLCJjbGFzcyBCcm93c2VyVXRpbCB7XHJcbiAgY29uc3RydWN0b3IodUFnZW50KXtcclxuICAgIHRoaXMudWEgPSB1QWdlbnQ7XHJcbiAgICB0aGlzLkluZm8gPSB7fTtcclxuICAgIHRoaXMuaW5pdERldGVjdCgpO1xyXG4gIH1cclxuICBpbml0RGV0ZWN0KCl7XHJcbiAgICBsZXQgZGUgPSB0aGlzLnBhcnNlVWFzZXJBZ2VudCgpO1xyXG4gICAgaWYoZGUpdGhpcy5JbmZvID0gT2JqZWN0LmFzc2lnbih7fSx0aGlzLkluZm8sZGUpO1xyXG4gIH1cclxuICBzdXBwb3J0TWV0YU1hc2soKXtcclxuICAgIGlmKHRoaXMuSW5mbyAmJiB0aGlzLkluZm8ubmFtZSl7XHJcbiAgICAgIGxldCBibmFtZSA9IHRoaXMuSW5mby5uYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgIGlmKGJuYW1lID09J2Nocm9tZScgfHwgYm5hbWUgPT0nZmlyZWZveCcgfHwgYm5hbWUgPT0nb3BlcmEnKXtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICBkZXRlY3RPUygpe1xyXG4gICAgaWYoIXRoaXMudWEpcmV0dXJuIG51bGw7XHJcbiAgICBsZXQgX3VhID0gdGhpcy51YTtcclxuICAgIGxldCBydWxlcyA9IGdldE9wZXJhdGluZ1N5c3RlbVJ1bGVzKCk7XHJcbiAgICBsZXQgZGV0ZWN0ZWQgPSBydWxlcy5maWx0ZXIoZnVuY3Rpb24ob3MpIHtcclxuICAgICAgcmV0dXJuIG9zLnJ1bGUgJiYgb3MucnVsZS50ZXN0KF91YSk7XHJcbiAgICB9KVswXTtcclxuXHJcbiAgICB0aGlzLkluZm8uZGV0ZWN0T1MgPSBkZXRlY3RlZCA/IGRldGVjdGVkLm5hbWUgOiBudWxsO1xyXG4gICAgcmV0dXJuIHRoaXMuSW5mby5kZXRlY3RPUzsgXHJcbiAgfVxyXG4gIHBhcnNlVWFzZXJBZ2VudCgpe1xyXG4gICAgbGV0IGJyb3dzZXJzID0gZ2V0QnJvd3NlclJ1bGVzKCk7XHJcbiAgICBpZighdGhpcy51YSlyZXR1cm4gbnVsbDtcclxuICAgIGxldCBfdWEgPSB0aGlzLnVhO1xyXG4gICAgbGV0IGRldGVjdGVkID0gYnJvd3NlcnMubWFwKGJyb3dzZXIgPT4ge1xyXG4gICAgICB2YXIgbWF0Y2ggPSBicm93c2VyLnJ1bGUuZXhlYyhfdWEpO1xyXG4gICAgICB2YXIgdmVyc2lvbiA9IG1hdGNoICYmIG1hdGNoWzFdLnNwbGl0KC9bLl9dLykuc2xpY2UoMCwzKTtcclxuXHJcbiAgICAgIGlmKHZlcnNpb24gJiYgdmVyc2lvbi5sZW5ndGggPDMpe1xyXG4gICAgICAgIHZlcnNpb24gPSB2ZXJzaW9uLmNvbmNhdCh2ZXJzaW9uLmxlbmd0aCA9PSAxID8gWzAsMF06WzBdKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbWF0Y2ggJiYge1xyXG4gICAgICAgIG5hbWU6YnJvd3Nlci5uYW1lLFxyXG4gICAgICAgIHZlcnNpb246dmVyc2lvbi5qb2luKCcuJylcclxuICAgICAgfTtcclxuICAgIH0pLmZpbHRlcihCb29sZWFuKVswXSB8fCBudWxsO1xyXG5cclxuICAgIGlmKGRldGVjdGVkKXtcclxuICAgICAgZGV0ZWN0ZWQub3MgPSB0aGlzLmRldGVjdE9TKF91YSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGV0ZWN0ZWQ7XHJcbiAgfVxyXG5cclxuICBnZXRNZXRhTWFza0hyZWYob3B0aW9ucyl7XHJcbiAgICBpZih0eXBlb2Ygb3B0aW9ucyAhPT0nb2JqZWN0JyB8fCAhdGhpcy5JbmZvLm5hbWUpcmV0dXJuIG51bGw7XHJcbiAgICBsZXQga2V5ID0gdGhpcy5JbmZvLm5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgIHJldHVybiBvcHRpb25zW2tleV18fG51bGw7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQERhdGVUaW1lIDIwMTktMTAtMTlcclxuICogQHJldHVybiAgIHtbdHlwZV19ICAgW2Rlc2NyaXB0aW9uXVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0QnJvd3NlclJ1bGVzKCl7XHJcbiAgcmV0dXJuIGJ1aWxkUnVsZXMoW1xyXG4gICAgWyAnZWRnZScsIC9FZGdlXFwvKFswLTlcXC5fXSspLyBdLFxyXG4gICAgWyAneWFuZGV4YnJvd3NlcicsIC9ZYUJyb3dzZXJcXC8oWzAtOVxcLl9dKykvIF0sXHJcbiAgICBbICd2aXZhbGRpJywgL1ZpdmFsZGlcXC8oWzAtOVxcLl0rKS8gXSxcclxuICAgIFsgJ2tha2FvdGFsaycsIC9LQUtBT1RBTEtcXHMoWzAtOVxcLl0rKS8gXSxcclxuICAgIFsgJ2Nocm9tZScsIC8oPyFDaHJvbS4qT1BSKUNocm9tKD86ZXxpdW0pXFwvKFswLTlcXC5dKykoOj9cXHN8JCkvIF0sXHJcbiAgICBbICdwaGFudG9tanMnLCAvUGhhbnRvbUpTXFwvKFswLTlcXC5dKykoOj9cXHN8JCkvIF0sXHJcbiAgICBbICdjcmlvcycsIC9DcmlPU1xcLyhbMC05XFwuXSspKDo/XFxzfCQpLyBdLFxyXG4gICAgWyAnZmlyZWZveCcsIC9GaXJlZm94XFwvKFswLTlcXC5dKykoPzpcXHN8JCkvIF0sXHJcbiAgICBbICdmeGlvcycsIC9GeGlPU1xcLyhbMC05XFwuXSspLyBdLFxyXG4gICAgWyAnb3BlcmEnLCAvT3BlcmFcXC8oWzAtOVxcLl0rKSg/Olxcc3wkKS8gXSxcclxuICAgIFsgJ29wZXJhJywgL09QUlxcLyhbMC05XFwuXSspKDo/XFxzfCQpJC8gXSxcclxuICAgIFsgJ2llJywgL1RyaWRlbnRcXC83XFwuMC4qcnZcXDooWzAtOVxcLl0rKS4qXFwpLipHZWNrbyQvIF0sXHJcbiAgICBbICdpZScsIC9NU0lFXFxzKFswLTlcXC5dKyk7LipUcmlkZW50XFwvWzQtN10uMC8gXSxcclxuICAgIFsgJ2llJywgL01TSUVcXHMoN1xcLjApLyBdLFxyXG4gICAgWyAnYmIxMCcsIC9CQjEwO1xcc1RvdWNoLipWZXJzaW9uXFwvKFswLTlcXC5dKykvIF0sXHJcbiAgICBbICdhbmRyb2lkJywgL0FuZHJvaWRcXHMoWzAtOVxcLl0rKS8gXSxcclxuICAgIFsgJ2lvcycsIC9WZXJzaW9uXFwvKFswLTlcXC5fXSspLipNb2JpbGUuKlNhZmFyaS4qLyBdLFxyXG4gICAgWyAnc2FmYXJpJywgL1ZlcnNpb25cXC8oWzAtOVxcLl9dKykuKlNhZmFyaS8gXVxyXG4gIF0pO1xyXG59XHJcblxyXG4vKipcclxuICogQERhdGVUaW1lIDIwMTktMTAtMTlcclxuICogQHJldHVybiAgIHtbdHlwZV19ICAgW2Rlc2NyaXB0aW9uXVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T3BlcmF0aW5nU3lzdGVtUnVsZXMoKXtcclxuICByZXR1cm4gYnVpbGRSdWxlcyhbXHJcbiAgICBbICdpT1MnLCAvaVAoaG9uZXxvZHxhZCkvIF0sXHJcbiAgICBbICdBbmRyb2lkIE9TJywgL0FuZHJvaWQvIF0sXHJcbiAgICBbICdCbGFja0JlcnJ5IE9TJywgL0JsYWNrQmVycnl8QkIxMC8gXSxcclxuICAgIFsgJ1dpbmRvd3MgTW9iaWxlJywgL0lFTW9iaWxlLyBdLFxyXG4gICAgWyAnQW1hem9uIE9TJywgL0tpbmRsZS8gXSxcclxuICAgIFsgJ1dpbmRvd3MgMy4xMScsIC9XaW4xNi8gXSxcclxuICAgIFsgJ1dpbmRvd3MgOTUnLCAvKFdpbmRvd3MgOTUpfChXaW45NSl8KFdpbmRvd3NfOTUpLyBdLFxyXG4gICAgWyAnV2luZG93cyA5OCcsIC8oV2luZG93cyA5OCl8KFdpbjk4KS8gXSxcclxuICAgIFsgJ1dpbmRvd3MgMjAwMCcsIC8oV2luZG93cyBOVCA1LjApfChXaW5kb3dzIDIwMDApLyBdLFxyXG4gICAgWyAnV2luZG93cyBYUCcsIC8oV2luZG93cyBOVCA1LjEpfChXaW5kb3dzIFhQKS8gXSxcclxuICAgIFsgJ1dpbmRvd3MgU2VydmVyIDIwMDMnLCAvKFdpbmRvd3MgTlQgNS4yKS8gXSxcclxuICAgIFsgJ1dpbmRvd3MgVmlzdGEnLCAvKFdpbmRvd3MgTlQgNi4wKS8gXSxcclxuICAgIFsgJ1dpbmRvd3MgNycsIC8oV2luZG93cyBOVCA2LjEpLyBdLFxyXG4gICAgWyAnV2luZG93cyA4JywgLyhXaW5kb3dzIE5UIDYuMikvIF0sXHJcbiAgICBbICdXaW5kb3dzIDguMScsIC8oV2luZG93cyBOVCA2LjMpLyBdLFxyXG4gICAgWyAnV2luZG93cyAxMCcsIC8oV2luZG93cyBOVCAxMC4wKS8gXSxcclxuICAgIFsgJ1dpbmRvd3MgTUUnLCAvV2luZG93cyBNRS8gXSxcclxuICAgIFsgJ09wZW4gQlNEJywgL09wZW5CU0QvIF0sXHJcbiAgICBbICdTdW4gT1MnLCAvU3VuT1MvIF0sXHJcbiAgICBbICdMaW51eCcsIC8oTGludXgpfChYMTEpLyBdLFxyXG4gICAgWyAnTWFjIE9TJywgLyhNYWNfUG93ZXJQQyl8KE1hY2ludG9zaCkvIF0sXHJcbiAgICBbICdRTlgnLCAvUU5YLyBdLFxyXG4gICAgWyAnQmVPUycsIC9CZU9TLyBdLFxyXG4gICAgWyAnT1MvMicsIC9PU1xcLzIvIF0sXHJcbiAgICBbICdTZWFyY2ggQm90JywgLyhudWhrKXwoR29vZ2xlYm90KXwoWWFtbXlib3QpfChPcGVuYm90KXwoU2x1cnApfChNU05Cb3QpfChBc2sgSmVldmVzXFwvVGVvbWEpfChpYV9hcmNoaXZlcikvIF1cclxuICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRSdWxlcyhydWxlVHVwbGVzKXtcclxuICByZXR1cm4gcnVsZVR1cGxlcy5tYXAodHVwbGUgPT57XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBuYW1lOnR1cGxlWzBdLFxyXG4gICAgICBydWxlOnR1cGxlWzFdXHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQnJvd3NlclV0aWw7IiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgbWV0YW1hc2s6e1xyXG4gICAgY2hyb21lOlwiaHR0cHM6Ly9jaHJvbWUuZ29vZ2xlLmNvbS93ZWJzdG9yZS9kZXRhaWwvbWV0YW1hc2svbmtiaWhmYmVvZ2FlYW9laGxlZm5rb2RiZWZncGdrbm5cIixcclxuICAgIGZpcmVmb3g6XCJodHRwczovL2FkZG9ucy5tb3ppbGxhLm9yZy96aC1DTi9maXJlZm94L2FkZG9uL2V0aGVyLW1ldGFtYXNrLz9zcmM9c2VhcmNoXCIsXHJcbiAgICBvcGVyYTpcImh0dHBzOi8vYWRkb25zLm9wZXJhLmNvbS96aC1jbi9leHRlbnNpb25zL2RldGFpbHMvbWV0YW1hc2svXCJcclxuICB9LFxyXG4gIHByZWNpc2lvbjp7XHJcbiAgICBcImNvaW5cIjo0LFxyXG4gICAgXCJtb25leVwiOjJcclxuICB9LFxyXG4gIHJvb3RBZGRyZXNzOlwiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwXCJcclxufSJdfQ==
