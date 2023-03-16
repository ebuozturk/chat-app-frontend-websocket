import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import backgroundLogo from "../img/background-logo.jpg";
import { ColorPalette } from "../style/Colors";

var stompClient = null;
var groupChats = ["Cgang", "Family"];
var sessionId = "";
const Landing = () => {
  const [chats, setChats] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState();
  const [selectedChat, setSelectedChat] = useState();

  const nameRef = useRef();
  const messageRef = useRef();
  const messageEndRef = useRef();

  useEffect(() => {
    scrollToBottom();
  }, [chats, selectedChat]);

  function connect() {
    var name = nameRef.current.value;

    var socket = new SockJS("http://localhost:9191" + "/connect");
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
      setIsConnected(true);

      // var url = stompClient.ws._transport.url;
      // url = url.replace("ws://localhost:8080/secured/room/", "");
      // url = url.replace("/websocket", "");
      // url = url.replace(/^[0-9]+\//, "");
      // console.log("Your current session is: " + url);

      // sessionId = url;

      stompClient.subscribe("/user/" + name + "/private", function (payload) {
        handleReceivedMessage(JSON.parse(payload.body));
      });

      groupChats.map((chat) => {
        stompClient.subscribe("/user/" + chat + "/private", function (payload) {
          console.table(payload);
          handleReceivedMessage(JSON.parse(payload.body));
        });
      });
      // stompClient.subscribe("/topic", function (payload) {
      //   console.table(payload);
      //   handleReceivedMessage(JSON.parse(payload.body));
      // });
      stompClient.send(
        "/app/send_message",
        {},
        JSON.stringify({
          sender: name,
          message: "I JOINED",
          receiver: "hüso",
          status: "JOIN",
          type: "USER",
        })
      );
      stompClient.send(
        "/app/send_message",
        {},
        JSON.stringify({
          sender: name,
          message: "I JOINED GROUP",
          receiver: "Cgang",
          status: "JOIN",
          type: "GROUP",
        })
      );
    });
  }

  function disconnect() {
    if (stompClient != null) {
      stompClient.disconnect();
    }
    setIsConnected(false);
    console.log("Disconnected");
  }
  function onConnect() {
    var name = nameRef.current.value;
    if (name !== "") {
      setUsername(name);
      connect();
    }
  }
  function sendMessage() {
    var message = messageRef.current.value;
    stompClient.send(
      "/app/send_message",
      {},
      JSON.stringify({
        sender: username,
        message: message,
        receiver: selectedChat.name,
        status: "NEW_MESSAGE",
        type: selectedChat.type,
      })
    );
    if (selectedChat.type !== "GROUP") {
      chats.get(selectedChat.name).messages.push({
        sender: username,
        message: message,
      });
      setChats(new Map(chats));
    }
    messageRef.current.value = "";
  }

  function handleReceivedMessage(payload) {
    var obj = {
      sender: payload.sender,
      message: payload.message,
      type: payload.type,
    };
    console.table(obj);
    if (obj.type === "USER") {
      if (chats.get(payload.sender) === undefined) {
        var list = [];
        list.push(obj);
        chats.set(payload.sender, { type: obj.type, messages: [...list] });
      } else {
        chats.get(payload.sender).messages.push(obj);
      }
    } else {
      if (chats.get(payload.receiver) === undefined) {
        var list = [];
        list.push(obj);
        chats.set(payload.receiver, { type: obj.type, messages: [...list] });
      } else {
        chats.get(payload.receiver).messages.push(obj);
      }
    }

    setChats(new Map(chats));
    console.table(chats);
  }

  const handleOnClickChatTab = (name) => {
    var type = chats.get(name).type;
    setSelectedChat({ name, type });
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        // background: `linear-gradient(
        //   to right,
        //   rgb(0 0 0 / 0.5),
        //   rgb(0 0 0 / 0.5)
        // ),
        // url(${backgroundLogo})`,
        background: ColorPalette.backgroundColor,
      }}
    >
      {/* <div
        style={{
          width: "100%",
          height: 100,
          background: "#CD3B3B",
          position: "fixed",
          top: 0,
        }}
      ></div> */}
      {isConnected ? (
        <div
          style={{
            display: "flex",
            width: "95%",
            height: "90%",
            background: ColorPalette.chatColor,
            borderRadius: 5,
            overflow: "hidden",
            zIndex: 10,
          }}
        >
          <div
            style={{
              flex: 1.6,
              boxSizing: "border-box",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {[...chats.keys()].map((name, index) => (
              <>
                {" "}
                {name !== username ? (
                  <div
                    style={{
                      borderBottom: "1px solid black",
                      background: `${
                        name === selectedChat?.name
                          ? ColorPalette.selectedChatColor
                          : "inherit"
                      } `,
                    }}
                    onClick={() => handleOnClickChatTab(name)}
                    key={index}
                  >
                    <div
                      style={{
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        height: 50,
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingLeft: 10,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: 18,
                        }}
                      >
                        {name}
                      </span>
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: 15,
                        }}
                      >
                        {
                          chats.get(name).messages[
                            chats.get(name).messages.length - 1
                          ].message
                        }
                      </span>
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: ColorPalette.chatroomColor,
              flex: 5,
              borderTopRightRadius: 10,
              borderBottomRightRadius: 10,
            }}
          >
            <div
              style={{
                flex: 10,
                overflowY: "scroll",
              }}
            >
              {chats.get(selectedChat?.name)?.messages?.map((message) => (
                <div
                  style={{
                    display: "flex",
                    justifyContent: `${
                      message.sender === username ? "flex-end" : "flex-start"
                    } `,
                    padding: "10px 40px",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      padding: 10,
                      boxSizing: "border-box",
                      maxWidth: 400,
                      minWidth: 100,
                      overflowWrap: "break-word",
                      background: `${
                        message.sender === username
                          ? ColorPalette.senderMessageColor
                          : ColorPalette.receiverMessageColor
                      } `,
                      borderRadius: 10,
                      borderTopRightRadius: "25px 25px 25px 0",
                      color: "white",
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                    }}
                  >
                    {selectedChat.type === "GROUP" &&
                      message.sender !== username && (
                        <span
                          style={{
                            fontSize: 18,
                            color: ColorPalette.senderMessageColor,
                          }}
                        >
                          {message.sender}
                        </span>
                      )}
                    {message.message}
                  </div>
                </div>
              ))}
              <div ref={messageEndRef}></div>
            </div>
            <div
              style={{
                display: "flex",
                flex: 1,
                padding: "9px 40px",
                boxSizing: "border-box",
                background: "#a9a9ab",
                gap: 10,
              }}
            >
              <input
                type="text"
                style={{
                  flex: 7,
                  border: 0,
                  borderRadius: 7,
                  overflowWrap: "break-word",
                  overflowY: "scroll",
                }}
                placeholder="Type here"
                ref={messageRef}
              />
              <button
                style={{ flex: 1, borderRadius: 7, border: 0 }}
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <input type="text" placeholder="name" ref={nameRef} />
          <button onClick={onConnect}>Connect</button>
        </div>
      )}
    </div>
  );
};
export default Landing;
