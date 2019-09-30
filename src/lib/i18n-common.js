
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