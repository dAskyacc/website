var DApp = {
  enabled:()=>{
    if(window.ethereum && window.ethereum.networkVersion =="1"){
      return true;
    }
    return false;
  },

  load:async() => {
    if(!_bw.supportMetaMask())
      return "Current browser not support Dapp,Please use Chrome，Firefox or Opera.";

    if(typeof window.web3 ==='undefined')
      return Promise.reject(new Error("Current browser need MetaMask,please install it."));
    //return Promise.reject(new Error('Need install MetaMask first'));
    await DApp.initWeb3();
    //console.log(_bw.Info);
    await DApp.loadContract();
    return "success";
  },
  initWeb3: async() =>{

    if(window.ethereum){
      window.ethereum.enable()
        .catch(reson =>{
          return Promise.reject(new Error(reson));
        })
        .then(accounts =>{
          //networkVersion check
          fillSelectedAddress(ethereum.selectedAddress);
          if(DAppUtils){
            let netShow = DAppUtils.getNetwork(ethereum.networkVersion);
            fillEthNetworkShow(netShow);
          }
          UnsupportNetworkWarn(DApp.enabled())
        });
      window.ethereum.on('accountsChanged',()=>{
         fillSelectedAddress(ethereum.selectedAddress);
      });  
      window.ethereum.on('networkChanged',(workId)=>{
        DApp.enabled = workId == requiredNetwork;
        toggleMMButton(DApp.enabled);
        console.log('networkChanged>>>>',workId);
      });

    }else if(window.web3){
      DApp.web3Provider = window.web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    }

    if(window.web3){
      // DApp.web3Provider = window.web3.currentProvider;
      // web3 = new Web3(web3.currentProvider);
    }else{
      return Promise.reject(new Error('Non-Ethereum browser detected. You should consider trying MetaMask!'));
    }
    
  },
  loadContract:async()=>{
    let p = AbiManager.getMaster();
    DApp.pirate = web3.eth.contract(p.abi).at(p.main_address) ;
  },
  query:()=>{
    if(!DApp.pirate)
      return Promise.reject(new Error('Contract load error'));
    let acc = ethereum.selectedAddress || $('[name="selectedAddress"]').val();
    console.log('Address>>>',acc)
    DApp.pirate.bindingInfo.call(acc,(err,data)=>{
      if(data){
        console.log('>>>>>',data[0]+"");
        let ethBal =DApp.fromWei2Ether(data[0]);
        let hopBal =DApp.fromWei2Ether(data[1]);
        console.log('>>>>>',ethBal);
        $('[name="ethBalance"]').val(ethBal);
        $('[name="hopBalance"]').val(hopBal);
        $('[name="bindCount"]').val(data[2]);
      }
    });

  },
  fromWei2Ether:(bn) => {
    return web3.fromWei(bn,'ether');
  }
}; 
/* =========================== GLOBAL METHODS ============================ */
let ELTag = {
  MetaMaskTips:".metamask-warn-container",
  MetaMaskInstallHref:".metamask-guide"
};

function fillSelectedAddress(address){
  $('[name="selectedAddress"]').val(address||'');
}
function fillEthNetworkShow(name){
  $(".eth-network-show").text(name);
}

function UnsupportNetworkWarn(b){
  b ? $("#netShowContainer").removeClass('text-danger').addClass('text-success') : 
  $("#netShowContainer").removeClass('text-success').addClass('text-danger');
}

function bindQueryBtn(){
  $('#queryBtn').on('click',function(e){
    DApp.query();
    return false;
  });
}

function balanceFormat(val,precision,symbol) {
  if(!val || val == 0 || val=="0") return "0.00"+(symbol||'');

  return AccFormatter.formatMoney(val,symbol||'',6);
}

/* ============================== Load Begin ==================================== */
((window,$) =>{
 
  $(window).on('load',()=>{
    DApp.load().then((res)=>{
      console.log(res);
      if(res != 'success'){
        browserNotSupportDapp(res);

      }
      toggleMMButton(DApp.enabled());
      initBindElEvents();
    }).catch(error =>{
      console.log('error',error);
      NoMetaMaskError(error);
      toggleMMButton(DApp.enabled());
    });
  });

  function initBindElEvents(){
    var i18n = new I18n('en');
    i18n.indexInit();
    bindQueryBtn();
  }


  function toggleMMButton(b){
    if(b){
      $(".mm-btn").removeAttr('disabled');
    }else{
      $(".mm-btn").attr('disabled',"disabled");
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