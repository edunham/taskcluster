let debug             = require('debug')('notify');
let app               = require('taskcluster-lib-app');
let loader            = require('taskcluster-lib-loader');
let config            = require('typed-env-config');
let monitor           = require('taskcluster-lib-monitor');
let validator         = require('taskcluster-lib-validator');
let _                 = require('lodash');
let v1                = require('./api');
let Notifier          = require('./notifier');
var Handler           = require('./handler');
let exchanges         = require('./exchanges');
let IRC               = require('./irc');

// Create component loader
let load = loader({
  cfg: {
    requires: ['profile'],
    setup: ({profile}) => config({profile}),
  },

  monitor: {
    requires: ['process', 'profile', 'cfg'],
    setup: ({process, profile, cfg}) => monitor({
      project: 'taskcluster-notify',
      credentials: cfg.taskcluster.credentials,
      mock: profile === 'test',
      process,
    }),
  },

  validator: {
    requires: ['cfg'],
    setup: ({cfg}) => validator({
      prefix: 'notify/v1/',
      aws: cfg.aws,
    }),
  },

  publisher: {
    requires: ['cfg', 'validator', 'monitor'],
    setup: ({cfg, validator, monitor}) => exchanges.setup({
      credentials:        cfg.pulse,
      exchangePrefix:     cfg.app.exchangePrefix,
      validator:          validator,
      referencePrefix:    'notify/v1/exchanges.json',
      publish:            process.env.NODE_ENV === 'production',
      aws:                cfg.aws,
      monitor:            monitor.prefix('publisher'),
    }),
  },

  notifier: {
    requires: ['cfg', 'publisher'],
    setup: ({cfg, publisher}) => new Notifier({
      email: cfg.app.sourceEmail,
      aws: cfg.aws,
      queueName: cfg.app.sqsQueueName,
      publisher,
    }),
  },

  irc: {
    requires: ['cfg'],
    setup: async ({cfg}) => {
      let client = new IRC(_.merge(cfg.irc, {
        aws: cfg.aws,
        queueName: cfg.app.sqsQueueName,
      }));
      await client.start();
      return client;
    },
  },

  handler: {
    requires: ['cfg', 'monitor', 'notifier', 'validator'],
    setup: async ({cfg, monitor, notifier, validator}) => {
      let handler = new Handler({
        notifier,
        validator,
        credentials:        cfg.pulse,
        queueName:          cfg.app.listenerQueueName,
        monitor:            monitor.prefix('handler'),
        routePrefix:        cfg.app.routePrefix,
      });
      return handler.listen();
    },
  },

  api: {
    requires: ['cfg', 'monitor', 'validator', 'notifier'],
    setup: ({cfg, monitor, validator, notifier}) => v1.setup({
      context:          {notifier},
      authBaseUrl:      cfg.taskcluster.authBaseUrl,
      publish:          process.env.NODE_ENV === 'production',
      baseUrl:          cfg.server.publicUrl + '/v1',
      referencePrefix:  'notify/v1/api.json',
      aws:              cfg.aws,
      monitor:          monitor.prefix('api'),
      validator,
    }),
  },

  server: {
    requires: ['cfg', 'api'],
    setup: ({cfg, api}) => {

      debug('Launching server.');
      let app = app(cfg.server);
      app.use('/v1', api);
      return app.createServer();
    },
  },

}, ['profile', 'process']);

// If this file is executed launch component from first argument
if (!module.parent) {
  load(process.argv[2], {
    process: process.argv[2],
    profile: process.env.NODE_ENV,
  }).catch(err => {
    console.log(err.stack);
    process.exit(1);
  });
}

// Export load for tests
module.exports = load;
