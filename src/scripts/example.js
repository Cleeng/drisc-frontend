import { createDrisc } from "./createDrisc";
import { createToken } from "./index";
import { ui } from "./ui";

const {
    handleStartCreatingSession,
    handleSessionError,
    handleWebsocketTakeover,
    handleWebsocketOk,
    handleWebsocketTerminate,
    handleSetupWebsocket,
    handleWebsocketMessage,
    handleSessionDisabled,
    handleSystemError,
    onPlaceholderVideoClicked,
    onFormChanged,
    onTakeOverButtonClicked,
    onTabClosed,
    onPlaybackEnded,
    onCloseVideoModal,
} = ui();

onFormChanged((data) => {
    const { sessionName, endpoint, tagName, offerId } = data;
    const SESSION_STORAGE_TOKEN_KEY = 'cleeng_token'

    createToken();
    const token = sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY)


    const { startSession, finishSession, takeOverSession } = createDrisc({
        endpoint,
        token,
        onStartCreatingSession: handleStartCreatingSession,
        onSessionError: handleSessionError,
        onWebsocketTakeover: handleWebsocketTakeover,
        onWebsocketOk: handleWebsocketOk,
        onWebsocketTerminate: handleWebsocketTerminate,
        onSetupWebsocket: handleSetupWebsocket,
        onWebsocketMessage: handleWebsocketMessage,
        onSessionDisabled: handleSessionDisabled,
        onSystemError: handleSystemError,
    });

    onTakeOverButtonClicked(async (sessionId) => {
        await takeOverSession({ offerId, tagName, sessionName, sessionId });
    });

    onPlaceholderVideoClicked(() => {
        startSession({ offerId, tagName, sessionName });
    });

    onCloseVideoModal(() => {
        finishSession();
    })
});
