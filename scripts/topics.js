const fuulProjectABI = require("../data/abi/FuulProject.json");

const iface = new ethers.utils.Interface(fuulProjectABI);

const event = "Attributed";

const topic = iface.getEventTopic(event);

// const log = {
//   topics: [
//     "0x9da6d2361426143b1f5fb37d258b72c038099495bc502036f4a780f92afb6db5",
//     "0x000000000000000000000000e91188000282d159209397948e104d4dd0616e66",
//     "0x000000000000000000000000000000000000000000000006aaf7c8516d0c0000",
//     "0x0000000000000000000000002a61f17d6ab1288627d8e21d75712df07007dafb",
//   ],
//   data: "0x0000000000000000000000000000000000000000000000000000000000000000",
// };

// const decode = iface.parseLog(log);

// console.log(decode.args);

console.log(topic);
