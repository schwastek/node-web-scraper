const Database = require('../db/database');
const CompaniesConnector = require('../connectors/companies');
const CompaniesScraper = require('../scrapers/companies');
const CompaniesTable = require('../db/tables/companies');
const ProductsConnector = require('../connectors/products');
const ProductsScraper = require('../scrapers/products');
const ProductsTable = require('../db/tables/products');
const logger = require('../logs/logger')(__filename);

/**
 * Logic:
 * 1. Scrape companies
 * 2. Get companies from DB
 * 2. Scrape products of each company
 */

async function updateCompanies() {
  let db = null;
  logger.info('Start updating companies');

  try {
    // Get website content
    const connector = new CompaniesConnector();
    const html = await connector.getHtml();

    // Scrape website
    const scraper = new CompaniesScraper(html);
    const rows = scraper.extractRows();
    logger.info(`Scraped companies: ${rows.length}`);

    // Update DB
    db = Database.open();
    const table = new CompaniesTable(db);
    const { deleted, inserted } = table.updateCompanies(rows);
    logger.info(`Deleted rows: ${deleted}. Inserted rows: ${inserted}`);
  } catch (err) {
    logger.error(err.message);
  } finally {
    if (db) db.close();
  }

  logger.info('End updating companies');
}

async function getCompanies() {
  let db = null;
  let companies = [];
  logger.info('Start retrieving companies from a database');

  try {
    db = Database.open();
    const table = new CompaniesTable(db);
    companies = table.selectAll();
  } catch (err) {
    logger.error(err.message);
  } finally {
    if (db) db.close();
  }

  logger.info(`Retrieved companies: ${companies.length}`);
  logger.info('End retrieving companies from a database');

  return companies;
}

async function updateProductsForSingleCompany(company) {
  let rows = [];

  try {
    // Get website content
    const connector = new ProductsConnector(company.Link);
    const html = await connector.getHtml();

    // Scrape website
    const scraper = new ProductsScraper(html);
    rows = scraper.extractRows();
    logger.info(`Company: "${company.Name}". Scraped rows: ${rows.length}`);
  } catch (err) {
    logger.error(err.message);
  }

  return rows;
}

async function updateProducts(companies) {
  logger.info('Start updating products for all companies');

  // Scrape products of each company
  const requests = companies.map((company) => updateProductsForSingleCompany(company));
  const results = await Promise.allSettled(requests);
  const fulfilled = results.filter((v) => v.status === 'fulfilled');
  const rows = fulfilled.map((v) => v.value).flat(1);

  // Update DB
  let db = null;
  try {
    db = Database.open();
    const table = new ProductsTable(db);
    const { deleted, inserted } = table.updateProducts(rows);
    logger.info(`Deleted rows: ${deleted}. Inserted rows: ${inserted}`);
  } catch (err) {
    logger.error(err.message);
  } finally {
    if (db) db.close();
  }

  logger.info('End updating products for all companies');
}

async function main() {
  logger.info('Start script');

  await updateCompanies();
  const companies = await getCompanies();
  await updateProducts(companies);

  logger.info('End script');
}

if (require.main === module) {
  // This module was run directly from CLI (as in node xxx.js)
  main();
} else {
  // This module was imported
  module.exports = main;
}
