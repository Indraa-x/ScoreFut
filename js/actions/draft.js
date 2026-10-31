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
