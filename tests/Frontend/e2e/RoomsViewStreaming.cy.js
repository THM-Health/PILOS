describe("Rooms view streaming", function () {
  beforeEach(function () {
    cy.init();
    cy.fixture("config.json").then((config) => {
      config.data.general.hide_disabled_features = true;
      config.data.streaming.enabled = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });
    cy.fixture("room.json").then((room) => {
      room.data.type.features.streaming.enabled = true;
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      fixture: "roomStreamingStatus.json",
    }).as("roomStreamingStatus");
  });

  it("no running meeting, room was never started", function () {
    cy.visit("/rooms/abc-def-123");

    cy.get("#tab-streaming").click();

    // Check if status is no running meeting
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.no_running_meeting",
    );

    // Check all action buttons are disabled
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");
  });

  it("no running meeting, meeting ended", function () {
    cy.fixture("room.json").then((room) => {
      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T08:20:00.000000Z",
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.get("#tab-streaming").click();

    // Check if status is no running meeting
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.no_running_meeting",
    );

    // Check all action buttons are disabled
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");
  });

  it("running meeting, streaming disabled", function () {
    cy.fixture("room.json").then((room) => {
      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.fixture("roomStreamingStatus.json").then((data) => {
      data.data.enabled_for_current_meeting = false;
      cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
        statusCode: 200,
        body: data,
      }).as("roomStreamingStatus");
    });

    cy.visit("/rooms/abc-def-123");

    cy.get("#tab-streaming").click();

    // Check if status is no running meeting
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.not_enabled_for_running_meeting",
    );

    // Check all action buttons are disabled
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");
  });

  it("fps counter is shown", function () {
    cy.fixture("room.json").then((room) => {
      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.fixture("roomStreamingStatus.json").then((data) => {
      data.data.enabled_for_current_meeting = false;
      data.data.fps = 30;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
        statusCode: 200,
        body: data,
      }).as("roomStreamingStatus");
    });

    cy.fixture("config.json").then((config) => {
      config.data.general.hide_disabled_features = true;
      config.data.streaming.enabled = true;
      config.data.streaming.show_fps = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    cy.visit("/rooms/abc-def-123");

    cy.get("#tab-streaming").click();

    // Check if fps counter is shown
    cy.get('[data-test="streaming-fps-counter"]').should("exist");
    cy.get('[data-test="streaming-fps-counter"]').should(
      "contain",
      'rooms.streaming.fps_{"fps":30}',
    );

    // Disable the fps counter in global config
    cy.fixture("config.json").then((config) => {
      config.data.general.hide_disabled_features = true;
      config.data.streaming.enabled = true;
      config.data.streaming.show_fps = false;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Reload the page
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    // Check if fps counter is not shown
    cy.get('[data-test="streaming-fps-counter"]').should("not.exist");
  });

  it("start, pause, resume and stop streaming", function () {
    cy.fixture("room.json").then((room) => {
      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");

    cy.get("#tab-streaming").click();

    // Check if no status is shown
    cy.get('[data-test="streaming-status"]').should("not.exist");

    // Check only start button is enabled
    cy.get('[data-test="streaming-start-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Start streaming
    cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/start", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "queued",
          fps: null,
        },
      },
    }).as("startStreaming");
    cy.get('[data-test="streaming-start-button"]').click();

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Check if status is queued
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.queued",
    );

    // Reload status
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "starting",
          fps: null,
        },
      },
    }).as("roomStreamingStatus");
    cy.get('[data-test="streaming-reload-button"]').click();
    cy.wait("@roomStreamingStatus");

    // Check if status is starting
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.starting",
    );

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Reload status
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "running",
          fps: 30,
        },
      },
    }).as("roomStreamingStatus");
    cy.get('[data-test="streaming-reload-button"]').click();
    cy.wait("@roomStreamingStatus");

    // Check if status is running
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.running",
    );

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Pause streaming
    cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/pause", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "pausing",
          fps: "30",
        },
      },
    }).as("pauseStreaming");
    cy.get('[data-test="streaming-pause-button"]').click();
    cy.wait("@pauseStreaming");

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Check if status is pausing
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.pausing",
    );

    // Reload status
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "paused",
          fps: 30,
        },
      },
    }).as("roomStreamingStatus");
    cy.get('[data-test="streaming-reload-button"]').click();
    cy.wait("@roomStreamingStatus");

    // Check if status is paused
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.paused",
    );

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("not.be.disabled");

    // Resume streaming
    cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/resume", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "resuming",
          fps: 30,
        },
      },
    }).as("resumeStreaming");
    cy.get('[data-test="streaming-resume-button"]').click();
    cy.wait("@resumeStreaming");

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Check if status is resuming
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.resuming",
    );

    // Reload status
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "running",
          fps: 30,
        },
      },
    }).as("roomStreamingStatus");
    cy.get('[data-test="streaming-reload-button"]').click();
    cy.wait("@roomStreamingStatus");

    // Check if status is running
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.running",
    );

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Stop streaming
    cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/stop", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "stopping",
          fps: 30,
        },
      },
    }).as("stopStreaming");
    cy.get('[data-test="streaming-stop-button"]').click();
    cy.wait("@stopStreaming");

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Check if status is stopping
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.stopping",
    );

    // Reload status
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "stopped",
          fps: null,
        },
      },
    }).as("roomStreamingStatus");
    cy.get('[data-test="streaming-reload-button"]').click();
    cy.wait("@roomStreamingStatus");

    // Check if status is stopped
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.stopped",
    );

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Start again, this time failing
    cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/start", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: "failed",
          fps: null,
        },
      },
    }).as("startStreaming");
    cy.get('[data-test="streaming-start-button"]').click();
    cy.wait("@startStreaming");

    // Check button status
    cy.get('[data-test="streaming-start-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // Check if status is failed
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.failed",
    );
  });

  it("load settings with different permissions", function () {
    // Check as co-owner
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.is_member = true;
      room.data.is_co_owner = true;

      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.fixture("roomStreamingStatus.json").then((data) => {
      data.data.enabled_for_current_meeting = true;
      data.data.status = "running";
      data.data.fps = 30;

      cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
        statusCode: 200,
        body: data,
      }).as("roomStreamingStatus");
    });

    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    // Check button and status are shown
    cy.get('[data-test="streaming-start-button"]').should("exist");
    cy.get('[data-test="streaming-stop-button"]').should("exist");
    cy.get('[data-test="streaming-pause-button"]').should("exist");
    cy.get('[data-test="streaming-resume-button"]').should("exist");
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.running",
    );

    // Check with rooms.viewAll permission
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

      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    // Check buttons are missing, but status is shown
    cy.get('[data-test="streaming-start-button"]').should("not.exist");
    cy.get('[data-test="streaming-stop-button"]').should("not.exist");
    cy.get('[data-test="streaming-pause-button"]').should("not.exist");
    cy.get('[data-test="streaming-resume-button"]').should("not.exist");
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.running",
    );

    // Check with rooms.manage permission
    cy.fixture("currentUser.json").then((currentUser) => {
      currentUser.data.permissions = [
        "rooms.create",
        "rooms.viewAll",
        "rooms.manage",
      ];
      cy.intercept("GET", "api/v1/currentUser", {
        statusCode: 200,
        body: currentUser,
      });
    });
    cy.fixture("room.json").then((room) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.current_user.permissions = [
        "rooms.create",
        "rooms.viewAll",
        "rooms.manage",
      ];

      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    // Check buttons and status are shown
    cy.get('[data-test="streaming-start-button"]').should("exist");
    cy.get('[data-test="streaming-stop-button"]').should("exist");
    cy.get('[data-test="streaming-pause-button"]').should("exist");
    cy.get('[data-test="streaming-resume-button"]').should("exist");
    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.running",
    );
  });

  it("auto reloading", function () {
    cy.clock();
    cy.fixture("room.json").then((room) => {
      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");

      cy.fixture("roomStreamingStatus.json").then((data) => {
        data.data.enabled_for_current_meeting = true;
        data.data.status = "queued";
        data.data.fps = 30;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
          statusCode: 200,
          body: data,
        }).as("roomStreamingStatus");
      });

      cy.fixture("config.json").then((config) => {
        config.data.general.hide_disabled_features = true;
        config.data.streaming.enabled = true;
        config.data.streaming.refresh_interval = 30;

        cy.intercept("GET", "api/v1/config", {
          statusCode: 200,
          body: config,
        });
      });

      cy.visit("/rooms/abc-def-123");
      cy.get("#tab-streaming").click();
      cy.wait("@roomStreamingStatus");

      // Check if status is queued
      cy.get('[data-test="streaming-status"]').should(
        "contain",
        "rooms.streaming.queued",
      );

      cy.fixture("roomStreamingStatus.json").then((data) => {
        data.data.enabled_for_current_meeting = true;
        data.data.status = "running";
        data.data.fps = 30;

        cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
          statusCode: 200,
          body: data,
        }).as("roomStreamingStatus");
      });
      cy.tick(30000);
      cy.wait("@roomStreamingStatus");
      cy.get('[data-test="streaming-status"]').should(
        "contain",
        "rooms.streaming.running",
      );
    });
  });

  it("error handling", function () {
    cy.fixture("room.json").then((room) => {
      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });

    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    // Check buttons
    cy.get('[data-test="streaming-start-button"]').should("not.be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    // General error on reload
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      statusCode: 500,
      body: {
        message: "Internal Server Error",
      },
    }).as("roomStreamingStatus");
    cy.get('[data-test="streaming-reload-button"]').click();
    cy.wait("@roomStreamingStatus");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Internal Server Error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // General error on start streaming
    cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/start", {
      statusCode: 500,
      body: {
        message: "Internal Server Error",
      },
    }).as("startStreaming");
    cy.get('[data-test="streaming-start-button"]').click();
    cy.wait("@startStreaming");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Internal Server Error"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);

    // Error streaming not enabled for current meeting
    cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/start", {
      statusCode: 412,
      body: {
        message: "Streaming is not enabled for the current meeting.",
      },
    }).as("startStreaming");
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: false,
          status: null,
          fps: null,
        },
      },
    }).as("roomStreamingStatus");
    cy.get('[data-test="streaming-start-button"]').click();
    cy.wait("@startStreaming");
    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"Streaming is not enabled for the current meeting."}',
      'app.flash.server_error.error_code_{"statusCode":412}',
    ]);
    // Check settings are reloaded
    cy.wait("@roomStreamingStatus");

    // Check buttons and status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.not_enabled_for_running_meeting",
    );

    // Reload
    cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
      statusCode: 200,
      body: {
        data: {
          enabled_for_current_meeting: true,
          status: null,
          fps: null,
        },
      },
    }).as("roomStreamingStatus");
    cy.get('[data-test="streaming-reload-button"]').click();
    cy.wait("@roomStreamingStatus");

    // Error meeting not running
    cy.intercept("POST", "api/v1/rooms/abc-def-123/streaming/start", {
      statusCode: 460,
      body: {
        message: "The meeting is not running.",
      },
    }).as("startStreaming");
    cy.fixture("room.json").then((room) => {
      room.data.type.features.streaming.enabled = true;
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T08:20:00.000000Z",
      };
      cy.intercept("GET", "api/v1/rooms/abc-def-123", {
        statusCode: 200,
        body: room,
      }).as("roomRequest");
    });
    cy.get('[data-test="streaming-start-button"]').click();
    cy.wait("@startStreaming");

    cy.checkToastMessage([
      'app.flash.server_error.message_{"message":"The meeting is not running."}',
      'app.flash.server_error.error_code_{"statusCode":460}',
    ]);

    // Check room is reloaded
    cy.wait("@roomRequest");

    // Check buttons and status
    cy.get('[data-test="streaming-start-button"]').should("be.disabled");
    cy.get('[data-test="streaming-stop-button"]').should("be.disabled");
    cy.get('[data-test="streaming-pause-button"]').should("be.disabled");
    cy.get('[data-test="streaming-resume-button"]').should("be.disabled");

    cy.get('[data-test="streaming-status"]').should(
      "contain",
      "rooms.streaming.no_running_meeting",
    );
  });
});
