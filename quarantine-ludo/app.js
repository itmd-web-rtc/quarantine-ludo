var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const io = require("socket.io")();
var indexRouter = require("./routes/index");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

//Soket for URL Rooms
const namespaces = io.of(/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);

namespaces.on("connect", function (socket) {
  const namespace = socket.nsp;
  console.log("connected");
  socket.emit(
    "message",
    `${socket.id} successfully Connected on NAMESPACE: ${namespace.name}`
  );
  //not getting this
  namespace.clients(function(error,clients) {
    socket.emit('connected peers', clients);
  });

  socket.on('new connected peer', function(data) {
    socket.broadcast.emit('new connected peer', data);
  });

  socket.on('disconnect', function() {
    console.log(`${socket.id} disconnected`);
    namespace.emit('new disconnected peer', socket.id);
  });
  //send the singal to others
  socket.on('signal', function({to, from, description, candidate }) {
    console.log(`Received a singal from ${socket.id}`);
    console.log({to, from, description, candidate });
    socket.to(to).emit('signal', {to, from, description, candidate});
    
  });

  socket.on('joined', function(e) {
    socket.emit('joined', e );
    socket.broadcast.emit('joined', e );
  });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = { app, io };
