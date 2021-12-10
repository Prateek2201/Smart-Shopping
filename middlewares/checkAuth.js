module.exports = function(req,res,next){
  if(req.session.is_logged_in){
    if(req.session.user.isVerified){
      next();
    }
    else{
      res.redirect('/login');  
    }
  }
  else{
    res.redirect('/login');
  }
}
