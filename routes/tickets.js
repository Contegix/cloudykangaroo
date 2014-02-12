module.exports = function (app, config, passport, redisClient) {

  app.get('/tickets'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      res.render('tickets',{ user: req.user, section: 'tickets', navLinks: config.navLinks.ubersmith });
    });

  app.get('/tickets/ticketid/:ticketid'
    , app.locals.ensureAuthenticated
    , function (req, res) {
      app.locals.ubersmith.getTicketbyTicketID(req.params.ticketid, function (err, ticket) {
        if (err)
        {
          res.send(500);
        } else {
          res.render('tickets/ticket',{ ticket: ticket, user: req.user, section: 'tickets', navLinks: config.navLinks.ubersmith });
        }
      });
    });
}