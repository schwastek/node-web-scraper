const cheerio = require('cheerio');

class ProductScraper {
  constructor(html) {
    this.html = html;
  }

  extractRows() {
    const $ = cheerio.load(this.html);

    // Get the main table
    const table = $('table').eq(0);

    // Get table rows but skip the first row with column headers
    const tableRows = table.find('tr').slice(1);

    // Container
    const extractedRows = [];

    // Extract values from each row
    tableRows.each((i, tableRow) => {
      // Get the current row's columns
      const columns = $(tableRow).children('td');

      /**
       * Create a row object
       * Note: use original column names in PascalCase
       */
      const row = {
        ProductName: columns.eq(0).text().trim(),
        Quantity: columns.eq(1).text().trim(),
      };

      // Add to container
      extractedRows.push(row);
    });

    return extractedRows;
  }
}

module.exports = ProductScraper;
