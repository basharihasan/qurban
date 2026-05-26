/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('delivery_confirmations', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('method', ['pickup', 'delivery']).notNullable();
    // Delivery fields
    table.string('recipient_name', 255).nullable();
    table.string('recipient_phone', 20).nullable();
    table.text('delivery_address').nullable();
    table.string('maps_link', 500).nullable();
    table.text('notes').nullable();
    // Pickup fields
    table.string('pickup_location', 500).nullable();
    table.timestamp('pickup_schedule').nullable();
    table.timestamp('confirmed_at').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('delivery_confirmations');
};
