const _ = require('underscore');
const colors = require('colors');
const config = require('./config');
const utils = require('../utils/utils');
const ArrayWatcher = require('./ArrayWatcher');

module.exports = (io) => {
  global.log = console.log.bind({});

  console.log = (data, onlyServer) => {
    if (config('ENABLE_SERVER_LOGGING')) global.log(data);

    if (!onlyServer && config('ENABLE_CLIENT_LOGGING')) {
      let color;
      if (typeof data === 'string') {
        const str = colors.stripColors(data);

        _.each(colors.styles, (_color, key) => {
          const open = _color.open.replace('\u001b', '');
          const close = _color.close.replace('\u001b', '');

          if (data.indexOf(open) > -1 && data.indexOf(close) > -1) {
            color = key;
          }
        });

        if (!color) color = 'white';
        io.sockets.emit('all', {
          evt: 'log',
          data: {
            str,
            color,
          },
        });
      }
    }
  };

  new ArrayWatcher(1000, () => global.downloadsdb.get()
      .value())
    .on('changed', (data) => {
      utils.cache.delete('downloads');
      utils.cache.set('downloads', data);

      _.each(io.sockets.sockets, (sk) => {
        sk.$emit('downloadsChanged', data);
      });
    });

  global.queuedb.on('update', (data) => {
    utils.cache.delete('queue');
    utils.cache.set('queue', global.queuedb.get().value());

    _.each(io.sockets.sockets, (sk) => {
      sk.$emit('queueChanged', data);
    });
  });

  global.filesdb.on('update', ({
    event,
    message,
  }) => {
    utils.filesdbHelpers.triggerUpdate(event, message, global.filesdb.get().value()).then(() => {});

    // _.each(io.sockets.sockets, (sk) => {
    //   mediasHandler.getFiles()
    //     .then((Files) => {
    //       sk.$emit('mediasChanged', Files);
    //     });
    // });
  });
};
