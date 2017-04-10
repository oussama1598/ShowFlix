const _ = require('underscore');
const colors = require('colors');
const config = require('./config');
const arrayWatcher = require('./arrayWatcher');
const request = require('request');
const mediasHandler = require('./mediasHandler');
const downloadsCtrl = require('../controllers/downloadsCtrl');

module.exports = io => {
    const log = global.log = console.log.bind({});

    console.log = (data, onlyServer, phoneLog) => {
        if (config('ENABLE_SERVER_LOGGING')) log(data);

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
                        color
                    }
                });
            }
        }
    };

    new arrayWatcher(1000, () => global.downloadsdb
        .db()
        .get('downloads')
        .value()
    ).on('changed', changes => {
        _.each(io.sockets.sockets, sk => {
            sk._emit('downloadsChanged', changes);
        });
    });

    new arrayWatcher(1000, () => global.queuedb.db().value()).on('changed', changes => {
        _.each(io.sockets.sockets, sk => {
            sk._emit('queueChanged', changes);
        });
    });

    new arrayWatcher(2000, () => global.Files).on('changed', () => {
        _.each(io.sockets.sockets, sk => {
            mediasHandler.getMedias().then(Files => {
                sk._emit('mediasChanged', Files);
            });
        });
    });
};
