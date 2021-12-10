const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;

const getUsers = require('./methods/getUsers');
const saveUser = require('./methods/saveUser');

const products = require('./products');
const getProducts = require('./methods/getProducts');

const checkAuth = require('./middlewares/checkAuth');

const sendMail = require('./methods/sendMail');
const passwordChgMail = require('./methods/passwordChgMail');
const resetPasswordMail = require('./methods/resetPasswordMail');

const readFile = require('./util/readFile');
const writeFile = require('./util/writeFile');
const getCartProducts = require('./methods/getCartProducts');

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.set('view engine','ejs');

app.get('/',(req,res)=>
{
  const { page_no=1 } = req.query;
  getProducts(parseInt(page_no), function(products,productsPerPage)
  {
    res.render('home',{ products:products,productsPerPage:productsPerPage,page_no:parseInt(page_no)+1 });
  })
})

app.get('/login',function(req,res)
{
  res.render('login',{error:''});
})

app.post('/login',function(req,res)
{
  const { username,password } = req.body;
  getUsers(function(err,users)
  {
    if(err)
    {
        res.render('login',{error:'user not found'});
        return
    }
    for(let i=0;i<users.length;i++)
    {
      let user = users[i];
      if(user.username===username && user.password===password)
      {
        req.session.is_logged_in = true;
        req.session.user = user;
        res.redirect('/home');
        return
      }
    }
    res.render('login',{error:'user not found'});
  })
})

app.get('/signup',function(req,res)
{
  res.render('signup',{error:""});
})

app.post('/signup',(req,res)=>
{
  const { username,password,name,mobile,email,role } = req.body;
  if(!username || !password || !name || !mobile || !email)
  {
    res.render('signup',{error:'you have forgot something'});
    return;
  }
  let user={
    username,
    password,
    name,
    mobile,
    email,
    role,
    isVerified:false,
  };
  
  saveUser(user, function(err)
  {
    if(err)
    {
      res.render('signup',{error:err});
      return;
    }
  })
  const token = Date.now();
  user.token = token;
  sendMail(email,token,function(err,data)
  {
    if(err){
      res.render('signup',{error:"Mail not sent"});
    }
    res.render("successMailSend");
    return;
  })
})

app.get('/home', checkAuth, function(req,res)
{
  const { page_no=1 } = req.query;
  getProducts(parseInt(page_no), function(products,productsPerPage)
  {
    if(req.session.user.role==1)
    {
      res.render('adminHome',{ user:req.session.user,products:products,productsPerPage:productsPerPage,page_no:parseInt(page_no)+1 });
    }
    else
    {
      res.render('dashboard',{ user:req.session.user,products:products,productsPerPage:productsPerPage,page_no:parseInt(page_no)+1 });
    }
  })
})

app.get('/logout',function(req,res)
{
  req.session.destroy();
  res.redirect('/home');
})

app.get('/verifyMail/:token',function(req,res)
{
  const { token } = req.params;
  getUsers(function(err,users)
  {
    if(err)
    {
      res.render('verifyUser',{error:'User not found!'});
        return
    }
    for(let i=0;i<users.length;i++){
      let user = users[i];
      if(user.token === parseInt(token)){
        user.isVerified = true;
        req.session.is_logged_in = true;
        req.session.user = user;
        res.redirect('/home'); 
        return;
      }
    }
    res.render('verifyUser',{error:'not verified'});
  })
})

app.get('/chgPassword',function(req,res)
{
  res.render('chgPassword',{error:''});
})

app.post('/chgPassword',function(req,res)
{
  const { curPassword,newPassword,confirmPassword } = req.body;
  if(newPassword!=confirmPassword)
  {
    res.render('chgPassword',{error:"New Password not matched with Confirm Password",user:req.session.user});
    return;
  }
  getUsers(function(err,users)
  {
    if(err)
    {
      res.render('chgPassword',{error:'User not found!'});
      return
    }
    for(let i=0;i<users.length;i++){
      let user = users[i];
      console.log(curPassword);
      if(user.password === curPassword){
        users = users.filter(function(element) {return element.username!=user.username});
        user.password = newPassword;
        users.push(user);
        writeFile('./db.txt',JSON.stringify(users),function(err)
        {
          if(err)
          {
            res.render('chgPassword',{error:'Password not updated in file'})
            return;
          }
        })
        console.log(user);
        passwordChgMail(user.email,function(err,data)
        {
          console.log(err,data);
          if(err)
          {
            res.render('chgPassword',{error:'Mail not sent'});
            return;
          }
        })
        res.redirect('/home'); 
        return;
      }
    }
    res.render('chgPassword',{error:'Password not updated!'});
  })
})

app.get('/forgotPassword',function(req,res)
{
  res.render('forgotPassword',{error:''});
})

app.post('/forgotPassword',function(req,res)
{
  const { username,email } = req.body;
  getUsers(function(err,users)
  {
    if(err)
    {
      res.render('forgotPassword',{error:'User not found!'});
      return;
    }
    for(let i=0;i<users.length;i++)
    {
      let user = users[i];
      
      if(user.username === username && user.email === email)
      {
        let resetToken = Date.now();
        user.resetToken = resetToken;
        console.log(user);
        resetPasswordMail(email,resetToken,function(err,data)
        {
          console.log(err,data);
          if(err)
          {
            res.render('forgotPassword',{error:'Mail not sent'});
            return;
          }
          res.render('resetMailSent');
          return;
        })
      }
    }
    //res.render('forgotPassword',{error:'Username or email not matched!'});
  })
})

app.get('/resetPassword/:resetToken',function(req,res)
{
  res.render('resetPassword',{error:'',user:req.session.user});
})

app.get('/viewDesc',function(req,res)
{
  const {productID} = req.query;
  let product = products.find(function(product)
  {
    return parseInt(productID) === product.id;
  })
  res.render('viewDesc',{product:product});
})

app.get('/addToCart',checkAuth,function(req,res)
{
  const {productID} = req.query;
  let product = products.find(function(product)
  {
    return parseInt(productID) === product.id;
  })
  const {username} = req.session.user;
  const userCart = {
    pid:product.id,
    pname:product.name,
    price:product.price,
    image:product.image,
    desc:product.desc,
    quantity:1
  }
  getCartProducts(function(err,cartProducts)
  {
    if(err)
    {
      res.send(err);
      return;
    }
    if(!cartProducts[username])
    {
      const arr = [];
      arr.push(userCart);
      cartProducts[username] = arr;
    }
    else
    {
      cartProducts[username].push(userCart);
    }
    writeFile('./cart.txt',JSON.stringify(cartProducts),function(err)
    {
      if(err)
      {
        res.send('error while adding product to cart');
        return;
      }
      res.redirect('/home');
    })
  })
})

app.get('/viewCart',checkAuth,function(req,res){
  
  const {username} = req.session.user;
  getCartProducts(function(err,cartProducts)
  {
    if(err)
    {
      res.send(err);
      return;
    }
    let flag=0;
    Object.keys(cartProducts).forEach(function(userName)
    {
      
      if(userName===username)
      {
        res.render('viewCart',{username:username,userCartProducts:cartProducts[username]});
        flag=1;
      }
    })
    if(!flag)
    {
      res.render('viewCart',{username:username,userCartProducts:[]});
    }
  })
})

app.get('/minusQuantity',function(req,res)
{
  const {productID} = req.query;
  const {username} = req.session.user;
  getCartProducts(function(err,cartProducts)
  {
    const cartproduct = cartProducts[username].find(function(product)
    {
      return parseInt(productID) === product.pid;
    })
    const index = cartProducts[username].findIndex(function(product)
    {
      return parseInt(productID) === product.pid;
    })
    cartProducts[username].splice(index,1);
    cartproduct.quantity -= 1;
    cartProducts[username].push(cartproduct);
    writeFile('./cart.txt',JSON.stringify(cartProducts),function(err)
    {
      if(err)
      {
        res.send('Error while minus quantity');
      }
      res.redirect('/viewCart');
    })
  })
})

app.get('/plusQuantity',function(req,res)
{
  const {productID} = req.query;
  const {username} = req.session.user;
  getCartProducts(function(err,cartProducts)
  {
    const cartproduct = cartProducts[username].find(function(product)
    {
      return parseInt(productID) === product.pid;
    })
    const product = products.find(function(product)
    {
      return parseInt(productID) === product.id;
    })
    if(cartproduct.quantity===product.quantity)
    {
      console.log('more stock not available');
      res.redirect('/viewCart');
      return;
    }
    const index = cartProducts[username].findIndex(function(product)
    {
      return parseInt(productID) === product.pid;
    })
    cartProducts[username].splice(index,1);
    cartproduct.quantity += 1;
    cartProducts[username].push(cartproduct);
    writeFile('./cart.txt',JSON.stringify(cartProducts),function(err)
    {
      if(err)
      {
        res.send('Error while plus quantity');
      }
      res.redirect('/viewCart');
    })
  })
})

app.get('/viewDescCart',checkAuth,function(req,res)
{
  const {productID} = req.query;
  const {username} = req.session.user;
  getCartProducts(function(err,cartProducts)
  {
    const product = cartProducts[username].find(function(product)
    {
      return parseInt(productID) === product.pid;
    })
    res.render('viewDescCart',{product,username:username});
  })
})

app.get('/deleteFromCart',function(req,res)
{
  const {productID} = req.query;
  const {username} = req.session.user;
  getCartProducts(function(err,cartProducts)
  {
    let product = cartProducts[username].find(function(product)
    {
      return parseInt(productID) === product.pid;
    })
    const updatedCartProducts = cartProducts[username].filter(function(itrProduct)
    {
      return itrProduct.pid != product.pid;
    })
    writeFile('./cart.txt',JSON.stringify(updatedCartProducts),function(err)
    {
      if(err)
      {
        res.send(err);
        return;
      }
      res.redirect('/viewCart');
    })
  })
})

app.get('/addProduct',function(req,res)
{
  const {username} = req.session.user;
  if(req.session.user.role!="1")
  {
    req.session.destroy();
    res.redirect('/home');
  }
  res.render('addProduct',{username:username,error:""});
})

app.post('/addProduct',function(req,res)
{
  const {name,desc,price,quantity,image} = req.body;
  if(!name || !desc || !price || !quantity || !image)
  {
    res.render('addProduct',{error:'you have forgot something'});
    return;
  }
  readFile('./products.txt',function(err,data)
  {
    if(err)
    {
      res.render('addProduct',{error:'error while getting products'});
    }
    let products = [];
    if(data.length>2)
    {
      products = JSON.parse(data);
    }
    let id = products[products.length-1].id+1;
    let product={
      id,
      name,
      price,
      quantity,
      image,
      desc
    };
    products.push(product);
    writeFile('./products.txt',JSON.stringify(products),function(err)
    {
      if(err)
      {
        res.render('addProduct',{error:'error while adding product in file'});
      }
      res.redirect('/home');
    })
  })
})

app.get('/updateProduct',function(req,res)
{
  const {username} = req.session.user;
  if(req.session.user.role!="1")
  {
    req.session.destroy();
    res.redirect('/home');
  }
  const {productID} = req.query;
  readFile('./products.txt',function(err,data)
  {
    let products=[];
    if(data.length>2)
    {
      products = JSON.parse(data);
    }
    let product = products.find(function(product)
    {
      return product.id === parseInt(productID);
    })
    res.render('updateProduct',{username:username,error:"",product:product});
  })
})

app.post('/updateProduct',function(req,res)
{
  const {id,name,desc,price,quantity,image} = req.body;
  if(!id || !name || !desc || !price || !quantity || !image)
  {
    res.render('addProduct',{error:'you have forgot something'});
    return;
  }
  readFile('./products.txt',function(err,data)
  {
    if(err)
    {
      res.render('updateProduct',{error:'error while getting products'});
    }
    let products = [];
    if(data.length>2)
    {
      products = JSON.parse(data);
    }
    let index = products.findIndex(function(product)
    {
      return product.id === parseInt(id);
    })
    products.splice(index,1);
    let product={
      id,
      name,
      price,
      quantity,
      image,
      desc
    };
    products.push(product);
    writeFile('./products.txt',JSON.stringify(products),function(err)
    {
      if(err)
      {
        res.render('updateProduct',{error:'error while updating product in file'});
      }
      res.redirect('/home');
    })
  })
})

app.get('/deleteProduct',function(req,res)
{
  const {productID} = req.query;
  readFile('./products.txt',function(err,data)
  {
    let products=[];
    if(data.length>2)
    {
      products = JSON.parse(data);
    }
    let index = products.findIndex(function(product)
    {
      return product.id === parseInt(productID);
    })
    products.splice(index,1);
    writeFile('./products.txt',JSON.stringify(products),function(err)
    {
      res.redirect('/home');
    })
  })
})

app.listen(port, ()=>
{
  console.log(`Example listening at port http://localhost:${port}`);
})
