const optionsContainer = document.querySelector("#options");
const toggleOptionsButton = document.querySelector("#options-toggler");
const hiddenClassName = "is-visible";
import videoSrc from '../assets/video.mp4';

const hideOptions = () => {
    optionsContainer.classList.remove(hiddenClassName);
};
const showOptions = () => {
    optionsContainer.classList.add(hiddenClassName);
};
const toggleOptions = () => {
    if (optionsContainer.classList.contains(hiddenClassName)) {
        hideOptions();
    } else {
        showOptions();
    }
};
const initSettingsContainer = () => {
    optionsContainer.classList.add("is-animated");
};
toggleOptionsButton.addEventListener("click", toggleOptions);
document.addEventListener("DOMContentLoaded", initSettingsContainer);

const ui = () => {
    // CSS and HTML elements
    const css = {
        MODAL_ACTIVE: "is-active",
    };
    const errorModal = document.getElementById("modalError");
    const takeOverModal = document.getElementById("takeOverModal");
    const videoModal = document.getElementById("videoModal");
    const loadingModal = document.getElementById("loadingModal");
    const player = document.getElementById("video-player");
    const systemErrorModal = document.getElementById("systemErrorModal");
    const videoCloseButton = document.getElementById("close-video");

    const openModal = (modal) => modal.classList.add(css.MODAL_ACTIVE);
    const closeModal = (modal) => modal.classList.remove(css.MODAL_ACTIVE);
    const openVideoModal = (forceHigh = false) => {
        openModal(videoModal);
        document.querySelector('.player-container').classList.add('is-higher')
    }
    const closeVideoModal = (forceHigh = false) => {
        closeModal(videoModal);
        if(forceHigh) {
            document.querySelector('.player-container').classList.remove('is-higher')
        }
    }
    const startLoading = () => openModal(loadingModal);
    const stopLoading = () => closeModal(loadingModal);

    // Bind events to close buttons of video and error modals
    const closeButtons = document.getElementsByClassName("modal-close");
    for (let button of closeButtons) {
        button.addEventListener("click", function () {
            document
                .getElementsByClassName(css.MODAL_ACTIVE)[0]
                .classList.remove(css.MODAL_ACTIVE);
        });
    }

    videoCloseButton.addEventListener('click', () => {
        if(videoModalCloseCallback && typeof videoModalCloseCallback === 'function') {
            videoModalCloseCallback();
        }
        closeVideoModal(true)
    })

    let endpoint = "";
    let sessionName = "";
    let tagName = "";
    let offerId = "";

    // Bind events to session name input
    const inputs = [
        { id: "sessionName", setValue: (v) => (sessionName = v) },
        { id: "sessionTag", setValue: (v) => (tagName = v) },
        { id: "sessionOffer", setValue: (v) => (offerId = v) },
        { id: "driscEndpoint", setValue: (v) => (endpoint = v) },
        { id: "jwtSecret", setValue: () => {} },
        { id: "customerID", setValue: () => {} },
        { id: "publisherID", setValue: () => {} },
    ];

    inputs.forEach((el) => {
        const input = document.getElementById(el.id);
        el.setValue(input.value);
        input.addEventListener("change", (e) => {
            el.setValue(e.target.value);
            if (
                onFormChangedCallback &&
                typeof onFormChangedCallback === "function"
            ) {
                onFormChangedCallback({
                    sessionName,
                    tagName,
                    offerId,
                    endpoint,
                });
            }
        });
    });

    document.addEventListener("DOMContentLoaded", () => {
        if (onFormChangedCallback && typeof onFormChangedCallback === "function") {
            onFormChangedCallback({
                sessionName,
                tagName,
                offerId,
                endpoint,
            });
        }
    });

    const handleSetupWebsocket = () => {
        startLoading();
        player.src = videoSrc;
        openVideoModal();
    };
    const handleWebsocketMessage = () => {
        stopLoading();
    };
    const handleWebsocketTerminate = async () => {
        await player.pause();
        closeVideoModal();
    };
    const handleWebsocketOk = async () => {
        openVideoModal();
        await player.play();
    };
    const handleWebsocketTakeover = async () => {
        await player.pause();
        closeVideoModal();
        openModal(takeOverModal);
    };
    const handleStartCreatingSession = () => {
        startLoading();
    };

    const handleSessionDisabled = () => {
        player.src = videoSrc;
        player.play();
        openVideoModal();
        stopLoading();
    };

    const handleSystemError = () => {
        openModal(systemErrorModal);
        stopLoading();
    }

    const handleSessionError = (data) => {
        stopLoading();
        const takeOverListParentNode = errorModal.querySelector(".js-error-footer");
        while (takeOverListParentNode.firstChild) {
            takeOverListParentNode.firstChild.remove();
        }

        const createTakeOverButtons = (data) => {
            const activeSessions = data.details.activeSessions || [];

            openModal(errorModal);

            const select = createSelect();

            activeSessions.forEach((element) => {
                addOptionToSelect(select, element);
            });

            const button = createButton("Takeover session");

            takeOverListParentNode.append(select);
            takeOverListParentNode.append(button);

            button.addEventListener("click", async () => {
                const sessionId = select.querySelector("select").value || "default";
                if (
                    onTakeOverButtonCallback &&
                    typeof onTakeOverButtonCallback === "function"
                ) {
                    onTakeOverButtonCallback(sessionId);
                }
                startLoading();
                closeModal(errorModal);
            });
        };

        if (data.details.takeOverEnabled) {
            createTakeOverButtons(data);
        }
    };

    const createSelect = () => {
        const select = document.createElement("div");
        select.className = "select";
        select.innerHTML = "<select></select>";
        return select;
    };

    const addOptionToSelect = (select, element) => {
        const opt = document.createElement("option");
        opt.setAttribute("value", element.sessionId);
        opt.innerText = element.name;
        select.querySelector("select").append(opt);
    };

    const createButton = (innerText) => {
        const button = document.createElement("button");
        button.innerText = innerText;
        button.classList.add("button", "is-light");
        return button;
    };

    let playbackEndedCallback = null;
    let placeholderVideoClickedCallback = null;
    let onFormChangedCallback = null;
    let onTakeOverButtonCallback = null;
    let tabCloseCallback = null;
    let videoModalCloseCallback = null;


    const onTabClosed = (cb) => {
        tabCloseCallback = cb;
    };

    const onCloseVideoModal = (cb) => {
        videoModalCloseCallback = cb;
    };

    const onPlaybackEnded = (cb) => {
        playbackEndedCallback = cb;
    };

    const onPlaceholderVideoClicked = (cb) => {
        placeholderVideoClickedCallback = cb;
    };

    const onFormChanged = (cb) => {
        onFormChangedCallback = cb;
    };

    const onTakeOverButtonClicked = (cb) => {
        onTakeOverButtonCallback = cb;
    };

    player.addEventListener("ended", () => {
        if (playbackEndedCallback && typeof playbackEndedCallback === "function") {
            playbackEndedCallback();
        }
        closeVideoModal(true)
    });

    // Bind events to cards with content
    const movieCards = document.getElementsByClassName("js-MovieCard");
    for (let movieCard of movieCards) {
        movieCard.addEventListener("click", () => {
            closeModal(systemErrorModal);
            if (
                placeholderVideoClickedCallback &&
                typeof placeholderVideoClickedCallback === "function"
            ) {
                placeholderVideoClickedCallback();
            }
        });
    }


    window.addEventListener("beforeunload", () => {
        if (tabCloseCallback && typeof tabCloseCallback === "function") {
            tabCloseCallback();
        }
    });

    return {
        handleStartCreatingSession,
        handleSessionError,
        handleWebsocketTakeover,
        handleWebsocketOk,
        handleWebsocketTerminate,
        handleSetupWebsocket,
        handleWebsocketMessage,
        handleSessionDisabled,
        handleSystemError,
        onPlaybackEnded,
        onPlaceholderVideoClicked,
        onFormChanged,
        onTakeOverButtonClicked,
        onTabClosed,
        onCloseVideoModal,
    };
};

module.exports = {
    ui,
};
