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

  var msg1 = document.createTextNode(msg);
  li.appendChild(msg1);
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
    var msg2 = chatInput.value;
    msg2= msg2.trim();
    if (msg2 !== "") {
      appendMsgToChatLog(chatLog, msg2, "self");
      datachannel.send(msg2);
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
var media_constraints = { video: true, audio: true };

var selfVideo = document.querySelector("#self-video");
var selfStream = new MediaStream();
selfVideo.volume = 0;
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

    
    //Player name Display
    console.log("Join Name = "+ joinName.value);



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
      document.getElementById("p1").innerHTML=joinName.value;
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
        document.getElementById("p1").innerHTML=joinName.value;
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
            var offer;
            console.log("Trying to prepare an answer:");
            offer = await pc.createAnswer();
            

          } else {
            // otherwise, create an offer
            console.log("Trying to prepare an offer:");
            offer = await pc.createOffer();
            
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



//---------Ludo Game logic-----------

//---Dice roll---
var dice = document.querySelector("#dice-roll");
var badtext = document.querySelector('#badtext');
var text = document.querySelector('#player');
var redpawn1 = document.querySelector('#redpawn1');
var redpawn2 = document.querySelector('#redpawn2');
var redpawn3 = document.querySelector('#redpawn3');
var redpawn4 = document.querySelector('#redpawn4');
var greenpawn1 = document.querySelector('#greenpawn1');
var greenpawn2 = document.querySelector('#greenpawn2');
var greenpawn3 = document.querySelector('#greenpawn3');
var greenpawn4 = document.querySelector('#greenpawn4');
var bluepawn1 = document.querySelector('#bluepawn1');
var bluepawn2 = document.querySelector('#bluepawn2');
var bluepawn3 = document.querySelector('#bluepawn3');
var bluepawn4 = document.querySelector('#bluepawn4');
var yellowpawn1 = document.querySelector('#yellowpawn1');
var yellowpawn2 = document.querySelector('#yellowpawn2');
var yellowpawn3 = document.querySelector('#yellowpawn3');
var yellowpawn4 = document.querySelector('#yellowpawn4');

var num = 0;
var n = 0;
var clicked = false;
var currcolor = "";
var NumOfPaw = "";
var currpawn = "";
var currPos = "";
var newPos = "";
var positions = {
  redpawn1: 0, redpawn2: 0, redpawn3: 0, redpawn4: 0,
  bluepawn1: 0, bluepawn2: 0, bluepawn3: 0, bluepawn4: 0,
  greenpawn1: 0, greenpawn2: 0, greenpawn3: 0, greenpawn4: 0,
  yellowpawn1: 0, yellowpawn2: 0, yellowpawn3: 0, yellowpawn4: 0};


// Moves for players

let redpawn = ["r1","r2","r3","r4","r5","r6","r7","r8","r9","r10","r11","r12","r13","g1","g2","g3","g4","g5","g6","g7","g8","g9","g10","g11","g12","g13","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10","y11","y12","y13","b1","b2","b3","b4","b5","b6","b7","b8","b9","b10","b11","b12","R5","R4","R3","R2","R1"];

let greenpawn = ["g1","g2","g3","g4","g5","g6","g7","g8","g9","g10","g11","g12","g13","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10","y11","y12","y13","b1","b2","b3","b4","b5","b6","b7","b8","b9","b10","b11","b12","b13","r1","r2","r3","r4","r5","r6","r7","r8","r9","r10","r11","r12","G5","G4","G3","G2","G1"];

let yellowpawn = ["y1","y2","y3","y4","y5","y6","y7","y8","y9","y10","y11","y12","y13","b1","b2","b3","b4","b5","b6","b7","b8","b9","b10","b11","b12","b13","r1","r2","r3","r4","r5","r6","r7","r8","r9","r10","r11","r12","r13","g1","g2","g3","g4","g5","g6","g7","g8","g9","g10","g11","g12","Y5","Y4","Y3","Y2","Y1"];

let bluepawn = ["b1","b2","b3","b4","b5","b6","b7","b8","b9","b10","b11","b12","b13","r1","r2","r3","r4","r5","r6","r7","r8","r9","r10","r11","r12","r13","g1","g2","g3","g4","g5","g6","g7","g8","g9","g10","g11","g12","g13","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10","y11","y12","B5","B4","B3","B2","B1"];

//Display player's turn
function changePlayer() {
  if (num != 6){
    switch (text.innerText) {
        case "red": text.innerText = text.style.color = "blue"; break;
        case "blue": text.innerText = text.style.color = "yellow"; break;
        case "yellow": text.innerText = text.style.color = "green"; break;
        case "green": text.innerText = text.style.color = "red"; break;
    }
  }
  badtext.innerText = "";
  dice.style.backgroundImage = "url(images/dice.gif)";
}

//Check free pawns
function DontHaveOtherFree() {
  
  var block;
  if(text.innerText == 'green'){
    block = document.querySelector('#greenblock');
    if (block.contains(greenpawn1) || block.contains(greenpawn2) || block.contains(greenpawn3) || block.contains(greenpawn4))
     return true;
  }else if(text.innerText == 'yellow'){
    block = document.querySelector('#yellowblock');
    if (block.contains(yellowpawn1) || block.contains(yellowpawn2) || block.contains(yellowpawn3) || block.contains(yellowpawn4))
     return true;
  }else if(text.innerText == 'blue'){
    block = document.querySelector('#blueblock');
    if (block.contains(bluepawn1) || block.contains(bluepawn2) || block.contains(bluepawn3) || block.contains(bluepawn4))
     return true;
  }else{
    block = document.querySelector('#redblock');
    if (block.contains(redpawn1) || block.contains(redpawn2) || block.contains(redpawn3) || block.contains(redpawn4))
     return true;
  }

  return false;
}

//Dice number logic

dice.addEventListener("click", function (e) {
  ///changes dice number
  if (!clicked) {
    num = Math.floor((Math.random() * 6) + 1);
    dice.style.backgroundImage = "url(images/" + num + ".jpg)";
    clicked = true;
  }

  //If number not 6 change player
  if (num != 6 && DontHaveOtherFree()) {
      badtext.innerText = "Unfortunately you are stuck";
      window.setTimeout(changePlayer, 1000);
      clicked = false;
  }

  if (num != 6 && !DontHaveOtherFree()) {
    badtext.innerText = "Click your pawn";
    clicked = false;
    n = num;
  }
  
  //if number is 6 move pawn from player block to board
  if(num == 6 && !DontHaveOtherFree()){
    if(text.innerText == 'green'){
      var g1 = document.querySelector('#g1');
      g1.appendChild(greenpawn1);
      currpawn = greenpawn1
      positions[currpawn] = g1;
      dice.style.backgroundImage = "url(images/dice.gif)";
    }else if(text.innerText == 'yellow'){
      var y1 = document.querySelector('#y1');
      y1.appendChild(yellowpawn1);
      currpawn = yellowpawn1
      positions[currpawn] = y1;
      dice.style.backgroundImage = "url(images/dice.gif)";
    }else if(text.innerText == 'blue'){
      var b1 = document.querySelector('#b1');
      b1.appendChild(bluwepawn1);
      currpawn = bluepawn1
      positions[currpawn] = b1;
      dice.style.backgroundImage = "url(images/dice.gif)";
    }else{
      var r1 = document.querySelector('#r1');
      r1.appendChild(redpawn1);
      currpawn = redpawn1
      positions[currpawn] = r1;
      dice.style.backgroundImage = "url(images/dice.gif)";
    }
  }

});

// Random num move for all pawns
function randomMove(Color, paw, number) {
  NumOfPaw = paw;
  currcolor = Color;
  num = number;
  currpawn = currcolor + "pawn" + NumOfPaw;
  currPos = positions[currpawn];
  var pcolor = str.slice(0, 1);
  var pnum = str.slice(1);
  var newnum = pnum + num;
  newPos = pcolor + newnum;
  var destination = document.querySelector(newPos);
  var source = document.querySelector(currPos);
  destination.appendChild(source);
  positions[currpawn] = destination;
  dice.style.backgroundImage = "url(images/dice.gif)";
  window.setTimeout(changePlayer, 1000);
  clicked = false;
}

//Event listeners for pawns click
redpawn1.addEventListener("click", function () {
  var color = text.innerHTML;
  randomMove(color,1,n);
});

greenpawn1.addEventListener("click", function () {
  var color = text.innerHTML;
  randomMove(color,1,n);
});

yellowpawn1.addEventListener("click", function () {
  var color = text.innerHTML;
  randomMove(color,1,n);
});

bluepawn1.addEventListener("click", function () {
  var color = text.innerHTML;
  randomMove(color,1,n);
});