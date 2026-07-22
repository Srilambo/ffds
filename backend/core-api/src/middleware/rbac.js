function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role === 'farmer' ? 'manager' : req.user?.role;
    const allowedRoles = roles.map((r) => (r === 'farmer' ? 'manager' : r));
    if (!req.user || (!roles.includes(req.user.role) && !allowedRoles.includes(userRole))) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireRole };

