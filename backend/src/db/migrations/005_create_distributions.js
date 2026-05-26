/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('animal_id').unsigned().nullable().references('id').inTable('animals').onDelete('SET NULL');
    table.enum('status', [
      'not_ready',
      'ready_pickup',
      'picked_up',
      'waiting_delivery',
      'on_delivery',
      'delivered',
    ]).notNullable().defaultTo('not_ready');
    table.enum('method', ['pickup', 'delivery']).nullable();
    // Delivery details
    table.string('courier_name', 255).nullable();
    table.string('courier_phone', 20).nullable();
    table.timestamp('delivery_time').nullable();
    table.string('proof_photo_url', 500).nullable();
    table.text('notes').nullable();
    // Recipient info (copied from delivery_confirmation)
    table.string('recipient_name', 255).nullable();
    table.string('recipient_phone', 20).nullable();
    table.text('delivery_address').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('distributions');
};
