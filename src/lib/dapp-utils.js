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