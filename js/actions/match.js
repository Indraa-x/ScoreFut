/** Actions belonging to the match flow. */
import {scrollKnockoutRound} from '../knockout-scroll.js';

export function matchActions({
  state,
  MATCH_SPEEDS,
  modal,
  ui,
  navigate,
  render,
  startTournament,
  nextMatch,
  persist,
  app,
  stopPlayback,
}) {
  return {
    tournament: async (value, element) => {
      startTournament();
      return;
    },
    "next-match": async (value, element) => {
      nextMatch();
      return;
    },
    "match-speed": async (value, element) => {
      {
        const speed = Number(value);
        if (MATCH_SPEEDS.includes(speed)) {
          state.matchSpeed = speed;
          persist();
          render();
          if (speed === 8)
            app
              .querySelector(".match-speed-fast")
              ?.classList.add("is-activating");
        }
        return;
      }
    },
    bracket: async (value, element) => {
      state.returnScreen = state.screen;
      navigate("bracket");
      return;
    },
    "back-match": async (value, element) => {
      navigate(state.returnScreen === "result" ? "result" : "match");
      return;
    },
    "champions-view": async (value, element) => {
      {
        if (!["champions", "world-cup", "copa-do-brasil"].includes(state.tournament?.mode))
          return;
        if (state.screen !== "bracket") {
          state.returnScreen = state.screen;
          state.championsGroupId = null;
          state.championsRound = null;
        }
        state.championsView = state.tournament.mode === "copa-do-brasil" || value === "knockout" ? "knockout" : "groups";
        navigate("bracket");
        return;
      }
    },
    "champions-group": async (value, element) => {
      if (
        state.screen === "bracket" &&
        ["champions", "world-cup"].includes(state.tournament?.mode) &&
        state.tournament.groups.some((group) => group.id === value)
      ) {
        state.championsGroupId = value;
        render();
      }
      return;
    },
    "champions-table-detail": async (value, element) => {
      const panel = app.querySelector('.champions-group-panel');
      if (state.screen !== 'bracket' || !panel) return;
      state.championsTableDetailed = !state.championsTableDetailed;
      panel.dataset.detailed = String(state.championsTableDetailed);
      element.setAttribute('aria-expanded', String(state.championsTableDetailed));
      element.querySelector('span').textContent = state.championsTableDetailed ? 'Mostrar resumo' : 'Ver tabela completa';
      const scroll = panel.querySelector('.champions-table-scroll');
      if (scroll) scroll.scrollLeft = 0;
    },
    "champions-round": async (value, element) => {
      if (
        state.screen === "bracket" &&
        ["champions", "world-cup", "copa-do-brasil"].includes(state.tournament?.mode) &&
        ["round16", "quarter", "semi", "final"].includes(value)
      ) {
        state.championsRound = value;
        const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
        if (!scrollKnockoutRound(app, value, behavior)) render();
      }
      return;
    },
    "champions-tie": async (value, element) => {
      {
        if (!["champions", "world-cup", "copa-do-brasil"].includes(state.tournament?.mode))
          return;
        const content = ui.renderChampionsTie(state.tournament, value);
        if (content) {
          document.getElementById("modal-content").innerHTML = content;
          modal.showModal();
        }
        return;
      }
    },
    "match-index": async (value, element) => {
      {
        const i = Number(value);
        if (
          !state.pendingRound &&
          Number.isInteger(i) &&
          i >= 0 &&
          i < state.tournament.userMatches.length
        ) {
          stopPlayback();
          state.userMatchIndex = i;
          if(state.friendChallenge)state.tournament.userTeamId=state.tournament.userMatches[i].homeId;
          state.penaltyReplay = null;
          state.matchMinute = state.tournament.userMatches[i].result.duration;
          persist();
          render();
        }
        return;
      }
    },
  };
}
