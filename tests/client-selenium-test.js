const { Builder, By, Key, until } = require('selenium-webdriver');
require('selenium-webdriver/chrome');
require('selenium-webdriver/firefox');
require('chromedriver');
require('geckodriver');
const helpers = require('./tests-helpers');
const www = require("../src/bin/server/javascripts/main-express");
const vcfServer = require('../src/bin/server/javascripts/vcf-server');
const config = require('../src/bin/config.js');
const passwords = require('./etc/passwords.json');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');

const rootURL = 'http://localhost:3000/';
let driver;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 5;
const clientApiKey = vcfServer.vcf_keys.youtube.clientApiKey;

async function openDB() {
    await helpers.deleteFile('./tests/resources/db-zhykos.temp');
    fs.copyFileSync('./tests/resources/db-zhykos.json', './tests/resources/db-zhykos.temp');
    const adapter = new FileSync('./tests/resources/db-zhykos.temp');
    const dbTests = lowdb(adapter);
    dbTests.defaults({ videos: [] }).write();
    dbTests.defaults({ channels: [] }).write();
    jest.spyOn(vcfServer.db, "get").mockImplementation(getWhat => dbTests.get(getWhat));
    jest.spyOn(vcfServer.db, "has").mockImplementation(getWhat => dbTests.has(getWhat));
}

async function openEmptyDB() {
    helpers.deleteFile('./tests/resources/db-empty.temp');
    const adapter = new FileSync('./tests/resources/db-empty.temp');
    const dbTests = lowdb(adapter);
    dbTests.defaults({ videos: [] }).write();
    dbTests.defaults({ channels: [] }).write();
    jest.spyOn(vcfServer.db, "get").mockImplementation(getWhat => dbTests.get(getWhat));
    jest.spyOn(vcfServer.db, "has").mockImplementation(getWhat => dbTests.has(getWhat));
}

describe('beforeAll', () => {

    test("beforeAll", async() => {
        jest.clearAllMocks();
        driver = await new Builder().forBrowser(config.BROWSER_TEST).build();
        await driver.manage().window().maximize();
        await openDB();
    });

});

describe('Selenium tests', () => {

    test("Init tests", async() => {
        await driver.get(rootURL);
        helpers.takeScreenshotForDocumentation("client-guide-00", driver);
    });

    test('Display hidden videos', async() => {

        // Default display

        await helpers.assertNoId('video_TuAc5KxXGQ4', driver);
        await helpers.selectId('video_f5s2yomPNL0', driver);
        await helpers.assertNoId('button-hide-hidden', driver);
        await helpers.assertCountElementsByClass("video", 38, driver);

        // Show hidden

        const linkShowHidden = await helpers.selectId('button-show-hidden', driver);
        await linkShowHidden.click();

        await helpers.assertNoId('button-show-hidden', driver);
        await helpers.selectId('button-hide-hidden', driver);
        await helpers.selectId('video_TuAc5KxXGQ4', driver);
        await helpers.selectId('video_f5s2yomPNL0', driver);
        await helpers.assertCountElementsByClass("video", 100, driver);

        helpers.takeScreenshotForDocumentation("client-guide-08", driver);

        // Back to default display

        const linkHideHidden3 = await helpers.selectId('button-hide-hidden', driver);
        await linkHideHidden3.click();

        await helpers.assertNoId('button-hide-hidden', driver);
        await helpers.selectId('button-show-hidden', driver);
        await helpers.assertNoId('video_TuAc5KxXGQ4', driver);
        await helpers.selectId('video_f5s2yomPNL0', driver);
        await helpers.assertCountElementsByClass("video", 38, driver);
    });

    test('Change channel', async() => {

        // Default display

        await helpers.selectId('video_f5s2yomPNL0', driver);
        await helpers.selectId('video_4QXpyrp8WUo', driver);

        // Zhykos channel

        const linkZhykos = await helpers.selectId('button-channel-UCWJHqzXc7rKO7h5TzYYBNFw', driver);
        await linkZhykos.click();

        await helpers.selectId('video_f5s2yomPNL0', driver);
        await helpers.assertNoId('video_4QXpyrp8WUo', driver);

        helpers.takeScreenshotForDocumentation("client-guide-11", driver);

        // Skywilly channel

        const linkSkywilly = await helpers.selectId('button-channel-UCnygly7mB_KSETq9zPclZVA', driver);
        await linkSkywilly.click();

        await helpers.assertNoId('video_f5s2yomPNL0', driver);
        await helpers.selectId('video_4QXpyrp8WUo', driver);

        // Back to default display

        const linkAllChannels = await helpers.selectId('button-channel-#all', driver);
        await linkAllChannels.click();

        await helpers.selectId('video_f5s2yomPNL0', driver);
        await helpers.selectId('video_4QXpyrp8WUo', driver);
    });

    test('Open video iframe', async() => {

        // Default display

        await helpers.assertIsNotVisibleById("popup", driver);

        // Open video

        const linkOpen = await helpers.selectId('button-open-4QXpyrp8WUo', driver);
        await linkOpen.click();
        await helpers.assertIsVisibleById("popup", driver);

        await helpers.waitMilli(2000);
        helpers.takeScreenshotForDocumentation("client-guide-13", driver);

        // Close video

        const linkClose2 = await helpers.selectId('close', driver);
        await linkClose2.click();
        await helpers.waitMilli(2000);
        await helpers.assertIsNotVisibleById("popup", driver);
        await helpers.selectId('video_4QXpyrp8WUo', driver);
    });

    test('Open video then mask', async() => {

        // Default display

        await helpers.assertIsNotVisibleById("popup", driver);
        await helpers.selectId('video_4QXpyrp8WUo', driver);
        await helpers.assertIsVisibleById("video_4QXpyrp8WUo", driver);

        // Open video

        const linkOpen = await helpers.selectId('button-open-hide-4QXpyrp8WUo', driver);
        await linkOpen.click();
        await helpers.assertIsVisibleById("popup", driver);

        // Close video

        const linkClose2 = await helpers.selectId('close', driver);
        await linkClose2.click();
        await helpers.waitMilli(2000);
        await helpers.assertIsNotVisibleById("video_4QXpyrp8WUo", driver);
    });

    test('Mask video', async() => {

        // Default display

        await helpers.selectId('video_FK30dDJh7fQ', driver);
        await helpers.assertIsVisibleById("video_FK30dDJh7fQ", driver);

        // Hide video

        const linkHide = await helpers.selectId('swap_FK30dDJh7fQ', driver);
        await linkHide.click();
        await helpers.assertIsNotVisibleById("video_FK30dDJh7fQ", driver);
    });

    test('Show masked video', async() => {

        // Default display

        await helpers.assertIsNotVisibleById("video_FK30dDJh7fQ", driver);
        await helpers.waitMilli(2000);

        // Show all videos

        const linkShowHidden = await helpers.selectId('button-show-hidden', driver);
        await linkShowHidden.click();
        await helpers.waitMilli(2000);
        await helpers.assertIsVisibleById("video_FK30dDJh7fQ", driver);

        // Unmask video

        const linkShow = await helpers.selectId('swap_FK30dDJh7fQ', driver);
        await linkShow.click();
        await helpers.waitMilli(2000);
        await helpers.assertIsVisibleById("video_FK30dDJh7fQ", driver);

        // Undo show all videos

        const linkHideHidden = await helpers.selectId('button-hide-hidden', driver);
        await linkHideHidden.click();
        await helpers.waitMilli(2000);
        await helpers.assertIsVisibleById("video_FK30dDJh7fQ", driver);
    });

    test('Open video in source website', async() => {

        // Default display

        await helpers.assertIsVisibleById("video_FK30dDJh7fQ", driver);

        // Open

        const linkOpenOrigin = await helpers.selectId('button-open-website-FK30dDJh7fQ', driver);
        await linkOpenOrigin.click();
        await helpers.waitMilli(2000);

        await driver.getAllWindowHandles().then(function(handles) {
            driver.switchTo().window(handles[1]);
            helpers.assertNoId("video_FK30dDJh7fQ", driver);
            driver.getCurrentUrl().then(async function(url) {
                if (url.includes("consent.youtube.com")) { // new consent page for unlogged accounts
                    await driver.findElements(By.xpath('//div/div/div/div[2]/div[1]/div[4]/form/div[1]/div/button/span')).then(async function(elements) {
                        expect(elements.length).toBe(1);
                        await elements[0].click();
                        await helpers.waitMilli(2000);

                        driver.getCurrentUrl().then(function(url) {
                            expect(url).toBe("https://www.youtube.com/watch?v=FK30dDJh7fQ");
                        });
                    });
                } else {
                    expect(url).toBe("https://www.youtube.com/watch?v=FK30dDJh7fQ");
                }
            });
            driver.close();
            driver.switchTo().window(handles[0]);
        });

        // Back in main page

        await helpers.assertIsVisibleById("video_FK30dDJh7fQ", driver);
    });

    test('No error', async() => {
        await helpers.assertIsNotVisibleById("settings-error", driver);
    });

    test('Check CSS', async() => {
        const linkShowHidden = await helpers.selectId('button-show-hidden', driver);
        await linkShowHidden.click();
        await helpers.waitMilli(2000);

        await helpers.assertIsVisibleById("whitelist_Oqp-Y_LUUDo", driver);
        await helpers.assertNoId("blacklist_Oqp-Y_LUUDo", driver);

        await helpers.assertIsVisibleById("blacklist_TuAc5KxXGQ4", driver);
        await helpers.assertNoId("whitelist_TuAc5KxXGQ4", driver);

        await helpers.assertNoId("whitelist_4QXpyrp8WUo", driver);
        await helpers.assertNoId("blacklist_4QXpyrp8WUo", driver);

        await helpers.assertClassById("img_Oqp-Y_LUUDo", "hiddenImage", driver);
        await helpers.assertClassById("title_Oqp-Y_LUUDo", "hiddenText", driver);

        await helpers.assertNoClassById("img_nArW0DjUMB8", driver);
        await helpers.assertNoClassById("title_nArW0DjUMB8", driver);

        await helpers.assertAttributeById("swap_LOilCuZhB5o", "src", rootURL + "images/visible.png", driver);
        await helpers.assertAttributeById("swap_ATsjtKOX-qY", "src", rootURL + "images/hide.png", driver);
    });

});

// Not a test but I dont care...
if (config.BROWSER_TEST == "chrome") {
    describe('Other screenshots', () => {

        test('Delete temp files', async() => {
            helpers.deleteFile('./doc/images/client-guide-07-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-09-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-10-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-12-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-14-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-15-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-16-temp.jpg');
        });

        test('client-guide-06', () => {
            helpers.cropImage('client-guide-00', 'client-guide-06', 0, 0, 1920, 720);
        });

        test('client-guide-07', () => {
            helpers.cropImage('client-guide-00', 'client-guide-07-temp', 0, 0, 805, 449).then(function() {
                helpers.drawRedNotFilledRectangle('client-guide-07-temp', 'client-guide-07', 7, 47, 157, 94);
            });
        });

        test('client-guide-09', () => {
            helpers.cropImage('client-guide-08', 'client-guide-09-temp', 0, 0, 581, 386).then(function() {
                helpers.drawRedNotFilledRectangle('client-guide-09-temp', 'client-guide-09', 7, 47, 157, 94);
            });
        });

        test('client-guide-10', () => {
            helpers.cropImage('client-guide-00', 'client-guide-10-temp', 0, 0, 581, 386).then(function() {
                helpers.drawRedNotFilledRectangle('client-guide-10-temp', 'client-guide-10', 4, 152, 146, 251);
            });
        });

        test('client-guide-12', () => {
            helpers.cropImage('client-guide-00', 'client-guide-12-temp', 998, 156, 1202, 353).then(function() {
                helpers.drawRedNotFilledRectangle('client-guide-12-temp', 'client-guide-12', 45, 167, 151, 196);
            });
        });

        test('client-guide-14', () => {
            helpers.cropImage('client-guide-13', 'client-guide-14-temp', 755, 136, 1283, 488).then(function() {
                helpers.drawRedNotFilledRectangle('client-guide-14-temp', 'client-guide-14', 231, 291, 318, 310);
            });
        });

        test('client-guide-15', () => {
            helpers.cropImage('client-guide-08', 'client-guide-15-temp', 184, 341, 407, 532).then(function() {
                helpers.drawRedNotFilledRectangle('client-guide-15-temp', 'client-guide-15', 102, 144, 148, 184);
            });
        });

        test('client-guide-16', () => {
            helpers.cropImage('client-guide-08', 'client-guide-16-temp', 790, 161, 999, 342).then(function() {
                helpers.drawRedNotFilledRectangle('client-guide-16-temp', 'client-guide-16', 48, 148, 70, 177);
            });
        });

        test('Delete temp files', async() => {
            helpers.deleteFile('./doc/images/client-guide-07-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-09-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-10-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-12-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-14-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-15-temp.jpg');
            helpers.deleteFile('./doc/images/client-guide-16-temp.jpg');
        });

    });
}

describe('Selenium error tests', () => {

    test("Init error tests", async() => {
        vcfServer.vcf_keys.youtube.clientApiKey = "<XXX>";
        await driver.get(rootURL);
    });

    test('No parameter file', async() => {
        await helpers.assertIsVisibleById("settings-error", driver);
    });

});

describe('Empty database', () => {

    test("Init empty database", async() => {
        vcfServer.vcf_keys.youtube.clientApiKey = clientApiKey;
        vcfServer.vcf_channels.channels.splice(0, 9);
        jest.clearAllMocks();
        await openEmptyDB();
        helpers.deleteFile('./doc/images/client-guide-empty-temp.jpg');
        helpers.deleteFile('./doc/images/client-guide-03-temp.jpg');
        helpers.deleteFile('./doc/images/client-guide-04-temp1.jpg');
        helpers.deleteFile('./doc/images/client-guide-04-temp2.jpg');
    });

    test("empty homepage", async() => {
        await driver.get(rootURL);

        if (config.BROWSER_TEST == "chrome") {
            helpers.takeScreenshotForDocumentation("client-guide-empty-temp", driver);

            await helpers.waitMilli(2000);

            await helpers.cropImage('client-guide-empty-temp', 'client-guide-01', 0, 0, 649, 290).then(function() {
                helpers.drawRedNotFilledRectangle('client-guide-01', 'client-guide-02', 9, 15, 122, 46);
            });
        }
    });

    test.skip("fetch videos", async() => {
        await driver.findElements(By.xpath('//*[@id="main"]/div[@class="video"]')).then(function(elements) {
            expect(elements.length).toBe(0);
        });

        const linkConnect = await helpers.selectId('button-connection', driver);
        await linkConnect.click();
        await helpers.waitMilli(2000);

        await driver.findElements(By.id("identifierId")).then(function(elements) {
            expect(elements.length).toBe(1);
            elements[0].sendKeys(passwords.youtube.login);
        });

        await driver.findElements(By.xpath('//*[@id="identifierNext"]/div/button')).then(function(elements) {
            expect(elements.length).toBe(1);
            elements[0].click();
        });

        await helpers.waitMilli(3000);

        await driver.findElements(By.xpath('//*[@id="password"]/div[1]/div/div[1]/input')).then(async function(elements) {
            if (elements.length == 0) {
                // Not secured browser: try a workaround
                await youtubeConnectionWorkaround();
            } else {
                expect(elements.length).toBe(1);
                elements[0].sendKeys(passwords.youtube.password);
            }
        });

        await driver.findElements(By.xpath('//*[@id="passwordNext"]/div/button')).then(function(elements) {
            expect(elements.length).toBe(1);
            elements[0].click();
        });

        if (passwords.youtube.hasDoubleAuth) {
            await helpers.waitMilli(30000);
        } else {
            await helpers.waitMilli(3000);
        }

        helpers.takeScreenshotForDocumentation("client-guide-03", driver);

        await driver.findElements(By.xpath('//*[@id="view_container"]/div/div/div[2]/div/div[1]/div/form/span/section/div/div/div/div/ul/li[1]/div')).then(function(elements) {
            expect(elements.length).toBe(1);
            elements[0].click();
        });

        await helpers.waitMilli(3000);

        await driver.findElements(By.xpath('//*[@id="main"]/div[@class="video"]')).then(function(elements) {
            expect(elements.length).toBe(0);
        });

        helpers.takeScreenshotForDocumentation("client-guide-04-temp1", driver);

        const linkFetch = await helpers.selectId('button-fetch', driver);
        await linkFetch.click();
        await helpers.waitMilli(3000);

        await driver.navigate().refresh();

        await driver.findElements(By.xpath('//*[@id="main"]/div[@class="video"]')).then(function(elements) {
            expect(elements.length).toBe(39);
        });

        if (config.BROWSER_TEST == "chrome") {
            await helpers.cropImage('client-guide-03', 'client-guide-03-temp', 725, 205, 1205, 755).then(function() {
                helpers.drawBlackRectangle('client-guide-03-temp', 'client-guide-03', 35, 205, 435, 345);
            });

            await helpers.cropImage('client-guide-04-temp1', 'client-guide-04-temp2', 0, 0, 643, 216).then(croppedImage => {
                    helpers.drawRedNotFilledRectangle('client-guide-04-temp2', 'client-guide-04', 7, 15, 135, 45);
                },
                errMessage => { console.log(errMessage); }
            );

            await helpers.waitMilli(3000);
        }
    });

    test("delete temp files", async() => {
        helpers.deleteFile('./doc/images/client-guide-empty-temp.jpg');
        helpers.deleteFile('./doc/images/client-guide-03-temp.jpg');
        helpers.deleteFile('./doc/images/client-guide-04-temp1.jpg');
        helpers.deleteFile('./doc/images/client-guide-04-temp2.jpg');
    });

});

describe('afterAll', () => {

    test("afterAll", async() => {
        jest.clearAllMocks();
        helpers.deleteFile('./tests/resources/db-zhykos.temp');
        helpers.deleteFile('./tests/resources/db-empty.temp');
        www.expressServer.close();
        driver.quit();
    });

});

async function youtubeConnectionWorkaround() {
    await driver.get("https://accounts.google.com/o/oauth2/auth/oauthchooseaccount?client_id=717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com&scope=profile%20email&redirect_uri=https%3A%2F%2Fstackauth.com%2Fauth%2Foauth2%2Fgoogle&state=%7B%22sid%22%3A1%2C%22st%22%3A%2259%3A3%3Abbc%2C16%3A1b89f0b22616eb32%2C10%3A1621595940%2C16%3Ae12a61b3379196b1%2C188bfc7145ea5573409a4fc098820f09d4b8f81ccefc83a2eb628ed2ef312378%22%2C%22cdl%22%3Anull%2C%22cid%22%3A%22717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com%22%2C%22k%22%3A%22Google%22%2C%22ses%22%3A%22012e2c67171243b29dbb9582cfbff102%22%7D&response_type=code&flowName=GeneralOAuthFlow");


    await driver.findElements(By.id("identifierId")).then(function(elements) {
        expect(elements.length).toBe(1);
        elements[0].sendKeys(passwords.youtube.login);
    });

    await driver.findElements(By.xpath('//*[@id="identifierNext"]/div/button')).then(function(elements) {
        expect(elements.length).toBe(1);
        elements[0].click();
    });

    await driver.findElements(By.xpath('//*[@id="password"]/div[1]/div/div[1]/input')).then(function(elements) {
        expect(elements.length).toBe(1);
        elements[0].sendKeys(passwords.youtube.password);

    });

    await helpers.waitMilli(1500);
    await driver.get(rootURL);
}