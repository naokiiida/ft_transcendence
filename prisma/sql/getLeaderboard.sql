-- @param {Int} $1:limit
-- Get top players by rating
SELECT
  id,
  login,
  displayName,
  imageUrl,
  wins,
  losses,
  rating
FROM User
ORDER BY rating DESC, wins DESC
LIMIT $1
