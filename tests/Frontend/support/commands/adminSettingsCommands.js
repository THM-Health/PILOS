import {
  _arrayBufferToBase64,
  getFileContentType,
} from "../utils/fileHelper.js";

/**
 * Checks if the image file upload works correctly
 * @memberof cy
 * @method checkSettingsImageSelector
 * @param  {string} originalSrc
 * @param  {string} imageName
 * @param  {boolean} deletable
 * @returns void
 */
Cypress.Commands.add(
  "checkSettingsImageSelector",
  (originalSrc, imageName, deletable) => {
    // Check that correct url is shown
    cy.get('[data-test="settings-image-url-input"]').should(
      "have.value",
      originalSrc,
    );

    cy.get('[data-test="settings-image-preview"]')
      .should("have.attr", "src")
      .and("include", originalSrc);

    cy.get('[data-test="settings-image-cancel-button"]').should("not.exist");

    if (originalSrc !== "" && deletable) {
      cy.get('[data-test="settings-image-delete-button"]').should("be.visible");
    } else {
      cy.get('[data-test="settings-image-delete-button"]').should("not.exist");
    }

    cy.get('[data-test="settings-image-undo-delete-button"]').should(
      "not.exist",
    );

    cy.get('[data-test="file-input-input"]').then((fileInput) => {
      cy.stub(fileInput[0], "click").as("fileInputClick");
    });

    cy.get('[data-test="file-input-button"]')
      .should("include.text", "app.browse")
      .trigger("keyup", { key: "Enter" });

    // Check that button is connected to file input
    cy.get("@fileInputClick").should("be.calledOnce");

    cy.get('[data-test="file-input-input"]').selectFile(
      "tests/Frontend/fixtures/files/" + imageName,
      {
        force: true,
      },
    );

    // Check that buttons changed
    cy.get('[data-test="file-input-button"]').should("include.text", imageName);

    cy.get('[data-test="settings-image-url-input"]').should("not.exist");

    cy.get('[data-test="settings-image-cancel-button"]').should("be.visible");
    cy.get('[data-test="settings-image-delete-button"]').should("not.exist");
    cy.get('[data-test="settings-image-undo-delete-button"]').should(
      "not.exist",
    );

    // Check that correct image is shown
    cy.fixture("files/" + imageName, "base64").then((content) => {
      const contentType = getFileContentType(imageName);

      cy.get('[data-test="settings-image-preview"]')
        .should("have.attr", "src")
        .and("not.include", originalSrc)
        .then((src) => {
          cy.checkBlobSrcImage(src, content, contentType);
        });
    });

    // Cancel upload
    cy.get('[data-test="settings-image-cancel-button"]').click();

    // Check that setting is shown correctly
    cy.get('[data-test="settings-image-url-input"]')
      .should("be.visible")
      .and("have.value", originalSrc);

    cy.get('[data-test="settings-image-cancel-button"]').should("not.exist");

    if (originalSrc !== "" && deletable) {
      cy.get('[data-test="settings-image-delete-button"]').should("be.visible");
    } else {
      cy.get('[data-test="settings-image-delete-button"]').should("not.exist");
    }

    cy.get('[data-test="settings-image-undo-delete-button"]').should(
      "not.exist",
    );

    cy.get('[data-test="file-input-button"]').should(
      "include.text",
      "app.browse",
    );

    // Upload image again
    cy.get('[data-test="file-input-input"]').selectFile(
      "tests/Frontend/fixtures/files/" + imageName,
      {
        force: true,
      },
    );

    // Check that correct image is shown
    cy.fixture("files/" + imageName, "base64").then((content) => {
      const contentType = getFileContentType(imageName);

      cy.get('[data-test="settings-image-preview"]')
        .should("have.attr", "src")
        .and("not.include", originalSrc)
        .then((src) => {
          cy.checkBlobSrcImage(src, content, contentType);
        });
    });
  },
);

/**
 * Checks if the image loaded from the blob url has the expected content and content type
 * @memberof cy
 * @method checkBlobUrlData
 * @param  {string} blobSrc
 * @param  {string} expectedBase64Content
 * @param  {string} expectedContentType
 * @returns void
 */
Cypress.Commands.add(
  "checkBlobSrcImage",
  (blobSrc, expectedBase64Content, expectedContentType) => {
    cy.wrap(null, { log: false }).then(async () => {
      return new Cypress.Promise((resolve, reject) => {
        fetch(blobSrc)
          .then((response) =>
            // Get array buffer and content type
            response.arrayBuffer().then((arrayBuffer) => ({
              arrayBuffer,
              contentType: response.headers.get("content-type"),
            })),
          )
          .then(({ arrayBuffer, contentType }) => {
            const base64 = _arrayBufferToBase64(arrayBuffer);

            // Check if content and content type are correct
            try {
              expect(contentType).to.eql(expectedContentType);
              expect(base64).to.eql(expectedBase64Content);
              resolve();
            } catch (error) {
              reject(error);
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    });
  },
);

/**
 * Checks if the image file upload works correctly
 * @memberof cy
 * @method checkSettingsFileSelector
 * @param {string} originalHref
 * @param  {string} fileName
 * @param  {boolean} deletable
 * @returns void
 */
Cypress.Commands.add(
  "checkSettingsFileSelector",
  (originalHref, fileName, deletable) => {
    cy.get('[data-test="settings-file-cancel-button"]').should("not.exist");
    if (originalHref !== "" && deletable) {
      cy.get('[data-test="settings-file-delete-button"]').should("be.visible");
    } else {
      cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
    }
    cy.get('[data-test="settings-file-undo-delete-button"]').should(
      "not.exist",
    );

    if (originalHref !== "") {
      cy.get('[data-test="settings-file-view-button"]')
        .should("be.visible")
        .and("include.text", "app.view")
        .and("have.attr", "href", originalHref);
    } else {
      cy.get('[data-test="settings-file-view-button"]').should("not.exist");
    }

    cy.get('[data-test="file-input-input"]').then((fileInput) => {
      cy.stub(fileInput[0], "click").as("fileInputClick");
    });

    cy.get('[data-test="file-input-button"]')
      .should("include.text", "app.browse")
      .trigger("keyup", { key: "Enter" });

    // Check that button is connected to file input
    cy.get("@fileInputClick").should("be.calledOnce");

    cy.get('[data-test="file-input-input"]').selectFile(
      "tests/Frontend/fixtures/files/" + fileName,
      {
        force: true,
      },
    );

    // Check that buttons changed
    cy.get('[data-test="file-input-button"]').should("include.text", fileName);

    cy.get('[data-test="settings-file-cancel-button"]').should("be.visible");
    cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
    cy.get('[data-test="settings-file-undo-delete-button"]').should(
      "not.exist",
    );

    // Cancel upload
    cy.get('[data-test="settings-file-cancel-button"]').click();

    // Check that setting is shown correctly
    cy.get('[data-test="settings-file-cancel-button"]').should("not.exist");
    if (originalHref !== "" && deletable) {
      cy.get('[data-test="settings-file-delete-button"]').should("be.visible");
    } else {
      cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
    }
    cy.get('[data-test="settings-file-undo-delete-button"]').should(
      "not.exist",
    );

    if (originalHref !== "") {
      cy.get('[data-test="settings-file-view-button"]')
        .should("be.visible")
        .and("include.text", "app.view")
        .and("have.attr", "href", originalHref);
    } else {
      cy.get('[data-test="settings-file-view-button"]').should("not.exist");
    }

    cy.get('[data-test="file-input-button"]').should(
      "include.text",
      "app.browse",
    );

    // Upload file again
    cy.get('[data-test="file-input-input"]').selectFile(
      "tests/Frontend/fixtures/files/" + fileName,
      {
        force: true,
      },
    );
  },
);

/**
 * Checks if the SettingsImageSelector is shown correctly with only view permission
 * @memberof cy
 * @method checkSettingsImageSelectorOnlyView
 * @param  {string} src
 * @returns void
 */
Cypress.Commands.add("checkSettingsImageSelectorOnlyView", (src) => {
  cy.get('[data-test="settings-image-url-input"]').should("not.exist");
  cy.get('[data-test="settings-image-cancel-button"]').should("not.exist");
  cy.get('[data-test="settings-image-delete-button"]').should("not.exist");
  cy.get('[data-test="settings-image-undo-delete-button"]').should("not.exist");
  cy.get('[data-test="file-input-button"]').should("not.exist");
  cy.get('[data-test="file-input-input"]').should("not.exist");

  if (src !== "") {
    cy.get('[data-test="settings-image-preview"]')
      .should("be.visible")
      .and("have.attr", "src", src);
  }
});

/**
 * Checks if the SettingsFileSelector is shown correctly with only view permission
 * @memberof cy
 * @method checkSettingsFileSelectorOnlyView
 * @param {string} href
 * @returns void
 */
Cypress.Commands.add("checkSettingsFileSelectorOnlyView", (href) => {
  cy.get('[data-test="settings-file-cancel-button"]').should("not.exist");
  cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
  cy.get('[data-test="settings-file-undo-delete-button"]').should("not.exist");
  cy.get('[data-test="file-input-button"]').should("not.exist");
  cy.get('[data-test="file-input-input"]').should("not.exist");

  if (href !== "") {
    cy.get('[data-test="settings-file-view-button"]')
      .should("be.visible")
      .and("include.text", "app.view")
      .and("have.attr", "href", href);
  } else {
    cy.get('[data-test="settings-file-view-button"]').should("not.exist");
  }
});
