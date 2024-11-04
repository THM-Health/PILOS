import { interceptIndefinitely } from "../support/utils/interceptIndefinitely.js";

describe("Rooms view members member actions", function () {
  beforeEach(function () {
    cy.init();
    cy.interceptRoomViewRequests();
    cy.interceptRoomMembersRequest();
  });

  it("add new member", function () {
    cy.visit("/rooms/abc-def-123#tab=members");

    cy.wait("@roomMembersRequest");

    cy.get("#overlay_menu").should("not.exist");

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get("#overlay_menu").should("be.visible");

    // Click on add single user option
    cy.get('[data-test="room-members-add-single-dialog"]').should("not.exist");

    cy.get("#overlay_menu_0")
      .should("have.text", "rooms.members.add_single_user")
      .click();

    cy.get('[data-test="room-members-add-single-dialog"]').should("be.visible");

    // Start typing and respond with too many results
    cy.intercept("GET", "/api/v1/users/search?query=*", {
      statusCode: 204,
    }).as("userSearchRequest");

    cy.get(".multiselect__content").should("not.be.visible");

    cy.get('[data-test="select-user-dropdown"]')
      .should("include.text", "rooms.members.modals.add.placeholder")
      .click();

    cy.get('[data-test="select-user-dropdown"]').find("input").type("L");

    cy.wait("@userSearchRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "L",
      });
    });

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 2);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "rooms.members.modals.add.too_many_results")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "rooms.members.modals.add.no_options")
      .and("not.be.visible");

    // Continue typing and respond with results
    cy.intercept("GET", "/api/v1/users/search?query=*", {
      statusCode: 200,
      body: {
        data: [
          {
            id: 5,
            firstname: "Laura",
            lastname: "Rivera",
            email: "LauraWRivera@domain.tld",
            image: null,
          },
          {
            id: 10,
            firstname: "Laura",
            lastname: "Walter",
            email: "LauraMWalter@domain.tld",
            image: null,
          },
        ],
      },
    }).as("userSearchRequest");

    cy.get('[data-test="select-user-dropdown"]').find("input").type("aura");

    cy.wait("@userSearchRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "La",
      });
    });
    cy.wait("@userSearchRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "Lau",
      });
    });
    cy.wait("@userSearchRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "Laur",
      });
    });

    cy.wait("@userSearchRequest").then((interception) => {
      expect(interception.request.query).to.contain({
        query: "Laura",
      });
    });

    // Check if correct options are shown
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").should("have.length", 4);
    cy.get(".multiselect__option")
      .eq(0)
      .should("include.text", "Laura Rivera")
      .and("include.text", "LauraWRivera@domain.tld")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(1)
      .should("include.text", "Laura Walter")
      .and("include.text", "LauraMWalter@domain.tld")
      .and("be.visible");
    cy.get(".multiselect__option")
      .eq(2)
      .should("include.text", "rooms.members.modals.add.no_result")
      .and("not.be.visible");
    cy.get(".multiselect__option")
      .eq(3)
      .should("include.text", "rooms.members.modals.add.no_options")
      .and("not.be.visible");

    // Select new user
    cy.get(".multiselect__option").eq(1).click();
    cy.get(".multiselect__content").should("not.be.visible");

    // Check that role checkboxes and labels are shown correctly
    cy.get('[data-test="participant-role-group"]').within(() => {
      cy.contains("rooms.roles.participant");
      cy.get("#participant-role").should("not.be.checked");
    });

    cy.get('[data-test="moderator-role-group"]').within(() => {
      cy.contains("rooms.roles.moderator");
      cy.get("#moderator-role").should("not.be.checked");
    });

    cy.get('[data-test="co-owner-role-group"]').within(() => {
      cy.contains("rooms.roles.co_owner");
      cy.get("#co_owner-role").should("not.be.checked");
    });

    // Select role (moderator)
    cy.get("#moderator-role").click();
    cy.get("#moderator-role").should("be.checked");

    // Add user to the room
    const addUserRequest = interceptIndefinitely(
      "POST",
      "/api/v1/rooms/abc-def-123/member",
      {
        statusCode: 204,
      },
      "addUserRequest",
    );

    cy.fixture("roomMembers.json").then((roomMembers) => {
      roomMembers.data.push({
        id: 10,
        firstname: "Laura",
        lastname: "Walter",
        email: "LauraMWalter@domain.tld",
        role: 2,
        image: null,
      });
      roomMembers.meta.per_page = 4;
      roomMembers.meta.to = 4;
      roomMembers.meta.total = 4;
      roomMembers.meta.total_no_filter = 4;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/member*", {
        statusCode: 200,
        body: roomMembers,
      }).as("roomMembersRequest");
    });

    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "rooms.members.modals.add.add")
      .click();

    // Check loading and send response
    cy.get('[data-test="select-user-dropdown"]')
      .find("input")
      .should("be.disabled");

    cy.get("#participant-role").should("be.disabled");
    cy.get("#moderator-role").should("be.disabled");
    cy.get("#co_owner-role").should("be.disabled");

    cy.get('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.cancel")
      .and("be.disabled");
    cy.get('[data-test="dialog-save-button"]')
      .should("be.disabled")
      .then(() => {
        addUserRequest.sendResponse();
      });

    // Check that correct data was sent
    cy.wait("@addUserRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        user: 10,
        role: 2,
      });
    });

    cy.wait("@roomMembersRequest");

    cy.get('[data-test="room-members-add-single-dialog"]').should("not.exist");

    // Check that new member is shown
    cy.get('[data-test="room-member-item"]').should("have.length", 4);

    cy.get('[data-test="room-member-item"]').eq(3).should("include.text", "LW");
    cy.get('[data-test="room-member-item"]')
      .eq(3)
      .should("include.text", "Laura Walter");
    cy.get('[data-test="room-member-item"]')
      .eq(3)
      .should("include.text", "LauraMWalter@domain.tld");
    cy.get('[data-test="room-member-item"]')
      .eq(3)
      .should("include.text", "rooms.roles.moderator");
  });

  it("add new member errors", function () {
    cy.visit("/rooms/abc-def-123#tab=members");
    cy.wait("@roomRequest");

    cy.wait("@roomMembersRequest");

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get("#overlay_menu_0")
      .should("have.text", "rooms.members.add_single_user")
      .click();

    cy.get('[data-test="room-members-add-single-dialog"]').should("be.visible");

    // Test 500 error on user search
    cy.intercept("GET", "/api/v1/users/search?query=*", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("userSearchRequest");

    cy.get('[data-test="select-user-dropdown"]').click();
    cy.get('[data-test="select-user-dropdown"]').find("input").type("L");

    cy.wait("@userSearchRequest");

    // Check that dialog is still open and error message is shown
    cy.get('[data-test="room-members-add-single-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-members-add-single-dialog"]').should("not.exist");

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-members-add-button"]').click();
        cy.get("#overlay_menu_0")
          .should("have.text", "rooms.members.add_single_user")
          .click();
        cy.get('[data-test="room-members-add-single-dialog"]').should(
          "be.visible",
        );
        cy.get('[data-test="select-user-dropdown"]').click();
        cy.get('[data-test="select-user-dropdown"]').find("input").type("a");
      },
      "GET",
      "/api/v1/users/search?query=*",
      "members",
    );

    // Reload page to check other errors
    cy.intercept("GET", "api/v1/rooms/abc-def-123", {
      fixture: "room.json",
    }).as("roomRequest");
    cy.reload();
    cy.wait("@roomRequest");
    cy.get("#tab-members").click();

    cy.wait("@roomMembersRequest");

    cy.get('[data-test="room-members-add-button"]').click();

    cy.get("#overlay_menu_0")
      .should("have.text", "rooms.members.add_single_user")
      .click();

    cy.get('[data-test="room-members-add-single-dialog"]').should("be.visible");

    cy.intercept("GET", "/api/v1/users/search?query=*", {
      statusCode: 200,
      body: {
        data: [
          {
            id: 5,
            firstname: "Laura",
            lastname: "Rivera",
            email: "LauraWRivera@domain.tld",
            image: null,
          },
          {
            id: 10,
            firstname: "Laura",
            lastname: "Walter",
            email: "LauraMWalter@domain.tld",
            image: null,
          },
        ],
      },
    }).as("userSearchRequest");

    cy.get('[data-test="select-user-dropdown"]').click();
    cy.get('[data-test="select-user-dropdown"]').find("input").type("L");

    cy.wait("@userSearchRequest");

    // Select new user
    cy.get(".multiselect__content").should("be.visible");
    cy.get(".multiselect__option").eq(1).click();
    cy.get(".multiselect__content").should("not.be.visible");

    // Try to add user to the room and respond with 422 error (role missing)
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/member", {
      statusCode: 422,
      body: {
        message: "The Role field is required.",
        errors: {
          role: ["The Role field is required."],
        },
      },
    }).as("addUserRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@addUserRequest");

    cy.get('[data-test="room-members-add-single-dialog"]')
      .should("be.visible")
      .and("include.text", "The Role field is required.");

    // Select role (participant)
    cy.get("#participant-role").click();

    // Try to add user to the room and respond with 422 error (user is already a member of the room)
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/member", {
      statusCode: 422,
      body: {
        message: "The given data was invalid.",
        errors: {
          user: ["The user is already member of the room."],
        },
      },
    }).as("addUserRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@addUserRequest");

    cy.get('[data-test="room-members-add-single-dialog"]')
      .should("be.visible")
      .and("include.text", "The user is already member of the room.");

    // Try to add user to the room and respond with 500 error
    cy.intercept("POST", "/api/v1/rooms/abc-def-123/member", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("addUserRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@addUserRequest");

    // Check that dialog is still open and that error message gets shown
    cy.get('[data-test="room-members-add-single-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-members-add-single-dialog"]').should("not.exist");

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-members-add-button"]').click();
        cy.get("#overlay_menu_0")
          .should("have.text", "rooms.members.add_single_user")
          .click();
        cy.get('[data-test="room-members-add-single-dialog"]').should(
          "be.visible",
        );
        cy.get('[data-test="dialog-save-button"]').click();
      },
      "POST",
      "/api/v1/rooms/abc-def-123/member",
      "members",
    );
  });

  it("edit member", function () {
    cy.visit("/rooms/abc-def-123#tab=members");

    cy.wait("@roomMembersRequest");

    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .should("include.text", "rooms.roles.participant");

    // Open edit dialog
    cy.get('[data-test="room-members-edit-dialog"]').should("not.exist");

    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .find('[data-test="room-members-edit-button"]')
      .click();

    cy.get('[data-test="room-members-edit-dialog"]').should("be.visible");

    // Check that roles are shown correctly
    cy.get('[data-test="participant-role-group"]').within(() => {
      cy.contains("rooms.roles.participant");
      cy.get("#participant-role").should("be.checked");
    });

    cy.get('[data-test="moderator-role-group"]').within(() => {
      cy.contains("rooms.roles.moderator");
      cy.get("#moderator-role").should("not.be.checked");
    });

    cy.get('[data-test="co-owner-role-group"]').within(() => {
      cy.contains("rooms.roles.co_owner");
      cy.get("#co_owner-role").should("not.be.checked");
    });

    // Select new role (moderator)
    cy.get("#moderator-role").click();
    cy.get("#participant-role").should("not.be.checked");
    cy.get("#moderator-role").should("be.checked");

    // Save changes
    const editUserRequest = interceptIndefinitely(
      "PUT",
      "/api/v1/rooms/abc-def-123/member/5",
      {
        statusCode: 204,
      },
      "editUserRequest",
    );

    cy.fixture("roomMembers.json").then((roomMembers) => {
      roomMembers.data[0].role = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/member*", {
        statusCode: 200,
        body: roomMembers,
      }).as("roomMembersRequest");
    });

    cy.get('[data-test="dialog-save-button"]')
      .should("have.text", "app.save")
      .click();

    // Check loading and send response
    cy.get('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.cancel")
      .and("be.disabled");
    cy.get('[data-test="dialog-save-button"]')
      .should("be.disabled")
      .then(() => {
        editUserRequest.sendResponse();
      });

    cy.wait("@editUserRequest").then((interception) => {
      expect(interception.request.body).to.eql({
        role: 2,
      });
    });

    cy.wait("@roomMembersRequest");

    cy.get('[data-test="room-members-edit-dialog"]').should("not.exist");

    // Check that role was updated
    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .should("include.text", "rooms.roles.moderator");
  });

  it("edit member errors", function () {
    cy.visit("/rooms/abc-def-123#tab=members");

    cy.wait("@roomMembersRequest");

    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .find('[data-test="room-members-edit-button"]')
      .click();
    cy.get('[data-test="room-members-edit-dialog"]').should("be.visible");

    // Check with member gone
    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/member/5", {
      statusCode: 410,
      body: {
        message: "The person is not a member of this room (anymore).",
      },
    }).as("editUserRequest");

    cy.fixture("roomMembers.json").then((roomMembers) => {
      roomMembers.data = roomMembers.data.slice(1, 3);
      roomMembers.meta.to = 2;
      roomMembers.meta.total = 2;
      roomMembers.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/member*", {
        statusCode: 200,
        body: roomMembers,
      }).as("roomMembersRequest");
    });

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editUserRequest");

    // Check that room members get reloaded and dialog gets closed
    cy.wait("@roomMembersRequest");

    cy.get('[data-test="room-members-edit-dialog"]').should("not.exist");

    cy.get('[data-test="room-member-item"]').should("have.length", 2);

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"The person is not a member of this room (anymore)."}',
      'app.flash.server_error.error_code_{"statusCode":410}',
    ]);

    // Check with 422 error
    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .find('[data-test="room-members-edit-button"]')
      .click();
    cy.get('[data-test="room-members-edit-dialog"]').should("be.visible");

    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/member/6", {
      statusCode: 422,
      body: {
        errors: {
          role: ["The selected role is invalid."],
        },
      },
    }).as("editUserRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editUserRequest");

    // Check that dialog is still open and that error message gets shown
    cy.get('[data-test="room-members-edit-dialog"]')
      .should("be.visible")
      .and("include.text", "The selected role is invalid.");

    // Check with 500 error
    cy.intercept("PUT", "/api/v1/rooms/abc-def-123/member/6", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("editUserRequest");

    cy.get('[data-test="dialog-save-button"]').click();

    cy.wait("@editUserRequest");

    // Check that dialog is still open and that error message gets shown
    cy.get('[data-test="room-members-edit-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-members-edit-dialog"]').should("not.exist");

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-member-item"]')
          .eq(0)
          .find('[data-test="room-members-edit-button"]')
          .click();
        cy.get('[data-test="room-members-edit-dialog"]').should("be.visible");
        cy.get('[data-test="dialog-save-button"]').click();
      },
      "PUT",
      "/api/v1/rooms/abc-def-123/member/6",
      "members",
    );
  });

  it("delete member", function () {
    cy.visit("/rooms/abc-def-123#tab=members");

    cy.wait("@roomMembersRequest");

    cy.get('[data-test="room-member-item"]').should("have.length", 3);

    // Open delete member dialog
    cy.get('[data-test="room-members-delete-dialog"]').should("not.exist");
    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .find('[data-test="room-members-delete-button"]')
      .click();
    cy.get('[data-test="room-members-delete-dialog"]').should("be.visible");

    // Check that dialog shows correct data
    cy.get('[data-test="room-members-delete-dialog"]')
      .should("be.visible")
      .should("include.text", "rooms.members.modals.remove.title")
      .should(
        "include.text",
        'rooms.members.modals.remove.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );

    // Confirm delete of member
    const deleteMemberRequest = interceptIndefinitely(
      "DELETE",
      "/api/v1/rooms/abc-def-123/member/5",
      {
        statusCode: 204,
      },
      "deleteMemberRequest",
    );

    cy.fixture("roomMembers.json").then((roomMembers) => {
      roomMembers.data = roomMembers.data.slice(1, 3);
      roomMembers.meta.to = 2;
      roomMembers.meta.total = 2;
      roomMembers.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/member*", {
        statusCode: 200,
        body: roomMembers,
      }).as("roomMembersRequest");
    });

    cy.get('[data-test="dialog-continue-button"]')
      .should("have.text", "app.yes")
      .click();
    cy.get('[data-test="dialog-cancel-button"]')
      .should("have.text", "app.no")
      .and("be.disabled");
    cy.get('[data-test="dialog-continue-button"]')
      .should("be.disabled")
      .then(() => {
        deleteMemberRequest.sendResponse();
      });

    cy.wait("@deleteMemberRequest");
    cy.wait("@roomMembersRequest");

    // Check that member was deleted
    cy.get('[data-test="room-member-item"]').should("have.length", 2);

    // Check that delete dialog is closed
    cy.get('[data-test="room-members-delete-dialog"]').should("not.exist");
  });

  it("delete member errors", function () {
    cy.visit("/rooms/abc-def-123#tab=members");

    cy.wait("@roomMembersRequest");

    cy.get('[data-test="room-member-item"]').should("have.length", 3);

    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .find('[data-test="room-members-delete-button"]')
      .click();
    cy.get('[data-test="room-members-delete-dialog"]').should("be.visible");

    // Check delete with member gone
    cy.intercept("DELETE", "/api/v1/rooms/abc-def-123/member/5", {
      statusCode: 410,
      body: {
        message: "The person is not a member of this room (anymore).",
      },
    }).as("deleteMemberRequest");

    cy.fixture("roomMembers.json").then((roomMembers) => {
      roomMembers.data = roomMembers.data.slice(1, 3);
      roomMembers.meta.to = 2;
      roomMembers.meta.total = 2;
      roomMembers.meta.total_no_filter = 2;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/member*", {
        statusCode: 200,
        body: roomMembers,
      }).as("roomMembersRequest");
    });

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteMemberRequest");
    cy.wait("@roomMembersRequest");

    // Check that user list was updated and dialog is closed
    cy.get('[data-test="room-members-delete-dialog"]').should("not.exist");
    cy.get('[data-test="room-member-item"]').should("have.length", 2);

    // Check that error message is shown
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"The person is not a member of this room (anymore)."}',
      'app.flash.server_error.error_code_{"statusCode":410}',
    ]);

    // Check with 500 error
    cy.get('[data-test="room-member-item"]')
      .eq(0)
      .find('[data-test="room-members-delete-button"]')
      .click();
    cy.get('[data-test="room-members-delete-dialog"]').should("be.visible");

    // Check delete with member gone
    cy.intercept("DELETE", "/api/v1/rooms/abc-def-123/member/6", {
      statusCode: 500,
      body: {
        message: "Test",
      },
    }).as("deleteMemberRequest");

    cy.get('[data-test="dialog-continue-button"]').click();

    cy.wait("@deleteMemberRequest");

    // Check that dialog is still open and that error message gets shown
    cy.get('[data-test="room-members-delete-dialog"]').should("be.visible");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Close dialog
    cy.get('[data-test="dialog-cancel-button"]').click();
    cy.get('[data-test="room-members-delete-dialog"]').should("not.exist");

    cy.checkRoomAuthErrors(
      () => {
        cy.get('[data-test="room-member-item"]')
          .eq(0)
          .find('[data-test="room-members-delete-button"]')
          .click();
        cy.get('[data-test="room-members-delete-dialog"]').should("be.visible");
        cy.get('[data-test="dialog-continue-button"]').click();
      },
      "DELETE",
      "/api/v1/rooms/abc-def-123/member/6",
      "members",
    );
  });
});
