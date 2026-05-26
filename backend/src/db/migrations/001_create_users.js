/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('phone', 20).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['mudhohi', 'admin', 'panitia']).notNullable().defaultTo('mudhohi');
    table.text('address').nullable();
    table.boolean('first_login').defaultTo(true);
    table.boolean('is_active').defaultTo(true);
    table.string('group_name', 100).nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('users');
};
