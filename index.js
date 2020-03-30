require('dotenv').config({ debug: process.env.DEBUG })
const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

// gmail account settings
const EMAIL = process.env.MAIL_ADDRESS;
const PASS = process.env.MAIL_PASS;

let trackingUrl = '';

/* check if env variables loaded */
console.log(`Email address is ${EMAIL} and password is ${PASS}`);

const PRODUCT_URLS = {
  productOne: 'cowin-SE7-Cancelling-Headphones-Comfortable-Black/dp/B07DB4WNFW', // Product 1 - Playstation
  productTwo: 'Google-PIXEL-G013C-64GB-Smartphone/dp/B07MTDQP7F', // Google Pixel 3XL
  productThree: 'Nintendo-Switch-Neon-eShop-Voucher/dp/B07TB3VS2C' // Nitendo switch
};

const makeUrl = (product) => {
  return `https://www.amazon.co.uk/${product}`;
}

async function configureBrowser() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  for (const [Product, ProductUrl] of Object.entries(PRODUCT_URLS)) {
    trackingUrl = makeUrl(ProductUrl);
    await page.goto(trackingUrl);
  }
  return page;
}


async function checkPrice(page) {
  await page.reload();
  let html = await page.evaluate(() => document.body.innerHTML);
  // console.log(html);

  $('#priceblock_dealprice', html).each(function () {
    let dollarPrice = $(this).text();
    // console.log(dollarPrice);
    let currentPrice = Number(dollarPrice.replace(/[^0-9.-]+/g, ""));

    if (currentPrice < 300) {
      console.log("BUY!!!! " + currentPrice);
      sendNotification(currentPrice);
    }
  });
}

async function startTracking() {
  const page = await configureBrowser();

  let job = new CronJob('* */30 * * * *', function () { //runs every 30 minutes in this config
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

startTracking();
