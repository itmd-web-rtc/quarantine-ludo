console.log(NAMESPACE);
var sc = io.connect("/" + NAMESPACE);
sc.on("message", function (data) {
  console.log(`${data}`);
});
