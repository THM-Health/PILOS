// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export function selectTiptapContent(limit = 5) {
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

      selectTiptapContent(limit - 1);
    });
  });
}

export function clearTiptapContent(limit = 5) {
  if (limit < 0) {
    throw new Error("Clearing the text failed");
  }

  cy.get(".tiptap").clear();

  cy.get(".tiptap").then((tiptap) => {
    try {
      expect(tiptap.text()).to.eq("");
      return;
    } catch {
      cy.log("Remaining tries to clear text: " + limit);
    }

    clearTiptapContent(limit - 1);
  });
}
