const DemoItem = {
  hash:"0x8e276b5b23446d64348a6aed559493adac3f90df289b237fcdc68544559b1bc8",
  from:"0x052516025f45a9ad8d47eefdcc371346c467a9b1",
  state:"pending"
};

const C = {
  loadTXContainer:true
};

var DApp = {
  enabled:()=>{
    if(window.ethereum && window.ethereum.networkVersion =="1"){
      return true;
    }
    return false;
  },
  getTransactionObject:()=>{
    return {from:ethereum.selectedAddress}
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
    DApp.loadTxContainer();
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
    DApp.pirate = await web3.eth.contract(p.abi).at(p.main_address) ;
  },
  loadTxContainer:async ()=>{
    if(C.loadTXContainer){
      DApp.TxListInstance = new TxListGroup();
    }
  },
  query:(el)=>{
    if(!DApp.pirate)
      return Promise.reject(new Error('Contract load error'));
    let acc = ethereum.selectedAddress || $('[name="selectedAddress"]').val();
    console.log('Address>>>',acc);
    //set doing
    $(el).attr('disabled',"disabled");
    setOperatedTips('query...');

    // var data = DApp.pirate.bindingInfo.getData(acc);
    // console.log(data);

    DApp.pirate.bindingInfo.call(acc,(err,data)=>{
      if(data){
        console.log('>>>>>',data[0]+"");
        let ethBal =DApp.fromWei2Ether(data[0]);
        let hopBal =DApp.fromWei2Ether(data[1]);
        console.log('>>>>>',ethBal);
        $('[name="ethBalance"]').val(AccFormatter.formatMoney(ethBal,'',_hopsettings.precision.coin));
        $('[name="hopBalance"]').val(AccFormatter.formatMoney(hopBal,'',_hopsettings.precision.coin));
        $('[name="bindCount"]').val(data[2]);
      }
      //set done
      $(el).removeAttr('disabled');
      setOperatedTips('');
    });
  },
  validPreOperated:()=>{
    return DApp.enabled() && DApp.pirate && ethereum.selectedAddress;
  },
  binding:async (v)=>{
    if(!DApp.validPreOperated()){
      return Promise.reject(new Error('no wallet account or metamask load fail.'));
    }

    if($('[name="selectedAddress"]').val() != ethereum.selectedAddress) {
      $('[name="selectedAddress"]').val(ethereum.selectedAddress);
    }
    let txItem = {
      from:ethereum.selectedAddress,
      state:"pending",
      created:new Date().getTime()
    };

    $(ELTag.OperatedTipsID).text('unbinding...')
    setOperatedTips('unbinding...');

    return await DApp.pirate.unbind.sendTransaction(
      v,DApp.getTransactionObject(),(err,tx)=>{
        if(err){
          console.log(err);
          return false;
        }
        if(tx){
          txItem.hash = tx;
          DApp.addTx(txItem);
        }
        setOperatedTips('');
      });

  },
  /**
   * unbind 
   * @DateTime 2019-10-20
   * @param    {[type]}   v [description]
   * @return   {[type]}     [description]
   */
  unbinding:async (v)=>{
    if(!DApp.validPreOperated()){
      return Promise.reject(new Error('no wallet account or metamask load fail.'));
    }

    if($('[name="selectedAddress"]').val() != ethereum.selectedAddress) {
      $('[name="selectedAddress"]').val(ethereum.selectedAddress);
    }

    let txItem = {
      from:ethereum.selectedAddress,
      state:"pending",
      created:new Date().getTime()
    };

    $(ELTag.OperatedTipsID).text('unbinding...')
    setOperatedTips('unbinding...');
    return await DApp.pirate.unbind.sendTransaction(
      v,DApp.getTransactionObject(),(err,tx) =>{
        if(err){
          console.log(err);
          let ms = err.stack ? err.stack +"" :'unbind failed.';
          return false;
        }
        if(tx){
          console.log('>>>',tx+"");
          txItem.hash = tx;
          DApp.addTx(txItem);
        }
        setOperatedTips('');
      });
  },
  check:async (el)=>{
    if(!DApp.pirate)
      return Promise.reject(new Error('Contract load error'));
    let hopAddr = $('#hopAddress').val();
    if(!hopAddr){
      return Promise.reject(new Error('please input address....'))
    }
    let rs = DApp.pirate.check.call(hopAddr,(err,data)=> {
      if(err){
        return Promise.reject(err);
      }
      if(data){
        console.log(data[0]+"");
        console.log(data[1]+"");
        console.log(data[2]+"");
      }
    });
    return Promise.resolve(rs);
  },
  addTx:(txObjt) => {
    if(DApp.TxListInstance){

      let $container = $("#tableContainer");
      DApp.TxListInstance.appendTx($container,txObjt);
    }
  },
  fromWei2Ether:(bn) => {
    return web3.fromWei(bn,'ether');
  }
}; 
/* =========================== GLOBAL METHODS ============================ */
let ELTag = {
  "MetaMaskTips":".metamask-warn-container",
  "MetaMaskInstallHref":".metamask-guide",
  "OperatedTipsID":"#operatedTipsContent",
  "PirateInputAddrID":"#hopAddress",
  "PirateInputTipsID":"#hopInputTips"
};

function validHOP(id){
  if(typeof id ==undefined)return false;
  //id = id.trim();
  let reg = /^[a-zA-Z0-9]{45}$/;
  //console.log('l:',id.trim().length);
  return reg.test(id.trim());
}

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
    DApp.query(this);
    return false;
  });
}

function bindBindingBtn(){
  $('#bindBtn').on('click',function(e){
    let v = $(ELTag.PirateInputAddrID).val();
    let $inputTips = $(ELTag.PirateInputTipsID);
    if(v==''|| !validHOP(v)){
      $(this).attr('disabled','disabled');
      $inputTips.text('please input correct address.').removeClass('d-none');
      setTimeout(()=>{$inputTips.addClass('d-none')},5000);
      return false;
    }

    DApp.binding(v).catch(err=>{
      console.log(err.message);
      if(err.message == 'ValidError'){
        $("#hopInputTips").text('please input correct address.').removeClass('d-none');
        setTimeout(()=>{$("#hopInputTips").addClass('d-none')},5000)        
      }
      return false;
    }).then(data =>{

    });
    return false;
  });  
}

/**
 * Unbind click
 * @DateTime 2019-10-20
 * @return   {[type]}   [unbind click]
 */
function unbindBindingBtn(){
  $('#unbindBtn').on('click',function(e){
    let $el = this;
    let v = $(ELTag.PirateInputAddrID).val();
    let $inputTips = $(ELTag.PirateInputTipsID);
    if(v==''|| !validHOP(v)){
      $(this).attr('disabled','disabled');
      $inputTips.text('please input correct address.').removeClass('d-none');
      setTimeout(()=>{$inputTips.addClass('d-none')},5000);
      return false;
    }
    let data = DApp.unbinding(v).catch(err=>{
      if(err){
        console.log('outUnbind:',err);
      }
    }).then(()=>{

    });

    return false;
  });  
}

function balanceFormat(val,precision,symbol) {
  if(!val || val == 0 || val=="0") return "0.00"+(symbol||'');

  return AccFormatter.formatMoney(val,symbol||'',6);
}

function setOperatedTips(tips){
  let v= tips ||'';
  $(ELTag.OperatedTipsID).text(v);
}

function hopAddressChanged() {
  $("#hopAddress").on('input propertychange',(e) => {
    let v = $("#hopAddress").val();
    
    if(typeof v ==='undefined'|| !validHOP(v)){
      $('#bindBtn').attr('disabled',"disabled");
      $('#unbindBtn').attr('disabled',"disabled");
    }else{
      $('#bindBtn').removeAttr('disabled');
      $('#unbindBtn').removeAttr('disabled');
    }
  });
}

function testBtEventBind() {
  $("#testBtn").on('click',(e) =>{
    DApp.addTx(DemoItem);
  });
}
/* ============================== Load Begin ==================================== */
((window,$) =>{
 
  $(window).on('load',()=>{
    DApp.load().then((res)=>{
      console.log("DApp loaded",res);
      if(res != 'success'){
        browserNotSupportDapp(res);
      }
      toggleMMButton(DApp.enabled());
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
    bindQueryBtn();
    bindBindingBtn();
    unbindBindingBtn();
    hopAddressChanged();
    //testBtEventBind();
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