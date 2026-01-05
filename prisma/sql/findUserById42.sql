-- @param {Int} $1:id42
-- Find a user by their 42 intra ID
SELECT
  id,
  id42,
  login,
  email,
  displayName,
  imageUrl,
  wins,
  losses,
  rating,
  isOnline,
  lastSeen,
  createdAt,
  updatedAt
FROM User
WHERE id42 = $1
