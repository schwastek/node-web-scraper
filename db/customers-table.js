class CustomersTable {
  constructor(db) {
    this.tableName = 'customers';
    this.db = db;
  }

  createTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS ${this.tableName} (
      ProductName     TEXT,
      CustomerName    TEXT,
      TransactionDate DATETIME,
      Total           NUMERIC,
      CreatedAt       DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )
    `;

    // Remark: don't return number of rows affected, it will be 0 after creating the table
    this.db.prepare(sql).run();
  }

  truncateTable() {
    const sql = `
    DELETE FROM ${this.tableName}
    `;

    const stmt = this.db.prepare(sql).run();

    /**
     * Use VACUUM command to clear unused space.
     * After data is deleted from a DB, the DB file remains the same size.
     */
    this.db.exec('VACUUM');

    // Return number of rows affected
    return stmt.changes;
  }

  selectAll() {
    const sql = `
    SELECT
    ProductName, CustomerName, TransactionDate, Total, CreatedAt
    FROM ${this.tableName}
    `;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all();

    return rows;
  }

  updateRowsByProductName(productName, rows) {
    let deleted = 0;
    let inserted = 0;

    /**
     * Wrapped in a transaction i.e. all or none will be executed.
     * If any error occurs, no DB rows will be affected.
     */
    this.db.exec('BEGIN TRANSACTION');
    try {
      deleted = this.deleteRowsByProductName(productName);
      inserted = this.insertRows(rows);
      this.db.exec('COMMIT TRANSACTION');
    } catch (err) {
      if (this.db.inTransaction) this.db.exec('ROLLBACK TRANSACTION');
      throw err;
    }

    // Return number of rows affected
    return { deleted, inserted };
  }

  deleteRowsByProductName(productName) {
    const sql = `
    DELETE
    FROM ${this.tableName}
    WHERE ProductName = ?
    `;

    const del = this.db.prepare(sql);
    const stmt = del.run(productName);

    // Return number of rows affected
    return stmt.changes;
  }

  insertRows(rows) {
    let changes = 0;

    const sql = `
    INSERT INTO ${this.tableName}
    (ProductName, CustomerName, TransactionDate, Total)
    VALUES (@ProductName, @CustomerName, @TransactionDate, @Total)
    `;

    const insert = this.db.prepare(sql);

    rows.forEach((row) => {
      const stmt = insert.run(row);
      changes += stmt.changes;
    });

    // Return number of rows affected
    return changes;
  }
}

module.exports = CustomersTable;
