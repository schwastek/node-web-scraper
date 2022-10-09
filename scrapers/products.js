const cheerio = require('cheerio');

class ProductScraper {
  constructor(html) {
    this.html = html;
  }

  extractRows() {
    const $ = cheerio.load(this.html);

    // Get the main table
    const table = $('table').eq(0);

    // Skip column headers
    const tableRows = table.find('tr').slice(1);

    // Container
    const extractedRows = [];

    // Extract values from each row
    tableRows.each((i, tableRow) => {
      // Get the current row's columns
      const columns = $(tableRow).children('td');

      const row = {
        Product: columns.eq(1).text().trim(),
        DateAdded: columns.eq(2).text(),
        Price: columns.eq(3).text(),
      };

      // Add to container
      extractedRows.push(row);
    });

    return extractedRows;
  }
}

module.exports = ProductScraper;
