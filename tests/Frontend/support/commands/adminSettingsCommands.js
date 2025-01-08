// import { _arrayBufferToBase64 } from "../utils/formData.js";

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
    cy.get('[data-test="settings-image-delete-button"]').should(
      deletable ? "be.visible" : "not.exist",
    );
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
      cy.get('[data-test="settings-image-preview"]')
        .should("have.attr", "src")
        .and("not.include", originalSrc)
        .then((src) => {
          cy.wrap(null).then(async () => {
            return new Cypress.Promise((resolve, reject) => {
              fetch(src)
                .then((response) => response.blob())
                .then((blob) => {
                  const contentType = blob.type;
                  const reader = new FileReader();
                  reader.readAsDataURL(blob);
                  reader.onloadend = function () {
                    try {
                      const base64data = reader.result;
                      expect(base64data).to.eql(
                        "data:" + contentType + ";base64," + content,
                      );
                      resolve();
                    } catch (error) {
                      reject(error);
                    }
                  };
                  // ToDo ???? use _arrayBufferToBase64???? (disadvantage: no content type)
                  // .then((response) => response.arrayBuffer())
                  // .then((arrayBuffer) => {
                  //   const base64 = _arrayBufferToBase64(arrayBuffer);
                  //   try {
                  //     expect(base64).to.eql(content);
                  //     resolve();
                  //   } catch (error) {
                  //     reject(error);
                  //   }
                })
                .catch((error) => {
                  reject(error);
                });
            });
          });
        });
    });

    // Cancel upload
    cy.get('[data-test="settings-image-cancel-button"]').click();

    // Check that setting is shown correctly
    cy.get('[data-test="settings-image-url-input"]')
      .should("be.visible")
      .and("have.value", originalSrc);

    cy.get('[data-test="settings-image-cancel-button"]').should("not.exist");
    cy.get('[data-test="settings-image-delete-button"]').should(
      deletable ? "be.visible" : "not.exist",
    );
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
      cy.get('[data-test="settings-image-preview"]')
        .should("have.attr", "src")
        .and("not.include", originalSrc)
        .then((src) => {
          cy.wrap(null).then(async () => {
            return new Cypress.Promise((resolve, reject) => {
              fetch(src)
                .then((response) => response.blob())
                .then((blob) => {
                  const contentType = blob.type;
                  const reader = new FileReader();
                  reader.readAsDataURL(blob);
                  reader.onloadend = function () {
                    try {
                      const base64data = reader.result;
                      expect(base64data).to.eql(
                        "data:" + contentType + ";base64," + content,
                      );
                      resolve();
                    } catch (error) {
                      reject(error);
                    }
                  };
                  // ToDo ???? use _arrayBufferToBase64???? (disadvantage: no content type)
                  // .then((response) => response.arrayBuffer())
                  // .then((arrayBuffer) => {
                  //   const base64 = _arrayBufferToBase64(arrayBuffer);
                  //   try {
                  //     expect(base64).to.eql(content);
                  //     resolve();
                  //   } catch (error) {
                  //     reject(error);
                  //   }
                })
                .catch((error) => {
                  reject(error);
                });
            });
          });
        });
    });
  },
);

/**
 * Checks if the image file upload works correctly
 * @memberof cy
 * @method checkSettingsFileSelector
 * @param {string} currentFileName
 * @param  {string} fileName
 * @param  {boolean} deletable
 * @returns void
 */
Cypress.Commands.add(
  "checkSettingsFileSelector",
  (currentFileName, fileName, deletable) => {
    cy.get('[data-test="settings-file-cancel-button"]').should("not.exist");
    if (currentFileName !== "" && deletable) {
      cy.get('[data-test="settings-file-delete-button"]').should("be.visible");
    } else {
      cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
    }
    cy.get('[data-test="settings-file-undo-delete-button"]').should(
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
    if (currentFileName !== "" && deletable) {
      cy.get('[data-test="settings-file-delete-button"]').should("be.visible");
    } else {
      cy.get('[data-test="settings-file-delete-button"]').should("not.exist");
    }
    cy.get('[data-test="settings-file-undo-delete-button"]').should(
      "not.exist",
    );

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
