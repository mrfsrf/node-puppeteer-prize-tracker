const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');


const PRODUCT_URLS = {
  productOne: 'cowin-SE7-Cancelling-Headphones-Comfortable-Black/dp/B07DB4WNFW' // Product 1 - Playstation
  productTwo: 'Google-PIXEL-G013C-64GB-Smartphone/dp/B07MTDQP7F' // Google Pixel 3XL
  productThree: 'Nintendo-Switch-Neon-eShop-Voucher/dp/B07TB3VS2C' // Nitendo switch
};

const url = (productUrl) =>
  `https://www.amazon.co.uk/${productUrl}`;


  async function configureBrowser() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    return page;
}


async function checkPrice(page) {
  await page.reload();
  let html = await page.evaluate(() => document.body.innerHTML);
  // console.log(html);

  $('#priceblock_dealprice', html).each(function() {
      let dollarPrice = $(this).text();
      // console.log(dollarPrice);
      let currentPrice = Number(dollarPrice.replace(/[^0-9.-]+/g,""));

      if (currentPrice < 300) {
          console.log("BUY!!!! " + currentPrice);
          sendNotification(currentPrice);
      }
  });
}

async function startTracking() {
  const page = await configureBrowser();

  let job = new CronJob('* */30 * * * *', function() { //runs every 30 minutes in this config
    checkPrice(page);
  }, null, true, null, null, true);
  job.start();
}


async function sendNotification(price) {

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: `${EMAIL}`,
      pass: `${PASS}`
    }
  });

  let textToSend = 'Price dropped to ' + price;
  let htmlText = `<a href=\"${url}\">Link</a>`;

  let info = await transporter.sendMail({
    from: '"Price Tracker" <*****@gmail.com>',
    to: `${EMAIL}`,
    subject: 'Price dropped to ' + price, 
    text: textToSend,
    html: htmlText
  });

  console.log("Message sent: %s", info.messageId);
}
