/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('animals', (table) => {
    table.increments('id').primary();
    table.string('animal_code', 50).notNullable().unique();
    table.enum('animal_type', ['sapi', 'kambing', 'domba', 'unta']).notNullable();
    table.decimal('weight', 8, 2).nullable();
    table.enum('status', [
      'registered',
      'ready',
      'slaughtered',
      'processed',
      'distributed',
    ]).notNullable().defaultTo('registered');
    table.string('photo_url', 500).nullable();
    table.text('notes').nullable();
    table.string('color', 100).nullable();
    table.string('age_estimate', 50).nullable();
    table.timestamp('slaughter_time').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('animals');
};
