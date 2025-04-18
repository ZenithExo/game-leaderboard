const auth = (req, res, next) => {
  if (!req.session.userId) {
      return res.redirect('/auth/login');
  }
  next();
};

module.exports = auth;