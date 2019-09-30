(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
const jQuery = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
global.I18n = require('./lib/i18n-common.js');


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./lib/i18n-common.js":2}],2:[function(require,module,exports){

'use strict';

const V = "0.0.1";
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvbGliL2kxOG4tY29tbW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IGpRdWVyeSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WyckJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWyckJ10gOiBudWxsKTtcbmdsb2JhbC5JMThuID0gcmVxdWlyZSgnLi9saWIvaTE4bi1jb21tb24uanMnKTtcblxuIiwiXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IFYgPSBcIjAuMC4xXCI7XG5jb25zdCBDREVGID0ge1xuXHRpMThuU2VsZWN0b3I6XCIuaTE4blwiLFxuXHRpbWdTcmM6XCJzcmNcIixcblx0YUhyZWY6XCJ1cmxcIixcblx0bGFuZ1NlbGVjdG9yOlwic3Bhbi5zZWwtbGdcIixcblx0bGFuZ0FjdGl2ZUNsYXp6OlwibGFuZy1hY3RpdmVcIlxufTtcblxuY2xhc3MgSTE4biB7XG5cblx0Y29uc3RydWN0b3IgKG9wdGlvbnMpIHtcblx0XHRsZXQgX2N0eCA9IE9iamVjdC5hc3NpZ24oe30sQ0RFRik7XG5cdCBcdGlmKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jyl7XG5cdCBcdFx0X2N0eCA9IE9iamVjdC5hc3NpZ24oX2N0eCxvcHRpb25zKTtcblx0XHR9ZWxzZSBpZih0eXBlb2Ygb3B0aW9ucyA9PT0nc3RyaW5nJyl7XG5cdFx0XHRfY3R4LmRlZmxhbmcgPSBvcHRpb25zO1xuXHRcdH1cblxuXHRcdGlmKCFfY3R4LmRlZmxhbmcgfHwgKF9jdHguZGVmbGFuZyAhPSdjbicgJiYgX2N0eC5kZWZsYW5nICE9ICdlbicpKXtcblx0XHRcdF9jdHguZGVmbGFuZyA9IFwiZW5cIjtcblx0XHR9XG5cblx0XHR0aGlzLmN0eCA9IF9jdHg7XG5cdH1cblxuXHRpbmRleEluaXQoKXtcblx0XHRcblx0XHRsZXQgX2N0eCA9IHRoaXMuY3R4O1xuXHRcdGxldCB0aGF0ID0gdGhpcztcblxuXHRcdCQoX2N0eC5sYW5nU2VsZWN0b3IpLm9uKCdjbGljaycsZnVuY3Rpb24oZXZlbnQpe1xuXHRcdFx0bGV0IGN1ckxnID0gJCh0aGlzKS5kYXRhKCdsZycpO1xuXHRcdFx0bGV0IGFjdGl2ZUNseiA9IF9jdHgubGFuZ0FjdGl2ZUNsYXp6IHx8IENERUYubGFuZ0FjdGl2ZUNsYXp6O1xuXHRcdFx0aWYoISQodGhpcykuaGFzQ2xhc3MoYWN0aXZlQ2x6KSl7XG5cdFx0XHRcdCQoX2N0eC5pMThuU2VsZWN0b3IpLnJlbW92ZUNsYXNzKGFjdGl2ZUNseik7XG5cdFx0XHRcdCQodGhpcykuYWRkQ2xhc3MoYWN0aXZlQ2x6KTtcblx0XHRcdFx0dGhhdC5zZXRMYW5nKGN1ckxnKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuc2V0TGFuZyhfY3R4LmRlZmxhbmcpO1xuXHR9XG5cblx0c2V0TGFuZyhsZyl7XG5cdFx0bGV0IHRoYXQgPSB0aGlzO1xuXHRcdCQodGhhdC5jdHguaTE4blNlbGVjdG9yKS5lYWNoKChpbmRleCxlbCkgPT4ge1xuXHRcdFx0bGV0IHRleHQgPSAkKGVsKS5kYXRhKCcnK2xnKTtcblxuXHRcdFx0aWYodGV4dCl7XG5cdFx0XHRcdCQoZWwpLnRleHQodGV4dCk7XG5cdFx0XHR9XG5cdFx0XHRsZXQgaW1nU3JjID0gJChlbCkuZGF0YShsZyt0aGF0LmN0eC5pbWdTcmMpO1xuXHRcdFx0aWYoaW1nU3JjKXtcblx0XHRcdFx0JChlbCkuYXR0cignc3JjJyxpbWdTcmMpO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgaHJlZlVybCA9ICQoZWwpLmRhdGEobGcrdGhhdC5jdHguYUhyZWYpO1xuXHRcdFx0aWYoaHJlZlVybCl7XG5cdFx0XHRcdCQoZWwpLmF0dHIoJ2hyZWYnLGhyZWZVcmwpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBJMThuOyJdfQ==
