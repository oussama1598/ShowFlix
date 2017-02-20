const _ = require("underscore");
const colors = require("colors");
const config = require("./config");
const arrayWatcher = require("./arrayWatcher");
const request = require("request");
const mediasHandler = require("./mediasHandler");

module.exports = io => {
    const _log = global._log = console.log.bind({});
    console.log = (data, onlyServer, phoneLog) => {
        if (config("ENABLE_SERVER_LOGGING")) _log(data);

        if (phoneLog && config("ENABLE_PHONE_LOGGIN") && config("SIMPLE_PUSH_ID") !== "" && typeof data === "string") {
            request.get(encodeURI(`${config("SIMPLE_PUSH_URL")}${config("SIMPLE_PUSH_ID")}/showFlix Notification/${colors.stripColors(data)}`));
        }

        if (!onlyServer && config("ENABLE_CLIENT_LOGGING")) {
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
        _.each(io.sockets.sockets, sk => {
            sk._emit("downloadsChanged", changes);
        })
    })

    new arrayWatcher(null, 1000, true).on("changed", (changes, added) => {
        _.each(io.sockets.sockets, sk => {
            sk._emit("queueChanged", changes);
        })
    })

    new arrayWatcher(global.Files, 2000).on("changed", () => {
        _.each(io.sockets.sockets, sk => {
            mediasHandler.getMedias().then(Files => {
                sk._emit("mediasChanged", Files);
            })
        })
    })
}
