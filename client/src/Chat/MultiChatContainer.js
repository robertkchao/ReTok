import React, { PropTypes }  from 'react'
import { render } from 'react-dom'
import { connect } from 'react-redux'
import io from 'socket.io-client'
import * as userActions from '../Redux/userReducer'
import OnlineFriends from '../Profile/OnlineFriends/OnlineFriends.js'

class MultiChatContainer extends React.Component {

  constructor(props, context) {
    super(props, context);
  }

  componentWillUnmount() {
    console.log('UNMOUNTING')
    connection = window.connection;
    connection.getAllParticipants().forEach(function(uid) {
        connection.disconnectWith( uid );
    });
    connection.attachStreams.forEach(function(selfStream) {
        selfStream.stop();
    });
  }

  componentWillMount() {
    var socket = this.props.socket;
    socket.on('update', function() {
      console.log('updating', username);
      let myHeaders = new Headers({'Content-Type': 'application/graphql; charset=utf-8'});
      let options = {

        method: 'POST',
        headers: myHeaders,
        body: `
          { 
            
            findFriends(username: \"${username}\")
            {
                  username
                  profilePic
                  firstName
                  lastName
                  email
                  online
                  videoChatCount
                  textChatCount
                  lastChatTime
                }
          }`

      };
      fetch('/graphql', options).then((res) =>{
        return res.json().then((data) => {
          console.log('checking my friends data',data.data.findFriends);
          var friends = data.data.findFriends;
          // friendRanking() added score to each friend
          if(friends) {
            friendScoreCalculator(friends);
            var onlineFriends = friends.filter(friend => friend.online === true);
            var suggestedFriends = this.tierRanking(onlineFriends.slice().sort((friend0, friend1) => {return friend1.score - friend0.score}));
            this.props.dispatch(userActions.updateFriends(friends.slice()));
            this.props.dispatch(userActions.updateOnlineFriends(onlineFriends.slice()));
            this.props.dispatch(userActions.updateSuggestedFriends(suggestedFriends.slice()));
            this.props.dispatch(userActions.updateFriendCount(friends.length));
          }
        })
      })
    }.bind(this))

  }

  componentDidMount() {
    var connection = new RTCMultiConnection();
    connection.videosContainer = document.getElementById('videosContainer');
    window.connection = connection;
    // connection.userid = this.props.user;
     connection.session = {
         audio: true,
         video: true,
         data: true
     };

     connection.sdpConstraints.mandatory = {
         OfferToReceiveAudio: true,
         OfferToReceiveVideo: true,
         OfferTOReceiveData: true
     };
     var socket = this.props.socket


     var room = this.props.room;
     //Ensures caller opens the room first, before callees come in.
     connection.openOrJoin(room);

     document.getElementById('input-text-chat').onkeyup = function(e) {
      if (e.keyCode != 13) return;
      // removing trailing/leading whitespace
      this.value = this.value.replace(/^\s+|\s+$/g, '');
      if (!this.value.length) return;
      connection.send(this.value);
      appendDIV(this.value);
      this.value = '';
     };
    
    var chatContainer = document.querySelector('.chat-output');
    
    var appendDIV = (event) => {
      var div = document.createElement('div');
      div.innerHTML = event.data || event;
      chatContainer.insertBefore(div, chatContainer.firstChild);
      div.tabIndex = 0;
      div.focus();
      document.getElementById('input-text-chat').focus();
   }


    connection.onstream = function(event) {
      var name = this.props.user
      var width = parseInt(connection.videosContainer.clientWidth / 2) - 20;
      var mediaElement = getMediaElement(event.mediaElement, {
          title: name,
          buttons: ['full-screen'],
          width: width,
          showOnMouseEnter: false
      });
      connection.videosContainer.appendChild(mediaElement);
      setTimeout(function() {
          mediaElement.media.play();
      }, 5000);
      mediaElement.id = event.streamid;
    }.bind(this);

    connection.onstreamended = function(event) {
      var mediaElement = document.getElementById(event.streamid);
      if(mediaElement) {
          mediaElement.parentNode.removeChild(mediaElement);
      }
    };

  

  }

  videoChat(friend) {
    console.log('i hit video chat for this friend', friend.username);

    var socket = this.props.socket;

    var info = {user: friend.username, caller: this.props.room}
    socket.emit('calling', info);

  } 


  render() {
    return (
      <div id='webRTC'>
        <h1>Tok</h1>

        <div id='chatContainer'>
        <div className="chat-output"></div>
        </div>

        <input type="text" id="input-text-chat" placeholder="Enter Text Chat"/>

        <div id="videosContainer">
        </div>

        <div>
          {this.props.onlineFriends.map((item, index) => <OnlineFriends key={index} friend={item} videoChat={this.videoChat.bind(this)}/>)}
        </div>

      </div>
      )


  }

};

MultiChatContainer.contextTypes = {
  router: PropTypes.object.isRequired
}

function mapStateToProps(state) {
  return {
    isLoggedIn: state.userReducer.isLoggedIn,
    user: state.userReducer.user,
    room: state.userReducer.room,
    socket: state.userReducer.socket,
    onlineFriends: state.userReducer.onlineFriends
  }
}

export default connect(mapStateToProps)(MultiChatContainer);