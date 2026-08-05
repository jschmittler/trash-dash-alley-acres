export const browserExperienceQueries = {
  touchFirst: "(hover: none), (pointer: coarse)",
  portrait: "(orientation: portrait)",
};

export function readBrowserExperience(browserWindow, browserDocument) {
  return {
    touchFirst: browserWindow.matchMedia(browserExperienceQueries.touchFirst).matches,
    portrait: browserWindow.matchMedia(browserExperienceQueries.portrait).matches,
    fullscreen: Boolean(browserDocument.fullscreenElement),
    fullscreenSupported: typeof browserDocument.documentElement?.requestFullscreen === "function",
  };
}

export function subscribeBrowserExperience(browserWindow, browserDocument, onChange) {
  const touchQuery = browserWindow.matchMedia(browserExperienceQueries.touchFirst);
  const portraitQuery = browserWindow.matchMedia(browserExperienceQueries.portrait);
  const visualViewport = browserWindow.visualViewport;

  touchQuery.addEventListener("change", onChange);
  portraitQuery.addEventListener("change", onChange);
  browserWindow.addEventListener("resize", onChange);
  browserWindow.addEventListener("orientationchange", onChange);
  visualViewport?.addEventListener("resize", onChange);
  browserDocument.addEventListener("fullscreenchange", onChange);

  return () => {
    touchQuery.removeEventListener("change", onChange);
    portraitQuery.removeEventListener("change", onChange);
    browserWindow.removeEventListener("resize", onChange);
    browserWindow.removeEventListener("orientationchange", onChange);
    visualViewport?.removeEventListener("resize", onChange);
    browserDocument.removeEventListener("fullscreenchange", onChange);
  };
}

export function clearInputState(heldKeys, pressedKeys) {
  heldKeys.clear();
  pressedKeys.clear();
}

export async function toggleGameFullscreen(target, browserDocument, orientation) {
  try {
    if (browserDocument.fullscreenElement) {
      if (typeof browserDocument.exitFullscreen !== "function") return "unsupported";
      await browserDocument.exitFullscreen();
      return "exited";
    }

    if (!target || typeof target.requestFullscreen !== "function") return "unsupported";
    await target.requestFullscreen();

    try {
      await orientation?.lock?.("landscape");
    } catch {
      // Orientation locking is optional and unsupported in several mobile browsers.
    }

    return "entered";
  } catch {
    return "failed";
  }
}
