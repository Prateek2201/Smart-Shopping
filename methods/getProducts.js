const readFile = require('../util/readFile');
module.exports = function(page_no,callback)
{
  readFile('./products.txt',function(err,data)
  {
    let products = [];
    if(data.length>2)
    {
      products = JSON.parse(data);
    }

    if(!page_no)
    {
      page_no = 1;
    }
    const productsPerPage = 5;
    let printedProduct = productsPerPage*(page_no-1);
    let lastProductIndex;
    if(products.length - printedProduct < products.length)
    {
      lastProductIndex = printedProduct + (products.length - printedProduct);
    }
    else
    {
      lastProductIndex = productsPerPage*page_no;
    }

    let new_array=[];
    for(let i=0;i<lastProductIndex;i++){
      new_array.push(products[i]);
    }
    callback(new_array,productsPerPage);
  })
}