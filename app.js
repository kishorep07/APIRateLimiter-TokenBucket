const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const redis = require('redis');
const session = require('express-session');
const rateLimiter = require('./rate-limiter.js');

// Create Redis Client
let client = redis.createClient();

client.on('connect', function(){
  console.log('Connected to Redis...');
});

// Set Port
const port = 3000;

// Init app
const app = express();

//Registering the session with it's secret ID
app.use(session({
  secret: 'cookie_secret',
  proxy: true,
  resave: true,
  saveUninitialized: true
}));

// View Engine
app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

// body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// methodOverride
app.use(methodOverride('_method'));

// Login Page
app.get('/login', function(req, res, next){
  if(req.session.username)
  res.redirect('/');
  else
    res.render('login');
});

// Sign-Up Page
app.get('/sign-up', function(req, res, next){
    res.render('sign-up');
});

// Process Sign-Up Page
app.post('/user/sign-up', function(req, res, next){
  var name = req.body.name;
  var username = req.body.username;
  var password = req.body.password;
  if(req.body.developers=="")
    var developers = 10;
  else 
    var developers = parseInt(req.body.developers);   
  
  if(req.body.companies=="")
    companies=10;
  else
    companies = parseInt(req.body.companies);
  if(req.body.students=="")
    students=10;
  else
    students = parseInt(req.body.students);

  client.hmset(username, [
    'name', name,
    'password', password,
    'developers', developers,
    'companies', companies,
    'students', students

  ], function(err, reply){
    if(err){
      console.log(err);
    }
    console.log(reply);
    res.redirect('/login');
  });
});

// Login processing
app.post('/user/login', function(req, res, next){
  let username = req.body.username;
  let password = req.body.password;

  client.hgetall(username, function(err, obj){
    if(!obj){
      res.render('login', {
        error: 'User does not exist'
      });
    } 
    else {
      client.hgetall(username, function(err, obj){
        if(obj.password==password)
        {
          req.session.username=username;
          res.redirect('/');
        }
        else
        {
          res.render('login', {
            error: 'Wrong Credentials'
          });
        }
      });

    }
  });
});

//Homepage
app.get('/', function(req, res, next){
  if(req.session.username)
    client.hgetall(req.session.username, function(err, obj){
      res.render('account', {user: obj});
    });
  else
    res.redirect('/login');
});

//Logout
app.get('/logout', function(req, res, next){

  req.session.destroy(function(err){
    if(err)
      res.negotiate(err);
    res.redirect('/login');
  });
});

// Developers Page
app.get('/developers', function(req, res, next){
  if(req.session.username)
    rateLimiter(req.session.username,'developers','developers','error',res,client)
  else
    res.redirect('/login');
});

// Companies Page
app.get('/companies', function(req, res, next){
  if(req.session.username)
    rateLimiter(req.session.username,'companies','companies','error',res,client)
  else
    res.redirect('/login');
});

// Students Page
app.get('/students', function(req, res, next){
  if(req.session.username)
    rateLimiter(req.session.username,'students','students','error',res,client)
  else
    res.redirect('/login');
});

app.listen(port, function(){
    console.log('Server started on port '+port);
  });
