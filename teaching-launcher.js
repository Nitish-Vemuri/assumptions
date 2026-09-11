'use strict';
const readline=require('node:readline');
const {Writable}=require('node:stream');
const {createServer}=require('./teaching-server');
async function main(){
  const args=process.argv.slice(2),portArg=args.find(x=>x.startsWith('--port='));
  const port=Number(portArg?portArg.slice(7):8001);
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Choose a port between 1024 and 65535.');
  if(args.includes('--ai')){
    if(!process.stdin.isTTY)throw Error('Run this launcher in an interactive terminal to enter your key.');
    process.stdout.write('OpenAI API key (hidden; paste and press Enter): ');
    const silent=new Writable({write(chunk,encoding,done){done();}});
    const prompt=readline.createInterface({input:process.stdin,output:silent,terminal:true});
    const key=await new Promise(resolve=>{prompt.on('SIGINT',()=>{prompt.close();resolve(null);});prompt.question('',answer=>{prompt.close();resolve(answer.trim());});});
    process.stdout.write('\n');
    if(!key)throw Error('No key entered. Server not started.');
    process.env.OPENAI_API_KEY=key;
  }
  const server=createServer();server.on('error',e=>{console.error(`Could not start: ${e.message}`);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Teaching lab: http://127.0.0.1:${port}/teaching.html\nKeep this terminal open. Press Ctrl+C to stop.`));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
