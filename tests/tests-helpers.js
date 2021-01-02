const { By, until } = require('selenium-webdriver');
const fs = require('fs');
const pngToJpeg = require('png-to-jpeg');
const config = require('../youtube-custom-feed/bin/config.js');

const waitUntilTime = 20000;

async function selectId(selector, driver) {
  const el = await driver.wait(
    until.elementLocated(By.id(selector)),
    waitUntilTime
  );
  return await driver.wait(until.elementIsVisible(el), waitUntilTime);
}
exports.selectId = selectId;

async function assertNoId(selector, driver) {
  await driver.findElements(By.id(selector)).then(function (elements) {
    expect(elements.length).toBe(0);
  });
}
exports.assertNoId = assertNoId;

async function assertVisibilityById(selector, driver, isVisible) {
  await driver.findElements(By.id(selector)).then(function (elements) {
    expect(elements.length, "Id = " + selector).toBe(1);
    elements[0].isDisplayed().then(function (element) {
      expect(element, "Id = '" + selector + "' must be visible = " + isVisible).toBe(isVisible);
    });
  });
}

async function assertIsVisibleById(selector, driver) {
  await assertVisibilityById(selector, driver, true);
}
exports.assertIsVisibleById = assertIsVisibleById;

async function assertIsNotVisibleById(selector, driver) {
  await assertVisibilityById(selector, driver, false);
}
exports.assertIsNotVisibleById = assertIsNotVisibleById;

function waitMilli(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
exports.waitMilli = waitMilli;

function deleteFile(file) {
  fs.unlink(file, function (err) {
    // XXX
  });
}
exports.deleteFile = deleteFile;

async function assertClassById(idSelector, expectedValue, driver) {
  await assertAttributeById(idSelector, "class", expectedValue, driver);
}
exports.assertClassById = assertClassById;

async function assertNoClassById(idSelector, driver) {
  await assertClassById(idSelector, "", driver);
}
exports.assertNoClassById = assertNoClassById;

async function assertAttributeById(idSelector, attributeName, expectedValue, driver) {
  await driver.findElements(By.id(idSelector)).then(function (elements) {
    expect(elements.length).toBe(1);
    elements[0].getAttribute(attributeName).then(function (element) {
      expect(element, "Id = " + idSelector).toBe(expectedValue);
    });
  });
}
exports.assertAttributeById = assertAttributeById;

async function assertCountElementsByClass(classSelector, expectedValue, driver) {
  await driver.findElements(By.className(classSelector)).then(function (elements) {
    expect(elements.length).toBe(expectedValue);
  });
}
exports.assertCountElementsByClass = assertCountElementsByClass;

async function takeScreenshotForDocumentation(filename, driver) {
  if (config.BROWSER_TEST == "chrome") {
    await driver.takeScreenshot().then(function (png64) {
      const buffer = Buffer.from(png64, 'base64');
      pngToJpeg({ quality: 90 })(buffer).then(output => fs.writeFileSync("./doc/images/" + filename + ".jpg", output));
    });
  }
}
exports.takeScreenshotForDocumentation = takeScreenshotForDocumentation;