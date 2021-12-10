const readFile = require('../util/readfile');

module.exports = function(callback)
{
  readFile('./cart.txt',function(err,data)
  {
    if(err)
    {
      callback("Something went very wrong");
      return;
    }
    let cartProducts={};
    if(data.length>2)
    {
      cartProducts = JSON.parse(data);
    }
    callback(null,cartProducts);
  })
}
