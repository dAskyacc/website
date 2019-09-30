/**
 * MetaMask Support
 *  |\_/|,,_____,~~`
 *  (.".)~~     )`~}}
 *   \o/\ /---~\\ ~}}
 *     _//    _// ~}
 * 
 * Copyright (c) 2019 hyperorchid.org,orchid2ev
 * E-mail :orchid@hyperorchid.org
 * git@flash:hyperorchidlab/website.git
 *
 */
'use strict';

const C = {
  TMP:"tmp",
  DIST:'dist'

}
const Version = require('../package.json').version;
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var zip = require('bestzip');