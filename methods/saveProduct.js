// const writeFile = require('../util/writeFile');
// const products = require('../products');
//
// module.exports = function(newProduct,callback)
// {
//   for(let i=0;i<products.length;i++)
//   {
//     let product = products[i];
//     if(product.name===newProduct.name)
//     {
//       callback('product already exists');
//       return;
//     }
//   }
//   products.push(newProduct);
//   writeFile('./products.js',JSON.stringify(products),function(err)
//   {
//     if(err)
//     {
//       callback('error while saving new product');
//       return;
//     }
//     callback(null,true);
//   })
// }
