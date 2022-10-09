const cheerio = require('cheerio');

class CompaniesScraper {
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
        Name: columns.eq(0).text().trim(),
        Link: columns.eq(1).find('a').attr('href'),
      };

      // Add to container
      extractedRows.push(row);
    });

    return extractedRows;
  }
}

module.exports = CompaniesScraper;
