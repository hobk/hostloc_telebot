const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();


const { timeout, keywords, dingTalkBotToken } = process.env
const options = {
  hostname: 'hostloc.com',
  path: '/forum.php?mod=forumdisplay&fid=45&filter=author&orderby=dateline',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
    'X-Forwarded-For': getRandomIp(),
  }
};
function getThreadList() {
  https.get(options, (res) => {
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => {

      data += chunk;
    });
    res.on('end', () => {
      const $ = cheerio.load(data);
      const $item = $('#threadlisttableid tbody');
      const result = [];
      $item.each((i, item) => {
        const $item = $(item);
        const $title = $item.find('.s.xst');
        const $url = 'https://hostloc.com/' + $item.find('.icn a').attr('href');
        const $by = $item.find('.by');
        const $author = $by.find('a');
        result.push({
          title: $title.text(),
          url: $url,
          by: $author.text(),
        });
      });
      listHandler(result);
      console.log('----', new Date().toLocaleString(), '获帖成功');
    });
  }).on('error', (e) => {
    console.log(`获取帖子列表错误: ${e.message}`);
  });
}

function listHandler(list) {
  const data = fs.readFileSync('./data.json', 'utf8');
  const dataJson = JSON.parse(data);
  list.forEach((item) => {
    const url = item.url;
    const isExist = dataJson.some((dataItem) => {
      return dataItem.url === url;
    });
    if (!isExist) {
      console.log('----', new Date().toLocaleString(), '新帖:', item.title);
      dingTalkRobot(item);
      dataJson.push(item);
    }
  });
  fs.writeFileSync('./data.json', JSON.stringify(dataJson));
}

function dingTalkRobot(item) {
  const postData = JSON.stringify({
    msgtype: 'markdown',
    markdown: {
      title: item.title,
      text: `#### ${item.title}\n\n> ${item.by}\n\n[详情](${item.url})`,
    },
  });
  const options = {
    hostname: 'oapi.dingtalk.com',
    path: '/robot/send?access_token=' + dingTalkBotToken,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    data: postData,
  };
  const arr = keywords.split(',')
  const isExist = arr.some((keyword) => {
    return item.title.includes(keyword);
  });
  if (!isExist) {
    return;
  }
  https.request(options, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      // console.log(`钉钉机器人发送消息成功: ${chunk}`);
    });
  }).on('error', (e) => {
    console.log(`钉钉机器人发送消息失败: ${e.message}`);
  }).end(postData);

}

function getRandomIp() {
  const ip = [];
  for (let i = 0; i < 4; i++) {
    ip.push(Math.floor(Math.random() * 255));
  }
  return ip.join('.');
};

function main() {
  setInterval(() => {
    getThreadList();
  }, timeout);
}
main()