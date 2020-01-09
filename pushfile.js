const pkgJson = require('./package.json')
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const DateFormat = require('fast-date-format');

const dateFormat = new DateFormat('YYDDDDhhmm');
const dateYMD = new DateFormat('YYMMDD');

let IEnv = {
  "REMOTE_ENABLE":false,
  "TMP_DEST":"tmp",
  "DEST":"dist",
  "LOG_DEST":"log",
  "REMOTE_DEST_HOME":"/data",
};

IEnv.BASE_DIR = process.cwd();

let envPath = path.resolve(path.join(process.cwd(),'.config'),'.env');
console.log('envPath',envPath);

var oEnv = require('dotenv').config({path:envPath,encoding:'utf8'});

if(oEnv.error){
  console.log("Load env Error:",oEnv.error);
  process.exit(1);
}else{
  //console.log('oEnv',JSON.stringify(oEnv.parsed,null,' '));
}


IEnv = Object.assign({},IEnv,oEnv.parsed);

preparedIEnv();

const user = IEnv.REMOTE_USER || 'root'

// public/**/.x. ed.
const PUSH_FILE = process.env.PUSH_FILE 
console.log('PUSH_FILE>>',PUSH_FILE)

//
execMkdir();



function preparedIEnv() {
  if(!IEnv['REMOTE_HOST'])throw 'need set REMOTE_HOST'

  if(typeof IEnv['SSH_KEY'] !== 'string')throw 'need set SSH_KEY'

  let ssh_home = process.env['HOME'] || process.env['USERPROFILE'];   
  ssh_home = path.join(ssh_home,'.ssh');

  let sshKey = path.resolve(ssh_home,IEnv['SSH_KEY']);
  IEnv['SSH_KEY_PATH'] = sshKey
  if(shell.find(sshKey).length <= 0)throw 'not fund SSH_KEY'


  let now = new Date()


  IEnv['BAK_FOLDER'] = dateYMD.format(now)
  IEnv['BAK_SUFFIX'] = dateFormat.format(now)
}

function checkPushFile(file) {
  if(!file)throw 'no push file '
  if(shell.find(file).length <= 0)throw 'not fund push file'
}

function buildShell(file) {
  let bash = ''
}

function getCreateBackupFolderBash(){
  let ssh = getSSHPreFix()

  let bash = `mkdir -p ${IEnv.REMOTE_DEST_HOME}/${IEnv.BAK_FOLDER}`

  return ssh +' '  + bash
}

function getSSHPreFix(){
  let str = `ssh -i ${IEnv.SSH_KEY_PATH} ${user}@${IEnv.REMOTE_HOST}`

  if(IEnv.REMOTE_PORT) str =str + ':'+IEnv.REMOTE_PORT

  return str
}

function execMkdir() {
  let bash = getCreateBackupFolderBash()
  console.log(bash)
  var execResult = shell.exec(bash,{silent:true,async:false}).stdout
  console.log('exec:',execResult)
}