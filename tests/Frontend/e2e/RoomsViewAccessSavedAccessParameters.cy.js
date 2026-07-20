import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms View access saved access parameters", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
  });

  it("saved access parameter priority", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.is_member = true;
      room.data.username = "Max Doe";

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 200,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.setValidRememberedParticipantName("Laura Rivera");

    cy.window().then((win) => {
      win.sessionStorage.setItem("roomAccessCode_abc-def-123", "123456789");
      win.sessionStorage.setItem(
        "roomPersonalizedLink_abc-def-123",
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Visit with all possible saved access parameters set
    cy.visit(
      "/rooms/abc-def-123#accessCode=987654321&personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
    );

    // Check that room access overlay is hidden
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

    // Check that auth was called with personalized link from hash
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that correct participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");
    cy.contains("Laura Rivera").should("not.exist");

    // Check that sessionStorage value for personalized link was updated to the value from hash
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

      // Reset to previous value
      win.sessionStorage.setItem(
        "roomPersonalizedLink_abc-def-123",
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that the competing access code hash was removed and cannot win on a later reload
    cy.url().should("not.include", "accessCode");

    // Reload without personalized link in hash
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.is_member = true;
      room.data.username = "Max Doe";

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 200,
      body: {
        data: {
          id: "roomAuthToken",
          type: 1,
        },
      },
    }).as("roomAuthRequest");

    cy.reload();

    // Check that the access code from the previous hash was discarded and the personalized link is still used
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

    // Check that correct participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");
    cy.contains("Laura Rivera").should("not.exist");

    // Reload without personalized link in hash, but with an explicit access code hash
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 200,
      body: {
        data: {
          id: "roomAuthToken",
          type: 0,
        },
      },
    }).as("roomAuthRequest");

    cy.reloadWithHash("accessCode=987654321");

    // Check that auth was called with access code from hash
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that correct participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");
    cy.contains("Max Doe").should("not.exist");

    // Check that sessionStorage value for access code was updated to the value from hash
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "987654321",
      );
      expect(win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123")).to
        .be.null;
    });

    // Reload without access code in hash
    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 200,
      body: {
        data: {
          id: "roomAuthToken",
          type: 0,
        },
      },
    }).as("roomAuthRequest");

    cy.reload();

    // Check that auth was called with access code from sessionStorage
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that correct participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");
    cy.contains("Max Doe").should("not.exist");
  });

  it("hash change with no saved access parameters", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();
    cy.setValidRememberedParticipantName("Laura Rivera");

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Add access code to hash params
    const accessCodeRoomAuthRequest = interceptIndefinitely(
      "POST",
      "api/v1/rooms/abc-def-123/auth",
      {
        statusCode: 201,
        body: {
          data: {
            id: "roomAuthToken",
            type: 0,
          },
        },
      },
      "roomAuthRequest",
    );

    cy.fixture("room.json").then((room) => {
      room.data.description = "<p>Test</p>";
      room.data.current_user = null;
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash = "accessCode=987654321";
    });

    // Check loading state
    cy.get('[data-test="room-loading-spinner"]')
      .should("be.visible")
      .then(() => {
        accessCodeRoomAuthRequest.sendResponse();
      });

    // Check that auth was called with access code from hash and room was reloaded
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that url was cleared and access code was saved to sessionStorage
    cy.url().should("not.include", "accessCode");
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "987654321",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Clear sessionStorage and reload room
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.wait("@roomRequest");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Add personalized link in hash params
    const personalizedLinkRoomAuthRequest = interceptIndefinitely(
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
      room.data.username = "Max Doe";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
    });

    // Check loading state
    cy.get('[data-test="room-loading-spinner"]')
      .should("be.visible")
      .then(() => {
        personalizedLinkRoomAuthRequest.sendResponse();
      });

    // Check that auth was called with personalized link from hash and room was reloaded
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that url was cleared and personalized link was saved to sessionStorage
    cy.url().should("not.include", "personalizedLink");
    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("not.exist");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

    // Clear sessionStorage and reload room
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    cy.fixture("room.json").then((room) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

    cy.wait("@roomRequest");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check that access overlay is shown
    cy.get('[data-test="room-access-overlay"]').should("be.visible");

    // Add personalized link and access code in hash params
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
      room.data.username = "Max Doe";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx&accessCode=987654321";
    });

    // Check that auth was called with personalized link from hash and room was reloaded
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that url was cleared and personalized link was saved to sessionStorage
    cy.url().should("not.include", "personalizedLink");
    cy.url().should("not.include", "accessCode");
    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("not.exist");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");
  });

  it("hash change with saved access code", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();
    cy.setValidRememberedParticipantName("Laura Rivera");

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
      room.data.description = "<p>Test</p>";
      room.data.current_user = null;
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.sessionStorage.setItem("roomAccessCode_abc-def-123", "987654321");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });
    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Add different access code to hash params
    cy.window().then((win) => {
      win.location.hash = "accessCode=123456789";
    });

    // Check that auth was called with access code from hash and room was reloaded
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "123456789",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that url was cleared and access code was updated in sessionStorage
    cy.url().should("not.include", "accessCode");
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "123456789",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Reset sessionStorage and reload room
    cy.window().then((win) => {
      win.sessionStorage.setItem("roomAccessCode_abc-def-123", "987654321");
    });

    cy.reload();

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Add personalized link in hash params
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
      room.data.username = "Max Doe";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
    });

    // Check that auth was called with personalized link from hash and room was reloaded
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that url was cleared and personalized link was saved to sessionStorage
    cy.url().should("not.include", "personalizedLink");
    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("not.exist");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

    // Reset sessionStorage and reload room
    cy.window().then((win) => {
      win.sessionStorage.clear();
      win.sessionStorage.setItem("roomAccessCode_abc-def-123", "987654321");
    });

    cy.fixture("room.json").then((room) => {
      room.data.description = "<p>Test</p>";
      room.data.current_user = null;
      room.data.allow_membership = true;

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
          type: 0,
        },
      },
    }).as("roomAuthRequest");

    cy.reload();

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Add personalized link and access code in hash params
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
      room.data.username = "Max Doe";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx&accessCode=987654321";
    });

    // Check that auth was called with personalized link from hash and room was reloaded
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that url was cleared and personalized link was saved to sessionStorage
    cy.url().should("not.include", "personalizedLink");
    cy.url().should("not.include", "accessCode");
    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("not.exist");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");
  });

  it("hash change with saved personalized link", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.interceptRoomFilesRequest();
    cy.setValidRememberedParticipantName("Laura Rivera");

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
      room.data.username = "Max Doe";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.sessionStorage.setItem(
        "roomPersonalizedLink_abc-def-123",
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    cy.visit("/rooms/abc-def-123");

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

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

    // Add access code to hash params
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
      room.data.description = "<p>Test</p>";
      room.data.current_user = null;
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash = "accessCode=987654321";
    });

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    // Check that url was cleared and sessionStorage was updated
    cy.url().should("not.include", "accessCode");
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "987654321",
      );
      expect(win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123")).to
        .be.null;
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("not.exist");
    cy.contains("Laura Rivera").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("be.visible");

    // Add different personalized link in hash params
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
      room.data.username = "Angela Jones";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
    });

    // Check that auth was called with personalized link from hash and room was reloaded
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that url was cleared and personalized link was updated in sessionStorage
    cy.url().should("not.include", "personalizedLink");
    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("not.exist");
    cy.contains("Angela Jones").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

    // Reset sessionStorage and reload room
    cy.window().then((win) => {
      win.sessionStorage.clear();
      win.sessionStorage.setItem(
        "roomPersonalizedLink_abc-def-123",
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    cy.fixture("room.json").then((room) => {
      room.data.username = "Max Doe";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.reload();

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

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Max Doe").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");

    // Add different personalized link and access code in hash params
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
      room.data.username = "Angela Jones";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx&accessCode=987654321";
    });

    // Check that auth was called with personalized link from hash and room was reloaded
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      });
    });

    cy.wait("@roomRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });
    });

    // Check that url was cleared and personalized link was saved to sessionStorage
    cy.url().should("not.include", "personalizedLink");
    cy.url().should("not.include", "accessCode");
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );
    });

    // Check that room Header is shown correctly
    cy.contains("Meeting One").should("be.visible");

    // Check that participant name is shown
    cy.contains("rooms.name_in_video_conference").should("be.visible");
    cy.contains("Laura Rivera").should("not.exist");
    cy.contains("Angela Jones").should("be.visible");
    cy.get('[data-test="change-participant-name-button"]').should("not.exist");
  });

  it("hash change with access code errors", function () {
    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.title().should("eq", "Meeting One - PILOS Test");

    // Check with 422 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 422,
      body: {
        message: "The Access code field is required.",
        errors: {
          access_code: ["The Access code field is required."],
        },
      },
    }).as("roomAuthRequest");

    cy.window().then((win) => {
      win.location.hash = "accessCode=123456789";
    });

    cy.wait("@roomAuthRequest");
    cy.wait("@roomRequest");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
    });

    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.contains("The Access code field is required.").should("be.visible");
      });

    // Check with invalid_code error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 401,
      body: {
        message: "invalid_code",
      },
    }).as("roomAuthRequest");

    cy.fixture("room.json").then((room) => {
      room.data.owner = {
        id: 2,
        name: "Max Doe",
      };
      room.data.authenticated = false;
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;

      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.location.hash = "accessCode=987654321";
    });

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });

    // Wait for room request
    cy.wait("@roomRequest");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.be
        .null;
    });

    // Check if error message is shown
    cy.checkToastMessage("rooms.flash.access_code_invalid");

    cy.contains("rooms.flash.access_code_invalid").should("be.visible");

    cy.get('[data-test="room-access-overlay"]')
      .should("be.visible")
      .within(() => {
        cy.get("#access-code").should("have.value", "987-654-321");
      });

    // Intercept room auth request and respond with rate limit error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 429,
      body: {
        limit: "room_auth",
        retry_after: 5,
      },
    }).as("roomAuthRequest");

    cy.clock();

    cy.window().then((win) => {
      win.location.hash = "accessCode=987654321";
    });

    // Wait for room auth request
    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        access_code: "987654321",
        type: 0,
      });
    });
    cy.wait("@roomRequest");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "987654321",
      );
    });

    // Check if input and buttons are disabled
    cy.get("#access-code").should("be.disabled");
    cy.get('[data-test="room-login-button"]').should("be.disabled");
    cy.get('[data-test="reload-room-button"]').should("be.disabled");

    // Check countdown
    for (let i = 5; i > 0; i--) {
      // Check if countdown message is updated
      cy.contains('rooms.auth_throttled_{"try_again":' + i + "}").should(
        "be.visible",
      );

      // Tick clock 1 sec forward
      cy.tick(1000);
    }

    // restore the clock
    cy.clock().then((clock) => {
      clock.restore();
    });

    // Check toast message
    cy.checkToastMessage("app.flash.too_many_requests");

    // Check if input and buttons are enabled again
    cy.get("#access-code").should("not.be.disabled");
    cy.get('[data-test="room-login-button"]').should("not.be.disabled");
    cy.get('[data-test="reload-room-button"]').should("not.be.disabled");

    // Check with 500 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomAuthRequest");

    cy.window().then((win) => {
      win.location.hash = "accessCode=987654321";
    });

    cy.wait("@roomAuthRequest");

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "987654321",
      );
    });

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Check that reload button is shown
    cy.get('[data-test="reload-button"]').should("be.visible");

    // Check with guests not allowed
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 403,
      body: {
        message: "guests_not_allowed",
      },
    }).as("roomAuthRequest");

    cy.window().then((win) => {
      win.location.hash = "accessCode=987654321";
    });

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("roomAccessCode_abc-def-123")).to.eq(
        "987654321",
      );
    });

    // Check if error message is shown
    // Check that the error message is shown
    cy.contains("rooms.only_used_by_authenticated_users").should("be.visible");

    // Check that access overlay is hidden
    cy.get('[data-test="room-access-overlay"]').should("not.exist");

    // Check with 404 error (room not found) as authenticated user
    cy.interceptRoomIndexRequests();
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("roomAuthRequest");

    cy.reload();

    cy.wait("@roomRequest");

    cy.window().then((win) => {
      win.location.hash = "accessCode=987654321";
    });

    cy.wait("@roomAuthRequest");

    // Check that redirect to room index page worked
    cy.url()
      .should("include", "/rooms")
      .and("not.include", "/rooms/abc-def-123");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);

    // Check with 404 error (room not found) as guest
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.setValidRememberedParticipantName("Angela Jones");

    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.window().then((win) => {
      win.location.hash = "accessCode=987654321";
    });

    cy.wait("@checkParticipantNameRequest");
    cy.wait("@roomAuthRequest");

    // Check that redirect to 404 page worked
    cy.url().should("include", "/404").and("not.include", "/rooms/abc-def-123");

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  it("hash change with personalized link errors", function () {
    cy.intercept("GET", "api/v1/currentUser", {});
    cy.fixture("room.json").then((room) => {
      room.data.current_user = null;
      room.data.authenticated = false;

      cy.intercept("GET", "api/v1/rooms/abc-def-123*", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
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
    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.personalized_link_invalid");
    cy.contains("rooms.invalid_personalized_link").should("be.visible");

    // Reload and check with 422 error
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
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.window().then((win) => {
      expect(
        win.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
      ).to.eq(
        "E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
    });

    // Check that error message is shown
    cy.checkToastMessage("rooms.flash.personalized_link_invalid");
    cy.contains("rooms.invalid_personalized_link").should("be.visible");

    // Check with guests only error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 420,
      body: {
        message: "guests_only",
      },
    }).as("roomAuthRequest");

    // Visit room
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.window().then((win) => {
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

    // Check with 500 error with personalized link
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("roomAuthRequest");

    // Visit room
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    cy.window().then((win) => {
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

    // Check with 404 error
    cy.intercept("POST", "api/v1/rooms/abc-def-123/auth", {
      statusCode: 404,
      body: {
        message: "model_not_found",
        model: "room",
        ids: ["abc-def-123"],
      },
    }).as("roomAuthRequest");

    // Visit room
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.visit("/rooms/abc-def-123");

    cy.wait("@roomRequest");

    cy.window().then((win) => {
      win.location.hash =
        "personalizedLink=E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    cy.wait("@roomAuthRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        personalized_link_token:
          "E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });
    });

    // Check that redirect to 404 page worked and error message is shown
    cy.url().should("include", "/404").and("not.include", "rooms/abc-def-123");

    cy.checkToastMessage([
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });
});
