import { Request, Response } from 'express';

class ApiDocsController {
  async getApiDocs(req: Request, res: Response): Promise<void> {
    try {
      const openApiSpec = {
        openapi: "3.0.0",
        info: {
          title: "GitHub Value API",
          version: "1.0.0",
          description: "API for GitHub Value - Copilot ROI and adoption tracking"
        },
        servers: [
          {
            url: `${req.protocol}://${req.get('host')}/api`,
            description: "Main API server"
          }
        ],
        paths: {
          "/survey": {
            get: {
              summary: "Get all surveys",
              parameters: [
                {
                  name: "org",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by organization"
                },
                {
                  name: "team",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by team"
                },
                {
                  name: "reasonLength",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by reason length"
                },
                {
                  name: "since",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by start date (ISO format)"
                },
                {
                  name: "until",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by end date (ISO format)"
                },
                {
                  name: "status",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by status"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Survey" }
                      }
                    }
                  }
                }
              }
            },
            post: {
              summary: "Create a new survey",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/NewSurvey" }
                  }
                }
              },
              responses: {
                "201": {
                  description: "Survey created",
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/Survey" }
                    }
                  }
                }
              }
            }
          },
          "/survey/{id}": {
            get: {
              summary: "Get survey by ID",
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: { type: "integer" },
                  description: "Survey ID"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/Survey" }
                    }
                  }
                },
                "404": {
                  description: "Survey not found"
                }
              }
            },
            put: {
              summary: "Update survey by ID",
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: { type: "integer" },
                  description: "Survey ID"
                }
              ],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/UpdateSurvey" }
                  }
                }
              },
              responses: {
                "200": {
                  description: "Survey updated",
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/Survey" }
                    }
                  }
                },
                "404": {
                  description: "Survey not found"
                }
              }
            },
            delete: {
              summary: "Delete survey by ID",
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: { type: "integer" },
                  description: "Survey ID"
                }
              ],
              responses: {
                "204": {
                  description: "Survey deleted"
                },
                "404": {
                  description: "Survey not found"
                }
              }
            }
          },
          "/survey/{id}/github": {
            post: {
              summary: "Update survey GitHub comment",
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: { type: "integer" },
                  description: "Survey ID"
                }
              ],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/UpdateSurvey" }
                  }
                }
              },
              responses: {
                "201": {
                  description: "Survey GitHub comment updated",
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/Survey" }
                    }
                  }
                }
              }
            }
          },
          "/metrics": {
            get: {
              summary: "Get metrics",
              parameters: [
                {
                  name: "org",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by organization"
                },
                {
                  name: "since",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by start date (ISO format)"
                },
                {
                  name: "until",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by end date (ISO format)"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Metric" }
                      }
                    }
                  }
                }
              }
            }
          },
          "/metrics/totals": {
            get: {
              summary: "Get metrics totals",
              parameters: [
                {
                  name: "org",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by organization"
                },
                {
                  name: "since",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by start date (ISO format)"
                },
                {
                  name: "until",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by end date (ISO format)"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            }
          },
          "/seats": {
            get: {
              summary: "Get all seats",
              parameters: [
                {
                  name: "org",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by organization"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Seat" }
                      }
                    }
                  }
                }
              }
            }
          },
          "/seats/activity": {
            get: {
              summary: "Get seats activity",
              parameters: [
                {
                  name: "enterprise",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by enterprise"
                },
                {
                  name: "org",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by organization"
                },
                {
                  name: "team",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by team"
                },
                {
                  name: "since",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by start date (ISO format)"
                },
                {
                  name: "until",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by end date (ISO format)"
                },
                {
                  name: "seats",
                  in: "query",
                  schema: { type: "string", enum: ["0", "1"] },
                  description: "Include seat data (1 to include)"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            }
          },
          "/seats/activity/totals": {
            get: {
              summary: "Get seats activity totals",
              parameters: [
                {
                  name: "org",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by organization"
                },
                {
                  name: "since",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by start date (ISO format)"
                },
                {
                  name: "until",
                  in: "query",
                  schema: { type: "string", format: "date-time" },
                  description: "Filter by end date (ISO format)"
                },
                {
                  name: "limit",
                  in: "query",
                  schema: { type: "integer" },
                  description: "Limit results"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            }
          },
          "/seats/{id}": {
            get: {
              summary: "Get seat by ID or login",
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: { type: "string" },
                  description: "Seat ID or login"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/Seat" }
                    }
                  }
                }
              }
            }
          },
          "/teams": {
            get: {
              summary: "Get all teams",
              parameters: [
                {
                  name: "org",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by organization"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Team" }
                      }
                    }
                  }
                }
              }
            }
          },
          "/members": {
            get: {
              summary: "Get all members",
              parameters: [
                {
                  name: "org",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by organization"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Member" }
                      }
                    }
                  }
                }
              }
            }
          },
          "/members/search": {
            get: {
              summary: "Search members by login",
              parameters: [
                {
                  name: "query",
                  in: "query",
                  required: true,
                  schema: { type: "string" },
                  description: "Search query"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Member" }
                      }
                    }
                  }
                }
              }
            }
          },
          "/members/{login}": {
            get: {
              summary: "Get member by login",
              parameters: [
                {
                  name: "login",
                  in: "path",
                  required: true,
                  schema: { type: "string" },
                  description: "Member login"
                },
                {
                  name: "exact",
                  in: "query",
                  schema: { type: "string", enum: ["true", "false"] },
                  description: "Exact match ('true' for exact)"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/Member" }
                    }
                  }
                },
                "404": {
                  description: "Member not found"
                }
              }
            }
          },
          "/settings": {
            get: {
              summary: "Get all settings",
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          settings: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Setting" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            post: {
              summary: "Create settings",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Setting" }
                  }
                }
              },
              responses: {
                "201": {
                  description: "Settings created"
                }
              }
            },
            put: {
              summary: "Update settings",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Setting" }
                  }
                }
              },
              responses: {
                "200": {
                  description: "Settings updated"
                }
              }
            }
          },
          "/settings/{name}": {
            get: {
              summary: "Get settings by name",
              parameters: [
                {
                  name: "name",
                  in: "path",
                  required: true,
                  schema: { type: "string" },
                  description: "Setting name"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/Setting" }
                    }
                  }
                },
                "404": {
                  description: "Setting not found"
                }
              }
            },
            delete: {
              summary: "Delete settings by name",
              parameters: [
                {
                  name: "name",
                  in: "path",
                  required: true,
                  schema: { type: "string" },
                  description: "Setting name"
                }
              ],
              responses: {
                "200": {
                  description: "Setting deleted"
                }
              }
            }
          },
          "/setup/registration/complete": {
            get: {
              summary: "Complete GitHub App registration",
              parameters: [
                {
                  name: "code",
                  in: "query",
                  required: true,
                  schema: { type: "string" },
                  description: "GitHub code"
                }
              ],
              responses: {
                "302": {
                  description: "Redirect to GitHub App installation page"
                }
              }
            }
          },
          "/setup/install/complete": {
            get: {
              summary: "Complete GitHub App installation",
              responses: {
                "302": {
                  description: "Redirect to home page"
                }
              }
            }
          },
          "/setup/install": {
            get: {
              summary: "Get GitHub App installation",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        owner: { type: "string" }
                      }
                    }
                  }
                }
              },
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            }
          },
          "/setup/manifest": {
            get: {
              summary: "Get GitHub App manifest",
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            }
          },
          "/setup/existing-app": {
            post: {
              summary: "Add existing GitHub App",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["appId", "privateKey", "webhookSecret"],
                      properties: {
                        appId: { type: "string" },
                        privateKey: { type: "string" },
                        webhookSecret: { type: "string" }
                      }
                    }
                  }
                }
              },
              responses: {
                "200": {
                  description: "Successful response"
                },
                "400": {
                  description: "Missing required fields"
                }
              }
            }
          },
          "/setup/db": {
            post: {
              summary: "Set up database connection",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["uri"],
                      properties: {
                        uri: { type: "string" }
                      }
                    }
                  }
                }
              },
              responses: {
                "200": {
                  description: "Database setup started"
                }
              }
            }
          },
          "/setup/status": {
            get: {
              summary: "Get setup status",
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            }
          },
          "/status": {
            get: {
              summary: "Get application status",
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            }
          },
          "/targets": {
            get: {
              summary: "Get target values",
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            },
            post: {
              summary: "Update target values",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TargetValues" }
                  }
                }
              },
              responses: {
                "200": {
                  description: "Target values updated"
                }
              }
            }
          },
          "/targets/calculate": {
            get: {
              summary: "Calculate target values",
              parameters: [
                {
                  name: "org",
                  in: "query",
                  schema: { type: "string", default: "enterprise" },
                  description: "Organization (defaults to 'enterprise')"
                },
                {
                  name: "enableLogging",
                  in: "query",
                  schema: { type: "string", enum: ["true", "false"] },
                  description: "Enable logging ('true' to enable)"
                },
                {
                  name: "includeLogs",
                  in: "query",
                  schema: { type: "string", enum: ["true", "false"] },
                  description: "Include logs in response ('true' to include)"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            }
          },
          "/docs": {
            get: {
              summary: "Get API documentation",
              parameters: [
                {
                  name: "format",
                  in: "query",
                  schema: { type: "string", enum: ["json", "html"] },
                  description: "Documentation format (html for interactive UI)"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response"
                }
              }
            }
          }
        },
        components: {
          schemas: {
            Survey: {
              type: "object",
              properties: {
                id: { type: "integer" },
                status: { type: "string", enum: ["pending", "completed"] },
                hits: { type: "integer" },
                userId: { type: "string" },
                org: { type: "string" },
                repo: { type: "string" },
                prNumber: { type: "integer" },
                usedCopilot: { type: "boolean" },
                percentTimeSaved: { type: "number" },
                reason: { type: "string" },
                timeUsedFor: { type: "string" }
              }
            },
            NewSurvey: {
              type: "object",
              required: ["status", "userId", "org", "repo", "prNumber", "usedCopilot"],
              properties: {
                status: { type: "string", enum: ["pending", "completed"] },
                userId: { type: "string" },
                org: { type: "string" },
                repo: { type: "string" },
                prNumber: { type: "integer" },
                usedCopilot: { type: "boolean" },
                percentTimeSaved: { type: "number" },
                reason: { type: "string" },
                timeUsedFor: { type: "string" }
              }
            },
            UpdateSurvey: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["pending", "completed"] },
                usedCopilot: { type: "boolean" },
                percentTimeSaved: { type: "number" },
                reason: { type: "string" },
                timeUsedFor: { type: "string" }
              }
            },
            Metric: {
              type: "object",
              properties: {
                org: { type: "string" },
                date: { type: "string", format: "date-time" },
                completions: { type: "integer" },
                suggestions: { type: "integer" },
                acceptances: { type: "integer" }
              }
            },
            Seat: {
              type: "object",
              properties: {
                assignee_id: { type: "integer" },
                assignee_login: { type: "string" },
                last_activity_at: { type: "string", format: "date-time" },
                last_activity_editor: { type: "string" },
                created_at: { type: "string", format: "date-time" },
                assignee: {
                  type: "object",
                  properties: {
                    login: { type: "string" },
                    id: { type: "integer" },
                    avatar_url: { type: "string" }
                  }
                }
              }
            },
            Team: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                slug: { type: "string" },
                description: { type: "string" },
                privacy: { type: "string" },
                members_count: { type: "integer" }
              }
            },
            Member: {
              type: "object",
              properties: {
                login: { type: "string" },
                id: { type: "integer" },
                name: { type: "string" },
                avatar_url: { type: "string" },
                team: { type: "string" },
                org: { type: "string" },
                seat: { $ref: "#/components/schemas/Seat" }
              }
            },
            Setting: {
              type: "object",
              properties: {
                name: { type: "string" },
                value: { type: "string" },
                secure: { type: "boolean" }
              }
            },
            TargetValues: {
              type: "object",
              properties: {
                devCostPerYear: { type: "string" },
                developerCount: { type: "string" },
                hoursPerYear: { type: "string" },
                percentTimeSaved: { type: "string" },
                percentCoding: { type: "string" }
              }
            }
          }
        }
      };

      // Add a simplified HTML UI option
      if (req.query.format === 'html') {
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>GitHub Value API Documentation</title>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
            </head>
            <body>
              <div id="swagger-ui"></div>
              <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"> </script>
              <script>
                window.onload = function() {
                  const ui = SwaggerUIBundle({
                    spec: ${JSON.stringify(openApiSpec)},
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                      SwaggerUIBundle.presets.apis,
                      SwaggerUIBundle.SwaggerUIStandalonePreset
                    ],
                    layout: "BaseLayout"
                  });
                };
              </script>
            </body>
          </html>
        `);
        return;
      }

      res.status(200).json(openApiSpec);
    } catch {
      res.status(500).json({ error: "Failed to retrieve API documentation" });
    }
  }
}

export default new ApiDocsController();
