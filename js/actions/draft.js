/** Actions belonging to the draft flow. */
export function draftActions({
  state,
  openSetup,
  render,
  startDraft,
  roll,
  selectPlayer,
  slotAction,
  chooseQuickTeam,
  app,
}) {
  return {
    start: async (value, element) => {
      const screen = state.screen,
        mode = state.mode;
      if (
        element?.matches(".setup-start-button") &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        element.classList.add("is-starting");
        element.disabled = true;
        element.setAttribute("aria-busy", "true");
        const animations = element.getAnimations?.({ subtree: true });
        if (animations)
          await Promise.all(
            animations
              .filter((animation) =>
                animation.animationName?.startsWith("setup-start-"),
              )
              .map((animation) => animation.finished.catch(() => {})),
          );
        else await new Promise((resolve) => setTimeout(resolve, 360));
        element.disabled = false;
        element.removeAttribute("aria-busy");
        element.classList.remove("is-starting");
        if (
          !element.isConnected ||
          state.screen !== screen ||
          state.mode !== mode
        )
          return;
      }

      if (state.mode === "quick") {
        state.quickStep = "clubs";
        render();
        window.scrollTo({ top: 0, behavior: "instant" });
      } else startDraft();
      return;
    },
    draw: async (value, element) => {
      await roll();
      return;
    },
    "reroll-club": async (value, element) => {
      await roll("club");
      return;
    },
    "reroll-season": async (value, element) => {
      await roll("season");
      return;
    },
    player: async (value, element) => {
      selectPlayer(value);
      return;
    },
    slot: async (value, element) => {
      slotAction(value);
      return;
    },
    "quick-team": async (value, element) => {
      chooseQuickTeam(value);
      return;
    },
    "quick-choose-club": async (value, element) => {
      openSetup("quick", "clubs");
      return;
    },
    "quick-formation": async (value, element) => {
      openSetup("quick");
      return;
    },
    "quick-region": async (value, element) => {
      if (["all", "brasil", "europa"].includes(value)) {
        state.quickRegion = value;
        render();
      }
      return;
    },
    "quick-clear": async (value, element) => {
      state.quickSearch = "";
      state.quickRegion = "all";
      render();
      app.querySelector("#quick-search")?.focus();
      return;
    },
  };
}
