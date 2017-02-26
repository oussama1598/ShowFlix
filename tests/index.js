var multimeter = require('multimeter');
var multi = multimeter(process);
multi.charm.reset();

var bar = multi(0, 0, {
        width : 20,
        solid : {
            text : '|',
            foreground : 'white',
            background : 'blue'
        },
        empty : { text : ' ' },
    });

bar.percent(50)
