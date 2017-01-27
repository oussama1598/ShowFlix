angular.module('showFlex').factory('socketEvt', ["serverSocket", function(serverSocket) {
    var evts = {};

    serverSocket.on("all", function(data) {
        evtsOccured(data.evt, data.data);
    })

    function emit(evt, data) {
        serverSocket.emit(evt, data);
    }

    function add(to, fn) {
        if (evts[to]) {
            evts[to].push(fn);
        } else {
            evts[to] = [fn];
        }
    }

    function remove(evt, fn) {
        if (!evts[evt]) return;
        evts[evt].splice(evts[evt].indexOf(fn), 1);
    }

    function evtsOccured(eventName, data) {
        const callbacks = evts[eventName] ? evts[eventName] : [];

        callbacks.forEach(function(fn) {
            fn(data);
        })
    }

    return {
        add: add,
        remove: remove,
        emit: emit,
        evts: evts
    }
}]);
