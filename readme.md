# DRISC integration example

--------------------------------

📚 This repository contains example of how you can integrate your application to the DRISC server. File `index.html`
contains all code needed to obtain session with websocket endpoint, reconnect functionality as well as handling for all
messages sent from or to DRISC Websocket API.  
`index.js` contains helpers for generating JWT based on inputs on top of the website.


📜 Bellow you can find currently supported WS messages

```typescript
enum ServerMessages {
    OK = {"action":"OK"},
    TERMINATE = {"action":"TERMINATE"},
    PING = {"action":"PING"},
}

enum ClientMessages {
    REQUESTED = {"action":"REQUESTED"},
    FINISHED = {"action":"FINISHED"},
    PONG = {"action":"PONG"},
}
```

🌁 Assets are free to use without any additional licence. Source:  
https://www.pexels.com/video/video-of-a-jelly-fish-underwater-8856781/  
https://unsplash.com/photos/XcuKWkUA4-4  