/** Actions belonging to the result flow. */
export function resultActions({ state, modal, ui, downloadResult, toast }) {
  return {
    "result-lineup": async (value, element) => {
      if (state.screen === "result" && state.resultRecord) {
        document.getElementById("modal-content").innerHTML =
          ui.renderResultLineup(state.resultRecord);
        modal.showModal();
      }
      return;
    },
    download: async (value, element) => {
      await downloadResult(state.resultRecord);
      toast("Seu resultado em PNG está pronto.");
      return;
    },
  };
}
