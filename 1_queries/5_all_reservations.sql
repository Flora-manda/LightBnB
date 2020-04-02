SELECT reservations.*, properties.*, avg(rating) AS average_rating
FROM properties
JOIN reservations ON properties.id = property_id
JOIN property_reviews ON reservations.id = reservation_id
JOIN users ON users.id = reservations.guest_id
WHERE reservations.end_date < now()::date AND reservations.guest_id = 1
GROUP BY reservations.id, properties.id
ORDER BY reservations.start_date DESC
LIMIT 10;