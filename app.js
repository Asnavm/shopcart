var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const userRouter = require('./routes/user');
    const adminRouter = require('./routes/admin');

const fileUpload = require('express-fileupload');


var hbs=require('express-handlebars')

var app = express();
var db=require('./config/connection')
var session= require('express-session')



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutDir:__dirname+'/views/layouts/',partialsDir:__dirname+'/views/partials/', runtimeOptions: { allowProtoPropertiesByDefault: true, allowProtoMethodsByDefault: true,},
helpers: {
    json: (context) => JSON.stringify(context, null, 2)
  }}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(fileUpload());
app.use(express.static('public'));
app.use(session({secret:"key", cookie:{maxAge:600000}}))

var exhbs=hbs.create({
  extname:'hbs',
  defaultLayout:'layout',
  helpers:{
    ifLt:(a,b,options)=>{
      return a >= b? options.fn(this):options.inverse(this)
    }
  }
})

 app.use('/', userRouter);
    app.use('/admin', adminRouter);

(async () => {
  try {
    await db.connect(); 
    db.get();// ✅ Must be awaited before using db.get()
    console.log('✅ DB connected');

    // Now it's safe to mount routes
    
 app.use('/', userRouter);
    app.use('/admin', adminRouter);
   

    
  } catch (err) {
    console.error('❌ Failed to start app due to DB error:', err.message);
  }
})();




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
