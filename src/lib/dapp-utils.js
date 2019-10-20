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