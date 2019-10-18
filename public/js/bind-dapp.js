var DApp = {
  load:async() => {
    if(!_bw.supportMetaMask())
      return "Current browser not support Dapp,Please use Chrome，Firefox or Opera.";

    if(!window.Web3)
      return Promise.reject(new Error("Current browser need MetaMask,please install it."));
    //return Promise.reject(new Error('Need install MetaMask first'));
    await DApp.initWeb3();
    console.log(_bw.Info);
    await DApp.loadContract();


    return "success";
  },
  initWeb3: async() =>{
    if(window.ethereum){
      window.web3 = new Web3();
    }
  },
  loadContract:async()=>{

  }
};

let ELTag = {
  MetaMaskTips:".metamask-warn-container",
  MetaMaskInstallHref:".metamask-guide"
};
((window,$) =>{
  
  

  $(window).on('load',()=>{
    DApp.load().then((res)=>{
      console.log(res);
      if(res != 'success'){
        browserNotSupportDapp(res);
        toggleMMButton(false);
      }
      toggleMMButton(true);
      initBindElEvents();
    }).catch(error =>{
      console.log('error',error);
      NoMetaMaskError(error);
      toggleMMButton(false);
    });
  });

  function initBindElEvents(){
    var i18n = new I18n('en');
    i18n.indexInit();
  }

  function fillSelectedAddress(address){
    
  }

  function toggleMMButton(b){
    if(b){
      $(".mm-btn").removeAttr('disabled');
    }else{
      $(".mm-btn").addAttr('disabled',"disabled");
    }
  }

  function browserNotSupportDapp(message){
    $(ELTag.MetaMaskInstallHref).addClass('d-none');
    $(ELTag.MetaMaskTips).find('p').text(message);
    $(ELTag.MetaMaskTips).removeClass('d-none');
  }

  function NoMetaMaskError(message) {
    if(_bw.supportMetaMask()){
      let href = _bw.getMetaMaskHref(_hopsettings.metamask);
      console.log(href);
      if(href)$(ELTag.MetaMaskInstallHref).find('a').attr('href',href);

      $(ELTag.MetaMaskInstallHref).removeClass('d-none');
    }
    $(ELTag.MetaMaskTips).find('p').text(message);
    $(ELTag.MetaMaskTips).removeClass('d-none');
  }
})(window,jQuery);