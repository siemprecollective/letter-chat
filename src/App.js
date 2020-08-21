import React from 'react';
import logo from './logo.svg';
import './App.css';
import $ from 'jquery';

// for debug
window.$ = $

const endpoint = "BLANK";
var socket;

class App extends React.Component {
  constructor(props) {
    super(props);
  
    this.state = {
      id: -1,
      composing: false,
      otherComposing: false,
      ourMessages: [],
      otherMessages: [],
    };
  }

  componentDidMount () {
    this.ws = new WebSocket(endpoint);
    this.ws.addEventListener("message", json => {
      let data = JSON.parse(json.data);
      console.log(data)
      if (data.event == "msg") {
        if (!this.state.otherComposing) {
          var newMessage = {
            msg: data.data.msg,
            top: this.nextMessageOffset()
          };
          this.setState({
            otherComposing: true,
            otherMessages: [...this.state.otherMessages, newMessage]
          });
        } else {
          var lastidx = this.state.otherMessages.length-1
          var lastMessage = {
            msg: this.state.otherMessages[lastidx].msg + data.data.msg,
            top: this.state.otherMessages[lastidx].top
          };
          this.setState({
            otherMessages: [...this.state.otherMessages.slice(0, lastidx), lastMessage]
          }); 
        }
      } else if (data.event == "end") {
        this.setState({
          otherComposing: false,
        });
      } else if (data.event == "backspace") {
        var lastidx = this.state.otherMessages.length-1;
        var curLastMessage = this.state.otherMessages[lastidx];
        var lastMessage = {
          msg: curLastMessage.msg.substring(0, curLastMessage.msg.length-1),
          top: this.state.otherMessages[lastidx].top
        };
        this.setState({
          otherMessages: [...this.state.otherMessages.slice(0, lastidx), lastMessage]
        });
      }
    })
  }

  componentDidUpdate() {
    $(".main-chat-container").scrollTop(99999999);
  }

  nextMessageOffset() {
    let ourOffset = 0;
    if ($("#ourMessages").children(".real-message").length > 0) {
      let ourLastMessage = $("#ourMessages").children(".real-message").last();
      ourOffset = ourLastMessage.position().top + ourLastMessage.outerHeight();
    } 
    let otherOffset = 0;
    if ($("#otherMessages").children(".real-message").length > 0) {
      let otherLastMessage = $("#otherMessages").children(".real-message").last();
      otherOffset = otherLastMessage.position().top + otherLastMessage.outerHeight();
    }
    return Math.max(ourOffset, otherOffset)+2;
  }

  userTyped(e) {
    let otherId = "2";
    if (this.state.id === 2) {
      otherId = "1"
    }

    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }    

    let c = e.key
    if (c.length == 1 || (c == "Enter" && e.shiftKey)) {
      if (c == "Enter") {
        c = "\n";
      }
      if (!this.state.composing) {
       let newMessage = {
          msg: c,
          top: this.nextMessageOffset()
        } 
	this.setState({
          composing: true,
          ourMessages: [...this.state.ourMessages, newMessage]
        })
      } else {
        var lastidx = this.state.ourMessages.length-1
        var lastMessage = {
          msg: this.state.ourMessages[lastidx].msg + c,
          top: this.state.ourMessages[lastidx].top
        }
        this.setState({
          ourMessages: [...this.state.ourMessages.slice(0, lastidx), lastMessage]
        }) 
      } 
      this.ws.send(JSON.stringify({
        "event": "msg",
        "to": otherId,
        "data": {
          "msg": c
        }
      }));
    } else if (c == "Enter") {
      this.setState({
        composing: false
      })
      this.ws.send(JSON.stringify({
        "event": "end",
        "to": otherId,
        "data": {}
      }))
    } else if (c == "Backspace") {
      var lastidx = this.state.ourMessages.length-1;
      var curLastMessage = this.state.ourMessages[lastidx];
      var lastMessage = {
        msg: curLastMessage.msg.substring(0, curLastMessage.msg.length-1),
        top: this.state.ourMessages[lastidx].top
      };
      this.setState({
        ourMessages: [...this.state.ourMessages.slice(0, lastidx), lastMessage]
      }); 
      this.ws.send(JSON.stringify({
        "event": "backspace",
        "to": otherId,
        "data": {}
      }))
    } 
    console.log(this.state.ourMessages)
    e.preventDefault()
  }

  userPasted(e) {
    let text = e.clipboardData.getData("text")
    if (!this.state.composing) {
      let newMessage = {
        msg: text,
        top: this.nextMessageOffset()
      } 
      this.setState({
        composing: true,
        ourMessages: [...this.state.ourMessages, newMessage]
      })
    } else {
      var lastidx = this.state.ourMessages.length-1
      var lastMessage = {
        msg: this.state.ourMessages[lastidx].msg + text,
        top: this.state.ourMessages[lastidx].top
      }
      this.setState({
        ourMessages: [...this.state.ourMessages.slice(0, lastidx), lastMessage]
      }) 
    }
    e.preventDefault() 
  }

  setId(i) {
    this.setState({ id: i });
    this.ws.send(JSON.stringify({
      "event": "identify",
      "data": i + ""
    }));
  }

  renderMessage(str) {
    return str.split(" ").map((item, _) => {
      if (item.startsWith("http://") || item.startsWith("https://")) {
        return <span><a href={item}>{item}</a> </span>
      } else {
        return <span>{item} </span>
      }
    })
  }

  renderNewlines(str) {
    return str.split('\n').map((item, _) => {
      return (
        <span>{this.renderMessage(item)}<br/></span>
      )
    })
  }

  render() {
    if (this.state.id === -1) {
      return (
        <div>
          <button onClick={() => this.setId(1)}>player one</button>
          <button onClick={() => this.setId(2)}>player two</button>
        </div>
      );
    } else {
      return (
        <div className="main-chat-container" onKeyDown={this.userTyped.bind(this)} tabIndex="0" onPaste={this.userPasted.bind(this)}>
          <div className="chat-container chat-input" id="ourMessages">
          { this.state.ourMessages.map( (msg) => {
            var classnames="message real-message";
            if (msg.top == this.state.ourMessages[this.state.ourMessages.length-1].top && this.state.composing) {
              classnames += " next-message-hint"
            }
            return (<div className={classnames} style={{top: msg.top}}>{this.renderNewlines(msg.msg)}</div>)
          })}
          <div className="message next-message-hint" style={{top: this.nextMessageOffset(), display: this.state.composing ? "none" : "block"}}>⇒</div>
          </div>
          <div className="chat-container chat-other" id="otherMessages">
          { this.state.otherMessages.map( (msg) => {
            return (<div className="message real-message" style={{top: msg.top}}>{this.renderNewlines(msg.msg)}</div>)
          })}
          </div>
        </div>
      );
    }
  }
}
    //        <textarea cols="200" wrap="hard" className="chat chat-input" onChange={this.userTyped.bind(this)} value={this.state.ourMessages} />

export default App;
