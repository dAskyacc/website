const pkgJson = require('./package.json')
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const os = require('os');
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
checkPushFile(PUSH_FILE);
//
const creatDir = execMkdir();

//upload file

if(creatDir){
 let r =  execBash(uploadBash())
}



function preparedIEnv() {
  console.log('OS>>',os.type())
  if(!IEnv['REMOTE_HOST'])throw 'need set REMOTE_HOST'

  if(typeof IEnv['SSH_KEY'] !== 'string')throw 'need set SSH_KEY'

  let ssh_home = process.env['HOME'] || process.env['USERPROFILE'];   
  ssh_home = path.join(ssh_home,'.ssh');

  let sshKey = path.resolve(ssh_home,IEnv['SSH_KEY']);
  IEnv['SSH_KEY_PATH'] = sshKey
  if(shell.find(sshKey).length <= 0)throw 'not fund SSH_KEY'

  if(os.type()=='Windows_NT' && sshKey.indexOf(':') > 0){
    let at = sshKey.indexOf(':');
    sshKey = '\\'+sshKey.substring(0,at)  + sshKey.substring(at+1)

    IEnv['SSH_KEY_PATH'] = sshKey.replace(/\\/g,'/')
  }

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

  return ssh +' \''  + bash+'\''
}

function getSSHPreFix(){
  let str = `ssh -i ${IEnv.SSH_KEY_PATH} `


  if(IEnv.REMOTE_PORT) str =str + ` -p ${IEnv.REMOTE_PORT}`

  str = str + ` ${user}@${IEnv.REMOTE_HOST}`

  return str
}

function getSCPPreFix(){
  let str = `scp -i ${IEnv.SSH_KEY_PATH} `
  if(IEnv.REMOTE_PORT) str =str + ` -P ${IEnv.REMOTE_PORT} `
  return str
}

function execMkdir() {
  let bash = getCreateBackupFolderBash()
  console.log(bash)
  var execResult = shell.exec(bash,{silent:true,async:false}).stdout
  console.log('exec:',execResult)

  return !execResult
}

function uploadBash(){
  let bash = getSCPPreFix()

  bash = bash + `` + ` ${user}@${IEnv.REMOTE_HOST}:${IEnv.REMOTE_DEST_HOME}/${IEnv.BAK_FOLDER}/`

  return bash;
}

function execBash(bash) {
  console.log(bash)
  var execResult = shell.exec(bash,{silent:true,async:false}).stdout
  console.log('exec:',execResult)

  return !execResult  
}