import React, { useState, useEffect, useRef } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/javascript-lint';
import { io } from 'socket.io-client';
import './App.css';
import ErrorPage from './ErrorPage';

const App = () => {
  const [code, setCode] = useState('// Start coding...');
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [output, setOutput] = useState('');
  const [username, setUsername] = useState('');
  const latestCode = useRef(code);
  const editorRef = useRef(null);
  const [userNameAdded, setuserNameAdded] = useState(true);

  useEffect(() => {
    const newSocket = io('https://collaborative-coding-backend.onrender.com');
    setSocket(newSocket);

    newSocket.on('requestUsername', () => {
      const name = prompt('Enter your username:');

      if (name == null || !name || name === " ") {
        setuserNameAdded(false);
      }
      if (name) {
        setuserNameAdded(true);
        setUsername(name);
        newSocket.emit('setUsername', name);
      }
    });

    newSocket.on('codeChange', (newCode) => {
      if (newCode !== latestCode.current) {
        setCode(newCode);
      }
    });

    newSocket.on('userList', (userList) => {
      setUsers(userList);
    });

    newSocket.on('userJoined', (username) => {
      alert(`${username} has joined the session.`);
    });

    newSocket.on('userChanged', ({ oldUsername, newUsername }) => {
      alert(`${oldUsername} changed their name to ${newUsername}.`);
    });

    newSocket.on('userLeft', (username) => {
      alert(`${username} has left the session.`);
    });

    newSocket.on('cursorMove', (data) => {
      setCursors((prevCursors) => ({
        ...prevCursors,
        [data.username]: data.position,
      }));
    });

    newSocket.on('codeOutput', (result) => {
      setOutput(result);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleEditorChange = (editor, data, value) => {
    latestCode.current = value;
    setCode(value);
    if (socket) {
      socket.emit('codeChange', value);
    }
  };

  const handleCursorMove = (editor) => {
    if (socket && editorRef.current) {
      const position = editor.getCursor();
      if (username) {
        socket.emit('cursorMove', { username, position });
      }
    }
  };

  const handleExecuteCode = () => {
    if (socket) {
      socket.emit('executeCode', latestCode.current);
    }
  };

  const cursorMarkers = Object.keys(cursors).map((username) => {
    const { line, ch } = cursors[username];
    const lineHeight = 1.5;
    const charWidth = 8;

    const top = line * lineHeight;
    const left = ch * charWidth;
    return (
      <div
        key={username}
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: `${left}px`,
          width: '10px',
          height: '10px',
          backgroundColor: 'red',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '12px', color: 'white' }}>{username}</span>
      </div>
    );
  });

  return (
    <>
      {userNameAdded ? (
        <div className="App">
          <header>
            <h1>Code Collaboration</h1>
          </header>

          <div className="users">
            <h2>Online Users:</h2>
            <ol>
              {users.map((user, index) => (
                <li key={index}>{user}</li>
              ))}
            </ol>
          </div>

          <div className="editor-wrapper">
            <CodeMirror
              value={code}
              options={{
                mode: 'javascript',
                theme: 'material',
                lineNumbers: true,
                lint: true,
                gutters: ['CodeMirror-lint-markers'],
              }}
              onBeforeChange={(editor, data, value) => {
                setCode(value);
              }}
              onChange={handleEditorChange}
              onCursorActivity={(editor) => handleCursorMove(editor)}
              ref={editorRef}
            />
            {cursorMarkers}
          </div>

          <button className="run-button" onClick={handleExecuteCode}>
            Run Code
          </button>

          <div className="output-area">
            <h2>Output:</h2>
            <pre>{output}</pre>
          </div>
        </div>
      ) : (
        <ErrorPage />
      )}
    </>
  );
};

export default App;
