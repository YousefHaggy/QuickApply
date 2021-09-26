import { useState, useEffect } from "react";
import "./App.css";
import TextField from "@material-ui/core/TextField";
import { request } from "./apiHelper";
function App() {
  const [applicationId, setApplicationId] = useState();
  const questions = [
    {
      content:
        "Hello, welcome to QuickApply recruiting. We'll help you find and apply to a role in 1-3 minutes. Could you start by providing your email address?",
      onResponse: async (userResponse) => {
        console.log(userResponse);
        try {
          const { response, json } = await request(
            "POST",
            "application/start",
            { params: { email: userResponse } }
          );
          if (response.status == 200) {
            setApplicationId(json.id);
            return true;
          }
        } catch (error) {
          console.log(error);
        }
        return false;
      },
    },
    {
      content: "Please briefly describe the role you are looking for",
      onResponse: async (userResponse) => {
        try {
          const { response, json } = await request("GET", "roles", {
            params: { description: userResponse },
          });
          if (response.status == 200) {
            setApplicationId(json.id);
            return true;
          }
        } catch (error) {
          console.log(error);
        }
        return false;
      },
    },
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState([
    { content: questions[0].content, type: "bot" },
  ]);

  const errorMessage = () => {
    setMessages([
      ...messages,
      {
        content: "I'm sorry, that is not a valid entry",
        "type": "bot",
      },
    ]);
  };
  const finishChat = () => {
    setMessages([
      ...messages,
      {
        content:
          "You're all set! Thanks for chatting with us. You should receive an email with more details shortly",
        "type": "bot",
      },
    ]);
    document.getElementById("messages").scrollTop += 1000;
  };
  return (
    <div className="App">
      <div className="header">QuickApply</div>
      <div className="messages" id="messages">
        {messages.map(({ content, type }) => (
          <p className={"speech-bubble-" + type}>{content}</p>
        ))}
      </div>
      <div className="input">
        <TextField
          fullWidth
          label="Chat"
          variant="filled"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyPress={async (ev) => {
            if (ev.key === "Enter") {
              messages.push({ content: input, type: "user" });
              const response = input;
              setInput("");
              const valid = await questions[currentQuestionIndex].onResponse(
                response
              );
              if (valid) {
                if (currentQuestionIndex == questions.length - 1) {
                  finishChat();
                  return;
                }
                setMessages([
                  ...messages,
                  {
                    content: questions[currentQuestionIndex + 1].content,
                    type: "bot",
                  },
                ]);
                setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
              } else {
                errorMessage();
              }
              document.getElementById("messages").scrollTop += 50;
              ev.preventDefault();
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;
