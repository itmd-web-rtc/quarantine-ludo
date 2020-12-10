// Use `sc` for the signaling channel...
var sc = io.connect('/' + NAMESPACE);

// Using Google's STUN servers
var rtc_config = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']
    }
  ]
};

// Track self id from socket.io
var self_id;
// Array for tracking IDs of connected peers
// TODO: Refactor this so only the `pcs` object is needed?
var peers;

// Object to hold each per-ID RTCPeerConnection and client state
var pcs = {};

// Object to hold peer video streams
var peer_streams = {};

// Let's handle video streams...
// Set up simple media_constraints
// (disable audio for classroom demo purposes)
var media_constraints = { video: true, audio: false };

var dc = null;
// Handle self video
// TODO: Add a Start Video button that handles all of this
// Problems on iOS with requesting media on page load, it seems.
var stream = new MediaStream();

//declare DOM elements for chat
var chatLog = document.querySelector("#chat-log");
var chatForm = document.querySelector("#chat-form");
var chatInput = document.querySelector("#message");
var chatButton = document.querySelector("#send-button");
var joinForm = document.querySelector("#join-form");
var joinName = document.querySelector("#join-name");

/*
  Signaling Logic
*/

// Basic connection diagnostic and self_id assignment
sc.on('message', function(data) {
  console.log('Message received:\n', data);
  // Set self_id
  self_id = sc.id;
});

// Receive payload of already-connected peers that socket.io knows about
sc.on('connected peers', function(data) {
  // Remove self from peers array
  peers = removePeer(data,sc.id);
  // Log out the array of connected peers
  console.log('Connected peers:\n', peers);
  // Client announces to everyone else that it has connected
  sc.emit('new connected peer', sc.id);
  // Set up connections with existing peers
  for (var peer of peers) {
    // Establish peer; set politeness to false with existing peers
    // Existing peers will themselves be polite (true)
    establishPeer(peer,false);
  }
});

// Receive payload of a newly connected peer
sc.on('new connected peer', function(peer) {
  console.log('New connected peer:', peer);
  // Add the new peer to the peers array
  peers.push(peer);
  // Log out the new array of connected peers
  console.log('New connected peers:\n', peers);
  // Set up connection with new peer; be polite
  establishPeer(peer,true);
  // Add video stream tracks to new peer connection
  // TODO: Move this into the establishPeer fuction?
  for (var track of stream.getTracks()) {
    pcs[peer].conn.addTrack(track);
  }
});

// Rececive payload of newly disconnected peer
sc.on('new disconnected peer', function(peer) {
  // Logic to remove the disconnected peer from `peers`
  // Also will need to eventually clean up known peer connections
  // and UI holding the disconnected peer's video, etc.
  console.log(`${peer} has disconnected`);
  peers = removePeer(peers,peer);
  removeVideo(peer);
  console.log('Remaining connected peers:\n', peers);
});

// Signals are now only over private messages to avoid cross-talk
sc.on('signal', async function({ to, from, candidate, description }) {
  // `from` is key to figuring out who we're negotiating a connection with
  var pc = pcs[from].conn;
  var clientIs = pcs[from].clientIs; // Set up when pcs object is populated

  try {
    if (description) {
      // W3C/WebRTC Specification Perfect Negotiation Pattern:
      // https://w3c.github.io/webrtc-pc/#example-18
      var readyForOffer =
            !clientIs.makingOffer &&
            (pc.signalingState == "stable" || clientIs.settingRemoteAnswerPending);

      // IMPORTANT! In previous class demos, I erronously was checking for an "answer" type here
      var offerCollision = description.type == "offer" && !readyForOffer;

      clientIs.ignoringOffer = !clientIs.polite && offerCollision;

      if (clientIs.ignoringOffer) {
        return; // Just leave if we're ignoring offers
      }

      // Set the remote description...
      try {
        console.log('Trying to set a remote description:\n', description);
        clientIs.settingRemoteAnswerPending = description.type == "answer";
        await pc.setRemoteDescription(description);
        clientIs.settingRemoteAnswerPending = false;
      } catch(error) {
        console.error('Error from setting local description', error);
      }

      // ...if it's an offer, we need to answer it:
      if (description.type == 'offer') {
        console.log('Specifically, an offer description...');
          try {
            // Very latest browsers are totally cool with an
            // argument-less call to setLocalDescription:
            await pc.setLocalDescription();
          } catch(error) {
            // Older (and not even all that old) browsers
            // are NOT cool. So because we're handling an
            // offer, we need to prepare an answer:
            console.log('Falling back to older setLocalDescription method when receiving an offer...');
            if (pc.signalingState == 'have-remote-offer') {
              // create a answer, if that's what's needed...
              console.log('Trying to prepare an answer:');
              var offer = await pc.createAnswer();
            } else {
              // otherwise, create an offer
              console.log('Trying to prepare an offer:');
              var offer = await pc.createOffer();
            }
            await pc.setLocalDescription(offer);
          } finally {
            console.log('Sending a response:\n', pc.localDescription);
            sc.emit('signal', { to: from, from: self_id, description: pc.localDescription });
          }
      }

    } else if (candidate) {
        console.log('Received a candidate:');
        console.log(candidate);
        // Save Safari and other browsers that can't handle an
        // empty string for the `candidate.candidate` value:
        try {
          if (candidate.candidate.length > 1) {
            await pc.addIceCandidate(candidate);
          }
        } catch(error) {
          if (!clientIs.ignoringOffer) {
            throw error;
          }
        }
    }
  } catch(error) {
    console.error(error);
  }

});

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

sc.on("joined", function (e) {
  appendMsgToChatLog(chatLog, e, "join");
});



function sendJoinedMessage(name){
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
}

/*

  NEGOTIATE PEER CONNECTIONS

*/

async function negotiateConnection(pc, clientIs, id) {
  console.log('Need to work with negotiating id', id, '...');
  pc.onnegotiationneeded = async function() {
    try {
      console.log('Making an offer...');
      clientIs.makingOffer = true;
      try {
        // Very latest browsers are totally cool with an
        // argument-less call to setLocalDescription:
        await pc.setLocalDescription();
      } catch(error) {
        // Older (and not even all that old) browsers
        // are NOT cool. So because we're making an
        // offer, we need to prepare an offer:
        console.log('Falling back to older setLocalDescription method when making an offer...');
        var offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
      } finally {
        console.log('Sending an offer:\n', pc.localDescription);
        sc.emit('signal', { to: id, from: self_id, description: pc.localDescription });
      }
    } catch(error) {
        console.error(error);
    } finally {
        clientIs.makingOffer = false;
    }
  };

  // Logic to send candidate
  pc.onicecandidate = function({candidate}) {
    console.log(`Sending a candidate to ${id}:\n`, candidate);
    sc.emit('signal', { to: id, from: self_id, candidate: candidate });
  };

// End negotiateConnection() function
}


// Utility function to remove peers: self or disconnects
function removePeer(peers,id) {
  var index = peers.indexOf(id);
  if (index === -1) {
    return; // no peer with that ID
  }
  // Remove from peers array
  peers.splice(index,1);
  // Remove from pcs connection object
  delete pcs[id];
  // Remove from peer_streams object
  delete peer_streams[id];
  return peers;
}

// Utility function to populate a peer to the pcs object
function establishPeer(peer,isPolite) {
  pcs[peer] = {};
  pcs[peer].clientIs = {
    polite: isPolite, // Be impolite with existing peers, who will themselves be polite
    makingOffer: false,
    ignoringOffer: false,
    settingRemoteAnswerPending: false
  };
  pcs[peer].conn = new RTCPeerConnection(rtc_config);
  // Respond to peer track events
  pcs[peer].conn.ontrack = function({track}) {
    console.log('Heard an ontrack event:\n', track);
    // Append track to the correct peer stream object
    track.onunmute = function() {
      console.log('Heard an unmute event');
      peer_streams[peer].addTrack(track);
    };
  };
  appendVideo(peer);
}

// Utility funciton to add videos to the DOM with an empty MediaStream
function appendVideo(id) {
  var videos = document.querySelector('#room-grid');
  var div = document.createElement("div");
  div.className = "room-video";
  var divPlayerName = document.createElement("div");

  divPlayerName.className = "player-name";
  divPlayerName.id = "p2";

  divPlayerName.innerHTML = "Player 2";
  div.appendChild(divPlayerName);
  var video = document.createElement('video');
  // Create an empty stream on the peer_streams object;
  // Remote track will be added later
  video.autoplay = true;
  video.width = "100%";
  video.height="100%";
  video.autoplay = true;
  video.playsinline = true;
  peer_streams[id] = new MediaStream();
  video.autoplay = true;
  video.className = "room-video-stream";
  video.id = "video-" + id.split('#')[1];
  // Set the video source to the empty peer stream
  video.srcObject = peer_streams[id];
  div.appendChild(video);
  videos.appendChild(div);
}

// Utlity function to remove videos from the DOM
function removeVideo(peer) {
  var old_video = document.querySelector('#video-' + peer.split('#')[1]);
  if (old_video) {
    old_video.remove();
  }
}

// Join button
var callButton = document.querySelector("#join-button");

callButton.addEventListener('click', async function(e) {
  e.preventDefault();
  if (joinName.value !== "") {
    stream = await navigator.mediaDevices.getUserMedia(media_constraints);
    var selfStream = new MediaStream();
    selfStream.addTrack(stream.getTracks()[0]);
    var selfVideo = document.querySelector('#self-video').srcObject = selfStream;
    for (var pc in pcs) {
      console.log('Negotiating connection with', pc);
      // Load up our media stream tracks on any connections that lack them
      for (var track of stream.getTracks()) {
        // Some tracks may have already been added, so use a try/catch block here
        try {
          pcs[pc].conn.addTrack(track);
        } catch(err) {
          console.error(err);
        }
      }
      // Set the wheels in motion to negotiate the connection with each connected peer
      negotiateConnection(pcs[pc].conn, pcs[pc].clientIs, pc);
    }
      } else {
        alert("Enter your Name!");
      }
  
  // Remove the join button
  sendJoinedMessage(joinName.value)
  callButton.remove();
  // TODO: Add a "Leave Call" button, and buttons for controlling audio/video

});

// // making another data channel
// var gdc = null // Game data channel

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
function dontHaveOtherFree() {
  
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
    
    if (num != 6 && dontHaveOtherFree()) {
      badtext.innerText = "Unfortunately you are stuck";
      gdc.send({ data: { action: 'fire', message: badtext.innerText } });
      window.setTimeout(changePlayer, 1000);
      clicked = false;
    }

    if (num != 6 && !dontHaveOtherFree()) {
      badtext.innerText = "Click your pawn";
      clicked = false;
      n = num;
    }


    //if number is 6 move pawn from player block to board
  if(num == 6 && dontHaveOtherFree()){
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
      b1.appendChild(bluepawn1);
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

  }

  //If number not 6 change player
  gdc.onmessage = function(e){
    var data = JSON.parse(e.data)
    console.log(`Heard this action: ${data.action}`)
  }
});



// Random num move for all pawns
function randomMove(Color, paw, number) {
  NumOfPaw = paw;
  currcolor = Color;
  num = number;
  currpawn = currcolor + "pawn" + NumOfPaw;
  currPos = positions[currpawn];
  var pcolor = Color.slice(0, 1);
  var pnum = paw
  var newnum = pnum + num;
  newPos = pcolor + newnum;
  console.log(newPos)
  var destination = document.querySelector('#'+newPos);
  console.log(currpawn)
  var source = document.querySelector('#'+currpawn);
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

bluepawn2.addEventListener("click", function () {
  var color = text.innerHTML;
  randomMove(color,2,n);
});

bluepawn3.addEventListener("click", function () {
  var color = text.innerHTML;
  randomMove(color,3,n);
});

bluepawn4.addEventListener("click", function () {
  var color = text.innerHTML;
  randomMove(color,4,n);
});
