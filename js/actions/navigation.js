/** Actions belonging to the navigation flow. */
export function navigationActions({
  state,
  MODES,
  FORMATIONS,
  modal,
  ui,
  renderReleaseDetails,
  navigate,
  openSetup,
  launchFromHome,
  render,
  resumeGame,
}) {
  return {
    "release-notes": async (value, element) => {
      document.getElementById("modal-content").innerHTML =
        renderReleaseDetails();
      modal.showModal();
      return;
    },
    home: async (value, element) => {
      navigate("home");
      return;
    },
    achievements: async (value, element) => {
      navigate("achievements");
      return;
    },
    help: async (value, element) => {
      document.getElementById("modal-content").innerHTML = ui.renderHelp();
      modal.showModal();
      return;
    },
    "close-modal": async (value, element) => {
      modal.close();
      return;
    },
    setup: async (value, element) => {
      openSetup(value || "world-cup");
      return;
    },
    "play-home": async (value, element) => {
      await launchFromHome(element);
      return;
    },
    mode: async (value, element) => {
      {
        if (MODES.some((m) => m.id === value)) {
          state.mode = value;
          if (value === "quick") state.quickStep = "formation";
          render();
        }
        return;
      }
    },
    formation: async (value, element) => {
      if (FORMATIONS[value]) {
        state.formation = value;
        render();
      }
      return;
    },
    resume: async (value, element) => {
      resumeGame();
    },
  };
}
