const jQuery = require('jquery');
global.I18n = require('./lib/i18n-common.js');
global.AbiManager = require('./lib/contract/abimanager.js');
global._hopsettings = require('./lib/utils/settings.js');
const BrowserUtil = require('./lib/utils/browserutil.js');
let ua = window.navigator.userAgent;
global._bw = new BrowserUtil(ua);
global.DAppUtils = require('./lib/dapp-utils.js');
