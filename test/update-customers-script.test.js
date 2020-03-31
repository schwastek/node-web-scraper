const chai = require('chai');
const nock = require('nock');
const path = require('path');
const fs = require('fs');
const Database = require('../db/database');
const ProductsTable = require('../db/products-table');
const CustomersTable = require('../db/customers-table');
const updateCustomersScript = require('../scripts/update-customers-script');

const { expect } = chai;

describe('Update Customers Script', function () {
  before(function () {
    // Common path to HTML files prepared for tests (to mock HTML response)
    this.htmlPath = path.resolve(__dirname, './html-update-customers-script');
  });

  after(function () {
    // Restore the HTTP interceptor to the original behaviour
    nock.restore();
  });

  beforeEach(function () {
    // Start each test with clean DB
    const db = Database.open();
    new ProductsTable(db).truncateTable();
    new CustomersTable(db).truncateTable();
    db.close();
  });

  afterEach(function () {
    // Remove all mocks
    nock.cleanAll();
  });

  it('should scrape products and their customers', async function () {
    /**
     * Scenario:
     * Day 0 (website): product A and B with 20 customers each.
     * Run script.
     * Expected (DB): both products and their customers in DB.
     */

    // Arrange - mock HTML response
    const htmlProductsDay0 = fs.readFileSync(path.join(this.htmlPath, './test-1/0-Products.html'));
    const htmlCustomers3474Day0 = fs.readFileSync(path.join(this.htmlPath, './test-1/0-PN-3474-customers.html'));
    const htmlCustomers8762Day0 = fs.readFileSync(path.join(this.htmlPath, './test-1/0-PN-8762-customers.html'));

    nock('http://localhost:8000')
      .get('/products.html').reply(200, htmlProductsDay0)
      .get('/PN-3474-customers.html').reply(200, htmlCustomers3474Day0)
      .get('/PN-8762-customers.html').reply(200, htmlCustomers8762Day0);

    // Act - execute task
    await updateCustomersScript();

    // Assert - check DB data
    const dbDay0 = Database.open();
    const proudctsRowsDay0 =  new ProductsTable(dbDay0).selectAll();
    const customersRowsDay0 = new CustomersTable(dbDay0).selectAll();
    const customer3474Day0 = customersRowsDay0.filter((row) => row.ProductName === 'PN-3474');
    const customer8762Day0 = customersRowsDay0.filter((row) => row.ProductName === 'PN-8762');
    dbDay0.close();

    expect(proudctsRowsDay0).to.have.lengthOf(2);
    expect(customersRowsDay0).to.have.lengthOf(40);
    expect(customer3474Day0).to.have.lengthOf(20);
    expect(customer8762Day0).to.have.lengthOf(20);
    expect(proudctsRowsDay0[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', Quantity: 5 });
    expect(proudctsRowsDay0[1]).to.be.an('object').that.includes({ ProductName: 'PN-8762', Quantity: 10 });
    expect(customer3474Day0[3]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-5585', TransactionDate: '12/18/19 8:56', Total: 82.21 });
    expect(customer3474Day0[12]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-5712', TransactionDate: '5/20/19 15:59', Total: 6.49 });
    expect(customer3474Day0[18]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-5198', TransactionDate: '1/11/20 8:23', Total: 80.06 });
    expect(customer8762Day0[7]).to.be.an('object').that.includes({ ProductName: 'PN-8762', CustomerName: 'CS-5297', TransactionDate: '4/10/19 8:04', Total: 98.31 });
    expect(customer8762Day0[14]).to.be.an('object').that.includes({ ProductName: 'PN-8762', CustomerName: 'CS-6411', TransactionDate: '7/8/19 18:00', Total: 76.35 });
    expect(customer8762Day0[2]).to.be.an('object').that.includes({ ProductName: 'PN-8762', CustomerName: 'CS-6710', TransactionDate: '12/18/19 23:40', Total: 16.41 });
  });

  it('should update existing products and their customers', async function () {
    /**
     * Scenario:
     * Day 0 (website): product A with 1 customer.
     * Day 1 (website): updated product A with 1 updated customer.
     * Expected (DB): updated product A with 1 updated customer.
     *
     * Run script each day.
     */

    // Arrange - day 0
    const htmlProductsDay0 = fs.readFileSync(path.join(this.htmlPath, './test-2/0-Products.html'));
    const htmlCustomersDay0 = fs.readFileSync(path.join(this.htmlPath, './test-2/0-PN-3474-customers.html'));

    nock('http://localhost:8000')
      .get('/products.html').reply(200, htmlProductsDay0)
      .get('/PN-3474-customers.html').reply(200, htmlCustomersDay0);

    // Act - day 0
    await updateCustomersScript();

    // Assert - day 0
    const dbDay0 = Database.open();
    const proudctsRowsDay0 =  new ProductsTable(dbDay0).selectAll();
    const customersRowsDay0 = new CustomersTable(dbDay0).selectAll();
    dbDay0.close();

    expect(proudctsRowsDay0[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', Quantity: 5 });
    expect(customersRowsDay0[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-6049', TransactionDate: '9/7/19 23:00', Total: 44.6 });

    // Arrange - day 1
    const htmlProductsDay1 = fs.readFileSync(path.join(this.htmlPath, './test-2/1-Products.html'));
    const htmlCustomersDay1 = fs.readFileSync(path.join(this.htmlPath, './test-2/1-PN-3474-customers.html'));

    nock('http://localhost:8000')
      .get('/products.html').reply(200, htmlProductsDay1)
      .get('/PN-3474-customers.html').reply(200, htmlCustomersDay1);

    // Act - day 1
    await updateCustomersScript();

    // Assert - day 1
    const dbDay1 = Database.open();
    const proudctsRowsDay1 =  new ProductsTable(dbDay1).selectAll();
    const customersRowsDay1 = new CustomersTable(dbDay1).selectAll();
    dbDay1.close();

    expect(proudctsRowsDay1[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', Quantity: 10 });
    expect(customersRowsDay1[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-2133', TransactionDate: '12/26/19 4:12', Total: 70.52 });
  });

  it('should keep historical products data', async function () {
    /**
     * DB keeps data even if it disappeared from the website.
     *
     * Scenario:
     * Day 0 (website): only product A with 1 customer.
     * Day 1 (website): only product B with 1 customer.
     * Expected (DB): both products A and B with 1 customer each.
     *
     * Run script each day.
     */

    // Arrange - day 0
    const htmlProductsDay0 = fs.readFileSync(path.join(this.htmlPath, './test-3/0-Products.html'));
    const htmlCustomersDay0 = fs.readFileSync(path.join(this.htmlPath, './test-3/0-PN-3474-customers.html'));

    nock('http://localhost:8000')
      .get('/products.html').reply(200, htmlProductsDay0)
      .get('/PN-3474-customers.html').reply(200, htmlCustomersDay0);

    // Act - day 0
    await updateCustomersScript();

    // Assert - day 0
    const dbDay0 = Database.open();
    const proudctsRowsDay0 =  new ProductsTable(dbDay0).selectAll();
    dbDay0.close();

    expect(proudctsRowsDay0).to.have.lengthOf(1);
    expect(proudctsRowsDay0[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', Quantity: 5 });

    // Arrange - day 1
    const htmlProductsDay1 = fs.readFileSync(path.join(this.htmlPath, './test-3/1-Products.html'));
    const htmlCustomersDay1 = fs.readFileSync(path.join(this.htmlPath, './test-3/1-PN-8762-customers.html'));

    nock('http://localhost:8000')
      .get('/products.html').reply(200, htmlProductsDay1)
      .get('/PN-8762-customers.html').reply(200, htmlCustomersDay1);

    // Act - day 1
    await updateCustomersScript();

    // Assert - day 1
    const dbDay1 = Database.open();
    const proudctsRowsDay1 =  new ProductsTable(dbDay1).selectAll();
    dbDay1.close();

    expect(proudctsRowsDay1).to.have.lengthOf(2);
    expect(proudctsRowsDay1[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', Quantity: 5 });
    expect(proudctsRowsDay1[1]).to.be.an('object').that.includes({ ProductName: 'PN-8762', Quantity: 10 });
  });

  it('should mirror customers data (1:1 website to DB)', async function () {
    /**
     * DB customers table mirrors the customers website.
     *
     * Scenario:
     * Day 0 (website): product A with 20 customers.
     * Day 1 (website): product A with 1 customer.
     * Expected (DB): product A with 1 customer.
     *
     * Run script each day.
     */

    // Arrange - day 0
    const htmlProductsDay0 = fs.readFileSync(path.join(this.htmlPath, './test-4/0-Products.html'));
    const htmlCustomersDay0 = fs.readFileSync(path.join(this.htmlPath, './test-4/0-PN-3474-customers.html'));

    nock('http://localhost:8000')
      .get('/products.html').reply(200, htmlProductsDay0)
      .get('/PN-3474-customers.html').reply(200, htmlCustomersDay0);

    // Act - day 0
    await updateCustomersScript();

    // Assert - day 0
    const dbDay0 = Database.open();
    const customersRowsDay0 = new CustomersTable(dbDay0).selectAll();
    dbDay0.close();

    expect(customersRowsDay0).to.have.lengthOf(20);
    expect(customersRowsDay0[3]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-5585', TransactionDate: '12/18/19 8:56', Total: 82.21 });
    expect(customersRowsDay0[12]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-5712', TransactionDate: '5/20/19 15:59', Total: 6.49 });
    expect(customersRowsDay0[18]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-5198', TransactionDate: '1/11/20 8:23', Total: 80.06 });

    // Arrange - day 1
    const htmlProductsDay1 = fs.readFileSync(path.join(this.htmlPath, './test-4/1-Products.html'));
    const htmlCustomersDay1 = fs.readFileSync(path.join(this.htmlPath, './test-4/1-PN-3474-customers.html'));

    nock('http://localhost:8000')
      .get('/products.html').reply(200, htmlProductsDay1)
      .get('/PN-3474-customers.html').reply(200, htmlCustomersDay1);

    // Act - day 1
    await updateCustomersScript();

    // Assert - day 1
    const dbDay1 = Database.open();
    const customersRowsDay1 = new CustomersTable(dbDay1).selectAll();
    dbDay1.close();

    expect(customersRowsDay1).to.have.lengthOf(1);
    expect(customersRowsDay1[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-2133', TransactionDate: '12/26/19 4:12', Total: 70.52 });
  });

  it('should update customers based on products in DB (and not current products on website)', async function () {
    /**
     * Customers of a product are still being updated
     * even if the product is no longer displayed on the website.
     *
     * Scenario:
     * Day 0 (website): only product A with 1 customer.
     * Day 1 (website): no products displayed but Product A customers are updated.
     * Expected (DB): product A with updated customer.
     *
     * Run script each day.
     */

     // Arrange - day 0
    const htmlProductsDay0 = fs.readFileSync(path.join(this.htmlPath, './test-5/0-Products.html'));
    const htmlCustomersDay0 = fs.readFileSync(path.join(this.htmlPath, './test-5/0-PN-3474-customers.html'));

    nock('http://localhost:8000')
      .get('/products.html').reply(200, htmlProductsDay0)
      .get('/PN-3474-customers.html').reply(200, htmlCustomersDay0);

    // Act - day 0
    await updateCustomersScript();

    // Assert - day 0
    const dbDay0 = Database.open();
    const customersRowsDay0 = new CustomersTable(dbDay0).selectAll();
    dbDay0.close();

    expect(customersRowsDay0[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-6049', TransactionDate: '9/7/19 23:00', Total: 44.6 });

    // Arrange - day 1
    const htmlProductsDay1 = fs.readFileSync(path.join(this.htmlPath, './test-5/1-Products.html'));
    const htmlCustomersDay1 = fs.readFileSync(path.join(this.htmlPath, './test-5/1-PN-3474-customers.html'));

    nock('http://localhost:8000')
      .get('/products.html').reply(200, htmlProductsDay1)
      .get('/PN-3474-customers.html').reply(200, htmlCustomersDay1);

    // Act - day 1
    await updateCustomersScript();

    // Assert - day 1
    const dbDay1 = Database.open();
    const customersRowsDay1 = new CustomersTable(dbDay1).selectAll();
    dbDay1.close();

    expect(customersRowsDay1[0]).to.be.an('object').that.includes({ ProductName: 'PN-3474', CustomerName: 'CS-2133', TransactionDate: '12/26/19 4:12', Total: 70.52 });
  });
});
