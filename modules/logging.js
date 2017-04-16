const _ = require('underscore');
const colors = require('colors');
const config = require('./config');
const ArrayWatcher = require('./arrayWatcher');
const request = require('request');
const mediasHandler = require('./mediasHandler');

module.exports = (io) => {
  global.log = console.log.bind({});

  console.log = (data, onlyServer, phoneLog) => {
    if (config('ENABLE_SERVER_LOGGING')) global.log(data);

    if (
      phoneLog &&
      config('ENABLE_PHONE_LOGGIN') &&
      config('SIMPLE_PUSH_ID') !== '' &&
      typeof data === 'string'
    ) {
      request.get(encodeURI(`${config('SIMPLE_PUSH_URL')}
                  ${config('SIMPLE_PUSH_ID')}/showFlix Notification/${colors.stripColors(data)}`));
    }

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

  new ArrayWatcher(1000, () => global.downloadsdb
      .db()
      .get('downloads')
      .value())
    .on('changed', (changes) => {
      _.each(io.sockets.sockets, (sk) => {
        sk.$emit('downloadsChanged', changes);
      });
    });

  new ArrayWatcher(1000, () => global.queuedb.db()
      .get('queue')
      .value())
    .on('changed', (changes) => {
      _.each(io.sockets.sockets, (sk) => {
        sk.$emit('queueChanged', changes);
      });
    });

  new ArrayWatcher(2000, () => global.filesdb
      .db()
      .get('files')
      .value())
    .on('changed', () => {
      _.each(io.sockets.sockets, (sk) => {
        mediasHandler.getMedias()
          .then((Files) => {
            sk.$emit('mediasChanged', Files);
          });
      });
    });
};
