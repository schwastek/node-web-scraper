const Database = require('../db/database');
const CustomersConnector = require('../connectors/customers-connector');
const CustomersScraper = require('../scrapers/customers-scraper');
const CustomersTable = require('../db/customers-table');
const ProductsConnector = require('../connectors/products-connector');
const ProductsScraper = require('../scrapers/products-scraper');
const ProductsTable = require('../db/products-table');
const logger = require('../logs/logger')(__filename);

async function updateCustomersSingleProduct(productName) {
  let db = null;
  logger.info(`Start updating customers of: ${productName}`);

  try {
    // Get website content
    const connector = new CustomersConnector(productName);
    const html = await connector.getHtml();
    logger.info(`Connected: ${connector.url}`);

    // Scrape website
    const scraper = new CustomersScraper(html);
    const rows = scraper.extractRows();
    logger.info(`Scraped rows: ${rows.length}`);

    // Add column with product name to scraped rows
    const rowsWithProductName = rows.map((row) => ({ ProductName: productName, ...row }));

    // Update DB
    db = Database.open();
    const table = new CustomersTable(db);
    const { deleted, inserted } = table.updateRowsByProductName(productName, rowsWithProductName);

    logger.info(`Deleted rows: ${deleted}`);
    logger.info(`Inserted rows: ${inserted}`);
  } catch (err) {
    logger.error(err.message);
  } finally {
    if (db) db.close();
  }

  logger.info(`End updating customers of: ${productName}`);
}

async function updateCustomersManyProducts(productNames) {
  logger.info('Start updating customers');

  /**
   * Do not run async operations below in parallel (don't use `Promise.all`).
   * This way, you prevent code below from sending an excessive amount of requests in parallel.
   */
  // eslint-disable-next-line no-restricted-syntax
  for (const [i, productName] of productNames.entries()) {
    logger.info(`Current element: ${i + 1} of ${productNames.length}`);

    // eslint-disable-next-line no-await-in-loop
    await updateCustomersSingleProduct(productName);
  }

  logger.info('End updating customers');
}

async function getProductNames() {
  let db = null;
  let uniqueProductNames = [];
  logger.info('Start retrieving product names from a database');

  try {
    db = Database.open();
    const table = new ProductsTable(db);
    const rows = table.selectAll();
    const productNames = rows.map((row) => row.ProductName);
    const nonEmptyProductNames = productNames.filter((productName) => productName);
    uniqueProductNames = Array.from(new Set(nonEmptyProductNames));
  } catch (err) {
    logger.error(err.message);
  } finally {
    if (db) db.close();
  }

  logger.info(`Retrieved product names: ${uniqueProductNames.length}`);
  logger.info('End retrieving product names from a database');
  return uniqueProductNames;
}

async function updateProducts() {
  let db = null;
  logger.info('Start updating products');

  try {
    // Get website content
    const connector = new ProductsConnector();
    const html = await connector.getHtml();
    logger.info(`Connected: ${connector.url}`);

    // Scrape website
    const scraper = new ProductsScraper(html);
    const rows = scraper.extractRows();
    logger.info(`Scraped rows: ${rows.length}`);

    // Update DB
    db = Database.open();
    const table = new ProductsTable(db);
    const productNames = rows.map((row) => row.ProductName);
    const { deleted, inserted } = table.updateRowsByProductNames(productNames, rows);
    logger.info(`Deleted rows: ${deleted}`);
    logger.info(`Inserted rows: ${inserted}`);
  } catch (err) {
    logger.error(err.message);
  } finally {
    if (db) db.close();
  }

  logger.info('End updating products');
}

async function updateCustomers() {
  logger.info('Start script');

  // Scrape latest products and insert them into DB
  await updateProducts();

  // Get all product names from DB
  const productNames = await getProductNames();

  // Scrape customers of given products and insert them into DB
  await updateCustomersManyProducts(productNames);

  logger.info('End script');
}

module.exports = updateCustomers;

// Run exported functions from CLI
require('make-runnable');
