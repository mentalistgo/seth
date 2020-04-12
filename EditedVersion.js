'use strict';
const {exec} = require("child_process");
const fs = require('fs');
const cheerio = require('cheerio');
const ig = require('instagram-scraping');
const hack = require('hacker-quotes');
const sig = require('signale');
const boxen = require('boxen');
const moment = require('moment');
const Pornsearch = require("pornsearch");
const clc = require('cli-color');
const crypto = require("crypto");
const dab = require("dabi-images");
const dabi = new dab.Client();
const axios = require('axios');
const request = require('request');
const TBot = require("node-telegram-bot-api");
const token = '1178340577:AAF4BXsDLql4QZC3JNNrtmdYwJ75AN8y3QU' //insert your token
const sudo = '27532125' //insert SudoID
const bot = new TBot(token, {
 polling: true
});
const promise = require("bluebird");
promise.config({
 cancellation: true
});

console.log(boxen('KhodeReza', {borderStyle: 'round', padding: 1, margin: 1, float: 'center', borderColor: 'cyan', backgroundColor: 'magenta'}));

sig.success("Run Successful :D");

console.log(clc.magenta.bold('[Bot] Started....'));


bot.on('message', (msg) => {
 var ping = [
	" `Pong!` ",
	" *Online :D* ",
	"im Ok😉"
];
var rndanswr = ping[Math.floor(Math.random() * ping.length)];

 if (msg.text == "ping") {
  bot.sendMessage(msg.chat.id, rndanswr, {
   reply_to_message_id: msg.message_id,
   parse_mode: 'Markdown'
  });
  console.log(msg.text);
 }
});

var answers = [
	'سلام عزیزم😃',
	'سلام به روی ماهت😊',
	'سلام عشقم😁',
	'سلام عزیزدل عمو😍'
];
var rnd = answers[Math.floor(Math.random() * answers.length)];


bot.on('message', (msg) => {
 if(msg.text == "سلام") {
  bot.sendMessage(msg.chat.id, rnd,{
   reply_to_message_id: msg.message_id
  });
  console.log(msg);
 }
});

bot.onText(/\/start/,(msg)=>{
 bot.sendMessage(msg.chat.id,'Hi😊\nim a Fun Bot For Groups!\nFor Active Bot Please Send Message To @Enekaas');
});

bot.on('message', (msg) => {
	if (msg.text == "ban") {
 bot.kickChatMember(msg.chat.id, msg.reply_to_message.from.id);
 bot.sendMessage(msg.chat.id, `*${msg.reply_to_message.from.first_name}*, Banned From This Group!`, {
  parse_mode: 'Markdown'
 });
 }
});
bot.onText(/\groupname (.+)/, (msg, match) => {
 let name = match[1];
 bot.setChatTitle(msg.chat.id, name);
 bot.sendMessage(msg.chat.id, `*Done!*\nName Changed To ~> ${name}`,{
  parse_mode: 'Markdown'
 });
});
bot.onText(/\/sick (.+)/, (msg, match) => {
 var resp = match[1];
 bot.kickChatMember(msg.chat.id, resp);
 bot.sendMessage(msg.chat.id, `[User](tg://user?id=${resp}) is Sicked :)`, {
  parse_mode: 'Markdown'
 });
});

bot.onText(/\تنظیم مقام (.+)/, (msg, match) => {
 var resp = match[1];
 bot.sendMessage(msg.chat.id, `مقام ${msg.reply_to_message.from.first_name} به ${resp} تغییر یافت!`, {
  reply_to_message_id: msg.message_id
 });
});
var pro = {
 pid: process.pid,
 ver: process.version,
 plat: process.platform,
 title: process.title
}
bot.onText(/\process/, (msg) => {
 bot.sendMessage(msg.chat.id, JSON.stringify(pro), {
  reply_to_message_id: msg.message_id
 });
});

bot.onText(/\hash (.+)/, (msg, match) => {
 var resp = match[1];
 var hash = crypto.createHash('md5');
 var data = hash.update(resp, 'utf-8');
 var generateHash = data.digest('hex');
 bot.sendMessage(msg.chat.id, `Your Hash is: ${generateHash}`, {
  reply_to_message_id: msg.message_id
 });
});


function time() {
 return new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
}

bot.onText(/\/cmd (.+)/, (msg, match) => {
  var resp = match[1];
   if (msg.from.id == sudo) {
  exec(resp, (error, stdout, stderr) => {
   if (error) {
    console.log(`error: ${error.message}`);
    return;
   }
   if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
   }
   bot.sendMessage(msg.chat.id, `\n ${stdout}`, {
    reply_to_message_id: msg.message_id
   });
  });
 } else {
  bot.sendMessage(msg.chat.id, "Don't Use Shell Command😉", {
   reply_to_message_id: msg.message_id
  });
 }
});

bot.onText(/\/sendfile (.+)/, (msg, match) => {
 var resp = match[1];
 bot.sendDocument(msg.chat.id, resp, {
  caption: 'Density :D'
 });
});

bot.onText(/\whois (.+)/,(msg,match)=>{
	var resp = match[1];
	bot.sendMessage(msg.chat.id,`[User](tg://user?id=${resp}) Found!`,{reply_to_message_id: msg.message_id, parse_mode: 'Markdown'});

});

bot.on('message',(msg) => {
	if (msg.text.toLowerCase() == 'btcprice') {
 request.get('https://api.livecoin.net/exchange/ticker?currencyPair=BTC/USD', {
  json: {
    todo: 'Buy the milk'
  }
}, (error, res, body) => {
  if (error) {
    console.error(error)
    return
  }
  var s = JSON.stringify(res);
  var p = JSON.parse(s);
  var txt = p.request.href;
  var txt2 = JSON.stringify(txt);
  console.log(`statusCode: ${txt2}`);
  var qeymat = JSON.stringify(body)
  var price = JSON.parse(qeymat)
  var bitcoin = price.last * 15000;
  console.log(`Qeymat Rooz Bitcoin: ${bitcoin} Toman`)
  bot.sendMessage(msg.chat.id,`BTC Price: ${bitcoin} Toman`,{reply_to_message_id: msg.message_id});
 });
 }
});

bot.on('message',(msg) => {
	if (msg.text.toLowerCase() == 'arz') {
 axios.get('https://api.tgju.online/v1/data/sana/json').then(resp => {
  var usd = resp.data.sana_buy_usd.p;
  var eur = resp.data.sana_buy_eur.p;
  var aed = resp.data.sana_buy_aed.p;
  var tur = resp.data.sana_buy_try.p;
  bot.sendMessage(msg.chat.id, `*Dollar:\n${usd}\nEur:\n${eur}\nAed:\n${aed}\nLir:\n${tur}\n©Density 2020*`,{
	reply_to_message_id: msg.message_id,
	parse_mode: 'Markdown'
  });
 });
 }
});

bot.onText(/\/addsudo/,(msg)=>{
  bot.sendMessage(msg.chat.id, `User ${msg.reply_to_message.from.id} is Now Sudo! :D`,{reply_to_message_id: msg.message_id});
  console.log(sudos);
});

bot.on('message',(msg)=>{
 if (msg.text == 'random' && msg.from.id == sudo){
  axios.get('http://www.splashbase.co/api/v1/images/random').then(resp => {
  bot.sendPhoto(msg.chat.id, resp.data.url, { reply_to_message_id: msg.message_id});
  });
 }
});

bot.on('message',(msg) => {
 if (msg.text.toLowerCase() == "ass" && msg.from.id == sudo){
  dabi.nsfw.real.ass().then(json => {
   bot.sendPhoto(msg.chat.id, json.url, {reply_to_message_id: msg.message_id});
   });
  } else if (msg.text.toLowerCase() == "ass2" && msg.from.id == sudo){
   dabi.nsfw.hentai.ass().then(json => {
   bot.sendPhoto(msg.chat.id, json.url, {reply_to_message_id: msg.message_id});
  });
 } else if (msg.text.toLowerCase() == "sexy" && msg.from.id == sudo){
   dabi.nsfw.real.panties().then(json => {
    bot.sendPhoto(msg.chat.id, json.url, {reply_to_message_id: msg.message_id});
  });
 } else if (msg.text == "sexy2" && msg.from.id == sudo){
   dabi.nsfw.real.thighs().then(json => {
    bot.sendPhoto(msg.chat.id, json.url, {reply_to_message_id: msg.message_id});
  });
 }

});

bot.onText(/\porn (.+)/,(msg,match)=>{
 var resp = match[1];
 const search = new Pornsearch(resp);

 search.videos().then(videos => {
 for (var i = 0; i < videos.length; i++){
 bot.sendMessage(msg.chat.id, `${videos[i].title}\n${videos[i].url}\n`);
  }
 });
});

bot.on('message',(msg)=>{
if (msg.text == "panel" && msg.from.id == sudo){
  const opts = {
   "reply_markup": {
    "inline_keyboard": [
	[
	  {
	     	text: "🎈Author",
		callback_data: "Mr-Reza"
	  }
	]
     ]
   }
 };
bot.sendMessage(msg.chat.id, 'Select: ',opts);
}
});

bot.on("callback_query",(callbackQuery)=>{
 var msg = callbackQuery.message;
 bot.answerCallbackQuery(callbackQuery.id)
  .then(()=> bot.sendMessage(msg.chat.id, `🎈Author ~> @Enekaas`));
});

bot.onText(/\/restrict (.+)/,(msg,match)=>{
 if(match[1] == "on" && msg.from.id == sudo){
 var user = msg.reply_to_message.from.id;
 bot.restrictChatMember(msg.chat.id, user, {
  permissions: {
    can_send_messages: false
  }
});
 bot.sendMessage(msg.chat.id, `User ${user} Can't Send Message!`);
} else if (match[1] == "off" && msg.from.id == sudo){
 bot.restrictChatMember(msg.chat.id, msg.reply_to_message.from.id, {
  permissions: {
	can_send_messages: True
  }
 });
 bot.sendMessage(msg.chat.id, `User ${msg.reply_to_message.from.id} Now Can Send Messages :D`);
 }
});

bot.on('message',(msg)=>{
 if(msg.text.toLowerCase() == "unsplash" && msg.from.id == sudo){
  (async () => {
  const res = await axios('https://source.unsplash.com/random');
  const currentUrl = res.request.res.responseUrl;
  bot.sendPhoto(msg.chat.id, currentUrl);
 })();
 }
});

bot.on('message',(msg)=>{
 if(msg.text == 'pin' && msg.from.id == sudo){
  bot.pinChatMessage(msg.chat.id, msg.reply_to_message.message_id);
  bot.sendMessage(msg.chat.id, 'Pinned!',{reply_to_message_id: msg.message_id});
 }
});

bot.onText(/\/xnxx (.+)/,(msg,match) =>{
 var jvb = match[1];
 if (msg.from.id == sudo){
  axios.get(`http://kings-afg.tk/api/xnxx/?dl=${jvb}`).then(res => {
   var resp = JSON.stringify(res.data);
   var s = JSON.parse(resp);
   bot.sendMessage(msg.chat.id, s.url.high, {reply_to_message_id: msg.message_id});
  });
 }
});

bot.on('message',(msg,match)=>{
 if (msg.text == 'شعر' && msg.from.id == sudo){
   axios.get('http://c.ganjoor.net/beyt-json.php').then(res => {
   var result = res.data;
   var m1 = result.m1;
   var m2 = result.m2;
   var poet = result.poet;
   bot.sendMessage(msg.chat.id, `${m1}\n${m2}\nشاعر -> ${poet}`,{reply_to_message_id: msg.message_id});
  });
 }
});

bot.onText(/\/insta (.+)/,(msg,match)=>{
 var resp = match[1];
 bot.sendMessage(msg.chat.id, "Getting Information...");
 ig.scrapeUserPage(resp).then(res => {
 	var objs = {
   reply_to_message_id: msg.message_id,
   caption: `User: ${res.user.username}\nID: ${res.user.id}\nFullName: ${res.user.full_name}\nFollowers: ${res.user.edge_followed_by.count}\nFollowing: ${res.user.edge_follow.count}\nBio: ${res.user.biography}`
 }
  bot.sendPhoto(msg.chat.id,res.user.profile_pic_url_hd, objs);
 });
});

bot.on('message',(msg)=>{
 if (msg.text.toLowerCase() == "quote" && msg.from.id == sudo){
  var s = hack[Math.floor(Math.random() * hack.length)];
  bot.sendMessage(msg.chat.id,`Quote: ${s.quote}\n[ ${s.cite} ]`,{reply_to_message_id: msg.message_id});
 }
});

bot.on('message',(msg)=>{
if (msg.text.toLowerCase() == "htbcode"){
(async () => {
 await exec('curl -X POST https://www.hackthebox.eu/api/invite/generate',(err, stdout, stderr) => {
  bot.sendMessage(msg.chat.id, `${stdout}`,{reply_to_message_id: msg.message_id});
  });
 })();
 }
});

bot.on('message',(msg)=>{
if (msg.text == "کون" && msg.from.id == sudo){
 axios.get("http://api.obutts.ru/noise/1").then(res => {
 var koon = res.data[0].preview;
 bot.sendPhoto(msg.chat.id, `http://media.obutts.ru/${koon}`);
 });
 } else if (msg.text == "ممه" && msg.from.id == sudo){
  axios.get("http://api.oboobs.ru/noise/1").then(res => {
  var mame = res.data[0].preview;
  bot.sendPhoto(msg.chat.id, `http://media.oboobs.ru/${mame}`);
  });
 }
});

bot.on('message',(msg)=>{
 if(msg.text == "امار کرونا"){
  axios.get("https://sobhan11.toucanhost.ir/index.php").then(res=>{
   var mobtala = res.data.cases;
   var dead = res.data.deads;
   var darman = res.data.recovered;
   bot.sendMessage(msg.chat.id, `تعداد افراد مبتلا: ${mobtala}\nتعداد افراد مرده: ${dead}\nتعداد افراد درمان شده: ${darman}`,{reply_to_message_id: msg.message_id});
  });
 }
});

bot.onText(/\/livetime/,(msg)=>{
 bot.sendMessage(msg.chat.id,"Reloading....").then(res=>{
 setInterval(()=>{
  bot.editMessageText(time(), {message_id: res.message_id, chat_id: res.chat.id});
 }, 1000);
  });
});

bot.on('message',(msg)=>{
 if(msg.text.toLowerCase() == "time"){
  bot.sendMessage(msg.chat.id,"Get Time...").then(res=>{
   setInterval(()=>{
    bot.editMessageText(`${moment().format('MMMM Do YYYY, h:mm:ss a')}`, {message_id: res.message_id, chat_id: res.chat.id});
  }, 1000);
  });
 }
});

bot.onText(/\/reload/,(msg)=>{
 bot.sendMessage(msg.chat.id,"Reloading...").then(res=>{
  bot.editMessageText('> Reloaded :D',{message_id: res.message_id, chat_id: res.chat.id});
 });
});

bot.onText(/\/laqab (.+)/,(msg,match)=>{
 var res1 = match[1];
 var res2 = match[2];
 var from = msg.reply_to_messsge.from.id;
 cli.set(from, res1, (err,res)=>{
  if (err) throw err;
  console.log(res);
  bot.sendMessage(msg.chat.id, `لقب ${msg.reply_to_message.from.first_name} به ${res1} تغییر یافت`);
  });
});

bot.onText(/\/analorde/,(msg)=>{

 const url = "https://www.picuki.com/profile/ana.lorde";
 const fetchData = async () => {
  const res = await axios.get(url);
  return cheerio.load(res.data);
 };
 (async () => {
  const $ = await fetchData();
  $('.post-image').each((i, el)=>{
   const img = $(el).attr('src');
   bot.sendPhoto(msg.chat.id, img);
  });
 })();
});

bot.onText(/\/post (.+)/,(msg, match)=>{
 var resp = match[1];
 axios(resp).then(res=>{
  const $ = cheerio.load(res.data);
  const link = $('meta[property="og:image"]').attr('content');
  bot.sendDocument(msg.chat.id, link, {caption: 'Insta Downloader', reply_to_message_id: msg.message_id, filename: 'Density-Bot'});

  });
});
