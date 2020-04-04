const properties = require("../json/properties.json");
const users = require("../json/users.json");
const { Pool, Client } = require("pg");

const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const queryString = `SELECT * FROM users WHERE email = $1`;
  const value = [email];
  return pool
    .query(queryString, value)
    .then((res) => res.rows[0])
    .catch((err) => console.log(`Error: ${err}`));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const queryString = `SELECT * FROM users WHERE id = $1`;
  const value = [id];
  return pool
    .query(queryString, value)
    .then((res) => res.rows[0])
    .catch((err) => console.log(`Error: ${err}`));
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const queryString = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`;
  const value = [user.name, user.email, user.password];

  return pool
    .query(queryString, value)
    .then((res) => res.rows[0])
    .catch((err) => console.log(`Error: ${err}`));
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `SELECT reservations.*, properties.*, avg(rating) AS average_rating
  FROM properties
  JOIN reservations ON properties.id = property_id
  JOIN property_reviews ON reservations.id = reservation_id
  JOIN users ON users.id = reservations.guest_id
  WHERE reservations.end_date < now()::date AND reservations.guest_id = $1
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date DESC
  LIMIT ${limit}`;
  const value = [guest_id];

  return pool
    .query(queryString, value)
    .then((res) => res.rows)
    .catch((err) => console.log(`Error: ${err}`));
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  console.log(options);
  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}`;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(parseInt(options.minimum_price_per_night));
    if (options.city) {
      queryString += ` AND cost_per_night >= $${queryParams.length}`;
    } else {
      queryString += `WHERE cost_per_night >= $${queryParams.length}`;
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(parseInt(options.maximum_price_per_night));
    if (options.city || options.minimum_price_per_night) {
      queryString += ` AND cost_per_night <= $${queryParams.length}`;
    } else {
      queryString += `WHERE cost_per_night <= $${queryParams.length}`;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    if (
      options.city ||
      options.minimum_price_per_night ||
      options.maximum_price_per_night
    ) {
      queryString += ` AND rating >= $${queryParams.length}`;
    } else {
      queryString += `WHERE rating >= $${queryParams.length}`;
    }
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length}
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const queryString = `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
  const value = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
  ];

  console.log(property);

  return pool
    .query(queryString, value)
    .then((res) => res.rows[0])
    .catch((err) => console.log(`Error: ${err}`));
};
exports.addProperty = addProperty;
