// 使用nodejs请求https://hostloc.com/forum.php?mod=forumdisplay&fid=45&filter=author&orderby=dateline；
// 1.获取页面内容
// 2.解析页面内容
// 3.获取帖子列表
// 4.获取帖子内容
// 5.获取帖子回复内容

const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const url = 'https://hostloc.com/forum.php?mod=forumdisplay&fid=45&filter=author&orderby=dateline';

https.get(url, res => {
  let html = '';
  res.on('data', data => {
    html += data;
  });
  res.on('end', () => {
    const $ = cheerio.load(html);
    const list = [];
    $('#threadlisttableid tbody[id^=normalthread]').each(function () {
      const title = $(this).find('th a').text().trim();
      const href = $(this).find('th a').attr('href');
      const author = $(this).find('td.by cite a').text().trim();
      const time = $(this).find('td.by em span').attr('title');
      const reply = $(this).find('td.num a').text().trim();
      list.push({
        title,
        href,
        author,
        time,
        reply
      });
    });
    console.log(list);
    const data = JSON.stringify(list);
    const filePath = path.resolve(__dirname, 'data.json');
    fs.writeFileSync(filePath, data);
  })
})
// 2.解析页面内容
// 3.获取帖子列表
// 4.获取帖子内容
// 5.获取帖子回复内容