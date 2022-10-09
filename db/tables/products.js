class ProductsTable {
  constructor(db) {
    this.tableName = 'products';
    this.db = db;

    this.ensureCreated();
  }

  ensureCreated() {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        Product TEXT,
        DateAdded DATETIME,
        Price NUMERIC,
        CreatedAt DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL
      )
    `;

    // Remark: don't return number of rows affected, it will be 0 after creating the table
    this.db.prepare(sql).run();
  }

  selectAll() {
    const sql = `
      SELECT Product, DateAdded, Price FROM ${this.tableName}
    `;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all();

    return rows;
  }

  deleteAll() {
    const sql = `
      DELETE FROM ${this.tableName}
    `;

    const stmt = this.db.prepare(sql).run();

    // Return number of rows affected
    return stmt.changes;
  }

  insertRows(rows) {
    let changes = 0;

    const sql = `
      INSERT INTO ${this.tableName}
      (Product, DateAdded, Price)
      VALUES (@Product, @DateAdded, @Price)
    `;

    const insert = this.db.prepare(sql);

    rows.forEach((row) => {
      const stmt = insert.run(row);
      changes += stmt.changes;
    });

    // Return number of rows affected
    return changes;
  }

  updateProducts(rows) {
    let deleted = 0;
    let inserted = 0;

    // If any error occurs, no DB rows will be affected
    this.db.exec('BEGIN TRANSACTION');
    try {
      deleted = this.deleteAll();
      inserted = this.insertRows(rows);
      this.db.exec('COMMIT TRANSACTION');
    } catch (err) {
      if (this.db.inTransaction) this.db.exec('ROLLBACK TRANSACTION');
      throw err;
    }

    // Return number of rows affected
    return { deleted, inserted };
  }
}

module.exports = ProductsTable;
