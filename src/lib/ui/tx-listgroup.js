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