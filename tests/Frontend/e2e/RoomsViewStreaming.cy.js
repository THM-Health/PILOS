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

    cy.fixture("roomStreamingStatus.json").then((data) => {
      cy.intercept("GET", "api/v1/rooms/abc-def-123/streaming/status", {
        statusCode: 200,
        body: data,
      }).as("roomStreamingStatus");
    });
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
      config.data.streaming.show_fps = true;

      cy.intercept("GET", "api/v1/config", {
        statusCode: 200,
        body: config,
      });
    });

    // Reload the page
    cy.visit("/rooms/abc-def-123");
    cy.get("#tab-streaming").click();

    // Check if fps counter is not shown
    cy.get('[data-test="streaming-fps-counter"]').should("exist");
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

  it("auto reloading", function () {
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
        config.data.streaming.refresh_interval = 5;

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
      cy.wait("@roomStreamingStatus", {
        requestTimeout: 6000,
      });
      cy.get('[data-test="streaming-status"]').should(
        "contain",
        "rooms.streaming.running",
      );
    });
  });
});
