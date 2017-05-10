const expressValidator = require('express-validator');

module.exports = () => expressValidator({
    customValidators: {
        FromAndTo: (from, to) => !(to !== 'f' && to < from),
        isIntOrF: value => value === 'f' || !isNaN(value),
        isIntAccNull: (value) => {
            if (value && isNaN(value)) return false;

            return true; // is an integer accept null
        },
    },
});
