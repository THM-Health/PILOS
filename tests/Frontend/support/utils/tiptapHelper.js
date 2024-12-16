export function selectTipTapContent(limit = 5) {
  if (limit < 0) {
    throw new Error("Selecting the text failed");
  }

  cy.get(".tiptap").then((tiptap) => {
    cy.get(".tiptap").type("{selectall}");

    cy.window().then((win) => {
      const selection = win.getSelection();
      const selectedText = selection.toString();
      try {
        expect(selectedText).to.eq(tiptap.text());
        return;
      } catch {
        cy.log("Remaining tries to select text: " + limit);
      }

      selectTipTapContent(limit - 1);
    });
  });
}
