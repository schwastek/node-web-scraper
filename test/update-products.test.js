const chai = require('chai');
const nock = require('nock');
const path = require('path');
const fs = require('fs');
const Database = require('../db/database');
const CompaniesTable = require('../db/tables/companies');
const ProductsTable = require('../db/tables/products');
const updateProductsScript = require('../scripts/update-products');

const { expect } = chai;

describe('Update products script', function () {
  after(function() {
    // Restore the HTTP interceptor to the original behaviour
    nock.restore();
  });

  beforeEach(async function() {
    const db = Database.open();
    new ProductsTable(db).deleteAll();
    new CompaniesTable(db).deleteAll();
    db.close();
  });

  afterEach(function() {
    // Remove all mocks
    nock.cleanAll();
  });

  it('Should scrape companies and their products', async function() {
    // Arrange - mock HTML response
    const htmlCompanies = fs.readFileSync(path.resolve(__dirname, '../docs/dummy-website/companies.html'));
    const htmlCompanyBark = fs.readFileSync(path.resolve(__dirname, '../docs/dummy-website/products-bark-industries.html'));
    const htmlCompanyKayne = fs.readFileSync(path.resolve(__dirname, '../docs/dummy-website/products-kayne-enterprise.html'));
    const htmlCompanyBurger = fs.readFileSync(path.resolve(__dirname, '../docs/dummy-website/products-meet-burger.html'));
    const htmlCompanyPackme = fs.readFileSync(path.resolve(__dirname, '../docs/dummy-website/products-packme-corp.html'));

    nock('https://schwastek.github.io/test-gh-pages/dummy-website')
      .get('/companies.html').reply(200, htmlCompanies)
      .get('/products-bark-industries.html').reply(200, htmlCompanyBark)
      .get('/products-kayne-enterprise.html').reply(200, htmlCompanyKayne)
      .get('/products-meet-burger.html').reply(200, htmlCompanyBurger)
      .get('/products-packme-corp.html').reply(200, htmlCompanyPackme);

    // Act
    await updateProductsScript();

    // Assert - check DB data
    const db = Database.open();
    const products =  new ProductsTable(db).selectAll();
    const companies = new CompaniesTable(db).selectAll();
    db.close();

    expect(companies).to.have.lengthOf(4);
    expect(products).to.have.lengthOf(70);
    expect(companies).to.include.deep.members([{Name: 'Bark Industries', Link: 'products-bark-industries.html'}]);
    expect(products).to.include.deep.members([{Product: 'BARK-6846', DateAdded: '8/10/19 19:45', Price: 67.89}]);
  });
});
