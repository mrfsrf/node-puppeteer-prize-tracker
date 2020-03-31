require('dotenv').config({ debug: process.env.DEBUG })
const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

// gmail account settings
const EMAIL = process.env.MAIL_ADDRESS;
const PASS = process.env.MAIL_PASS;

let trackingUrl = '';


const PRODUCT_URLS = {
  productOne: 'dp/B07Q1YXVWH', // Product 1 - headphones
  productTwo: 'dp/B07MTDQP7F', // Google Pixel 3XL
  productThree: 'dp/B07W7H3LYZ', // Nitendo switch
  productFour: 'dp/B07Q3RX9MY'
  // https://www.amazon.co.uk/Dewdrop-Display-Smartphone-Ultra-wide-Sim-Free-Black/dp/B07Q3RX9MY?ref_=s9_apbd_otopr_hd_bw_b5qselD&pf_rd_r=66CXGMDETK4WKVPG5B69&pf_rd_p=6009d7e0-7bae-5e6b-9e98-f5228ba53cfd&pf_rd_s=merchandised-search-11&pf_rd_t=BROWSE&pf_rd_i=5362060031
};

const makeUrl = (product) => {
  return `https://www.amazon.co.uk/${product}`;
}


async function configureBrowser() {
    for (const [Product, ProductUrl] of Object.entries(PRODUCT_URLS)) {
      trackingUrl = makeUrl(ProductUrl);
      console.log(`Product ${Product} and url is ${trackingUrl}`)
      startTracking(trackingUrl);
    }
}

$.prototype.exists = function (selector) {
  return this.find($('#' + selector)).length > 0;
}

async function checkPrice(page) {
    await page.reload();
    let html = await page.evaluate(() => document.body.innerHTML);
    let productName = $('#productTitle', html).text();
    productName = productName.replace(/\s\s+/g, ' ');

    $("#price span[id^=priceblock_]", html).each(function () {
      let dollarPrice = $(this).text();
      const initialPrice = Number(dollarPrice.replace(/[^0-9.-]+/g, "")); // set first time only!
      console.log(productName);
      console.log(initialPrice);
      let currentPrice = Number(dollarPrice.replace(/[^0-9.-]+/g, ""));

      if (currentPrice < initialPrice) {
        console.log("BUY!!!! " + currentPrice);
        sendNotification(currentPrice, productName);
      }
    });
}

async function startTracking(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // const page = await configureBrowser();
    await page.goto(url);
    let job = new CronJob('* */30 * * * *', function () { //runs every 30 minutes in this config
      checkPrice(page);
    }, null, true, null, null, true);
    job.start();

}


async function sendNotification(price, product) {

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: `${EMAIL}`,
      pass: `${PASS}`
    }
  });

  let textToSend = 'Price for product ' + product + 'dropped to ' + price;
  let htmlText = `<a href=\"${trackingUrl}\">Link</a>`;

  let info = await transporter.sendMail({
    from: '"Price Tracker" <*****@gmail.com>',
    to: `${EMAIL}`,
    subject: 'Price dropped to ' + price,
    text: textToSend,
    html: htmlText
  });

  console.log("Message sent: %s", info.messageId);
}

configureBrowser();