const axios = require('axios');

class CompaniesConnector {
  constructor() {
    this.url = 'https://schwastek.github.io/node-web-scraper/dummy-website/companies.html';
  }

  async getHtml() {
    const response = await axios.get(this.url);
    return response.data;
  }
}

module.exports = CompaniesConnector;
