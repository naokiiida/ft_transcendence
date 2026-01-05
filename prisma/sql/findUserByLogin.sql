-- @param {String} $1:login
-- Find a user by their 42 login
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
WHERE login = $1
