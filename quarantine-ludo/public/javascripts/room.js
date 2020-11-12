console.log(NAMESPACE);
var sc = io.connect("/" + NAMESPACE);

sc.on("message", function (data) {
  console.log(`${data}`);
});

var clientIs = {
  makingOffer: false,
  ignoringOffer: false,
  polite:false
}

var rtc_config = null;

//Setting basic to get peer connection
var pc = new RTCPeerConnection(rtc_config);

//set data channel
var dc = null;

//declare DOM elements for chat
var chatLog = document.querySelector('#chat-log');
var chatForm = document.querySelector('#chat-form');
var chatInput = document.querySelector('#message');
var chatButton = document.querySelector('#send-button');


function appendMsgToChatLog(log, msg, who){

  var li = document.createElement('li');
  var msg = document.createTextNode(msg);
  li.appendChild(msg);
  li.className = who;
  log.appendChild(li);
  if(chatLog.scrollTo){
    chatLog.scrollTo({
      top: chatLog.scrollHeight,
      behavior: 'smooth'
    });
  }else{
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}


function addDataChannelEventListner(datachannel){

  datachannel.onmessage = function(e){
    appendMsgToChatLog(chatLog, e.data, 'peer');
  }

  datachannel.onopen = function(){
    chatButton.disabled = false;
    chatInput.disabled = false;
  }

  datachannel.onclose = function(){
    chatButton.disabled = true;
    chatInput.disabled = true;
  }

  chatForm.addEventListener('submit', function(e){
    e.preventDefault();
    var msg = chatInput.value;
    msg = msg.trim();
    if(msg !== ""){
      appendMsgToChatLog(chatLog, msg, 'self');
      datachannel.send(msg);
      chatInput.value = '';
    }
  });

}


//Once the RTC connection is steup and connected the peer will open data channel
pc.onconnectionstatechange = function(e){
  if(pc.connectionState == 'connected'){
    if(clientIs.polite) {
      console.log("Creating a data channel on the initiating side");
      dc = pc.createDataChannel('text chat');
      addDataChannelEventListner(dc);
    }
  }
}

//listen for datachannel
// This will on fire on receiving end of the connection
pc.ondatachannel = function(e){
  console.log("Data Channel is open");
  dc = e.channel;
  addDataChannelEventListner(dc);
}

//video Streams
var media_constraints = {video: true, audio: true};

var selfVideo = document.querySelector('#self-video');
var selfStream = new MediaStream();
selfVideo.srcObject = selfStream;

var peerVideo = document.querySelector('#peer-video');
var peerStream = new MediaStream();
peerVideo.srcObject = peerStream;


async function startStream() {
  try{
    var stream = await navigator.mediaDevices.getUserMedia(media_constraints);
    for( var track of stream.getTracks()){
      pc.addTrack(track);
    }

    selfVideo.srcObject = stream;
  } catch(error){

  }
}


pc.ontrack = (track) => {
  peerStream.addTrack(track.track);
}

var callButton = document.querySelector('#join-button');

callButton.addEventListener('click', joinCall);


function joinCall(){
  clientIs.polite = true;
  negotiateConnection();
  startStream();
  callButton.hidden = true;
}

async function negotiateConnection() {
  pc.onnegotiationneeded = async function() {
    try {
      console.log("Making Offer");
      clientIs.makingOffer = true;
      try {
        await pc.setLocalDescription();
      } catch (error) {
        var offer = await pc.createOffer();
          await pc.setLocalDescription(new RTCSessionDescription(offer));
      }finally{
        sc.emit('signal', { description: pc.localDescription});
      }
    } catch (error) {
      console.log(error);
    }finally{
      clientIs.makingOffer = false;
    }
  }
}

sc.on('signal', async function({candidate, description}){
  try {
    if(description){
      console.log("Received a description!!!");
      var OfferCollision = (description.type == 'offer')  && (clientIs.makingOffer  || pc.signalingState != 'stable');
      clientIs.ignoringOffer = !clientIs.polite && OfferCollision;
      if(clientIs.ignoringOffer){
        return;
      }

      // Set the remote decription
      await pc.setRemoteDescription(description);

      //if it's offer you need to answer
      if(description.type == 'offer'){
        console.log("Offer description");

        try {
          //works for latest browsers
          await pc.setLocalDescription();
        } catch (error) {
          //works for older browsers we pass the answer we created using RTCSession
          var answer = await pc.createAnswer();
          await pc.setLocalDescription(new RTCSessionDescription(answer));
        } finally{
          sc.emit('signal', {description: pc.localDescription});
        }    
      }

    }else if(candidate){
      console.log('Received a candidate:');
      console.log(candidate);
      //safari fix for the blank candidate
      if(candidate.candidate.length > 1){
        await pc.addIceCandidate(candidate);
      }
      
    }
  } catch (error) {
    console.log(error);
  }
});

//logic to send candidate
pc.onicecandidate = function({candidate}){
  sc.emit('signal', {candidate: candidate});
}