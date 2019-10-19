(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
const jQuery = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
global.I18n = require('./lib/i18n-common.js');
global.AbiManager = require('./lib/contract/abimanager.js');
global._hopsettings = require('./lib/utils/settings.js');
const BrowserUtil = require('./lib/utils/browserutil.js');
let ua = window.navigator.userAgent;
global._bw = new BrowserUtil(ua);
global.DAppUtils = require('./lib/dapp-utils.js');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib/contract/abimanager.js":2,"./lib/dapp-utils.js":3,"./lib/i18n-common.js":4,"./lib/utils/browserutil.js":5,"./lib/utils/settings.js":6}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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


module.exports = {
  getNetwork:GetNetwork
}
},{}],4:[function(require,module,exports){

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
},{}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
module.exports = {
  metamask:{
    chrome:"https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
    firefox:"https://addons.mozilla.org/zh-CN/firefox/addon/ether-metamask/?src=search",
    opera:"https://addons.opera.com/zh-cn/extensions/details/metamask/"
  }
}
},{}]},{},[1]);
