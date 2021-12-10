const readFile = require('../util/readfile');

module.exports = function(callback)
{
  readFile('./db.txt',function(err,data)
  {
    if(err)
    {
      callback("users not found");
      return;
    }
    let users=[];
    if(data.length>0 && data[0]==='[' && data[data.length-1]===']')
    {
      users = JSON.parse(data);
    }
    callback(null,users);
  })
}
