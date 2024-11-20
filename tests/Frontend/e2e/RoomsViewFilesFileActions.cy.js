import {
  _arrayBufferToBase64,
  parseFormData,
} from "../support/utils/formData.js";
import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view files file actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomFilesRequest(true);
  });

  it("upload file", function () {
    cy.visit("/rooms/abc-def-123#tab=files");

    cy.wait("@roomFilesRequest");

    cy.get('[data-test="room-files-upload-dialog"]').should("not.exist");
    cy.get('[data-test="room-files-upload-button"]').click();

    cy.get('[data-test="room-files-upload-dialog"]')
      .should("include.text", "rooms.files.upload")
      .should(
        "include.text",
        'rooms.files.formats_{"formats":"pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf, odt, ods, odp, odg, odc, odi, jpg, jpeg, png"}',
      )
      .should("include.text", 'rooms.files.size_{"size":30')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="drop-zone"]')
          .should("not.have.class", "cursor-wait")
          .and("have.text", "rooms.files.select_or_drag");
        cy.get('[data-test="progress-bar"]').should("not.exist");

        cy.get("#file").then((fileInput) => {
          cy.stub(fileInput[0], "click").as("fileInputClick");
        });

        cy.get('[data-test="upload-file-button"]')
          .should("be.visible")
          .and("not.have.class", "p-disabled")
          .and("include.text", "app.browse")
          .trigger("keyup", { key: "Enter" });

        // Check that button is connected to file input
        cy.get("@fileInputClick").should("be.calledOnce");

        const uploadFileRequest = interceptIndefinitely(
          "POST",
          "/api/v1/rooms/abc-def-123/files",
          {
            statusCode: 204,
          },
          "uploadFileRequest",
        );

        cy.fixture("roomFiles.json").then((roomFiles) => {
          roomFiles.data.push({
            id: 4,
            filename: "testFile.txt",
            download: false,
            use_in_meeting: false,
            default: false,
            uploaded: "2020-09-21T07:10:00.000000Z",
          });
          roomFiles.meta.per_page = 4;
          roomFiles.meta.to = 4;
          roomFiles.meta.total = 4;
          roomFiles.meta.total_no_filter = 4;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
            statusCode: 200,
            body: roomFiles,
          }).as("roomFilesRequest");
        });

        cy.get("#file")
          .should("not.be.visible")
          .selectFile("tests/Frontend/fixtures/files/testFile.txt", {
            force: true,
          });

        // Check loading
        cy.get('[data-test="upload-file-button"]').should(
          "have.class",
          "p-disabled",
        );
        cy.get('[data-test="drop-zone"]')
          .should("have.class", "cursor-wait")
          .and("have.text", "testFile.txt");
        cy.get('[data-test="progress-bar"]')
          .should("be.visible")
          .then(() => {
            uploadFileRequest.sendResponse();
          });
      });

    // Check that file is uploaded correctly
    cy.wait("@uploadFileRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );
      const uploadedFile = formData.get("file");
      expect(uploadedFile.name).to.eql("testFile.txt");
      expect(uploadedFile.type).to.eql("text/plain");
      cy.fixture("files/testFile.txt", "base64").then((content) => {
        uploadedFile.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });
    });

    cy.wait("@roomFilesRequest");

    // Check that dialog stayed open and success message is shown
    cy.get('[data-test="room-files-upload-dialog"]')
      .should("be.visible")
      .within(() => {
        // Check that loading is finished
        cy.get('[data-test="upload-file-button"]').should(
          "not.have.class",
          "p-disabled",
        );
        cy.get('[data-test="drop-zone"]')
          .should("not.have.class", "cursor-wait")
          .and("have.text", "rooms.files.select_or_drag");
        cy.get('[data-test="progress-bar"]').should("not.exist");

        cy.get('[data-test="uploaded-file-message"]').should("have.length", 1);

        cy.get('[data-test="uploaded-file-message"]')
          .eq(0)
          .should("have.text", 'rooms.files.uploaded_{"name":"testFile.txt"}');

        cy.fixture("roomFiles.json").then((roomFiles) => {
          roomFiles.data.push({
            id: 4,
            filename: "testFile.txt",
            download: false,
            use_in_meeting: false,
            default: false,
            uploaded: "2020-09-21T07:10:00.000000Z",
          });
          roomFiles.data.push({
            id: 5,
            filename: "testFile2.txt",
            download: false,
            use_in_meeting: false,
            default: false,
            uploaded: "2020-09-21T07:10:00.000000Z",
          });
          roomFiles.meta.per_page = 5;
          roomFiles.meta.to = 5;
          roomFiles.meta.total = 5;
          roomFiles.meta.total_no_filter = 5;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
            statusCode: 200,
            body: roomFiles,
          }).as("roomFilesRequest");
        });

        // Upload another file
        cy.get("#file")
          .should("not.be.visible")
          .selectFile("tests/Frontend/fixtures/files/testFile2.txt", {
            force: true,
          });
      });

    // Check that file is uploaded correctly
    cy.wait("@uploadFileRequest").then((interception) => {
      const formData = parseFormData(
        interception.request.body,
        interception.request.headers,
      );
      const uploadedFile = formData.get("file");
      expect(uploadedFile.name).to.eql("testFile2.txt");
      expect(uploadedFile.type).to.eql("text/plain");
      cy.fixture("files/testFile2.txt", "base64").then((content) => {
        uploadedFile.arrayBuffer().then((arrayBuffer) => {
          const base64 = _arrayBufferToBase64(arrayBuffer);
          expect(content).to.eql(base64);
        });
      });
    });

    cy.wait("@roomFilesRequest");

    // Check that dialog stayed open and success message is shown
    cy.get('[data-test="room-files-upload-dialog"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-test="uploaded-file-message"]').should("have.length", 2);

        cy.get('[data-test="uploaded-file-message"]')
          .eq(0)
          .should("have.text", 'rooms.files.uploaded_{"name":"testFile.txt"}');
        cy.get('[data-test="uploaded-file-message"]')
          .eq(1)
          .should("have.text", 'rooms.files.uploaded_{"name":"testFile2.txt"}');

        // Close dialog
        cy.get('[data-test="dialog-header-close-button"]').click();
      });

    cy.get('[data-test="room-files-upload-dialog"]').should("not.exist");

    // Check that new files are shown correctly
    cy.get('[data-test="room-file-item"]').should("have.length", 5);

    cy.get('[data-test="room-file-item"]')
      .eq(3)
      .should("include.text", "testFile.txt");
    cy.get('[data-test="room-file-item"]')
      .eq(3)
      .should("include.text", "Sep 21, 2020, 09:10");
    cy.get('[data-test="room-file-item"]')
      .eq(3)
      .should("include.text", "rooms.files.download_hidden");
    cy.get('[data-test="room-file-item"]')
      .eq(3)
      .should("include.text", "rooms.files.use_in_next_meeting_disabled");

    cy.get('[data-test="room-file-item"]')
      .eq(4)
      .should("include.text", "testFile2.txt");
    cy.get('[data-test="room-file-item"]')
      .eq(4)
      .should("include.text", "Sep 21, 2020, 09:10");
    cy.get('[data-test="room-file-item"]')
      .eq(4)
      .should("include.text", "rooms.files.download_hidden");
    cy.get('[data-test="room-file-item"]')
      .eq(4)
      .should("include.text", "rooms.files.use_in_next_meeting_disabled");
  });

  it("upload file errors", function () {
    // Check 413 error (payload too large)
    cy.visit("/rooms/abc-def-123#tab=files");

    cy.wait("@roomFilesRequest");

    cy.get('[data-test="room-files-upload-button"]').click();
    cy.get('[data-test="room-files-upload-dialog"]').should("be.visible");

    cy.intercept("POST", "/api/v1/rooms/abc-def-123/files", {
      statusCode: 413,
    }).as("uploadFileRequest");

    cy.get('[data-test="room-files-upload-dialog"]')
      .find("#file")
      .selectFile("tests/Frontend/fixtures/files/testFile.txt", {
        force: true,
      });

    cy.wait("@uploadFileRequest");

    // Check that dialog stayed open and error message is shown
    cy.get('[data-test="room-files-upload-dialog"]')
      .should("be.visible")
      .and("include.text", "app.validation.too_large");

    // Check 422 error (validation error)
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/files", {
      statusCode: 422,
      body: {
        message: "The given data was invalid.",
        errors: {
          file: ["The File must be a file of type: pdf, doc."],
        },
      },
    }).as("uploadFileRequest");

    cy.get('[data-test="room-files-upload-dialog"]')
      .find("#file")
      .selectFile("tests/Frontend/fixtures/files/testFile.txt", {
        force: true,
      });

    cy.wait("@uploadFileRequest");

    // Check that dialog stayed open and error message is shown
    cy.get('[data-test="room-files-upload-dialog"]')
      .should("be.visible")
      .and("include.text", "The File must be a file of type: pdf, doc.");

    // Check other errors
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/files", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("uploadFileRequest");

    cy.get('[data-test="room-files-upload-dialog"]')
      .find("#file")
      .selectFile("tests/Frontend/fixtures/files/testFile.txt", {
        force: true,
      });

    cy.wait("@uploadFileRequest");

    // Check that dialog stayed open and error message is shown
    cy.get('[data-test="room-files-upload-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-header-close-button"]').click();

    // Check auth errors
    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-files-upload-button"]').click();
        cy.get('[data-test="room-files-upload-dialog"]')
          .should("be.visible")
          .find("#file")
          .selectFile("tests/Frontend/fixtures/files/testFile.txt", {
            force: true,
          });
      },
      "POST",
      "/api/v1/rooms/abc-def-123/files",
      "files",
    );
  });

  it("delete file", function () {
    cy.visit("/rooms/abc-def-123#tab=files");

    cy.wait("@roomFilesRequest");

    cy.get('[data-test="room-file-item"]').should("have.length", 3);

    cy.get('[data-test="room-files-delete-dialog"]').should("not.exist");
    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-delete-button"]')
      .click();
    cy.get('[data-test="room-files-delete-dialog"]')
      .should("be.visible")
      .should("include.text", "rooms.files.delete")
      .should(
        "include.text",
        'rooms.files.confirm_delete_{"filename":"File1.pdf"}',
      );

    const deleteFileRequest = interceptIndefinitely(
      "DELETE",
      "/api/v1/rooms/abc-def-123/files/1",
      {
        statusCode: 204,
      },
      "deleteFileRequest",
    );

    cy.fixture("roomFiles.json").then((roomFiles) => {
      roomFiles.data = roomFiles.data.slice(1, 3);
      roomFiles.meta.to = 2;
      roomFiles.meta.total = 2;
      roomFiles.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 200,
        body: roomFiles,
      }).as("roomFilesRequest");
    });

    cy.get('[data-test="room-files-delete-dialog"]')
      .find('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();

    cy.get('[data-test="room-files-delete-dialog"]')
      .find('[data-test="dialog-continue-button"]')
      .should("be.disabled");

    cy.get('[data-test="room-files-delete-dialog"]')
      .find('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .and("be.disabled")
      .then(() => {
        deleteFileRequest.sendResponse();
      });

    cy.wait("@deleteFileRequest");
    cy.wait("@roomFilesRequest");

    // Check that file was deleted
    cy.get('[data-test="room-file-item"]').should("have.length", 2);

    // Check that dialog is closed
    cy.get('[data-test="room-files-delete-dialog"]').should("not.exist");
  });

  it("delete file errors", function () {
    cy.visit("/rooms/abc-def-123#tab=files");

    cy.wait("@roomFilesRequest");

    // Check with 404 error (file not found / already deleted)
    cy.get('[data-test="room-file-item"]')
      .eq(2)
      .find('[data-test="room-files-delete-button"]')
      .click();
    cy.get('[data-test="room-files-delete-dialog"]').should("be.visible");

    cy.intercept("DELETE", "/api/v1/rooms/abc-def-123/files/3", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("deleteFileRequest");

    cy.fixture("roomFiles.json").then((roomFiles) => {
      roomFiles.data = roomFiles.data.slice(0, 2);
      roomFiles.meta.to = 2;
      roomFiles.meta.total = 2;
      roomFiles.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 200,
        body: roomFiles,
      }).as("roomFilesRequest");
    });

    cy.get('[data-test="room-files-delete-dialog"]')
      .find('[data-test="dialog-continue-button"]')
      .click();

    cy.wait("@deleteFileRequest");
    cy.wait("@roomFilesRequest");

    // Check that file is not shown anymore and dialog is closed
    cy.get('[data-test="room-files-delete-dialog"]').should("not.exist");
    cy.get('[data-test="room-file-item"]').should("have.length", 2);

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.file_gone");

    // Check with 500 error
    cy.get('[data-test="room-file-item"]')
      .eq(1)
      .find('[data-test="room-files-delete-button"]')
      .click();

    // Check that dialog is shown for the correct file
    cy.get('[data-test="room-files-delete-dialog"]')
      .should("be.visible")
      .should(
        "include.text",
        'rooms.files.confirm_delete_{"filename":"File2.pdf"}',
      );

    cy.intercept("DELETE", "/api/v1/rooms/abc-def-123/files/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("deleteFileRequest");

    cy.get('[data-test="room-files-delete-dialog"]')
      .find('[data-test="dialog-continue-button"]')
      .click();

    cy.wait("@deleteFileRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that dialog is still open and close it
    cy.get('[data-test="room-files-delete-dialog"]').should("be.visible");
    cy.get('[data-test="room-files-delete-dialog"]')
      .find('[data-test="dialog-cancel-button"]')
      .click();

    cy.get('[data-test="room-files-delete-dialog"]').should("not.exist");

    // Check auth errors
    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-file-item"]')
          .eq(0)
          .find('[data-test="room-files-delete-button"]')
          .click();
        cy.get('[data-test="room-files-delete-dialog"]')
          .should("be.visible")
          .find('[data-test="dialog-continue-button"]')
          .click();
      },
      "DELETE",
      "/api/v1/rooms/abc-def-123/files/1",
      "files",
    );
  });

  it("change file settings", function () {
    cy.visit("/rooms/abc-def-123#tab=files");

    cy.wait("@roomFilesRequest");

    cy.get('[data-test="room-files-edit-dialog"]').should("not.exist");
    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-edit-button"]')
      .click();

    cy.get('[data-test="room-files-edit-dialog"]')
      .should("be.visible")
      .and("include.text", "rooms.files.edit")
      .within(() => {
        cy.get('[data-test="download-field"]')
          .should("include.text", "rooms.files.downloadable")
          .find("#download")
          .should("be.checked")
          .click();

        cy.get('[data-test="use-in-meeting-field"]')
          .should("include.text", "rooms.files.use_in_next_meeting")
          .find("#use_in_meeting")
          .should("not.be.checked")
          .click();

        cy.get('[data-test="default-field"]')
          .should("include.text", "rooms.files.default")
          .find("#default")
          .should("not.be.checked")
          .click();

        const editFileRequest = interceptIndefinitely(
          "PUT",
          "/api/v1/rooms/abc-def-123/files/1",
          {
            statusCode: 204,
          },
          "editFileRequest",
        );

        cy.fixture("roomFiles.json").then((roomFiles) => {
          roomFiles.data[0].download = false;
          roomFiles.data[0].use_in_meeting = true;
          roomFiles.data[0].default = true;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
            statusCode: 200,
            body: roomFiles,
          }).as("roomFilesRequest");
        });

        cy.get('[data-test="dialog-save-button"]')
          .should("have.text", "app.save")
          .click();

        // Check loading
        cy.get('[data-test="dialog-save-button"]').should("be.disabled");

        cy.get("#download").should("be.disabled");
        cy.get("#use_in_meeting").should("be.disabled");
        cy.get("#default").should("be.disabled");

        cy.get('[data-test="dialog-cancel-button"]')
          .should("have.text", "app.cancel")
          .and("be.disabled")
          .then(() => {
            editFileRequest.sendResponse();
          });
      });

    cy.wait("@editFileRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        default: true,
        download: false,
        use_in_meeting: true,
      });
    });
    cy.wait("@roomFilesRequest");

    cy.get('[data-test="room-files-edit-dialog"]').should("not.exist");

    // Check that file settings were changed
    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .should("include.text", "rooms.files.download_hidden")
      .and("include.text", "rooms.files.use_in_next_meeting")
      .and("not.include.text", "rooms.files.download_visible")
      .and("not.include.text", "rooms.files.use_in_next_meeting_disabled");
  });

  it("change file settings errors", function () {
    cy.visit("/rooms/abc-def-123#tab=files");

    cy.wait("@roomFilesRequest");

    // Check with 404 error (file not found / already deleted)
    cy.get('[data-test="room-file-item"]')
      .eq(2)
      .find('[data-test="room-files-edit-button"]')
      .click();
    cy.get('[data-test="room-files-edit-dialog"]').should("be.visible");

    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/files/3", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("editFileRequest");

    cy.fixture("roomFiles.json").then((roomFiles) => {
      roomFiles.data = roomFiles.data.slice(0, 2);
      roomFiles.meta.to = 2;
      roomFiles.meta.total = 2;
      roomFiles.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 200,
        body: roomFiles,
      }).as("roomFilesRequest");
    });

    cy.get('[data-test="room-files-edit-dialog"]')
      .find('[data-test="dialog-save-button"]')
      .click();

    cy.wait("@editFileRequest");
    cy.wait("@roomFilesRequest");

    // Check that file is not shown anymore and dialog is closed
    cy.get('[data-test="room-files-edit-dialog"]').should("not.exist");
    cy.get('[data-test="room-file-item"]').should("have.length", 2);

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.file_gone");

    // Check with 422 error
    cy.get('[data-test="room-file-item"]')
      .eq(1)
      .find('[data-test="room-files-edit-button"]')
      .click();
    cy.get('[data-test="room-files-edit-dialog"]').should("be.visible");

    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/files/2", {
      statusCode: 422,
      body: {
        errors: {
          download: ["The Downloadable field is required."],
          use_in_meeting: ["The Use in the next meeting field is required."],
          default: ["The Default field is required."],
        },
      },
    }).as("editFileRequest");

    cy.get('[data-test="room-files-edit-dialog"]')
      .find('[data-test="dialog-save-button"]')
      .click();

    cy.wait("@editFileRequest");

    // Check that dialog stayed open and error message is shown
    cy.get('[data-test="room-files-edit-dialog"]')
      .should("be.visible")
      .and("include.text", "The Downloadable field is required.")
      .and("include.text", "The Use in the next meeting field is required.")
      .and("include.text", "The Default field is required.");

    // Check with 500 error
    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/files/2", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("editFileRequest");

    cy.get('[data-test="room-files-edit-dialog"]')
      .find('[data-test="dialog-save-button"]')
      .click();

    cy.wait("@editFileRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that dialog is still open and close it
    cy.get('[data-test="room-files-edit-dialog"]').should("be.visible");
    cy.get('[data-test="room-files-edit-dialog"]')
      .find('[data-test="dialog-cancel-button"]')
      .click();

    cy.get('[data-test="room-files-edit-dialog"]').should("not.exist");

    // Check auth errors
    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-file-item"]')
          .eq(0)
          .find('[data-test="room-files-edit-button"]')
          .click();
        cy.get('[data-test="room-files-edit-dialog"]')
          .should("be.visible")
          .find('[data-test="dialog-save-button"]')
          .click();
      },
      "PUT",
      "/api/v1/rooms/abc-def-123/files/1",
      "files",
    );
  });

  it("download file", function () {
    cy.visit("/rooms/abc-def-123#tab=files");

    cy.wait("@roomFilesRequest");

    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/1", {
      statusCode: 200,
      body: {
        url: "https://example.org/?foo=a&bar=b",
      },
    }).as("downloadFileRequest");

    // Stub window.open to check if correct url is opened
    cy.window().then((win) => {
      cy.stub(win, "open").as("fileDownload").returns(true);
    });

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest");

    cy.get("@fileDownload")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");

    // Reload as guest and with terms of use
    cy.fixture("config.json").then((config) => {
      config.data.room.file_terms_of_use = "Test terms of use";

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.wait("@roomFilesRequest");

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    // Check that require terms of use info is shown
    cy.get('[data-test="terms-of-use-required-info"]')
      .should("be.visible")
      .and("have.text", "rooms.files.terms_of_use.required");

    // Stub window.open to check if correct url is opened
    cy.window().then((win) => {
      cy.stub(win, "open").as("secondFileDownload").returns(true);
    });

    cy.get('[data-test="terms-of-use-message"]').find("#terms_of_use").click();

    cy.get('[data-test="terms-of-use-required-info"]').should("not.exist");

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest");

    cy.get("@secondFileDownload")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");

    cy.get('[data-test="terms-of-use-required-info"]').should("not.exist");
  });

  it("download file with access code", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.interceptRoomFilesRequest();

    cy.visit("/rooms/abc-def-123");

    // Type in access code to get access to the room
    cy.wait("@roomRequest");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");
    cy.wait("@roomFilesRequest");

    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/1", {
      statusCode: 200,
      body: {
        url: "https://example.org/?foo=a&bar=b",
      },
    }).as("downloadFileRequest");

    // Stub window.open to check if correct url is opened
    cy.window().then((win) => {
      cy.stub(win, "open").as("fileDownload").returns(true);
    });

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });
    cy.get("@fileDownload")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");
  });

  it("download file with access code errors", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.interceptRoomFilesRequest();

    cy.visit("/rooms/abc-def-123");

    // Type in access code to get access to the room
    cy.wait("@roomRequest");
    cy.get("#access-code").type("123456789");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");
    cy.wait("@roomFilesRequest");

    // Check with invalid_code error
    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/1", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("downloadFileRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check that access code header is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-login-button"]').click();

    cy.wait("@roomRequest");
    cy.wait("@roomFilesRequest");

    // Check require_code error
    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/1", {
      statusCode: 403,
      body: {
        message: "require_code",
      },
    }).as("downloadFileRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest").then((interception) => {
      // Check that header for access code is set
      expect(interception.request.headers["access-code"]).to.eq("123456789");
    });

    // Check that access code header is reset
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.headers["access-code"]).to.be.undefined;
    });

    // Check if error message is shown and close it
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");
  });

  it("download file with token", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.interceptRoomFilesRequest();

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomRequest");

    cy.wait("@roomFilesRequest");

    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/1", {
      statusCode: 200,
      body: {
        url: "https://example.org/?foo=a&bar=b",
      },
    }).as("downloadFileRequest");

    // Stub window.open to check if correct url is opened
    cy.window().then((win) => {
      cy.stub(win, "open").as("fileDownload").returns(true);
    });

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest").then((interception) => {
      // Check that header for token is set
      expect(interception.request.headers.token).to.eq(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    cy.get("@fileDownload")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");
  });

  it("download file with token errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    // Visit room with token
    cy.visit(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    cy.wait("@roomRequest");
    cy.wait("@roomFilesRequest");

    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/1", {
      statusCode: 401,
      body: {
        message: "invalid_token",
      },
    }).as("downloadFileRequest");

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest");

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.token_invalid");

    cy.contains("rooms.invalid_personal_link").should("be.visible");
  });

  it("download file errors", function () {
    cy.fixture("config.json").then((config) => {
      config.data.room.file_terms_of_use = "Test terms of use";

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/rooms/abc-def-123#tab=files");

    cy.wait("@roomFilesRequest");

    // Check with browser blocking download
    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/1", {
      statusCode: 200,
      body: {
        url: "https://example.org/?foo=a&bar=b",
      },
    }).as("downloadFileRequest");

    // Stub window open to simulate browser blocking download
    cy.window().then((win) => {
      cy.stub(win, "open").as("fileDownload").returns(false);
    });

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest");

    cy.get("@fileDownload")
      .should("be.calledOnce")
      .and("be.calledWith", "https://example.org/?foo=a&bar=b", "_blank");

    // Check toast message is shown (browser is blocking download)
    cy.checkToastMessage("app.flash.popup_blocked");

    // Check with 404 error (file not found / already deleted)
    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/1", {
      statusCode: 404,
      body: {
        message: "No query results for model",
      },
    }).as("downloadFileRequest");

    cy.fixture("roomFiles.json").then((roomFiles) => {
      roomFiles.data = roomFiles.data.slice(1, 3);
      roomFiles.meta.to = 2;
      roomFiles.meta.total = 2;
      roomFiles.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 200,
        body: roomFiles,
      }).as("roomFilesRequest");
    });

    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest");
    cy.wait("@roomFilesRequest");

    // Check that error message is shown and that file is not shown anymore
    cy.checkToastMessage("rooms.flash.file_gone");
    cy.get('[data-test="room-file-item"]').should("have.length", 2);

    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/3", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("downloadFileRequest");

    cy.get('[data-test="room-file-item"]')
      .eq(1)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest");

    // Check that error message gets shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check 403 error
    cy.intercept("GET", "/api/v1/rooms/abc-def-123/files/3", {
      statusCode: 403,
      body: {
        message: "This action is unauthorized.",
      },
    }).as("downloadFileRequest");

    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("reloadRoomRequest");
    });

    cy.get('[data-test="room-file-item"]')
      .eq(1)
      .find('[data-test="room-files-view-button"]')
      .click();

    cy.wait("@downloadFileRequest");
    cy.wait("@reloadRoomRequest");
    cy.wait("@roomFilesRequest");

    cy.checkToastMessage("rooms.flash.file_forbidden");
    cy.contains("auth.login").should("be.visible");

    // Check that action buttons are hidden and download agreement message is shown
    cy.get('[data-test="room-files-upload-button"]').should("not.exist");
    cy.get('[data-test="terms-of-use-message"]').should("be.visible");
    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-view-button"]')
      .should("not.be.disabled");
    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-edit-button"]')
      .should("not.exist");
    cy.get('[data-test="room-file-item"]')
      .eq(0)
      .find('[data-test="room-files-delete-button"]')
      .should("not.exist");

    cy.get('[data-test="room-file-item"]')
      .eq(1)
      .find('[data-test="room-files-view-button"]')
      .should("not.be.disabled");
    cy.get('[data-test="room-file-item"]')
      .eq(1)
      .find('[data-test="room-files-edit-button"]')
      .should("not.exist");
    cy.get('[data-test="room-file-item"]')
      .eq(1)
      .find('[data-test="room-files-delete-button"]')
      .should("not.exist");
  });
});
