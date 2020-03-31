const axios = require('axios');

class ProductsConnector {
  constructor() {
    this.url = 'http://localhost:8000/products.html';
  }

  async getHtml() {
    const response = await axios.get(this.url);
    return response.data;
  }
}

module.exports = ProductsConnector;
