const axios = require('axios');

class CustomersConnector {
  constructor(partNumber) {
    this.url = `http://localhost:8000/${partNumber}-customers.html`;
  }

  async getHtml() {
    const response = await axios.get(this.url);
    return response.data;
  }
}

module.exports = CustomersConnector;
