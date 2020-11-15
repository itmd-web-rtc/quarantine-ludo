console.log(NAMESPACE);
var sc = io.connect("/" + NAMESPACE);

sc.on("message", function (data) {
  console.log(`${data}`);
});

var clientIs = {
  makingOffer: false,
  ignoringOffer: false,
  polite: false,
  settingRemoteAnswerPending: false,
};

var rtc_config = null;

//Setting basic to get peer connection
var pc = new RTCPeerConnection(rtc_config);

//set data channel
var dc = null;

//declare DOM elements for chat
var chatLog = document.querySelector("#chat-log");
var chatForm = document.querySelector("#chat-form");
var chatInput = document.querySelector("#message");
var chatButton = document.querySelector("#send-button");
var joinForm = document.querySelector("#join-form");
var joinName = document.querySelector("#join-name");

function appendMsgToChatLog(log, msg, who) {
  var li = document.createElement("li");

  //Add timestampn to chat messages
  var br = document.createElement("br");
  var span = document.createElement("span");
  span.className = "chat-time";

  var msg = document.createTextNode(msg);
  li.appendChild(msg);
  li.className = who;
  if (who !== "join") {
    li.appendChild(br);
    li.appendChild(span);
  }

  //add current timestamp
  span.innerText = new Date().toLocaleTimeString("en-US", {
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  });
  log.appendChild(li);
  if (chatLog.scrollTo) {
    chatLog.scrollTo({
      top: chatLog.scrollHeight,
      behavior: "smooth",
    });
  } else {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

function addDataChannelEventListner(datachannel) {
  datachannel.onmessage = function (e) {
    appendMsgToChatLog(chatLog, e.data, "peer");
  };

  datachannel.onopen = function () {
    chatButton.disabled = false;
    chatInput.disabled = false;
  };

  datachannel.onclose = function () {
    chatButton.disabled = true;
    chatInput.disabled = true;
  };

  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = chatInput.value;
    msg = msg.trim();
    if (msg !== "") {
      appendMsgToChatLog(chatLog, msg, "self");
      datachannel.send(msg);
      chatInput.value = "";
    }
  });
}

//Once the RTC connection is steup and connected the peer will open data channel
pc.onconnectionstatechange = function (e) {
  if (pc.connectionState == "connected") {
    if (clientIs.polite) {
      console.log("Creating a data channel on the initiating side");
      dc = pc.createDataChannel("text chat");
      addDataChannelEventListner(dc);
    }
  }
};

//listen for datachannel
// This will on fire on receiving end of the connection
pc.ondatachannel = function (e) {
  console.log("Data Channel is open");
  dc = e.channel;
  addDataChannelEventListner(dc);
};

//video Streams
var media_constraints = { video: true, audio: false };

var selfVideo = document.querySelector("#self-video");
var selfStream = new MediaStream();
selfVideo.srcObject = selfStream;

var peerVideo = document.querySelector("#peer-video");
var peerStream = new MediaStream();
console.log(peerStream);
peerVideo.srcObject = peerStream;

async function startStream(name) {
  try {
    var stream = await navigator.mediaDevices.getUserMedia(media_constraints);
    for (var track of stream.getTracks()) {
      pc.addTrack(track);
    }

    selfVideo.srcObject = stream;
    //send joined message with current timestamp
    sc.emit(
      "joined",
      `${name} joined the chat! at ${new Date().toLocaleTimeString("en-US", {
        hour12: true,
        hour: "numeric",
        minute: "numeric",
      })}`
    );
  } catch (error) {}
}

sc.on("joined", function (e) {
  appendMsgToChatLog(chatLog, e, "join");
});

pc.ontrack = (track) => {
  peerStream.addTrack(track.track);
};

var callButton = document.querySelector("#join-button");

callButton.addEventListener("click", function (e) {
  e.preventDefault();
  if (joinName.value !== "") {
    joinCall(joinName.value);
  } else {
    alert("Enter your Name!");
  }
});

function joinCall(name) {
  clientIs.polite = true;
  negotiateConnection();
  startStream(name);
  joinForm.hidden = true;
}

async function negotiateConnection() {
  pc.onnegotiationneeded = async function () {
    try {
      console.log("Making Offer");
      clientIs.makingOffer = true;
      try {
        await pc.setLocalDescription();
      } catch (error) {
        var offer = await pc.createOffer();
        await pc.setLocalDescription(new RTCSessionDescription(offer));
      } finally {
        sc.emit("signal", { description: pc.localDescription });
      }
    } catch (error) {
      console.log(error);
    } finally {
      clientIs.makingOffer = false;
    }
  };
}

sc.on("signal", async function ({ candidate, description }) {
  try {
    if (description) {
      console.log("Received a description!!!");
      var readyForOffer =
        !clientIs.makingOffer &&
        (pc.signalingState == "stable" || clientIs.settingRemoteAnswerPending);

      var offerCollision = description.type == "answer" && !readyForOffer;

      clientIs.ignoringOffer = !clientIs.polite && offerCollision;

      if (clientIs.ignoringOffer) {
        return;
      }

      // Set the remote decription
      // Set the remote description...
      try {
        console.log("Trying to set a remote description:\n", description);
        clientIs.settingRemoteAnswerPending = description.type == "answer";
        await pc.setRemoteDescription(description);
        clientIs.settingRemoteAnswerPending = false;
      } catch (error) {
        console.error("Error from setting local description", error);
      }

      //if it's offer you need to answer
      if (description.type == "offer") {
        console.log("Offer description");
        try {
          //works for latest browsers
          await pc.setLocalDescription();
        } catch (error) {
          //works for older browsers we pass the answer we created using RTCSession
          if (pc.signalingState == "have-remote-offer") {
            // create a answer, if that's what's needed...
            console.log("Trying to prepare an answer:");
            var offer = await pc.createAnswer();
          } else {
            // otherwise, create an offer
            console.log("Trying to prepare an offer:");
            var offer = await pc.createOffer();
          }

          await pc.setLocalDescription(new RTCSessionDescription(offer));
        } finally {
          sc.emit("signal", { description: pc.localDescription });
        }
      }
    } else if (candidate) {
      console.log("Received a candidate:");
      console.log(candidate);
      //safari fix for the blank candidate
      try {
        if (candidate.candidate.length > 1) {
          await pc.addIceCandidate(candidate);
        }
      } catch (error) {
        if (!clientIs.ignoringOffer) {
          throw error;
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
});

//logic to send candidate
pc.onicecandidate = function ({ candidate }) {
  sc.emit("signal", { candidate: candidate });
};

function createHomeSquares(ctx, x, y){
  ctx.beginPath();
  ctx.strokeStyle = 'grey'
  ctx.fillStyle = 'white'
  ctx.lineWidth = 5
  ctx.rect(x, y, 50, 50);
  ctx.fill()
  ctx.stroke()
}

function setWidthAndHeightOfLeftLayer() {
  let homeBlockGreen = document.querySelector("#home-block-green");
  let homeBlockRed = document.querySelector("#home-block-red");
  let playBlockGreen = document.querySelector("#play-block-green");

  let leftLayer = document.querySelector("#left-layer");
  homeBlockGreen.width = leftLayer.offsetWidth;
  homeBlockGreen.height = (40 * leftLayer.offsetHeight) / 100;
  ctx1 = homeBlockGreen.getContext("2d");

  // outlined square X: 50, Y: 35, width/height 50
  createHomeSquares(ctx1, 50, 35)

   // outlined square X: 175, Y: 35, width/height 50
   createHomeSquares(ctx1, 175, 35)

   // outlined square X: 50, Y: 125, width/height 50
   createHomeSquares(ctx1, 50, 125)

    // outlined square X: 175, Y: 125, width/height 50
    createHomeSquares(ctx1, 175, 125)

  playBlockGreen.width = leftLayer.offsetWidth;
  playBlockGreen.height = (20 * leftLayer.offsetHeight) / 100;
  let ctx5 = playBlockGreen.getContext("2d");
  //drawPlayBlockGrid(ctx5, leftLayer.offsetWidth, leftLayer.offsetWidth)
  ctx5.strokeStyle = "black";
  ctx5.lineWidth = 4;
  
  for(let i = 0; i <= leftLayer.offsetWidth; i+=leftLayer.offsetWidth/6){
    console.log("in for loop")
    ctx5.beginPath(); 
    ctx5.moveTo(i,0)
    ctx5.lineTo(i,playBlockGreen.width)
    ctx5.stroke()
  }

  for(let i = 0; i <= playBlockGreen.height; i+=playBlockGreen.height/3){
    console.log("in for loop")
    ctx5.moveTo(0,i)
    ctx5.lineTo(playBlockGreen.width, i)
    ctx5.stroke()
  }

  homeBlockRed.width = leftLayer.offsetWidth;
  homeBlockRed.height = (40 * leftLayer.offsetHeight) / 100;
  ctx2 = homeBlockRed.getContext("2d");
    // outlined square X: 50, Y: 35, width/height 50
    createHomeSquares(ctx2, 50, 35)

    // outlined square X: 175, Y: 35, width/height 50
    createHomeSquares(ctx2, 175, 35)
 
    // outlined square X: 50, Y: 125, width/height 50
    createHomeSquares(ctx2, 50, 125)
 
     // outlined square X: 175, Y: 125, width/height 50
     createHomeSquares(ctx2, 175, 125)
}
setWidthAndHeightOfLeftLayer();

function setWidthAndHeightOfMiddleLayer() {
  let playBlockYellow = document.querySelector("#play-block-yellow");
  let finishBlock = document.querySelector("#finish-block");
  let playBlockRed = document.querySelector("#play-block-red");

  let middleLayer = document.querySelector("#middle-layer");
  playBlockYellow.width = middleLayer.offsetWidth;
  playBlockYellow.height = (40 * middleLayer.offsetHeight) / 100;
  let ctx7 = playBlockYellow.getContext("2d");
  //drawPlayBlockGrid(ctx7, leftLayer.offsetWidth, leftLayer.offsetWidth)
  ctx7.strokeStyle = "black";
  ctx7.lineWidth = 4;
  
  for(let i = 0; i <= middleLayer.offsetWidth; i+=middleLayer.offsetWidth/3){
    console.log("in for loop")
    ctx7.beginPath(); 
    ctx7.moveTo(i,0)
    ctx7.lineTo(i,playBlockYellow.width)
    ctx7.stroke()
  }

  for(let i = 0; i <= playBlockYellow.height; i+=playBlockYellow.height/6){
    console.log("in for loop")
    ctx7.moveTo(0,i)
    ctx7.lineTo(playBlockYellow.height, i)
    ctx7.stroke()
  }

  finishBlock.width = middleLayer.offsetWidth;
  finishBlock.height = (20 * middleLayer.offsetHeight) / 100;
  let ctx9 = finishBlock.getContext("2d");
  //drawPlayBlockGrid(ctx7, leftLayer.offsetWidth, leftLayer.offsetWidth)
  ctx9.strokeStyle = "black";
  ctx9.lineWidth = 4;
  
  for(let i = 0; i <= middleLayer.offsetWidth; i+=middleLayer.offsetWidth/3){
    console.log("in for loop")
    ctx9.beginPath(); 
    ctx9.moveTo(i,0)
    ctx9.lineTo(i,finishBlock.width)
    ctx9.stroke()
  }

  for(let i = 0; i <= finishBlock.height; i+=finishBlock.height/3){
    console.log("in for loop")
    ctx9.moveTo(0,i)
    ctx9.lineTo(playBlockYellow.height, i)
    ctx9.stroke()
  }

  playBlockRed.width = middleLayer.offsetWidth;
  playBlockRed.height = (40 * middleLayer.offsetHeight) / 100;
  let ctx8 = playBlockRed.getContext("2d");
  //drawPlayBlockGrid(ctx8, leftLayer.offsetWidth, leftLayer.offsetWidth)
  ctx8.strokeStyle = "black";
  ctx8.lineWidth = 4;
  
  for(let i = 0; i <= middleLayer.offsetWidth; i+=middleLayer.offsetWidth/3){
    console.log("in for loop")
    ctx8.beginPath(); 
    ctx8.moveTo(i,0)
    ctx8.lineTo(i,playBlockRed.width)
    ctx8.stroke()
  }

  for(let i = 0; i <= playBlockRed.height; i+=playBlockRed.height/6){
    console.log("in for loop")
    ctx8.moveTo(0,i)
    ctx8.lineTo(playBlockYellow.width, i)
    ctx8.stroke()
  }

}

setWidthAndHeightOfMiddleLayer();

function setWidthAndHeightOfRightLayer() {
  let homeBlockYellow = document.querySelector("#home-block-yellow");
  let playBlockBlue = document.querySelector("#play-block-blue");
  let homeBlockBlue = document.querySelector("#home-block-blue");

  let rightLayer = document.querySelector("#right-layer");
  homeBlockYellow.width = rightLayer.offsetWidth;
  homeBlockYellow.height = (40 * rightLayer.offsetHeight) / 100;
  ctx3 = homeBlockYellow.getContext("2d");
  // outlined square X: 50, Y: 35, width/height 50
  createHomeSquares(ctx3, 50, 35)

   // outlined square X: 175, Y: 35, width/height 50
   createHomeSquares(ctx3, 175, 35)

   // outlined square X: 50, Y: 125, width/height 50
   createHomeSquares(ctx3, 50, 125)

    // outlined square X: 175, Y: 125, width/height 50
    createHomeSquares(ctx3, 175, 125)

  playBlockBlue.width = rightLayer.offsetWidth;
  playBlockBlue.height = (20 * rightLayer.offsetHeight) / 100;
  let ctx6 = playBlockBlue.getContext("2d");
  //drawPlayBlockGrid(ctx6, leftLayer.offsetWidth, leftLayer.offsetWidth)
  ctx6.strokeStyle = "black";
  ctx6.lineWidth = 4;
  
  for(let i = 0; i <= rightLayer.offsetWidth; i+=rightLayer.offsetWidth/6){
    console.log("in for loop")
    ctx6.beginPath(); 
    ctx6.moveTo(i,0)
    ctx6.lineTo(i,playBlockBlue.width)
    ctx6.stroke()
  }

  for(let i = 0; i <= playBlockBlue.height; i+=playBlockBlue.height/3){
    console.log("in for loop")
    ctx6.moveTo(0,i)
    ctx6.lineTo(playBlockBlue.width, i)
    ctx6.stroke()
  }

  homeBlockBlue.width = rightLayer.offsetWidth;
  homeBlockBlue.height = (40 * rightLayer.offsetHeight) / 100;
  ctx4 = homeBlockBlue.getContext("2d");

  // outlined square X: 50, Y: 35, width/height 50
  createHomeSquares(ctx4, 50, 35)

   // outlined square X: 175, Y: 35, width/height 50
   createHomeSquares(ctx4, 175, 35)

   // outlined square X: 50, Y: 125, width/height 50
   createHomeSquares(ctx4, 50, 125)

    // outlined square X: 175, Y: 125, width/height 50
    createHomeSquares(ctx4, 175, 125)
}

setWidthAndHeightOfRightLayer();
