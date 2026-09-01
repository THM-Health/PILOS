import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

Cypress._.times(20, () => {
  describe("Rooms View Files", function () {
    beforeEach(function () {
      cy.init();
      cy.interceptRoomViewRequests();
      cy.interceptRoomFilesRequest(true);

      cy.setValidRememberedParticipantName("Laura Rivera");
    });

    it("load files", function () {
      const roomFileRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123/files*",
        { fixture: "roomFiles.json" },
        "roomFilesRequest",
      );

      cy.visit("/rooms/abc-def-123");

      cy.get("#tab-files").click();

      cy.url().should("include", "/rooms/abc-def-123#tab=files");

      // Check loading
      cy.get('[data-test="overlay"]').should("be.visible");

      cy.get('[data-test="room-files-search"]').within(() => {
        cy.get("input").should("be.disabled");
        cy.get("button").should("be.disabled");
      });

      cy.get('[data-test="filter-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "true");
      });

      cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
        cy.get('[data-test="sorting-type-dropdown"]').within(() => {
          cy.get(".p-select-label").should(
            "have.attr",
            "aria-disabled",
            "true",
          );
        });

        cy.get("button").should("be.disabled");
      });

      cy.get('[data-test="room-files-upload-button"]').should("be.disabled");

      cy.get('[data-test="room-files-reload-button"]')
        .should("be.disabled")
        .then(() => {
          roomFileRequest.sendResponse();
        });

      cy.wait("@roomFilesRequest");

      cy.get('[data-test="overlay"]').should("not.exist");

      // Check that loading is done
      cy.get('[data-test="room-files-search"]').within(() => {
        cy.get("input").should("not.be.disabled");
        cy.get("button").should("not.be.disabled");
      });

      cy.get('[data-test="filter-dropdown"]').within(() => {
        cy.get(".p-select-label").should("have.attr", "aria-disabled", "false");
      });

      cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
        cy.get('[data-test="sorting-type-dropdown"]').within(() => {
          cy.get(".p-select-label").should(
            "have.attr",
            "aria-disabled",
            "false",
          );
        });

        cy.get("button").should("not.be.disabled");
      });

      cy.get('[data-test="room-files-upload-button"]').should(
        "not.be.disabled",
      );
      cy.get('[data-test="room-files-reload-button"]').should(
        "not.be.disabled",
      );

      // Check files
      cy.get('[data-test="room-file-item"]').should("have.length", 3);

      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf")
        .and("include.text", "Sep 21, 2020, 09:08")
        .and("include.text", "rooms.files.download_visible")
        .and("include.text", "rooms.files.use_in_next_meeting_disabled")
        .find('a[data-test="room-files-view-button"]')
        .should(
          "have.attr",
          "href",
          "https://example.com/files/File1.pdf?signature=abc123",
        )
        .and("have.attr", "rel", "opener")
        .and("have.attr", "target", "_blank");

      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "File2.pdf")
        .and("include.text", "Sep 21, 2020, 09:08")
        .and("include.text", "rooms.files.download_visible")
        .and("include.text", "rooms.files.use_in_next_meeting")
        .find('a[data-test="room-files-view-button"]')
        .should(
          "have.attr",
          "href",
          "https://example.com/files/File2.pdf?signature=def456",
        )
        .and("have.attr", "rel", "opener")
        .and("have.attr", "target", "_blank");

      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .should("include.text", "File3.pdf")
        .and("include.text", "Sep 21, 2020, 09:09")
        .and("include.text", "rooms.files.download_hidden")
        .and("include.text", "rooms.files.use_in_next_meeting_disabled")
        .find('a[data-test="room-files-view-button"]')
        .should(
          "have.attr",
          "href",
          "https://example.com/files/File3.pdf?signature=ghi789",
        )
        .and("have.attr", "rel", "opener")
        .and("have.attr", "target", "_blank");

      // Reload file list
      const roomFileReloadRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123/files*",
        { fixture: "roomFiles.json" },
        "roomFilesReloadRequest",
      );
      cy.get('[data-test="room-files-reload-button"]').click();

      // Check loading overlay shown during loading
      cy.get('[data-test="overlay"]').should("be.visible");

      // Check view button is disabled during loading
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('button[data-test="room-files-view-button"]')
        .should("be.disabled");

      // Check edit button is disabled during loading
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('[data-test="room-files-edit-button"]')
        .should("be.disabled");

      // Check delete button is disabled during loading
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('button[data-test="room-files-delete-button"]')
        .should("be.disabled")
        .then(() => {
          roomFileReloadRequest.sendResponse();
        });

      // Check overlay is hidden after loading
      cy.get('[data-test="overlay"]').should("not.exist");

      // Check view button is enabled after loading
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('a[data-test="room-files-view-button"]')
        .should(
          "have.attr",
          "href",
          "https://example.com/files/File1.pdf?signature=abc123",
        );

      // Check edit button is enabled after loading
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('[data-test="room-files-edit-button"]')
        .should("not.be.disabled");

      // Check delete button is enabled after loading
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('button[data-test="room-files-delete-button"]')
        .should("not.be.disabled");
    });

    it("load files with access code", function () {
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 0,
          },
        },
      }).as("roomAuthRequest");

      cy.fixture("room.json").then((room) => {
        room.data.owner = { id: 2, name: "Max Doe" };

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.interceptRoomFilesRequest();

      cy.visit("/rooms/abc-def-123#accessCode=123456789");

      cy.wait("@roomAuthRequest");
      cy.wait("@roomRequest");

      cy.wait("@roomFilesRequest").then((interception) => {
        // Check that room auth token is set
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "0",
        });
      });

      cy.contains("rooms.files.title").should("be.visible");

      cy.get('[data-test="room-files-upload-button"]').should("not.exist");

      // Check that files are shown correctly
      cy.get('[data-test="room-file-item"]').should("have.length", 2);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf")
        .and("include.text", "Sep 21, 2020, 09:08")
        .and("not.include.text", "rooms.files.download_visible")
        .and("not.include.text", "rooms.files.use_in_next_meeting_disabled")
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled")
        .and(
          "have.attr",
          "href",
          "https://example.com/files/File1.pdf?signature=abc123&room_auth_token=roomAuthToken&room_auth_token_type=0",
        )
        .and("have.attr", "rel", "opener")
        .and("have.attr", "target", "_blank");
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
        .should("include.text", "File2.pdf")
        .and("include.text", "Sep 21, 2020, 09:08")
        .and("not.include.text", "rooms.files.download_visible")
        .and("not.include.text", "rooms.files.use_in_next_meeting")
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled")
        .and(
          "have.attr",
          "href",
          "https://example.com/files/File2.pdf?signature=def456&room_auth_token=roomAuthToken&room_auth_token_type=0",
        )
        .and("have.attr", "rel", "opener")
        .and("have.attr", "target", "_blank");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-edit-button"]')
        .should("not.exist");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-delete-button"]')
        .should("not.exist");
    });

    it("load files with access code errors", function () {
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 0,
          },
        },
      }).as("roomAuthRequest");

      cy.fixture("room.json").then((room1) => {
        room1.data.owner = { id: 2, name: "Max Doe" };

        const firstRoomRequest = interceptIndefinitely(
          "GET",
          "api/v1/rooms/abc-def-123*",
          {
            statusCode: 200,
            body: room1,
          },
          "roomRequest",
        );

        cy.visit("/rooms/abc-def-123#accessCode=123456789");
        cy.wait("@roomAuthRequest");

        cy.fixture("room.json").then((room2) => {
          room2.data.owner = { id: 2, name: "Max Doe" };
          room2.data.authenticated = false;

          cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
            statusCode: 200,
            body: room2,
          })
            .as("roomRequest")
            .then(() => {
              firstRoomRequest.sendResponse();
            });
        });
      });

      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 401,
        body: {
          message: "invalid_auth_token",
        },
      }).as("roomFilesRequest");

      cy.wait("@roomRequest");

      cy.wait("@roomFilesRequest").then((interception) => {
        // Check that room auth token is set
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "0",
        });
      });

      cy.wait("@roomRequest").then((interception) => {
        // Check that room auth token is reset
        expect(interception.request.query.room_auth_token).to.be.undefined;
        expect(interception.request.query.room_auth_token_type).to.be.undefined;
      });

      // Check if error message is shown and close it
      cy.checkToastMessage("rooms.flash.access_code_invalid");

      cy.contains("rooms.flash.access_code_invalid").should("be.visible");

      // Test require_code
      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 403,
        body: {
          message: "require_code",
        },
      }).as("roomFilesRequest");

      cy.fixture("room.json").then((room1) => {
        room1.data.owner = { id: 2, name: "Max Doe" };

        const firstRoomRequest = interceptIndefinitely(
          "GET",
          "api/v1/rooms/abc-def-123*",
          {
            statusCode: 200,
            body: room1,
          },
          "roomRequest",
        );

        // Reload room to trigger files request again (but without setting room auth token)
        cy.get('[data-test="reload-room-button"]').click();

        cy.fixture("room.json").then((room2) => {
          room2.data.owner = { id: 2, name: "Max Doe" };
          room2.data.authenticated = false;

          cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
            statusCode: 200,
            body: room2,
          })
            .as("roomRequest")
            .then(() => {
              firstRoomRequest.sendResponse();
            });
        });
      });

      cy.wait("@roomRequest");

      cy.wait("@roomFilesRequest").then((interception) => {
        // Check that room auth token is not set
        expect(interception.request.query.room_auth_token).to.be.undefined;
        expect(interception.request.query.room_auth_token_type).to.be.undefined;
      });

      cy.wait("@roomRequest").then((interception) => {
        // Check that room auth token is not set
        expect(interception.request.query.room_auth_token).to.be.undefined;
        expect(interception.request.query.room_auth_token_type).to.be.undefined;
      });

      // Check if error message is shown
      cy.checkToastMessage("rooms.require_access_code");

      cy.contains("rooms.flash.access_code_invalid").should("not.exist");
      cy.get("#access-code").should("have.value", "");
    });

    it("load files with personalized link", function () {
      cy.intercept("GET", "api/v1/currentUser", {});
      cy.fixture("room.json").then((room) => {
        room.data.username = "Max Doe";
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 1,
          },
        },
      }).as("roomAuthRequest");

      cy.interceptRoomFilesRequest();

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest");
      cy.wait("@roomRequest");

      cy.wait("@roomFilesRequest").then((interception) => {
        // Check that room auth token is set
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      cy.contains("rooms.files.title").should("be.visible");
      cy.get('[data-test="room-files-upload-button"]').should("not.exist");

      // Check that files are shown correctly
      cy.get('[data-test="room-file-item"]').should("have.length", 2);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf")
        .and("include.text", "Sep 21, 2020, 03:08")
        .and("not.include.text", "rooms.files.download_visible")
        .and("not.include.text", "rooms.files.use_in_next_meeting_disabled")
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled")
        .and(
          "have.attr",
          "href",
          "https://example.com/files/File1.pdf?signature=abc123&room_auth_token=roomAuthToken&room_auth_token_type=1",
        )
        .and("have.attr", "rel", "opener")
        .and("have.attr", "target", "_blank");
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
        .should("include.text", "File2.pdf")
        .and("include.text", "Sep 21, 2020, 03:08")
        .and("not.include.text", "rooms.files.download_visible")
        .and("not.include.text", "rooms.files.use_in_next_meeting")
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled")
        .and(
          "have.attr",
          "href",
          "https://example.com/files/File2.pdf?signature=def456&room_auth_token=roomAuthToken&room_auth_token_type=1",
        )
        .and("have.attr", "rel", "opener")
        .and("have.attr", "target", "_blank");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-edit-button"]')
        .should("not.exist");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-delete-button"]')
        .should("not.exist");
    });

    it.only("load files with personalized link errors", function () {
      cy.intercept("GET", "api/v1/currentUser", {});
      cy.fixture("room.json").then((room) => {
        room.data.username = "Max Doe";
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 1,
          },
        },
      }).as("roomAuthRequest");

      const fileRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123/files*",
        {
          statusCode: 401,
          body: {
            message: "invalid_auth_token",
          },
        },
        "roomFilesRequest",
      );

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest").then(() => {
        cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
          statusCode: 401,
          body: {
            message: "invalid_personalized_link",
          },
        }).as("roomAuthRequest");

        fileRequest.sendResponse();
      });
      cy.wait("@roomRequest");
      cy.wait("@roomFilesRequest");
      cy.wait("@roomAuthRequest");

      // Check that sessionStorage is cleared
      cy.window().should((win) => {
        expect(win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"))
          .to.be.null;
      });

      // Check that error message is shown and url changed
      cy.checkToastMessage("rooms.flash.personalized_link_invalid");
      cy.contains("rooms.invalid_personalized_link").should("be.visible");

      cy.url().should(
        "include",
        "/rooms/abc-def-123/invalid_personalized_link",
      );

      // Check with guests only error
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 1,
          },
        },
      }).as("roomAuthRequest");

      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 420,
        body: {
          message: "guests_only",
        },
      }).as("roomFilesRequest");

      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest");
      cy.wait("@roomRequest");
      cy.wait("@roomFilesRequest");

      // Check that the error message is shown
      cy.checkToastMessage("app.flash.guests_only");

      // Check that redirected to home page
      cy.url()
        .should("not.include", "/rooms/abc-def-123")
        .and("not.include", "/rooms");
    });

    it("load files errors", function () {
      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 500,
        body: {
          message: "Test",
        },
      }).as("roomFilesRequest");

      cy.visit("/rooms/abc-def-123#tab=files");
      cy.wait("@roomFilesRequest");

      // Check that overlay is shown
      cy.get('[data-test="overlay"]').should("be.visible");

      // Check that error message gets shown
      cy.checkToastMessage([
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that components are not disabled
      cy.get('[data-test="room-files-search"]').within(() => {
        cy.get("input").should("not.be.disabled");
        cy.get("button").should("not.be.disabled");
      });

      cy.get('[data-test="filter-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
        cy.get('[data-test="sorting-type-dropdown"]').within(() => {
          cy.get(".p-select-label").should(
            "not.have.attr",
            "aria-disabled",
            "true",
          );
        });

        cy.get("button").should("not.be.disabled");
      });

      cy.get('[data-test="room-files-reload-button"]').should(
        "not.be.disabled",
      );

      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(0, 1);
        roomFiles.meta.last_page = 3;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.to = 1;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      // Check if reload button exists and click it
      cy.get('[data-test="loading-retry-button"]')
        .should("include.text", "app.reload")
        .click();
      cy.wait("@roomFilesRequest");

      // Check that overlay is hidden
      cy.get('[data-test="overlay"]').should("not.exist");
      cy.get('[data-test="loading-retry-button"]').should("not.exist");

      // Check if file is shown and contains the correct data
      cy.get('[data-test="room-file-item"]').should("have.length", 1);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");

      // Switch to next page with general error
      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 500,
        body: {
          message: "Test",
        },
      }).as("roomFilesRequest");

      cy.get('[data-test="paginator-next-button"]').eq(1).click();
      cy.wait("@roomFilesRequest");

      // Check that error message gets shown
      cy.checkToastMessage([
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that components are not disabled
      cy.get('[data-test="room-files-search"]').within(() => {
        cy.get("input").should("not.be.disabled");
        cy.get("button").should("not.be.disabled");
      });

      cy.get('[data-test="filter-dropdown"]').within(() => {
        cy.get(".p-select-label").should(
          "not.have.attr",
          "aria-disabled",
          "true",
        );
      });

      cy.get('[data-test="sorting-type-inputgroup"]').within(() => {
        cy.get('[data-test="sorting-type-dropdown"]').within(() => {
          cy.get(".p-select-label").should(
            "not.have.attr",
            "aria-disabled",
            "true",
          );
        });

        cy.get("button").should("not.be.disabled");
      });

      cy.get('[data-test="room-files-reload-button"]').should(
        "not.be.disabled",
      );

      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(0, 1);
        roomFiles.meta.last_page = 3;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.to = 1;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      // Check if reload button exists and click it
      cy.get('[data-test="overlay"]').should("be.visible");
      cy.get('[data-test="loading-retry-button"]')
        .should("include.text", "app.reload")
        .click();

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          page: "1",
        });
      });

      // Check if file is shown and contains the correct data
      cy.get('[data-test="room-file-item"]').should("have.length", 1);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");

      // Check that reload button does not exist
      cy.get('[data-test="overlay"]').should("not.exist");
      cy.get('[data-test="loading-retry-button"]').should("not.exist");

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(0)
        .should("have.attr", "data-p-active", "true");

      // Check with 404 error (room not found) as authenticated user
      cy.interceptRoomIndexRequests();

      cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
        statusCode: 404,
        body: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      }).as("roomFilesRequest");

      cy.reload();
      cy.wait("@roomFilesRequest");

      // Check that redirect to room index page worked
      cy.url()
        .should("include", "/rooms")
        .and("not.include", "/rooms/abc-def-123");

      // Check that error message gets shown
      cy.checkToastMessage([
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);

      // Check with 404 error (room not found) as guest
      cy.intercept("GET", "api/v1/currentUser", { data: [] });
      cy.fixture("room.json").then((room) => {
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.visit("/rooms/abc-def-123#tab=files");

      cy.wait("@roomFilesRequest");

      // Check that redirect to 404 page worked
      cy.url()
        .should("include", "/404")
        .and("not.include", "/rooms/abc-def-123");

      // Check that error message gets shown
      cy.checkToastMessage([
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });

    it("load files page out of range", function () {
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(0, 1);
        roomFiles.data[0].role = 3;
        roomFiles.meta.last_page = 2;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.to = 1;
        roomFiles.meta.total = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.visit("/rooms/abc-def-123#tab=files");

      cy.wait("@roomFilesRequest");

      // Switch to next page but respond with no room files on second page
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = [];
        roomFiles.meta.current_page = 2;
        roomFiles.meta.from = null;
        roomFiles.meta.per_page = 2;
        roomFiles.meta.to = null;
        roomFiles.meta.total = 2;
        roomFiles.meta.total_no_filter = 2;

        const emptyRoomFilesRequest = interceptIndefinitely(
          "GET",
          "api/v1/rooms/abc-def-123/files*",
          {
            statusCode: 200,
            body: roomFiles,
          },
          "roomFilesRequest",
        );

        cy.get('[data-test="paginator-next-button"]').eq(1).click();

        cy.fixture("roomFiles.json").then((roomFiles) => {
          roomFiles.data = roomFiles.data.slice(0, 2);
          roomFiles.meta.per_page = 2;
          roomFiles.meta.to = 2;
          roomFiles.meta.total = 2;
          roomFiles.meta.total_no_filter = 2;

          cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
            statusCode: 200,
            body: roomFiles,
          })
            .as("roomFilesRequest")
            .then(() => {
              emptyRoomFilesRequest.sendResponse();
            });
        });
      });

      // Wait for first room request and check that page is still the same
      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          page: "2",
        });
      });

      // Wait for second room request and check that page is reset
      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          page: "1",
        });
      });
    });

    it("view with different permissions", function () {
      // Check view for guest without terms of use
      cy.intercept("GET", "api/v1/currentUser", { data: [] });
      cy.fixture("room.json").then((room) => {
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.interceptRoomFilesRequest();

      cy.visit("/rooms/abc-def-123");
      cy.wait("@roomRequest");

      cy.wait("@roomFilesRequest");

      cy.get('[data-test="room-files-upload-button"]').should("not.exist");

      // Check that download agreement is hidden
      cy.get('[data-test="-message"]').should("not.exist");

      // Check that files are shown correctly and buttons are enabled or hidden
      cy.get('[data-test="room-file-item"]').should("have.length", 2);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "Sep 21, 2020, 03:08");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("not.include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("not.include.text", "rooms.files.use_in_next_meeting_disabled");
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
        .should("include.text", "File2.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "Sep 21, 2020, 03:08");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("not.include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("not.include.text", "rooms.files.use_in_next_meeting");
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

      // Check view with rooms.viewAll permission without terms of use
      cy.fixture("currentUser.json").then((currentUser) => {
        currentUser.data.permissions = ["rooms.viewAll"];
        cy.intercept("GET", "api/v1/currentUser", {
          statusCode: 200,
          body: currentUser,
        });
      });

      cy.fixture("room.json").then((room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = ["rooms.viewAll"];

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.reload();
      cy.wait("@roomRequest");
      cy.get("#tab-files").click();
      cy.wait("@roomFilesRequest");

      // Check that files are shown correctly
      cy.get('[data-test="room-files-upload-button"]').should("not.exist");
      // Check that download agreement is hidden
      cy.get('[data-test="terms-of-use-message"]').should("not.exist");

      // Check that files are shown correctly and buttons are enabled or hidden
      cy.get('[data-test="room-file-item"]').should("have.length", 2);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "Sep 21, 2020, 09:08");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("not.include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("not.include.text", "rooms.files.use_in_next_meeting_disabled");
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
        .should("include.text", "File2.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "Sep 21, 2020, 09:08");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("not.include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("not.include.text", "rooms.files.use_in_next_meeting");
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

      // Reload with terms of use
      cy.fixture("config.json").then((config) => {
        config.data.room.file_terms_of_use = "Test terms of use";

        cy.intercept("GET", "api/v1/config", {
          statusCode: 200,
          body: config,
        });
      });

      // Check view for guest with terms of use
      cy.intercept("GET", "api/v1/currentUser", { data: [] });
      cy.fixture("room.json").then((room) => {
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.interceptRoomFilesRequest();

      cy.reload();
      cy.wait("@roomRequest");

      cy.wait("@roomFilesRequest");

      cy.get('[data-test="room-files-upload-button"]').should("not.exist");

      // Check that download agreement is shown
      cy.get('[data-test="terms-of-use-message"]').should("be.visible");
      cy.get('[data-test="terms-of-use-message"]').should(
        "include.text",
        "rooms.files.terms_of_use.title",
      );
      cy.get('[data-test="terms-of-use-message"]').should(
        "include.text",
        "Test terms of use",
      );
      cy.get('[data-test="terms-of-use-message"]').should(
        "include.text",
        "rooms.files.terms_of_use.accept",
      );
      cy.get('[data-test="terms-of-use-message"]')
        .find("#terms_of_use")
        .should("not.be.checked");

      // Check that files are shown correctly and buttons are enabled or hidden
      cy.get('[data-test="room-file-item"]').should("have.length", 2);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "Sep 21, 2020, 03:08");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("not.include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("not.include.text", "rooms.files.use_in_next_meeting_disabled");
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
        .should("include.text", "File2.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "Sep 21, 2020, 03:08");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("not.include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("not.include.text", "rooms.files.use_in_next_meeting");
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

      // Accept terms of use
      cy.get("#terms_of_use").click();
      cy.get('[data-test="terms-of-use-required-info"]').should("not.exist");

      cy.get('[data-test="terms-of-use-message"]')
        .contains("Test terms of use")
        .should("not.be.visible");
      cy.get("#terms_of_use").should("not.be.visible");

      // Check view with rooms.viewAll permission with terms of use
      cy.fixture("currentUser.json").then((currentUser) => {
        currentUser.data.permissions = ["rooms.viewAll"];
        cy.intercept("GET", "api/v1/currentUser", {
          statusCode: 200,
          body: currentUser,
        });
      });

      cy.fixture("room.json").then((room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = ["rooms.viewAll"];

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.reload();
      cy.wait("@roomRequest");
      cy.get("#tab-files").click();
      cy.wait("@roomFilesRequest");

      // Check that files are shown correctly
      cy.get('[data-test="room-files-upload-button"]').should("not.exist");
      // Check that download agreement is shown
      cy.get('[data-test="terms-of-use-message"]').should("be.visible");
      cy.get('[data-test="terms-of-use-message"]').should(
        "include.text",
        "rooms.files.terms_of_use.title",
      );
      cy.get('[data-test="terms-of-use-message"]').should(
        "include.text",
        "Test terms of use",
      );
      cy.get('[data-test="terms-of-use-message"]').should(
        "include.text",
        "rooms.files.terms_of_use.accept",
      );
      cy.get('[data-test="terms-of-use-message"]')
        .find("#terms_of_use")
        .should("not.be.checked");

      // Check that files are shown correctly and buttons are enabled or hidden
      cy.get('[data-test="room-file-item"]').should("have.length", 2);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "Sep 21, 2020, 09:08");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("not.include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("not.include.text", "rooms.files.use_in_next_meeting_disabled");
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
        .should("include.text", "File2.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "Sep 21, 2020, 09:08");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("not.include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("not.include.text", "rooms.files.use_in_next_meeting");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-edit-button"]')
        .should("not.exist");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-delete-button"]')
        .should("not.exist");

      // Accept terms of use
      cy.get("#terms_of_use").click();
      cy.get('[data-test="terms-of-use-required-info"]').should("not.exist");

      cy.get('[data-test="terms-of-use-message"]')
        .contains("Test terms of use")
        .should("not.be.visible");
      cy.get("#terms_of_use").should("not.be.visible");
      // Check for co_owner
      cy.intercept("GET", "api/v1/currentUser", {
        fixture: "currentUser.json",
      });

      cy.fixture("room.json").then((room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.is_member = true;
        room.data.is_co_owner = true;

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.interceptRoomFilesRequest(true);

      cy.reload();
      cy.wait("@roomRequest");
      cy.wait("@roomFilesRequest");

      // Check that download agreement is hidden
      cy.get('[data-test="terms-of-use-message"]').should("not.exist");

      cy.get('[data-test="room-files-upload-button"]').should("be.visible");
      // Check that files are shown correctly and buttons are enabled
      cy.get('[data-test="room-file-item"]').should("have.length", 3);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "Sep 21, 2020, 09:08");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "rooms.files.use_in_next_meeting_disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('[data-test="room-files-edit-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('[data-test="room-files-delete-button"]')
        .should("not.be.disabled");

      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "File2.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "Sep 21, 2020, 09:08");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "rooms.files.use_in_next_meeting");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-edit-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-delete-button"]')
        .should("not.be.disabled");

      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .should("include.text", "File3.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .should("include.text", "Sep 21, 2020, 09:09");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .should("include.text", "rooms.files.download_hidden");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .should("include.text", "rooms.files.use_in_next_meeting_disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .find('[data-test="room-files-edit-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .find('[data-test="room-files-delete-button"]')
        .should("not.be.disabled");

      // Check view with rooms.manage permission
      cy.fixture("currentUser.json").then((currentUser) => {
        currentUser.data.permissions = ["rooms.viewAll", "rooms.manage"];
        cy.intercept("GET", "api/v1/currentUser", {
          statusCode: 200,
          body: currentUser,
        });
      });

      cy.fixture("room.json").then((room) => {
        room.data.owner = { id: 2, name: "Max Doe" };
        room.data.current_user.permissions = ["rooms.viewAll", "rooms.manage"];

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.reload();
      cy.wait("@roomRequest");
      cy.wait("@roomFilesRequest");

      // Check that download agreement is hidden
      cy.get('[data-test="terms-of-use-message"]').should("not.exist");
      cy.get('[data-test="room-files-upload-button"]').should("be.visible");

      // Check that files are shown correctly and buttons are enabled
      cy.get('[data-test="room-file-item"]').should("have.length", 3);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "Sep 21, 2020, 09:08");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "rooms.files.use_in_next_meeting_disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('[data-test="room-files-edit-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .find('[data-test="room-files-delete-button"]')
        .should("not.be.disabled");

      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "File2.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "Sep 21, 2020, 09:08");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "rooms.files.download_visible");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .should("include.text", "rooms.files.use_in_next_meeting");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-edit-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(1)
        .find('[data-test="room-files-delete-button"]')
        .should("not.be.disabled");

      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .should("include.text", "File3.pdf");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .should("include.text", "Sep 21, 2020, 09:09");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .should("include.text", "rooms.files.download_hidden");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .should("include.text", "rooms.files.use_in_next_meeting_disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .find('[data-test="room-files-view-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .find('[data-test="room-files-edit-button"]')
        .should("not.be.disabled");
      cy.get('[data-test="room-file-item"]')
        .eq(2)
        .find('[data-test="room-files-delete-button"]')
        .should("not.be.disabled");
    });

    it("search files", function () {
      cy.visit("/rooms/abc-def-123#tab=files");

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query.query).to.be.undefined;
        expect(interception.request.query).to.contain({
          page: "1",
        });
      });

      // Check with no files found for this search query
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = [];
        roomFiles.meta.from = null;
        roomFiles.meta.to = null;
        roomFiles.meta.total = 0;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get('[data-test="room-files-search"] > input').type("Test");
      cy.get('[data-test="room-files-search"] > button').click();

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          query: "Test",
          page: "1",
        });
      });

      // Check if correct message is shown and no files are displayed
      cy.get('[data-test="room-file-item"]').should("have.length", 0);
      cy.contains("app.filter_no_result").should("be.visible");

      // Check with no files in room
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = [];
        roomFiles.meta.from = null;
        roomFiles.meta.to = null;
        roomFiles.meta.total = 0;
        roomFiles.meta.total_no_filter = 0;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get('[data-test="room-files-search"] > input').clear();
      cy.get('[data-test="room-files-search"]').type("Test2");
      cy.get('[data-test="room-files-search"] > input').type("{enter}");

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          query: "Test2",
          page: "1",
        });
      });

      // Check if correct message is shown and no files are displayed
      cy.get('[data-test="room-file-item"]').should("have.length", 0);
      cy.contains("rooms.files.nodata").should("be.visible");

      // Check with 2 files on 2 pages
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(0, 1);
        roomFiles.meta.last_page = 2;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.to = 1;
        roomFiles.meta.total = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get('[data-test="room-files-search"] > input').clear();
      cy.get('[data-test="room-files-search"]').type("File");
      cy.get('[data-test="room-files-search"] > button').click();

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          query: "File",
          page: "1",
        });
      });

      // Check if correct files are shown
      cy.get('[data-test="room-file-item"]').should("have.length", 1);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");

      // Check that pagination shows the correct number of pages
      cy.get('[data-test="paginator-page"]').should("have.length", 2);

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(0)
        .should("have.attr", "data-p-active", "true");

      // Switch to next page
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(1, 2);
        roomFiles.meta.current_page = 2;
        roomFiles.meta.last_page = 2;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.from = 2;
        roomFiles.meta.to = 2;
        roomFiles.meta.total = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      // Click on button for next page (eq(1) needed because there are two paginator components
      // (first one for small devices second one for larger devices))
      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      // Check if search query stays the same after changing the page
      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          query: "File",
          page: "2",
        });
      });

      cy.get("[data-test=room-files-search] > input").should(
        "have.value",
        "File",
      );

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(1)
        .should("have.attr", "data-p-active", "true");

      // Check if correct files are shown
      cy.get('[data-test="room-file-item"]').should("have.length", 1);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File2.pdf");

      // Change search query and make sure that the page is reset
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(0, 1);
        roomFiles.meta.last_page = 2;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.to = 1;
        roomFiles.meta.total = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get('[data-test="room-files-search"] > input').clear();
      cy.get('[data-test="room-files-search"]').type("Fil");
      cy.get('[data-test="room-files-search"] > button').click();

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          query: "Fil",
          page: "1",
        });
      });

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(0)
        .should("have.attr", "data-p-active", "true");
    });

    it("filter files", function () {
      cy.visit("/rooms/abc-def-123#tab=files");

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query.filter).to.be.undefined;
        expect(interception.request.query).to.contain({
          page: "1",
        });
      });

      cy.get('[data-test="filter-dropdown-items"]').should("not.exist");

      // Check that correct filter is displayed
      cy.get('[data-test="filter-dropdown"]')
        .should("have.text", "rooms.files.filter.all")
        .click();

      cy.get('[data-test="filter-dropdown-items"]')
        .should("be.visible")
        .within(() => {
          // check that filter options are shown correctly

          cy.get("[data-test=filter-dropdown-option]").should("have.length", 3);

          cy.get("[data-test=filter-dropdown-option]")
            .eq(0)
            .should("have.text", "rooms.files.filter.all");
          cy.get("[data-test=filter-dropdown-option]")
            .eq(0)
            .should("have.attr", "aria-selected", "true");
          cy.get("[data-test=filter-dropdown-option]")
            .eq(1)
            .should("have.text", "rooms.files.filter.downloadable");
          cy.get("[data-test=filter-dropdown-option]")
            .eq(2)
            .should("have.text", "rooms.files.filter.use_in_meeting");
        });

      // Change filter and respond with no files found for this filter
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = [];
        roomFiles.meta.from = null;
        roomFiles.meta.to = null;
        roomFiles.meta.total = 0;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get("[data-test=filter-dropdown-option]").eq(1).click();

      // Check that correct filter is sent with request and correct filter is displayed
      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          filter: "downloadable",
          page: "1",
        });
      });

      // Check if correct message is shown and no files are displayed
      cy.get('[data-test="filter-dropdown"]').should(
        "have.text",
        "rooms.files.filter.downloadable",
      );

      cy.get('[data-test="room-file-item"]').should("have.length", 0);
      cy.contains("app.filter_no_result").should("be.visible");

      // Change filter again and respond with no files in room
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = [];
        roomFiles.meta.from = null;
        roomFiles.meta.to = null;
        roomFiles.meta.total = 0;
        roomFiles.meta.total_no_filter = 0;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get("[data-test=filter-dropdown]").click();
      cy.get("[data-test=filter-dropdown-option]").eq(2).click();

      // Check that correct filter is sent with request and correct filter is displayed
      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          filter: "use_in_meeting",
          page: "1",
        });
      });

      cy.get('[data-test="filter-dropdown"]').should(
        "have.text",
        "rooms.files.filter.use_in_meeting",
      );

      // Check if correct message is shown and no files are displayed
      cy.get('[data-test="room-file-item"]').should("have.length", 0);
      cy.contains("rooms.files.nodata").should("be.visible");

      // Change filter again and respond with 2 files on 2 pages
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(0, 1);
        roomFiles.meta.last_page = 2;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.to = 1;
        roomFiles.meta.total = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get("[data-test=filter-dropdown]").click();
      cy.get("[data-test=filter-dropdown-option]").eq(1).click();

      // Check that correct filter is sent with request and correct filter is displayed
      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          filter: "downloadable",
          page: "1",
        });
      });

      cy.get('[data-test="filter-dropdown"]').should(
        "have.text",
        "rooms.files.filter.downloadable",
      );

      // Check if correct files are shown
      cy.get('[data-test="room-file-item"]').should("have.length", 1);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");

      // Check that pagination shows the correct number of pages
      cy.get('[data-test="paginator-page"]').should("have.length", 2);

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(0)
        .should("have.attr", "data-p-active", "true");

      // Switch to next page
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(1, 2);
        roomFiles.meta.current_page = 2;
        roomFiles.meta.last_page = 2;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.from = 2;
        roomFiles.meta.to = 2;
        roomFiles.meta.total = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      // Click on button for next page (eq(1) needed because there are two paginator components
      // (first one for small devices second one for larger devices))
      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      // Check if filter stays the same after changing the page
      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          filter: "downloadable",
          page: "2",
        });
      });

      cy.get("[data-test=filter-dropdown]").should(
        "have.text",
        "rooms.files.filter.downloadable",
      );

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(1)
        .should("have.attr", "data-p-active", "true");

      // Check if correct files are shown
      cy.get('[data-test="room-file-item"]').should("have.length", 1);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File2.pdf");

      // Change filter again (reset filer) and make sure that the page is reset
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(0, 1);
        roomFiles.meta.last_page = 2;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.to = 1;
        roomFiles.meta.total = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get("[data-test=filter-dropdown]").click();
      cy.get("[data-test=filter-dropdown-option]").eq(0).click();

      // Check that filter and page were reset
      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query.filter).to.be.undefined;
        expect(interception.request.query).to.contain({
          page: "1",
        });
      });

      cy.get('[data-test="filter-dropdown"]').should(
        "have.text",
        "rooms.files.filter.all",
      );

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(0)
        .should("have.attr", "data-p-active", "true");
    });

    it("sort files", function () {
      cy.visit("/rooms/abc-def-123#tab=files");

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          sort_by: "uploaded",
          sort_direction: "desc",
          page: "1",
        });
      });

      cy.get('[data-test="sorting-type-dropdown-items"]').should("not.exist");

      // Check that correct sorting type is displayed
      cy.get('[data-test="sorting-type-dropdown"]')
        .should("have.text", "rooms.files.sort.uploaded_at")
        .click();

      cy.get('[data-test="sorting-type-dropdown-items"]')
        .should("be.visible")
        .within(() => {
          cy.get("[data-test=sorting-type-dropdown-option]").should(
            "have.length",
            2,
          );
          cy.get("[data-test=sorting-type-dropdown-option]")
            .eq(0)
            .should("have.text", "rooms.files.sort.filename");
          cy.get("[data-test=sorting-type-dropdown-option]")
            .eq(1)
            .should("have.text", "rooms.files.sort.uploaded_at");
          cy.get("[data-test=sorting-type-dropdown-option]")
            .eq(1)
            .should("have.attr", "aria-selected", "true");

          // Change sorting type and respond with 3 files on 3 different pages
          cy.fixture("roomFiles.json").then((roomFiles) => {
            roomFiles.data = roomFiles.data.slice(0, 1);
            roomFiles.meta.last_page = 3;
            roomFiles.meta.per_page = 1;
            roomFiles.meta.to = 1;

            cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
              statusCode: 200,
              body: roomFiles,
            }).as("roomFilesRequest");
          });

          cy.get("[data-test=sorting-type-dropdown-option]").eq(0).click();
        });

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          sort_by: "filename",
          sort_direction: "desc",
          page: "1",
        });
      });

      cy.get("[data-test=sorting-type-dropdown-items]").should("not.exist");

      cy.get("[data-test=sorting-type-dropdown]").should(
        "have.text",
        "rooms.files.sort.filename",
      );

      // Check if correct files are shown
      cy.get('[data-test="room-file-item"]').should("have.length", 1);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File1.pdf");

      // Check that pagination shows the correct number of pages
      cy.get('[data-test="paginator-page"]').should("have.length", 3);

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(0)
        .should("have.attr", "data-p-active", "true");

      // Switch to next page
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(1, 2);
        roomFiles.meta.current_page = 2;
        roomFiles.meta.last_page = 3;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.from = 2;
        roomFiles.meta.to = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          sort_by: "filename",
          sort_direction: "desc",
          page: "2",
        });
      });

      cy.get("[data-test=sorting-type-dropdown]").should(
        "have.text",
        "rooms.files.sort.filename",
      );

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(1)
        .should("have.attr", "data-p-active", "true");

      // Check if correct files are shown
      cy.get('[data-test="room-file-item"]').should("have.length", 1);
      cy.get('[data-test="room-file-item"]')
        .eq(0)
        .should("include.text", "File2.pdf");

      // Change sorting direction and make sure that the page is reset
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(0, 1);
        roomFiles.meta.last_page = 3;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.to = 1;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get('[data-test="sorting-type-inputgroup"]').find("button").click();

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          sort_by: "filename",
          sort_direction: "asc",
          page: "1",
        });
      });

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(0)
        .should("have.attr", "data-p-active", "true");

      // Switch to next page
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(1, 2);
        roomFiles.meta.current_page = 2;
        roomFiles.meta.last_page = 3;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.from = 2;
        roomFiles.meta.to = 2;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get('[data-test="paginator-next-button"]').eq(1).click();

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          sort_by: "filename",
          sort_direction: "asc",
          page: "2",
        });
      });

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(1)
        .should("have.attr", "data-p-active", "true");

      // Change sorting type and make sure that the page is reset
      cy.fixture("roomFiles.json").then((roomFiles) => {
        roomFiles.data = roomFiles.data.slice(0, 1);
        roomFiles.meta.last_page = 3;
        roomFiles.meta.per_page = 1;
        roomFiles.meta.to = 1;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/files*", {
          statusCode: 200,
          body: roomFiles,
        }).as("roomFilesRequest");
      });

      cy.get("[data-test=sorting-type-dropdown]").click();
      cy.get("[data-test=sorting-type-dropdown-option]").eq(1).click();

      cy.wait("@roomFilesRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          sort_by: "uploaded",
          sort_direction: "asc",
          page: "1",
        });
      });

      cy.get("[data-test=sorting-type-dropdown]").should(
        "have.text",
        "rooms.files.sort.uploaded_at",
      );

      // Check that correct pagination is active
      cy.get('[data-test="paginator-page"]')
        .eq(0)
        .should("have.attr", "data-p-active", "true");
    });
  });
});
