import { useState, useEffect, useRef } from "react";
import "./App.css";
import TextField from "@material-ui/core/TextField";
import Chip from "@material-ui/core/Chip";

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
      content:
        "Please briefly describe your experiences or attach a resume to see matching roles",
      choices: [
        {
          value: "Upload Resume",
          onClick: () => {
            inputFile.current.click();
            return "DONOTHING";
          },
        },
      ],
      isInputDisabled: false,
      onResponse: async (userResponse) => {
        try {
          const { response, json } = await request("GET", "role", {
            params: { description: userResponse },
          });
          if (response.status == 200) {
            setChoices(
              json.slice(0, 3).map(({ title }) => ({
                value: title,
                onClick: () => updateApplication("role", title),
              }))
            );
            setIsInputDisabled(true);
            return true;
          }
        } catch (error) {
          console.log(error);
        }
        return false;
      },
    },
    {
      content:
        "Looking at your experiences, I found the following open roles. Pick a role:",
    },
    {
      content: "What's your name?",
      onResponse: (userResponse) => updateApplication("name", userResponse),
    },
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (currentQuestionIndex >= questions.length) {
      finishChat();
      return;
    }
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: questions[currentQuestionIndex].content,
        type: "bot",
      },
    ]);
    if (!!questions[currentQuestionIndex].choices) {
      setChoices(questions[currentQuestionIndex].choices);
      setIsInputDisabled(questions[currentQuestionIndex].isInputDisabled);
    }
    document.getElementById("messages").scrollTop += 500;
  }, [currentQuestionIndex]);

  const [input, setInput] = useState("");
  const [isInputDisabled, setIsInputDisabled] = useState(false);

  const [choices, setChoices] = useState([]);
  const [messages, setMessages] = useState([]);

  const errorMessage = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: "I'm sorry, that is not a valid entry",
        "type": "bot",
      },
    ]);
  };
  const finishChat = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content:
          "You're all set! Thanks for chatting with us. You should receive an email with more details shortly",
        "type": "bot",
      },
    ]);
    document.getElementById("messages").scrollTop += 1000;
    setIsInputDisabled(true);
  };

  const nextMessage = () => {
    setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
  };
  const updateApplication = async (field, value) => {
    const { response, json } = await request(
      "PUT",
      `application/${applicationId}`,
      {
        body: { [field]: value },
      }
    );
    if (response?.status == 200) {
      setChoices([]);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          content: "Roger that, I've recorded your selection",
          "type": "bot",
        },
      ]);
      setIsInputDisabled(false);
      return true;
    } else {
      return false;
    }
  };

  const inputFile = useRef();
  return (
    <div className="App">
      <input
        type="file"
        id="file"
        ref={inputFile}
        onChange={async (event) => {
          const file = event.target.files[0];
          setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
          const { response, json } = await request("GET", "role", {
            params: { description: "test thing" },
          });
          if (response.status == 200) {
            setChoices(
              json.slice(0, 3).map(({ title }) => ({
                value: title,
                onClick: () => updateApplication("role", title),
              }))
            );
          }
          setIsInputDisabled(true);
          console.log(file);
        }}
        style={{ display: "none" }}
      />
      <div className="header">QuickApply</div>
      <div className="messages" id="messages">
        {messages.map(({ content, type }) => (
          <p className={"speech-bubble-" + type}>{content}</p>
        ))}
        <div className="choices">
          {choices.map(({ value, onClick }) => (
            <Chip
              label={value}
              style={{
                margin: "2px",
                fontSize: "1em",
                padding: "5px",
                fontWeight: "bold",
              }}
              onClick={async () => {
                setMessages((prevMessages) => [
                  ...prevMessages,
                  {
                    content: value,
                    "type": "user",
                  },
                ]);
                const valid = await onClick();
                if (valid == "DONOTHING") {
                  return;
                } else if (valid) {
                  nextMessage();
                } else {
                  errorMessage();
                }
                document.getElementById("messages").scrollTop += 500;
              }}
            />
          ))}
        </div>
      </div>

      <div className="input">
        <TextField
          fullWidth
          label={isInputDisabled ? "Custom input disabled" : "Chat"}
          variant="filled"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isInputDisabled}
          onKeyPress={async (ev) => {
            if (ev.key === "Enter") {
              messages.push({ content: input, type: "user" });
              const response = input;
              setInput("");
              const valid = await questions[currentQuestionIndex].onResponse(
                response
              );
              console.log(valid, currentQuestionIndex, response);
              if (valid) {
                nextMessage();
              } else {
                errorMessage();
              }
              document.getElementById("messages").scrollTop += 500;
              ev.preventDefault();
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;
