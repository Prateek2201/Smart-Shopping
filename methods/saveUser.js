const writeFile = require('../util/writeFile');
const getUsers = require('./getUsers');

module.exports = function(newUser,callback)
{
  getUsers(function(err,users)
  {
    if(err)
    {
      res.send('something went wrong');
      return;
    }
    for(let i=0;i<users.length;i++)
    {
      let user = users[i];
      if(user.username===newUser.username)
      {
        callback('user already exists');
        return;
      }
    }
    users.push(newUser);
    writeFile('./db.txt',JSON.stringify(users),function(err)
    {
      if(err)
      {
        callback('error while saving new user');
        return;
      }
      callback(null,true);
    })
  })
}
