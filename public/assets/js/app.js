var AppProcess= function () {
    var  peers_conection_ids = [];
    var peers_conection = [];
    var  remote_vid_stream = [];
    var  remote_aud_stream = [];

 var serverProcess;
function _init(SDP_function, my_connid){
    serverProcess = SDP_function;
    my_connection_id = my_connid;
}
   var iceConfiguration = {
       iceServers:[
           {
               urls:"stun:stun.l.google.com:19302",
           },
           {
            urls:"stun:stun.l.google.com:19302",
        },
       ]
   }

  function setConnetion(connid){
   var connection = new RTCPeerConnection(iceConfiguration); 
   
   connection.onnegotiationneeded = async function(event){
      await setOffer(connid);
   };
   connection.onicecandidate = function(event){
       if(event.candidate){
           serverProcess(
               JSON.stringify({icecandidate: event.candidate}),
           connid
           );
       }
   };

  connection.ontrack = function(event){
      if(!remote_vid_stream[connid]){
          remote_vid_stream[connid] = new MediaStream();
      }
      if(!remote_aud_stream[connid]){
        remote_aud_stream[connid] = new MediaStream();
    }

    if (event.track.kind == "video"){
        remote_vid_stream[connid]
        .getVideotracks()
        .forEach((t)=>remote_vid_stream[connid].removeTrack(t));
        remote_vid_stream[connid].addTrack(event.track);
        var remoteVideoPlayer = document.getElementById("v_"+connid);
        remoteVideoPlayer.srcObject = null;
        remoteVideoPlayer.srcObject = remote_vid_stream[connid];
        remoteVideoPlayer.load();

    }else if(event.track.kind == "audio"){
        remote_aud_stream[connid]
        .getAudiotracks()
        .forEach((t)=>remote_aud_stream[connid].removeTrack(t));
        remote_aud_stream[connid].addTrack(event.track);
        var remoteAudioPlayer = document.getElementById("a_"+connid);
        remoteAudioPlayer.srcObject = null;
        remoteAudioPlayer.srcObject = remote_aud_stream[connid];
        remoteAudioPlayerr.load();

    }

  };
   peers_conection_ids[connid] = connid;
   peers_conection[connid] = connection;
  return connection;
}

function setOffer(connid){
  var connection = peers_connection[connid];
  var offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  serverProcess(JSON.stringify({
      offer: connection.localDescription,
  }),connid)

}
  return{
      setNewConnetion: async function(connid){
          await setConnetion(connid);
      },
      init: async function (SDP_function, my_connid) {
          await _init(SDP_function, my_connid);
      },
  };


})();
var MyApp = (function()  { 

    var socket = null;
    var user_id = "";
    var meeting_id = "";
    function init (uid,mid){
        user_id = uid;
        meeting_id = "";
        event_process_for_signaling_server();
    }
    var socket=null;
    function event_process_for_signaling_server(){
        socket = io.connect();

        var SDP_function = function(data, to_connid){
            socket.emit("SDPProcess",{
                message: data,
                to_connid: to_connid
            })
        }
        socket.on ("connect",()=>{
            if(socket.connected){
              AppProcess.init(SDP_function, socket.id)
                if(user_id != "" && meeting_id != ""){
                    socket.emit("userconnect",{
                        displayName: user_id,
                        meetingid: meeting_id
                    });
                }
            }
            

        });

        socket.on("inform_other_about_me", function(data){
           addUser(data.other-user_id, data.connId); 
           AppProcess.setNewConnection(data.connId); 
        });
    }
    function addUser(other_user_id,connId){
        var newDivId = $("#otherTemplate").clone();
        newDivId = newDivId.attr("id",connId).addClass("other");
        newDivId.find("h2").text(other_user_id);
        newDivId.find("video").attr("id","v_"+connId);
        newDivId.find("audio").attr("id","a_"+connId);
        newDivId.show();
        $("#divUsers").append(newDivId);

    }


    return{
        _init:function(uid,mid){
            init(uid,mid);
        },
    };
})();