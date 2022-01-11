/**
 * Main function creating DRISC
 * @param {string} token - JWT token generated from customerId, publisherId, secret
 * @param {string} endpoint
 * @param {() => void} onStartCreatingSession
 * @param {(data) => void} onSessionError
 * @param {() => void} onSessionDisabled
 * @param {() => void} onWebsocketTakeover
 * @param {() => void} onWebsocketOk
 * @param {() => void} onWebsocketTerminate
 * @param {() => void} onSetupWebsocket
 * @param {() => void} onWebsocketMessage
 * @param {() => void} onSystemError
 * @returns startSession,
 * @returns finishSession,
 * @returns takeOverSession,
 */
const createDrisc = ({
     token,
     endpoint,
     onStartCreatingSession,
     onSessionError,
     onSessionDisabled,
     onWebsocketTakeover,
     onWebsocketOk,
     onWebsocketTerminate,
     onSetupWebsocket,
     onWebsocketMessage,
     onSystemError,
}) => {

    // Interval id used to monitor WS state
    let intervalID;

    // Configuration
    const RECONNECT_INTERVAL = 2000;
    const WS_ENDPOINT_KEY = 'ws_endpoint';

    // Websocket
    let websocketEndpoint = "";
    let websocketClient = null;
    let localCache = {
        offerId: null,
        tagName: null,
        sessionName: null,
    }

    /**
     * All messages client application must implement to integrate with DRISC
     */
    const clientMessages = {
        REQUESTED: JSON.stringify({ action: "REQUESTED" }),
        FINISHED: JSON.stringify({ action: "FINISHED" }),
        PONG: JSON.stringify({ action: "PONG" }),
    };

    /**
     * All messages server can possibly send.
     */
    const serverMessages = {
        OK: "OK",
        TERMINATE: "TERMINATE",
        PING: "PING",
        TAKE_OVER: "TAKE_OVER",
        EXPIRED: "EXPIRED",
    };

    /**
     * @param {string} offerId
     * @param {string} tagName
     * @param {string} sessionName
     */
    const startSession = async ({ offerId, tagName, sessionName }) => {
        onStartCreatingSession();
        localCache = {
            offerId, tagName, sessionName
        }

        const body = {
            sessionName,
        };

        if (offerId) {
            body.offerId = offerId;
        } else {
            body.tag = tagName;
        }
        const wsEndpoint = sessionStorage.getItem(WS_ENDPOINT_KEY);
        if(wsEndpoint) {
            setupWebsocket(wsEndpoint);
            return;
        }

        try {
            const res = await fetch(`${endpoint}/sessions`, {
                method: "POST",
                headers: createAuthorizationHeaders(),
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.status === 200) {
                if (data.enabled === false) {
                    onSessionDisabled();
                } else {
                    websocketEndpoint = data.endpoint;
                    sessionStorage.setItem(WS_ENDPOINT_KEY, websocketEndpoint);
                    setupWebsocket(websocketEndpoint);
                }
            } else {
                onSessionError(data);
            }
        } catch (e) {
            onSystemError();
        }

    };

    /**
     * @param {string} websocketEndpoint
     */
    const setupWebsocket = (websocketEndpoint) => {
        websocketClient = new WebSocket(websocketEndpoint);

        intervalID = startReconnect(RECONNECT_INTERVAL);
        onSetupWebsocket();

        websocketClient.addEventListener("open", async () => {
            await sendMessage(websocketClient, clientMessages.REQUESTED);
        });

        websocketClient.addEventListener("message", async (data) => {
            onWebsocketMessage();
            const message = JSON.parse(data.data);
            switch (message.action) {
                case serverMessages.TERMINATE:
                    clearInterval(intervalID);
                    await onWebsocketTerminate();
                    break;
                case serverMessages.OK:
                    await onWebsocketOk();
                    break;
                case serverMessages.PING:
                    await sendMessage(websocketClient, clientMessages.PONG);
                    break;
                case serverMessages.TAKE_OVER:
                    clearInterval(intervalID);
                    await onWebsocketTakeover();
                    break;
                case serverMessages.EXPIRED:
                    sessionStorage.removeItem(WS_ENDPOINT_KEY)
                    startSession(localCache);
                    break;
                default:
                    onSystemError();
                    console.info(`Unhandled message ${JSON.stringify(message)}`);
            }
        });
    };

    /**
     * Starts interval which ensures websocket is in Ready State
     * Returns ID of Interval
     * @param {number} sleep
     * @returns {number}
     */
    const startReconnect = (sleep, wsEndpoint) => {
        return setInterval(() => {
            if (websocketClient.readyState !== 1 && wsEndpoint) {
                websocketClient = new WebSocket(wsEndpoint);
            }
        }, sleep);
    };


    /**
     * @param {string} sessionId
     * @param {string} offerId
     * @param {string} tagName
     * @param {string} sessionName
     */
    const takeOverSession = async ({
                                       sessionId,
                                       sessionName,
                                       offerId,
                                       tagName,
                                   }) => {
        const body = { sessionName, sessionId };

        if (offerId) {
            body.offerId = offerId;
        } else {
            body.tag = tagName;
        }

        const res = await fetch(`${endpoint}/takeover`, {
            method: "POST",
            headers: createAuthorizationHeaders(),
            body: JSON.stringify(body),
        });

        const data = await res.json();

        websocketEndpoint = data.endpoint;
        setupWebsocket(websocketEndpoint);

        return data;
    };


    /**
     * Helper function which generates Authorization headers using token passed in createDrisc function
     */
    const createAuthorizationHeaders = () => ({
        Authorization: `Bearer ${token}`,
    });

    /**
     * Helper function which stops reconnect interval, closes modal and sens FINISHED message
     */
    const finishSession = async () => {
        clearInterval(intervalID);
        if (websocketClient) {
            await sendMessage(websocketClient, clientMessages.FINISHED);
        }
        sessionStorage.removeItem(WS_ENDPOINT_KEY);
    };

    /**
     *
     * @param {WebSocket} socket
     * @param {string} message
     * @returns {Promise<void>}
     */
    const sendMessage = (socket, message) =>
        new Promise((resolve, reject) => {
            if (socket.readyState === 1) {
                resolve();
            }
            let retryCount = 0;

            const interval = setInterval(() => {
                if (retryCount === 20) {
                    clearInterval(interval);
                    reject("Could not connect to socket after 20 retries");
                }
                if (socket.readyState === 1) {
                    clearInterval(interval);
                    socket.send(message);
                    resolve();
                }
                retryCount++;
            }, 1000);
        });

    return {
        startSession,
        finishSession,
        takeOverSession,
    };
};

module.exports = {
    createDrisc,
};
