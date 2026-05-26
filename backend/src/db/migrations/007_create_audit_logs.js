/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('user_name', 255).nullable();
    table.string('action', 100).notNullable(); // CREATE, UPDATE, DELETE, LOGIN, etc.
    table.string('entity_type', 100).nullable(); // users, animals, distributions, etc.
    table.integer('entity_id').nullable();
    table.jsonb('details').nullable();
    table.string('ip_address', 50).nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('audit_logs');
};
