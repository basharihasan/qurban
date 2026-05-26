/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('mudhohi_animals', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('animal_id').unsigned().notNullable().references('id').inTable('animals').onDelete('CASCADE');
    table.string('group_name', 100).nullable();
    table.integer('share_count').defaultTo(1); // for sapi/unta: max 7 shares
    table.timestamps(true, true);
    table.unique(['user_id', 'animal_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('mudhohi_animals');
};
