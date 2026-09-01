import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

Cypress._.times(20, () => {
  describe("Rooms View access personalized link", function () {
    beforeEach(function () {
      cy.init();
      cy.interceptRoomViewRequests();
    });

    it("room view with personalized link (participant)", function () {
      cy.intercept("GET", "api/v1/currentUser", {});
      cy.interceptRoomFilesRequest();

      // Intercept room auth request
      const roomAuthRequest = interceptIndefinitely(
        "POST",
        "api/v1/rooms/abc-def-123/auth",
        {
          statusCode: 201,
          body: {
            data: {
              id: "roomAuthToken",
              type: 1,
            },
          },
        },
        "roomAuthRequest",
      );

      cy.fixture("room.json").then((room) => {
        room.data.username = "Laura Rivera";
        room.data.allow_membership = true;
        room.data.is_member = true;
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.get("[data-test='room-loading-spinner']")
        .should("be.visible")
        .then(() => {
          roomAuthRequest.sendResponse();
        });

      cy.title().should("eq", "Meeting One - PILOS Test");

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      // Check that room auth token is set
      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      // Check that sessionStorage was set
      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Check that personalized link was removed from url
      cy.url().should("not.include", "#personalizedLink");

      // Check that room Header is shown correctly
      cy.contains("Meeting One").should("be.visible");
      cy.contains("John Doe").should("be.visible");
      cy.contains("rooms.index.room_component.never_started").should(
        "be.visible",
      );

      // Check that participant name is shown
      cy.contains("rooms.name_in_video_conference").should("be.visible");
      cy.contains("Laura Rivera").should("be.visible");
      cy.get('[data-test="change-participant-name-button"]').should(
        "not.exist",
      );

      // Check that buttons are shown correctly
      cy.get('[data-test="reload-room-button"]').should("be.visible");
      cy.get('[data-test="room-join-membership-button"]').should("not.exist");
      cy.get('[data-test="room-end-membership-button"]').should("not.exist");
      cy.get('[data-test="room-favorites-button"]').should("not.exist");

      // Check that tabs are shown correctly
      cy.get("#tab-description").should("not.exist");
      cy.get("#tab-members").should("not.exist");
      cy.get("#tab-tokens").should("not.exist");
      cy.get("#tab-files").should("be.visible");
      cy.get("#tab-recordings").should("be.visible");
      cy.get("#tab-history").should("not.exist");
      cy.get("#tab-settings").should("not.exist");

      // Check that correct tab is shown
      cy.contains("rooms.files.title").should("be.visible");

      // Check if share button is hidden
      cy.get('[data-test="room-share-button"]').should("not.exist");

      // Reload page with personalizedLink set in sessionStorage
      cy.log("Reload page with personalizedLink set in sessionStorage");
      cy.reload();
      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      // Check that room auth token is set
      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      // Check that sessionStorage is still set
      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Check that room Header is shown correctly
      cy.contains("Meeting One").should("be.visible");
      cy.contains("John Doe").should("be.visible");
      cy.contains("rooms.index.room_component.never_started").should(
        "be.visible",
      );

      // Check that participant name is shown
      cy.contains("rooms.name_in_video_conference").should("be.visible");
      cy.contains("Laura Rivera").should("be.visible");
      cy.get('[data-test="change-participant-name-button"]').should(
        "not.exist",
      );

      // Check that buttons are shown correctly
      cy.get('[data-test="reload-room-button"]').should("be.visible");
      cy.get('[data-test="room-join-membership-button"]').should("not.exist");
      cy.get('[data-test="room-end-membership-button"]').should("not.exist");
      cy.get('[data-test="room-favorites-button"]').should("not.exist");

      // Check that tabs are shown correctly
      cy.get("#tab-description").should("not.exist");
      cy.get("#tab-members").should("not.exist");
      cy.get("#tab-tokens").should("not.exist");
      cy.get("#tab-files").should("be.visible");
      cy.get("#tab-recordings").should("be.visible");
      cy.get("#tab-history").should("not.exist");
      cy.get("#tab-settings").should("not.exist");

      // Check that correct tab is shown
      cy.contains("rooms.files.title").should("be.visible");

      // Check if share button is hidden
      cy.get('[data-test="room-share-button"]').should("not.exist");

      // Reload with invalid token
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 401,
        body: {
          message: "invalid_personalized_link",
        },
      }).as("roomAuthRequest");

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 401,
        body: {
          message: "invalid_auth_token",
        },
      }).as("roomRequest");

      cy.get('[data-test="reload-room-button"]').click();

      cy.wait("@roomRequest");
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
    });

    it("room view with personalized link (moderator)", function () {
      cy.intercept("GET", "api/v1/currentUser", {});
      cy.interceptRoomFilesRequest();

      // Intercept room auth request
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 1,
          },
        },
      }).as("roomAuthRequest");

      cy.fixture("room.json").then((room) => {
        room.data.username = "Laura Rivera";
        room.data.allow_membership = true;
        room.data.is_member = true;
        room.data.is_moderator = true;
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.title().should("eq", "Meeting One - PILOS Test");

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      // Check that header for token is set
      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      // Check that sessionStorage was set
      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Check that personalized link was removed from url
      cy.url().should("not.include", "#personalizedLink");

      // Check that room Header is shown correctly
      cy.contains("Meeting One").should("be.visible");
      cy.contains("John Doe").should("be.visible");
      cy.contains("rooms.index.room_component.never_started").should(
        "be.visible",
      );

      // Check that participant name is shown
      cy.contains("rooms.name_in_video_conference").should("be.visible");
      cy.contains("Laura Rivera").should("be.visible");
      cy.get('[data-test="change-participant-name-button"]').should(
        "not.exist",
      );

      // Check that buttons are shown correctly
      cy.get('[data-test="reload-room-button"]').should("be.visible");
      cy.get('[data-test="room-join-membership-button"]').should("not.exist");
      cy.get('[data-test="room-end-membership-button"]').should("not.exist");
      cy.get('[data-test="room-favorites-button"]').should("not.exist");

      // Check that tabs are shown correctly
      cy.get("#tab-description").should("not.exist");
      cy.get("#tab-members").should("not.exist");
      cy.get("#tab-tokens").should("not.exist");
      cy.get("#tab-files").should("be.visible");
      cy.get("#tab-recordings").should("be.visible");
      cy.get("#tab-history").should("not.exist");
      cy.get("#tab-settings").should("not.exist");

      // Check that correct tab is shown
      cy.contains("rooms.files.title").should("be.visible");

      // Check if share button is hidden
      cy.get('[data-test="room-share-button"]').should("not.exist");
    });

    it("room view with personalized link legacy route", function () {
      cy.intercept("GET", "api/v1/currentUser", {});
      cy.interceptRoomFilesRequest();

      // Intercept room auth request
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 1,
          },
        },
      }).as("roomAuthRequest");

      cy.fixture("room.json").then((room) => {
        room.data.username = "Laura Rivera";
        room.data.allow_membership = true;
        room.data.is_member = true;
        room.data.is_moderator = false;
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      // Visit room with personalized link (legacy personalized link route)
      cy.visit(
        "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.title().should("eq", "Meeting One - PILOS Test");

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      // Check that header for token is set
      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      // Check that sessionStorage was set
      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Check that personalized link is not visible in the url
      cy.url().should("not.include", "#personalizedLink");
      cy.url().should(
        "not.include",
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      // Check that room Header is shown correctly
      cy.contains("Meeting One").should("be.visible");
      cy.contains("John Doe").should("be.visible");
      cy.contains("rooms.index.room_component.never_started").should(
        "be.visible",
      );

      // Check that participant name is shown
      cy.contains("rooms.name_in_video_conference").should("be.visible");
      cy.contains("Laura Rivera").should("be.visible");
      cy.get('[data-test="change-participant-name-button"]').should(
        "not.exist",
      );

      // Check that buttons are shown correctly
      cy.get('[data-test="reload-room-button"]').should("be.visible");
      cy.get('[data-test="room-join-membership-button"]').should("not.exist");
      cy.get('[data-test="room-end-membership-button"]').should("not.exist");
      cy.get('[data-test="room-favorites-button"]').should("not.exist");

      // Check that tabs are shown correctly
      cy.get("#tab-description").should("not.exist");
      cy.get("#tab-members").should("not.exist");
      cy.get("#tab-tokens").should("not.exist");
      cy.get("#tab-files").should("be.visible");
      cy.get("#tab-recordings").should("be.visible");
      cy.get("#tab-history").should("not.exist");
      cy.get("#tab-settings").should("not.exist");

      // Check that correct tab is shown
      cy.contains("rooms.files.title").should("be.visible");

      // Check if share button is hidden
      cy.get('[data-test="room-share-button"]').should("not.exist");
    });

    it("room auth with personalized link errors", function () {
      cy.intercept("GET", "api/v1/currentUser", {});
      cy.interceptRoomFilesRequest();

      // 401 invalid personalize link with personalized link from hash
      // Intercept room auth request
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 401,
        body: {
          message: "invalid_personalized_link",
        },
      }).as("roomAuthRequest");

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

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

      // Reload and check with 422 error with personalized link from hash
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 422,
        body: {
          message: "The Access token field is required.",
          errors: {
            personalized_link_token: ["The Access token field is required."],
          },
        },
      }).as("roomAuthRequest");

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

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

      // Check with guests only error with personalized link from hash
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 420,
        body: {
          message: "guests_only",
        },
      }).as("roomAuthRequest");

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      cy.checkToastMessage("app.flash.guests_only");
      cy.url()
        .should("not.include", "/rooms")
        .and("not.include", "rooms/abc-def-123");

      // Check with 500 error with personalized link from hash
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 500,
        body: {
          message: "Test",
        },
      }).as("roomAuthRequest");

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Check that error message is shown
      cy.checkToastMessage([
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that reload button is shown
      cy.get('[data-test="reload-button"]').should("be.visible");

      // Reload page and check that error stays even though personalized link now is loaded from the sessionStorage
      cy.url().should("not.include", "#personalizedLink");
      cy.reload();

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Check that error message is shown
      cy.checkToastMessage([
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that reload button is shown
      cy.get('[data-test="reload-button"]').should("be.visible");

      // Click reload button and make sure auth request is sent again
      // Reload with valid auth request and room request
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 1,
          },
        },
      }).as("roomAuthRequest");

      cy.fixture("room.json").then((room) => {
        room.data.username = "Laura Rivera";
        room.data.allow_membership = true;
        room.data.is_member = true;
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.get('[data-test="reload-button"]').click();

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Check that room is shown correctly
      cy.contains("Meeting One").should("be.visible");
      cy.contains("John Doe").should("be.visible");
      cy.contains("rooms.index.room_component.never_started").should(
        "be.visible",
      );

      // Check with 404 error
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 404,
        body: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      }).as("roomAuthRequest");

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      // Check that redirect to 404 page worked and error message is shown
      cy.url()
        .should("include", "/404")
        .and("not.include", "rooms/abc-def-123");

      cy.checkToastMessage([
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });

    it.only("room view with personalized link errors", function () {
      cy.intercept("GET", "api/v1/currentUser", {});
      cy.interceptRoomFilesRequest();

      // Check with 401 invalid token error
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 1,
          },
        },
      }).as("roomAuthRequest");

      const roomRequest = interceptIndefinitely(
        "GET",
        "api/v1/rooms/abc-def-123*",
        {
          statusCode: 401,
          body: {
            message: "invalid_auth_token",
          },
        },
        "roomRequest",
      );

      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });

        const roomAuthRequest = interceptIndefinitely(
          "POST",
          "api/v1/rooms/abc-def-123/auth",
          {
            statusCode: 401,
            body: {
              message: "invalid_personalized_link",
            },
          },
          "roomAuthRequest",
        );

        roomRequest.sendResponse();

        cy.wait("@roomRequest").then((interception) => {
          expect(interception.request.query).to.contain({
            room_auth_token: "roomAuthToken",
            room_auth_token_type: "1",
          });
        });

        cy.window()
          .should((win) => {
            expect(
              win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
            ).to.eq(
              "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
            );
          })
          .then(() => {
            roomAuthRequest.sendResponse();
          });
      });

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

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

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 420,
        body: {
          message: "guests_only",
        },
      }).as("roomRequest");

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      cy.checkToastMessage("app.flash.guests_only");
      cy.url()
        .should("not.include", "/rooms")
        .and("not.include", "rooms/abc-def-123");

      // Check with 500 error
      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 500,
        body: {
          message: "Test",
        },
      }).as("roomRequest");

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest").then((interception) => {
        expect(interception.request.body).to.eql({
          personalized_link_token:
            "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        });
      });

      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Check that error message is shown
      cy.checkToastMessage([
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that reload button is shown
      cy.get('[data-test="reload-button"]').should("be.visible");

      // Intercept room auth request with different token
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "differentToken",
            type: 1,
          },
        },
      }).as("differentRoomAuthRequest");

      // Click reload button and make sure room request is sent again with same auth token
      // Reload with valid room request
      cy.fixture("room.json").then((room) => {
        room.data.username = "Laura Rivera";
        room.data.allow_membership = true;
        room.data.is_member = true;
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.get('[data-test="reload-button"]').click();

      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      //  Check that room is shown correctly
      cy.contains("Meeting One").should("be.visible");
      cy.contains("John Doe").should("be.visible");
      cy.contains("rooms.index.room_component.never_started").should(
        "be.visible",
      );

      // Check that room auth request was not sent again
      cy.get("@differentRoomAuthRequest").should("be.null");
    });

    it("visit with personalized link as authenticated user", function () {
      cy.fixture("room.json").then((room) => {
        room.data.owner = {
          id: 2,
          name: "Max Doe",
        };
        room.data.is_member = true;
        room.data.is_moderator = true;
        room.data.allow_membership = true;

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      // Visit room with personalized link
      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      // Check that error message is shown and user is redirected to the home page
      cy.checkToastMessage("app.flash.guests_only");
      cy.url().should("not.include", "/rooms/abc-def-123");

      cy.get("@roomRequest").should("be.null");
    });

    it("visit with personalized link in sessionStorage as authenticated user", function () {
      cy.fixture("room.json").then((room) => {
        room.data.owner = {
          id: 2,
          name: "Max Doe",
        };
        room.data.is_member = true;
        room.data.is_moderator = true;
        room.data.allow_membership = true;

        cy.intercept("GET", "api/v1/rooms/abc-def-123", {
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

      cy.window().then((win) => {
        win.sessionStorage.setItem(
          "roomPersonalizedLink_abc-def-123",
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Visit room with personalized link in session storage
      cy.visit("/rooms/abc-def-123");

      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query.room_auth_token).to.be.undefined;
        expect(interception.request.query.room_auth_token_type).to.be.undefined;
      });

      // Check that room was loaded and no participant name is shown
      cy.contains("Meeting One").should("be.visible");

      // Check that participant name is not shown
      cy.contains("rooms.name_in_video_conference").should("not.exist");
      cy.get('[data-test="change-participant-name-button"]').should(
        "not.exist",
      );

      // Check that sessionStorage was cleared
      cy.window().should((win) => {
        expect(win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"))
          .to.be.null;
      });

      // Check that auth request was not sent
      cy.get("@roomAuthRequest").should("be.null");
    });

    it("reload with personalized link errors", function () {
      cy.intercept("GET", "api/v1/currentUser", {});
      cy.interceptRoomFilesRequest();

      // Check with 401 invalid token error
      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 1,
          },
        },
      }).as("roomAuthRequest");

      cy.fixture("room.json").then((room) => {
        room.data.username = "Laura Rivera";
        room.data.allow_membership = true;
        room.data.is_member = true;
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest");
      cy.wait("@roomRequest");

      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      // Check with invalid token error
      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 401,
        body: {
          message: "invalid_auth_token",
        },
      }).as("roomRequest");

      cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
        statusCode: 401,
        body: {
          message: "invalid_personalized_link",
        },
      }).as("roomAuthRequest");

      cy.get('[data-test="reload-room-button"]').click();

      cy.wait("@roomRequest").then((interception) => {
        expect(interception.request.query).to.contain({
          room_auth_token: "roomAuthToken",
          room_auth_token_type: "1",
        });
      });

      cy.wait("@roomAuthRequest");

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

      cy.fixture("room.json").then((room) => {
        room.data.username = "Laura Rivera";
        room.data.allow_membership = true;
        room.data.is_member = true;
        room.data.current_user = null;

        cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
          statusCode: 200,
          body: room,
        }).as("roomRequest");
      });

      cy.visit(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      cy.wait("@roomAuthRequest");
      cy.wait("@roomRequest");

      cy.window().should((win) => {
        expect(
          win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ).to.eq(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
      });

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 420,
        body: {
          message: "guests_only",
        },
      }).as("roomRequest");

      cy.get('[data-test="reload-room-button"]').click();

      cy.wait("@roomRequest");

      // Check that error message is shown
      cy.checkToastMessage("app.flash.guests_only");
      cy.url()
        .should("not.include", "/rooms")
        .and("not.include", "rooms/abc-def-123");
    });
  });
});
