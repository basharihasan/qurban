/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('type', 50).notNullable(); // slaughter_complete, meat_ready, delivery_started
    table.text('message').notNullable();
    table.string('phone', 20).nullable();
    table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending');
    table.timestamp('sent_at').nullable();
    table.text('error_message').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notifications');
};
