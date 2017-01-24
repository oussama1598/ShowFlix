const _ = require("underscore");
const colors = require("colors");
const config = require("./config");
const arrayWatcher = require("./arrayWatcher");

module.exports = io => {
    const _log = global._log = console.log.bind({});
    console.log = (data, noServer) => {
        if(config("ENABLE_SERVER_LOGGING")) _log(data);

        if (!noServer && config("ENABLE_CLIENT_LOGGING")) {
            let color;
            if (typeof data === "string") {
                const str = colors.stripColors(data);
                for (key in colors.styles) {
                    if (colors.styles.hasOwnProperty(key)) {
                        const open = colors.styles[key].open.replace("\u001b", ""),
                            close = colors.styles[key].close.replace("\u001b", "");

                        if (data.indexOf(open) > -1 && data.indexOf(close) > -1) {
                            color = key;
                            break;
                        }
                    }
                }
                if (!color) color = "white";
                io.sockets.emit("all", { evt: "log", data: { str, color } });
            }
        }
    };

    new arrayWatcher(global.fileDowns, 1000).on("changed", changes => {
        _.each(io.sockets.clients(), sk => {
            if (sk.downloads) {
                sk._emit("downloadsChanged", changes);
            }
        })
    })

    new arrayWatcher(null, 1000, true).on("changed", changes => {
        _.each(io.sockets.sockets, sk => {
            if (sk.queue) {
                sk._emit("queueChanged", changes);
            }
        })
    })
}
