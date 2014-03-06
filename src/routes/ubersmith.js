/* jshint unused: false */
module.exports = function (app, config, passport, redisClient) {
  "use strict";
  app.get('/ubersmith', app.locals.ensureAuthenticated, function (req, res) {
    var ticketLow = 0;
    var ticketNormal = 0;
    var ticketHigh = 0;
    var ticketUrgent = 0;
    var ticketTotal = 0;
    var eventList = {};
    var renderParams = {
      ticket_count: {
        low: ticketLow,
        normal: ticketNormal,
        high: ticketHigh,
        urgent: ticketUrgent,
        total: ticketTotal
      },
      event_list: eventList,
      user: req.user,
      section: 'dashboard',
      navLinks: config.navLinks.ubersmith
    };
    res.render('ubersmith', renderParams);
  });

  app.get('/ubersmith/tickets', app.locals.ensureAuthenticated, function (req, res) {
    res.redirect('/tickets');
  });

  // Device Browser
  app.get('/ubersmith/devices', app.locals.requireGroup('users'), function (req, res) {
    app.locals.crmModule.getDeviceTypeList(function(err, deviceTypeList) {
      if (err) {
        res.send(500);
      } else {
        var renderParams = {
          device_types: deviceTypeList,
          user:req.user,
          section: 'devices',
          navLinks: config.navLinks.ubersmith
        };
        res.render('ubersmith/devices', renderParams);
      }
    });
  });

  // Used to view a single device
  app.get('/ubersmith/devices/deviceid/:deviceid', app.locals.requireGroup('users'), function (req, res) {
    app.locals.crmModule.getDeviceByID(req.params.deviceid, function (error, uberDevice) {
      if (!uberDevice)
      {
        app.locals.logger.log('error', 'Failed to retrieve device from Ubersmith', { error: error, deviceid: req.params.deviceid });
        res.send(404);
      } else {
        var async = require('async');
        var hostname =  uberDevice.dev_desc + app.locals.config.mgmtDomain;
        async.parallel([
          function (asyncCallback) {
            app.locals.crmModule.getDeviceByID(req.params.deviceid, asyncCallback);
          },
          function (asyncCallback) {
            app.locals.puppetModule.getDevice(hostname, function (error, puppetDevice){
              asyncCallback(error, puppetDevice);
            });
          },
          function (asyncCallback) {
            app.locals.monModule.getDevice(hostname, asyncCallback);
          }
        ], function(err, results) {
          if (err)
          {
            app.locals.logger.log('error', 'could not get all device data ' + err.message, {err: err});
            res.send(500);
          } else {
            if (results && results.length === 3)
            {
              var _ = require('underscore');
              var uberDevice = results[0];
              var puppetDevice = results[1];
              var sensuDevice = results[2];

              _.defaults(uberDevice, {
                dev: 0,
                dev_desc: 'unknown',
                metadata: {},
                devtype_group_name: 'unknown',
                type: 'unknown',
                active: 0,
                location: 'unknown',
                parent_desc: 'unknown',
                clientid: 0,
                listed_company: 'none',
                email: '',
                phone: ''
              });

              _.defaults(uberDevice.metadata, {
                management_level: 'unknown'
              });

              _.defaults(sensuDevice, {
                node: {},
                events: []
              });

              _.defaults(sensuDevice.events, {
                output: "No Events Found",
                status: 1,
                issued: Date.now(),
                handlers: [],
                flapping: false,
                occurrences: 0,
                client: hostname,
                check: 'N/A'
              });

              _.defaults(sensuDevice.node, {
                name: '',
                address: ''
              });

              _.defaults(puppetDevice, {
                catalog_timestamp: 0,
                facts_timestamp: 0,
                report_timestamp: 0,
                facts: {}
              });

              _.defaults(puppetDevice.facts, {
                operatingsystem: '',
                operatingsystemrelease: '',
                kernel:  '',
                kernelrelease: '',
                uptime: '',
                manufacturer: '',
                productname: '',
                serialnumber: '',
                memoryfree: '',
                memorytotal: '',
                physicalprocessorcount: 0,
                processorcount: 0,
                processor0: '',
                interface_mgmt: '',
                interface_public: ''
              });

              var renderParams = {
                puppetDevice: puppetDevice,
                uberDevice: uberDevice,
                sensuDevice: sensuDevice,
                user:req.user,
                section: 'devices',
                navLinks: config.navLinks.ubersmith
              };

              res.render('ubersmith/device', renderParams);
            } else {
              app.locals.logger.log('error', 'failed to retrieve device data', {results: JSON.stringify(results)});
              res.send(500);
            }
          }
        });
      }
    });
  });

  app.get('/ubersmith/devices/hostname/:hostname', app.locals.requireGroup('users'), function (req, res) {
    app.locals.crmModule.getDeviceByHostname(req.params.hostname, function (error, uberDevice) {
      if (!uberDevice)
      {
        app.locals.logger.log('error', 'Failed to retrieve device from Ubersmith', { error: error, deviceid: req.params.deviceid });
        res.send(404);
      } else {
        res.redirect('/ubersmith/devices/deviceid/' + uberDevice.dev);
      }
    });
  });

  app.get('/ubersmith/clients', app.locals.requireGroup('users'), function (req, res) {
    res.render('ubersmith/clients', { user:req.user, section: 'clients', navLinks: config.navLinks.ubersmith });
  });

  app.get('/ubersmith/clients/clientid/:clientid', app.locals.requireGroup('users'), function (req, res) {
    var async = require('async');
    async.parallel([
      function(callback){
        app.locals.crmModule.getClientByID(req.params.clientid, callback);
      },
      function(callback){
        app.locals.crmModule.getContactsbyClientID(req.params.clientid, callback);
      }
    ],
      function(err, results) {
        if (err)
        {
          res.send(500);
        } else {
          var client = results[0];
          client.contacts = results[1];
          var renderParams = {
            clientid: req.params.clientid,
            client: client,
            user:req.user,
            section: 'clients',
            navLinks: config.navLinks.ubersmith
          };
          res.render('ubersmith/client', renderParams);
        }
      });
  });
};
