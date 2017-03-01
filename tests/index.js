const low = require("lowdb");


const values = low("../data/queue.json").get();

console.log(values.value());
