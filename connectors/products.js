const axios = require('axios');

class ProductsConnector {
  constructor(companyLink) {
    this.url = `https://schwastek.github.io/node-web-scraper/dummy-website/${companyLink}`;
  }

  async getHtml() {
    const response = await axios.get(this.url);
    return response.data;
  }
}

module.exports = ProductsConnector;
