/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "commondataserviceforapps": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "SubscribeWebhookTrigger": {
        "path": "/{connectionId}/api/data/v9.1/callbackregistrations",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Consistency",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "subscriptionRequest",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "catalog",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "category",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListRecords": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "$select",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$expand",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchXml",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skiptoken",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "partitionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateRecord": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListRecordsWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "MSCRM.IncludeMipSensitivityLabel",
            "in": "header",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "$select",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$expand",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchXml",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skiptoken",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "partitionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateRecordWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetItem": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}({recordId})",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "$select",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$expand",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "partitionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteRecord": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}({recordId})",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "partitionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateRecord": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}({recordId})",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateOnlyRecord": {
        "path": "/{connectionId}/api/data/v9.2/{entityName}({recordId})",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "If-Match",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetItemWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}({recordId})",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "MSCRM.IncludeMipSensitivityLabel",
            "in": "header",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "$select",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$expand",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "partitionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteRecordWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}({recordId})",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "partitionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateRecordWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}({recordId})",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateOnlyRecordWithOrganization": {
        "path": "/{connectionId}/api/data/v9.2.0/{entityName}({recordId})",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "accept",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "If-Match",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "x-ms-odata-metadata-full",
            "in": "header",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "AssociateEntities": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}({recordId})/{associationEntityRelationship}/$ref",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "associationEntityRelationship",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DisassociateEntities": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}({recordId})/{associationEntityRelationship}/$ref",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "associationEntityRelationship",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$id",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "AssociateEntitiesWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}({recordId})/{associationEntityRelationship}/$ref",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "associationEntityRelationship",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DisassociateEntitiesWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}({recordId})/{associationEntityRelationship}/$ref",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "associationEntityRelationship",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$id",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "PerformUnboundAction": {
        "path": "/{connectionId}/flow/api/data/v9.1/{actionName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "actionName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "PerformUnboundActionWithOrganization": {
        "path": "/{connectionId}/flow/api/data/v9.1.0/{actionName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "actionName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "PerformBoundAction": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}({recordId})/{actionName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "actionName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "PerformBoundActionWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}({recordId})/{actionName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "actionName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ExecuteChangeset": {
        "path": "/{connectionId}/api/data/v9.1/$batch",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "UpdateEntityFileImageFieldContent": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}({recordId})/{fileImageFieldName}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "content-type",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fileImageFieldName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "string",
            "format": "binary"
          },
          {
            "name": "x-ms-file-name",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateEntityFileImageFieldContentWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}({recordId})/{fileImageFieldName}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "content-type",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fileImageFieldName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "string",
            "format": "binary"
          },
          {
            "name": "x-ms-file-name",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEntityFileImageFieldContent": {
        "path": "/{connectionId}/api/data/v9.1/{entityName}({recordId})/{fileImageFieldName}/$value",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Range",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fileImageFieldName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEntityFileImageFieldContentWithOrganization": {
        "path": "/{connectionId}/api/data/v9.1.0/{entityName}({recordId})/{fileImageFieldName}/$value",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Range",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "organization",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "recordId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fileImageFieldName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetRelevantRows": {
        "path": "/{connectionId}/api/search/v1.0/query",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "SearchRequest",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "BusinessEventsTrigger": {
        "path": "/{connectionId}/api/data/v9.2/callbackregistrations",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Consistency",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "catalog",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "category",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "subscriptionRequest",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "PerformBackgroundOperation": {
        "path": "/{connectionId}/api/data/v9.2/{actionName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "Consistency",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "x-ms-dyn-callback-url",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "catalog",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "category",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "actionName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "InvokeMCP": {
        "path": "/{connectionId}/api/mcp",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Mcp-Session-Id",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "InvokeMCPPreview": {
        "path": "/{connectionId}/api/mcp_preview",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Mcp-Session-Id",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_SalesMCPServer": {
        "path": "/{connectionId}/mcp/SalesMCPServer",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_ServiceMCPServer": {
        "path": "/{connectionId}/mcp/ServiceMCPServer",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_ERPMCPServer": {
        "path": "/{connectionId}/mcp/ERPMCPServer",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_DataverseMCPServer": {
        "path": "/{connectionId}/mcp/DataverseMCPServer",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_ContactCenterMCPServer": {
        "path": "/{connectionId}/mcp/ContactCenterMCPServer",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_ConversationOrchestratorMCPServer": {
        "path": "/{connectionId}/mcp/ConversationOrchestratorMCPServer",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      }
    }
  },
  "flowmanagement": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "ListApis": {
        "path": "/{connectionId}/apis",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetApi": {
        "path": "/{connectionId}/apis/{apiName}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "apiName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateConnection": {
        "path": "/{connectionId}/apis/{apiName}/connections",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "apiName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connection",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListConnections": {
        "path": "/{connectionId}/connections",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListUserEnvironments": {
        "path": "/{connectionId}/environments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListFlowOwners": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}/owners",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ModifyFlowOwners": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}/modifyOwners",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "permissions",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListFlowUsers": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}/users",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ModifyRunOnlyUsers": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}/modifyUsers",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "permissions",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListMyFlows": {
        "path": "/{connectionId}/environments/{environmentName}/flows",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateFlow": {
        "path": "/{connectionId}/environments/{environmentName}/flows",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Flow",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetFlow": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteFlow": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateFlow": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Flow",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "StopFlow": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}/stop",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "StartFlow": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}/start",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ResubmitFlow": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}/triggers/{triggerName}/histories/{runId}/resubmit",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "triggerName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "runId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListCallbackUrl": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}/triggers/manual/listCallbackUrl",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CancelFlowRun": {
        "path": "/{connectionId}/environments/{environmentName}/flows/{flowName}/runs/{runId}/cancel",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "runId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListFlowsInEnvironment_V2": {
        "path": "/{connectionId}/scopes/admin/environments/{environmentName}/v2/flows",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          },
          {
            "name": "expandSuspensionInfo",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeSoftDeletedFlows",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "AdminModifyFlowOwners": {
        "path": "/{connectionId}/scopes/admin/environments/{environmentName}/flows/{flowName}/modifyOwners",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "permissions",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "AdminGetFlow": {
        "path": "/{connectionId}/scopes/admin/environments/{environmentName}/flows/{flowName}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "includeFlowDefinition",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "AdminRestoreFlow": {
        "path": "/{connectionId}/scopes/admin/environments/{environmentName}/flows/{flowName}/restore",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      }
    }
  },
  "microsoftflowforadmins": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Remove-AdminFlow": {
        "path": "/{connectionId}/providers/Microsoft.ProcessSimple/scopes/admin/environments/{environment}/flows/{flow}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flow",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Enable-AdminFlow": {
        "path": "/{connectionId}/providers/Microsoft.ProcessSimple/scopes/admin/environments/{environment}/flows/{flow}/start",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flow",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Disable-AdminFlow": {
        "path": "/{connectionId}/providers/Microsoft.ProcessSimple/scopes/admin/environments/{environment}/flows/{flow}/stop",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flow",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Edit-AdminFlowOwnerRole": {
        "path": "/{connectionId}/providers/Microsoft.ProcessSimple/scopes/admin/environments/{environment}/flows/{flow}/modifyPermissions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flow",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "Content-Type",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Get-AdminFlowOwnerRole": {
        "path": "/{connectionId}/providers/Microsoft.ProcessSimple/scopes/admin/environments/{environment}/flows/{flow}/permissions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flow",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "Get-AdminFlowUserDetails": {
        "path": "/{connectionId}/providers/Microsoft.ProcessSimple/scopes/admin/users/{userId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "Remove-AdminFlowUserDetails": {
        "path": "/{connectionId}/providers/Microsoft.ProcessSimple/scopes/admin/users/{userId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      }
    }
  },
  "office365": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "OnUpcomingEvents": {
        "path": "/{connectionId}/Events/OnUpcomingEvents",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "lookAheadTimeInMinutes",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnUpcomingEventsV2": {
        "path": "/{connectionId}/v2/Events/OnUpcomingEvents",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "lookAheadTimeInMinutes",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnUpcomingEventsV3": {
        "path": "/{connectionId}/v3/Events/OnUpcomingEvents",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "lookAheadTimeInMinutes",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEventsCalendarView": {
        "path": "/{connectionId}/Events/CalendarView",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "calendarId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDateTimeOffset",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDateTimeOffset",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmails": {
        "path": "/{connectionId}/Mail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyUnread",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "searchQuery",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendEmail": {
        "path": "/{connectionId}/Mail",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "emailMessage",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOutlookCategoryNames": {
        "path": "/{connectionId}/Categories",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DraftEmail": {
        "path": "/{connectionId}/Draft",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "draftMessage",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "messageId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "draftType",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "comment",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateDraftEmail": {
        "path": "/{connectionId}/Draft",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "draftMessage",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "messageId",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendDraftEmail": {
        "path": "/{connectionId}/Draft/Send/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "AssignCategory": {
        "path": "/{connectionId}/Mail/Category",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "category",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "AssignCategoryBulk": {
        "path": "/{connectionId}/Mail/Category/Bulk/{categoryName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageIds",
            "in": "body",
            "required": true,
            "type": "array"
          },
          {
            "name": "categoryName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmailsV2": {
        "path": "/{connectionId}/v2/Mail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyUnread",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchOnlyFlagged",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "searchQuery",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendEmailV2": {
        "path": "/{connectionId}/v2/Mail",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "emailMessage",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmail": {
        "path": "/{connectionId}/Mail/{messageId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "internetMessageId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteEmail": {
        "path": "/{connectionId}/Mail/{messageId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmailV2": {
        "path": "/{connectionId}/v2/Mail/{messageId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "internetMessageId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "extractSensitivityLabel",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchSensitivityLabelMetadata",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmailsV3": {
        "path": "/{connectionId}/v3/Mail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyUnread",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchOnlyFlagged",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "searchQuery",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "Move": {
        "path": "/{connectionId}/Mail/Move/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MoveV2": {
        "path": "/{connectionId}/v2/Mail/Move/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "Flag": {
        "path": "/{connectionId}/Mail/Flag/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MarkAsRead": {
        "path": "/{connectionId}/Mail/MarkAsRead/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ReplyTo": {
        "path": "/{connectionId}/Mail/ReplyTo/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "comment",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "replyAll",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ReplyToV2": {
        "path": "/{connectionId}/v2/Mail/ReplyTo/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "replyParameters",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ReplyToV3": {
        "path": "/{connectionId}/v3/Mail/ReplyTo/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "replyParameters",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetAttachment": {
        "path": "/{connectionId}/Mail/{messageId}/Attachments/{attachmentId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "attachmentId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewEmail": {
        "path": "/{connectionId}/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewEmailV2": {
        "path": "/{connectionId}/v2/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewEmailV3": {
        "path": "/{connectionId}/v3/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnFlaggedEmail": {
        "path": "/{connectionId}/Mail/OnFlaggedEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnFlaggedEmailV2": {
        "path": "/{connectionId}/v2/Mail/OnFlaggedEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnFlaggedEmailV3": {
        "path": "/{connectionId}/v3/Mail/OnFlaggedEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnFlaggedEmailV4": {
        "path": "/{connectionId}/v4/Mail/OnFlaggedEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewMentionMeEmail": {
        "path": "/{connectionId}/Mail/OnNewMentionMeEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageIdToFireOnFirstTriggerRun",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewMentionMeEmailV2": {
        "path": "/{connectionId}/v2/Mail/OnNewMentionMeEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageIdToFireOnFirstTriggerRun",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewMentionMeEmailV3": {
        "path": "/{connectionId}/v3/Mail/OnNewMentionMeEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageIdToFireOnFirstTriggerRun",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SetAutomaticRepliesSetting": {
        "path": "/{connectionId}/AutomaticRepliesSetting",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "clientSetting",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetMailTips": {
        "path": "/{connectionId}/MailTips",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateOnNewEmailSubscription": {
        "path": "/{connectionId}/MailSubscription/$subscriptions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "subscription",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "hasAttachment",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendMailWithOptions": {
        "path": "/{connectionId}/mailwithoptions/$subscriptions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "optionsEmailSubscription",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendApprovalMail": {
        "path": "/{connectionId}/approvalmail/$subscriptions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "approvalEmailSubscription",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SharedMailboxSendEmail": {
        "path": "/{connectionId}/SharedMailbox/Mail",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "emailMessage",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SharedMailboxSendEmailV2": {
        "path": "/{connectionId}/v2/SharedMailbox/Mail",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "emailMessage",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SharedMailboxOnNewEmail": {
        "path": "/{connectionId}/SharedMailbox/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "hasAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SharedMailboxOnNewEmailV2": {
        "path": "/{connectionId}/v2/SharedMailbox/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "hasAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetTables": {
        "path": "/{connectionId}/datasets/calendars/tables",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetItems": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarPostItem": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetItem": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarDeleteItem": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarPatchItem": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V3CalendarGetItems": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V3CalendarPostItem": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V4CalendarGetItems": {
        "path": "/{connectionId}/datasets/calendars/v4/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V4CalendarPostItem": {
        "path": "/{connectionId}/datasets/calendars/v4/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V2CalendarGetItems": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V2CalendarPostItem": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEventsCalendarViewV2": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/items/calendarview",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "calendarId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDateTimeOffset",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDateTimeOffset",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEventsCalendarViewV3": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/items/calendarview",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "calendarId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDateTimeUtc",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDateTimeUtc",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V2CalendarGetItem": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/items/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V2CalendarPatchItem": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V3CalendarGetItem": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/items/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V3CalendarPatchItem": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V4CalendarPatchItem": {
        "path": "/{connectionId}/datasets/calendars/v4/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnNewItems": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/onnewitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnUpdatedItems": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/onupdateditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnNewItemsV2": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/onnewitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnNewItemsV3": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/onnewitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnUpdatedItemsV2": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/onupdateditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnUpdatedItemsV3": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/onupdateditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnChangedItems": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/onchangeditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "incomingDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pastDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnChangedItemsV2": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/onchangeditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "incomingDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pastDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnChangedItemsV3": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/onchangeditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "incomingDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pastDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetTables": {
        "path": "/{connectionId}/datasets/contacts/tables",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetTablesV2": {
        "path": "/{connectionId}/v2/datasets/contacts/tables",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetItems": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactPostItem": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetItem": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactDeleteItem": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactPatchItem": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ExportEmail": {
        "path": "/{connectionId}/codeless/api/beta/me/messages/{messageId}/$value",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ExportEmail_V2": {
        "path": "/{connectionId}/codeless/beta/me/messages/{messageId}/$value",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "Flag_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{messageId}/flag",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MarkAsRead_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{messageId}/markAsRead",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MarkAsRead_V3": {
        "path": "/{connectionId}/codeless/v3/v1.0/me/messages/{messageId}/markAsRead",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteEmail_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{messageId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetAttachment_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{messageId}/attachments/{attachmentId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "attachmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "extractSensitivityLabel",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchSensitivityLabelMetadata",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "RespondToEvent": {
        "path": "/{connectionId}/codeless/api/v2.0/me/events/{event_id}/{response}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "event_id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "response",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "RespondToEvent_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/events/{event_id}/{response}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "event_id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "response",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ForwardEmail": {
        "path": "/{connectionId}/codeless/api/v2.0/me/messages/{message_id}/forward",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "message_id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ForwardEmail_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{message_id}/forward",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "message_id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "extractSensitivityLabel",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchSensitivityLabelMetadata",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetRoomLists": {
        "path": "/{connectionId}/codeless/api/beta/me/findroomlists",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRoomLists_V2": {
        "path": "/{connectionId}/codeless/beta/me/findRoomLists",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRooms": {
        "path": "/{connectionId}/codeless/api/beta/me/findrooms",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRooms_V2": {
        "path": "/{connectionId}/codeless/beta/me/findRooms",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRoomsInRoomList": {
        "path": "/{connectionId}/codeless/api/beta/me/findrooms(roomlist='{room_list}')",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "room_list",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRoomsInRoomList_V2": {
        "path": "/{connectionId}/codeless/beta/me/findRooms(RoomList='{room_list}')",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "room_list",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "FindMeetingTimes": {
        "path": "/{connectionId}/codeless/api/v2.0/me/findmeetingtimes",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "FindMeetingTimes_V2": {
        "path": "/{connectionId}/codeless/beta/me/findMeetingTimes",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "SetAutomaticRepliesSetting_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/mailboxSettings",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetMailTips_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/getMailTips",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetTables_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/calendars",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "orderBy",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarDeleteItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/calendars/{calendar}/events/{event}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "calendar",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "event",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactDeleteItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactPatchItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetItems_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactPostItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateMyContactPhoto": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts/{id}/photo/$value",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "string",
            "format": "binary"
          },
          {
            "name": "Content-Type",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "HttpRequest": {
        "path": "/{connectionId}/codeless/httprequest",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Uri",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "Method",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "Body",
            "in": "body",
            "required": false,
            "type": "string",
            "format": "binary"
          },
          {
            "name": "ContentType",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader1",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader2",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader3",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader4",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader5",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_EmailsManagement": {
        "path": "/{connectionId}/mcp/EmailsManagement",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_MeetingManagement": {
        "path": "/{connectionId}/mcp/MeetingManagement",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_ContactsManagement": {
        "path": "/{connectionId}/mcp/ContactsManagement",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      }
    }
  },
  "office365groups": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "ListGroupMembers": {
        "path": "/{connectionId}/v1.0/groups/{groupId}/members",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnGroupMembershipChange": {
        "path": "/{connectionId}/trigger/v1.0/groups/delta",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "query",
            "required": true,
            "type": "string",
            "format": "guid"
          },
          {
            "name": "$select",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "AddMemberToGroup": {
        "path": "/{connectionId}/v1.0/groups/{groupId}/members/$ref",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          },
          {
            "name": "userUpn",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          }
        }
      },
      "ListOwnedGroups": {
        "path": "/{connectionId}/v1.0/me/memberOf/$/microsoft.graph.group",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListOwnedGroups_V2": {
        "path": "/{connectionId}/v1.0/me/ownedObjects/$/microsoft.graph.group",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "extractSensitivityLabel",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchSensitivityLabelMetadata",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListOwnedGroups_V3": {
        "path": "/{connectionId}/v2/v1.0/me/memberOf/$/microsoft.graph.group",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "extractSensitivityLabel",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchSensitivityLabelMetadata",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListGroups": {
        "path": "/{connectionId}/v1.0/groups",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "extractSensitivityLabel",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchSensitivityLabelMetadata",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          },
          {
            "name": "$skiptoken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "CreateCalendarEvent": {
        "path": "/{connectionId}/v1.0/groups/{groupId}/events",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "CreateCalendarEventV2": {
        "path": "/{connectionId}/v2/v1.0/groups/{groupId}/events",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "CalendarDeleteItem_V2": {
        "path": "/{connectionId}/v1.0/groups/{groupId}/events/{event}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          },
          {
            "name": "event",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateCalendarEvent": {
        "path": "/{connectionId}/v1.0/groups/{groupId}/events/{event}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          },
          {
            "name": "event",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "RemoveMemberFromGroup": {
        "path": "/{connectionId}/v1.0/groups/{groupId}/members/memberId/$ref",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          },
          {
            "name": "userUpn",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          }
        }
      },
      "OnNewEvent": {
        "path": "/{connectionId}/trigger/v1.0/groups/{groupId}/events",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "HttpRequestV2": {
        "path": "/{connectionId}/v2/httprequest",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Uri",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "Method",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "Body",
            "in": "body",
            "required": false,
            "type": "string",
            "format": "binary"
          },
          {
            "name": "ContentType",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader1",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader2",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader3",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader4",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader5",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "HttpRequest": {
        "path": "/{connectionId}/httprequest",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Uri",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "Method",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "Body",
            "in": "body",
            "required": false,
            "type": "string",
            "format": "binary"
          },
          {
            "name": "ContentType",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader1",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader2",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader3",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader4",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader5",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ListDeletedGroups": {
        "path": "/{connectionId}/v1.0/directory/deletedItems/microsoft.graph.group",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "RestoreDeletedGroup": {
        "path": "/{connectionId}/v1.0/directory/deletedItems/{groupId}/restore",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "ListDeletedGroupsByOwner": {
        "path": "/{connectionId}/v1.0/directory/deletedItems/getUserOwnedObjects",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "userId",
            "in": "header",
            "required": true,
            "type": "string",
            "format": "guid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      }
    }
  },
  "powerappsforadmins": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Get-AdminAppRoleAssignment": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apps/{app}/permissions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "app",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "Set-AdminAppOwner": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apps/{app}/modifyAppOwner",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "app",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "Content-Type",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Set-AppQuarantineState": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apps/{app}/setAppQuarantineState",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "app",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "Content-Type",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Set-PowerAppConditionalAccess": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apps/{app}/setPowerAppConditionalAccessDetails",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "app",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "Content-Type",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Get-AdminApps": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apps",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          },
          {
            "name": "$skiptoken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "Get-PowerAppConditionalAccess": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apps/{app}/getPowerAppConditionalAccessDetails",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "app",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "Get-AdminApp": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apps/{app}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "app",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "Remove-AdminApp": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apps/{app}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "app",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Edit-AdminAppRoleAssignment": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apps/{app}/modifyPermissions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "app",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "Get-AdminConnections": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/connections",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "Remove-AdminConnection": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apis/{connectorName}/connections/{connectionName}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connectorName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connectionName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Get-AdminConnectionRoleAssignment": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apis/{connectorName}/connections/{connectionName}/permissions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connectorName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connectionName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "Edit-AdminConnectionRoleAssignment": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apis/{connector}/connections/{connection}/modifyPermissions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connector",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connection",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "Content-Type",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "Get-AdminConnectors": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apis",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "Get-AdminConnectorRoleAssignment": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apis/{connectorName}/permissions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connectorName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "Edit-AdminConnectorRoleAssignment": {
        "path": "/{connectionId}/providers/Microsoft.PowerApps/scopes/admin/environments/{environment}/apis/{connectorName}/modifyPermissions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environment",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connectorName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "Content-Type",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      }
    }
  },
  "powerplatformadminv2": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "InvokeAdvisorMCP": {
        "path": "/{connectionId}/analytics/mcp/Advisor",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "Mcp-Session-Id",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "ExecuteRecommendationAction": {
        "path": "/{connectionId}/analytics/actions/{actionName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "actionName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetRecommendations": {
        "path": "/{connectionId}/analytics/advisorRecommendations",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$skipToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetRecommendationResources": {
        "path": "/{connectionId}/analytics/advisorRecommendations/{scenario}/resources",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "scenario",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$skipToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetTenantApplicationPackage": {
        "path": "/{connectionId}/appmanagement/applicationPackages",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "GetEnvironmentApplicationPackage": {
        "path": "/{connectionId}/appmanagement/environments/{environmentId}/applicationPackages",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "appInstallState",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "lcid",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "InstallApplicationPackage": {
        "path": "/{connectionId}/appmanagement/environments/{environmentId}/applicationPackages/{uniqueName}/install",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "uniqueName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "GetApplicationPackageInstallStatus": {
        "path": "/{connectionId}/appmanagement/environments/{environmentId}/operations/{operationId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "operationId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "ListEnvironmentGroupRoleAssignments": {
        "path": "/{connectionId}/authorization/environmentGroups/{environmentGroupId}/roleAssignments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentGroupId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "CreateEnvironmentGroupRoleAssignment": {
        "path": "/{connectionId}/authorization/environmentGroups/{environmentGroupId}/roleAssignments",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentGroupId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "DeleteEnvironmentGroupRoleAssignment": {
        "path": "/{connectionId}/authorization/environmentGroups/{environmentGroupId}/roleAssignments/{roleAssignmentId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentGroupId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "roleAssignmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "SearchEnvironmentRoleAssignments": {
        "path": "/{connectionId}/authorization/environments/{environmentId}/listRoleAssignments",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListEnvironmentRoleAssignments": {
        "path": "/{connectionId}/authorization/environments/{environmentId}/roleAssignments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "CreateEnvironmentRoleAssignment": {
        "path": "/{connectionId}/authorization/environments/{environmentId}/roleAssignments",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "DeleteEnvironmentRoleAssignment": {
        "path": "/{connectionId}/authorization/environments/{environmentId}/roleAssignments/{roleAssignmentId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "roleAssignmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "SearchRoleAssignments": {
        "path": "/{connectionId}/authorization/listRoleAssignments",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListRoleAssignments": {
        "path": "/{connectionId}/authorization/roleAssignments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "CreateRoleAssignment": {
        "path": "/{connectionId}/authorization/roleAssignments",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "DeleteRoleAssignment": {
        "path": "/{connectionId}/authorization/roleAssignments/{roleAssignmentId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "roleAssignmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListRoleDefinitions": {
        "path": "/{connectionId}/authorization/roleDefinitions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListConnections": {
        "path": "/{connectionId}/connectivity/environments/{environmentId}/connections",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListConnectors": {
        "path": "/{connectionId}/connectivity/environments/{environmentId}/connectors",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetConnectorById": {
        "path": "/{connectionId}/connectivity/environments/{environmentId}/connectors/{connectorId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connectorId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "DownloadAgentChannelManifest": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/agents/{AgentId}/channels/{ChannelName}/download",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "AgentId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "ChannelName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "includeAgentSchema",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          }
        }
      },
      "DeleteCopilotAgent": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/botAdminOperations",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "ReassignCopilotAgent": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/botAdminOperations/reassign",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetBotQuarantineStatus": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/botQuarantine",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "SetBotAsQuarantined": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/botQuarantine/SetAsQuarantined",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "SetBotAsUnquarantined": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/botQuarantine/SetAsUnquarantined",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetConnectorConsentBypass": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/connectorConsentBypass",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "SetConnectorConsentBypass": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/connectorConsentBypass",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListMakerEvaluationTestRuns": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/makerevaluation/testruns",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetMakerEvaluationTestRun": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/makerevaluation/testruns/{TestRunId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "TestRunId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "DownloadMakerEvaluationSnapshot": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/makerevaluation/testruns/{TestRunId}/snapshot",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "TestRunId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "ListMakerEvaluationTestSets": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/makerevaluation/testsets",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetMakerEvaluationTestSet": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/makerevaluation/testsets/{TestSetId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "TestSetId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "RunMakerEvaluationTestSet": {
        "path": "/{connectionId}/copilotstudio/environments/{EnvironmentId}/bots/{BotId}/api/makerevaluation/testsets/{TestSetId}/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "EnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "BotId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "TestSetId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GenerateLicensingReport": {
        "path": "/{connectionId}/copilotstudio/licensing/reports/{ReportName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "ReportName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "DownloadLicensingReportFile": {
        "path": "/{connectionId}/copilotstudio/licensing/reports/{ReportName}/files/{FileName}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "ReportName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "FileName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetLicensingReportOperation": {
        "path": "/{connectionId}/copilotstudio/licensing/reports/{ReportName}/operations/{OperationId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "ReportName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "OperationId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetFinOpsMaintenanceSettings": {
        "path": "/{connectionId}/dynamics/environments/{environmentId}/finopsadminsettings",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "UpdateFinOpsMaintenanceSettings": {
        "path": "/{connectionId}/dynamics/environments/{environmentId}/finopsadminsettings",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "GetFinOpsProperties": {
        "path": "/{connectionId}/dynamics/environments/{environmentId}/finopsproperties",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "GetFinOpsVersions": {
        "path": "/{connectionId}/dynamics/environments/{environmentId}/finopsversions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "ApplyFinOpsVersion": {
        "path": "/{connectionId}/dynamics/environments/{environmentId}/finopsversions/{version}/apply",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "version",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "GetFinOpsOperationErrors": {
        "path": "/{connectionId}/dynamics/environments/{environmentId}/operationerrors",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "maxResults",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "CreateEnvironmentManagementSettings": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/settings",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "409": {
            "type": "object"
          }
        }
      },
      "ListEnvironmentManagementSettings": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/settings",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          },
          {
            "name": "$select",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "429": {
            "type": "object"
          }
        }
      },
      "UpdateEnvironmentManagementSettings": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/settings",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "409": {
            "type": "object"
          },
          "412": {
            "type": "object"
          }
        }
      },
      "CreateEnvironmentBackup": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/backups",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetEnvironmentBackups": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/backups",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "DeleteEnvironmentBackup": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/backups/{backupId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "backupId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetBusinessContinuityStateFullSnapshot": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/businessContinuityStateFullSnapshot",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "DisableDisasterRecovery": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/disableDisasterRecovery",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "PerformDRDrill": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/disasterRecoveryDrill",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "EnableDisasterRecovery": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/enableDisasterRecovery",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "PerformFailback": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/failback",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "PerformForceFailover": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/forceFailover",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "DisableManagedEnvironment": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/governanceSetting/disableManaged",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "EnableManagedEnvironment": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/governanceSetting/enableManaged",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "ModifyEnvironmentSku": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/modifySku",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetOperationsForEnvironment": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/operations",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "RecoverEnvironment": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/recover",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "ResetEnvironment": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}/reset",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetEnvironmentCopyCandidates": {
        "path": "/{connectionId}/environmentmanagement/environments/{sourceEnvironmentId}/copyCandidates",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "sourceEnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetRestoreCandidates": {
        "path": "/{connectionId}/environmentmanagement/environments/{sourceEnvironmentId}/restoreCandidates",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "sourceEnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "CopyEnvironment": {
        "path": "/{connectionId}/environmentmanagement/environments/{targetEnvironmentId}/copy",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "targetEnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetEnvironmentOperationByID": {
        "path": "/{connectionId}/environmentmanagement/environments/{targetEnvironmentId}/operations/{operationId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "targetEnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "operationId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "RestoreEnvironment": {
        "path": "/{connectionId}/environmentmanagement/environments/{targetEnvironmentId}/restore",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "targetEnvironmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetOperationByID": {
        "path": "/{connectionId}/environmentmanagement/operations/{operationId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "operationId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "ProvisionNewEnvironment": {
        "path": "/{connectionId}/environmentmanagement/provisioning/environments",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "LinkDataverse": {
        "path": "/{connectionId}/environmentmanagement/provisioning/environments/{environmentId}/link",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetSupportedLocations": {
        "path": "/{connectionId}/environmentmanagement/provisioning/locations",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetProvisioningCurrencies": {
        "path": "/{connectionId}/environmentmanagement/provisioning/locations/{location}/currencies",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "location",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetProvisioningLanguages": {
        "path": "/{connectionId}/environmentmanagement/provisioning/locations/{location}/languages",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "location",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetProvisioningTemplates": {
        "path": "/{connectionId}/environmentmanagement/provisioning/locations/{location}/templates",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "location",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "GetEnvironmentGroupOperation": {
        "path": "/{connectionId}/environmentmanagement/environmentGroupOperations/{operationId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "operationId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          }
        }
      },
      "CreateEnvironmentGroup": {
        "path": "/{connectionId}/environmentmanagement/environmentGroups",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          }
        }
      },
      "ListEnvironmentGroups": {
        "path": "/{connectionId}/environmentmanagement/environmentGroups",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          }
        }
      },
      "GetEnvironmentGroup": {
        "path": "/{connectionId}/environmentmanagement/environmentGroups/{groupId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          }
        }
      },
      "UpdateEnvironmentGroup": {
        "path": "/{connectionId}/environmentmanagement/environmentGroups/{groupId}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          }
        }
      },
      "DeleteEnvironmentGroup": {
        "path": "/{connectionId}/environmentmanagement/environmentGroups/{groupId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          }
        }
      },
      "AddEnvironmentToGroup": {
        "path": "/{connectionId}/environmentmanagement/environmentGroups/{groupId}/addEnvironment/{environmentId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          }
        }
      },
      "RemoveEnvironmentFromGroup": {
        "path": "/{connectionId}/environmentmanagement/environmentGroups/{groupId}/removeEnvironment/{environmentId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          }
        }
      },
      "ListEnvironmentsForUser": {
        "path": "/{connectionId}/environmentmanagement/environments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$select",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetEnvironmentByIdForUser": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$select",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "DeleteEnvironmentByID": {
        "path": "/{connectionId}/environmentmanagement/environments/{environmentId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ValidateOnly",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "ValidateProperties",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "409": {
            "type": "object"
          },
          "429": {
            "type": "void"
          }
        }
      },
      "CreateRuleBasedPolicy": {
        "path": "/{connectionId}/governance/ruleBasedPolicies",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListRuleBasedPolicies": {
        "path": "/{connectionId}/governance/ruleBasedPolicies",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetRuleBasedPolicyByID": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/{policyId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "policyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "UpdateRuleBasedPolicyByID": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/{policyId}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "policyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "PatchRuleBasedPolicy": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/{policyId}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "policyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListRuleAssignmentsByPolicyId": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/{policyId}/assignments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "policyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "includeRuleSetCounts",
            "in": "query",
            "required": true,
            "type": "boolean"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "CreateEnviornmentGroupRuleBasedAssignment": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/{policyId}/environmentGroups/{groupId}/assignments",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "policyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "CreateEnvironmentRuleBasedAssignment": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/{policyId}/environments/{environmentId}/assignments",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "policyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "RemoveRuleFromRuleBasedPolicy": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/{policyId}/removeRule",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "policyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListRuleAssignments": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/assignments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "includeRuleSetCounts",
            "in": "query",
            "required": true,
            "type": "boolean"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListRuleAssignmentsByEnvironmentGroupId": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/environmentGroups/{environmentGroupId}/assignments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentGroupId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "includeRuleSetCounts",
            "in": "query",
            "required": true,
            "type": "boolean"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListRuleAssignmentsByEnvironmentId": {
        "path": "/{connectionId}/governance/ruleBasedPolicies/environments/{environmentId}/assignments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "includeRuleSetCounts",
            "in": "query",
            "required": true,
            "type": "boolean"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetRuleSet": {
        "path": "/{connectionId}/governance/environmentGroups/{groupId}/ruleSets",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "CreateRuleSet": {
        "path": "/{connectionId}/governance/environmentGroups/{groupId}/ruleSets",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "GetRuleSetListForTenant": {
        "path": "/{connectionId}/governance/ruleSets",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$select",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$expand",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$skiptoken",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "UpdateRuleSet": {
        "path": "/{connectionId}/governance/ruleSets/{ruleSetId}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "ruleSetId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "DeleteRuleSet": {
        "path": "/{connectionId}/governance/ruleSets/{ruleSetId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "ruleSetId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "500": {
            "type": "object"
          }
        }
      },
      "ListCrossTenantConnectionReports": {
        "path": "/{connectionId}/governance/crossTenantConnectionReports",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "CreateCrossTenantConnectionReport": {
        "path": "/{connectionId}/governance/crossTenantConnectionReports",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetCrossTenantConnectionReport": {
        "path": "/{connectionId}/governance/crossTenantConnectionReports/{reportId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "reportId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "PutAllocationsV2": {
        "path": "/{connectionId}/licensing/allocationsV2",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "GetAllocationsAvailabilityV2": {
        "path": "/{connectionId}/licensing/allocationsV2/availability",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "GetManyEntitlementsReservedV2": {
        "path": "/{connectionId}/licensing/allocationsV2/entitlements/reserved",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "GetEntitlement": {
        "path": "/{connectionId}/licensing/entitlements/{entitlementId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entitlementId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetEnvironmentResources": {
        "path": "/{connectionId}/licensing/entitlements/{entitlementId}/environments/{environmentId}/resources",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entitlementId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fromDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "toDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "searchRequest",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeFields",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "orderbyConsumed",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetTenantLicenseTrends": {
        "path": "/{connectionId}/licensing/entitlements/{entitlementId}/licenses",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entitlementId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fromDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "toDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetTenantResourcesAcrossEnvironments": {
        "path": "/{connectionId}/licensing/entitlements/{entitlementId}/resources",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entitlementId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fromDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "toDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "pageSize",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetTenantUserConsumptionByResource": {
        "path": "/{connectionId}/licensing/entitlements/{entitlementId}/resources/{resourceId}/users",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entitlementId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "resourceId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fromDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "toDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "pageSize",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "searchRequest",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetAllResourceThresholds": {
        "path": "/{connectionId}/licensing/entitlements/{entitlementId}/resourceThresholds",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entitlementId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "GetTenantUsers": {
        "path": "/{connectionId}/licensing/entitlements/{entitlementId}/users",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entitlementId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fromDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "toDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "pageSize",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "searchRequest",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "orderbyConsumed",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetTenantResourceConsumptionByUser": {
        "path": "/{connectionId}/licensing/entitlements/{entitlementId}/users/{userId}/resources",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entitlementId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "fromDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "toDate",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "pageSize",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "searchRequest",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetManyEnvironmentEntitlements": {
        "path": "/{connectionId}/licensing/environments/{environmentId}/entitlements",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "UpsertResourceThreshold": {
        "path": "/{connectionId}/licensing/environments/{environmentId}/entitlements/{entitlementId}/resources/{resourceId}/threshold",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entitlementId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "resourceId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "GetFinOpsLicenseSummaryV2": {
        "path": "/{connectionId}/licensing/FinOpsLicensing/GetLicenseSummaryV2",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "ListAllocationsByEnvironment": {
        "path": "/{connectionId}/licensing/allocationsByEnvironment",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "UpdateAllocationsByEnvironment": {
        "path": "/{connectionId}/licensing/allocationsByEnvironment",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetAllocationsByEnvironment": {
        "path": "/{connectionId}/licensing/allocationsByEnvironment/{environmentId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "ListBillingPolicies": {
        "path": "/{connectionId}/licensing/billingPolicies",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "CreateBillingPolicy": {
        "path": "/{connectionId}/licensing/billingPolicies",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "GetBillingPolicy": {
        "path": "/{connectionId}/licensing/billingPolicies/{billingPolicyId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "billingPolicyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "UpdateBillingPolicy": {
        "path": "/{connectionId}/licensing/billingPolicies/{billingPolicyId}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "billingPolicyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "DeleteBillingPolicy": {
        "path": "/{connectionId}/licensing/billingPolicies/{billingPolicyId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "billingPolicyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "ListBillingPolicyEnvironments": {
        "path": "/{connectionId}/licensing/billingPolicies/{billingPolicyId}/environments",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "billingPolicyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetBillingPolicyEnvironment": {
        "path": "/{connectionId}/licensing/billingPolicies/{billingPolicyId}/environments/{environmentId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "billingPolicyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "AddBillingPolicyEnvironment": {
        "path": "/{connectionId}/licensing/billingPolicies/{billingPolicyId}/environments/add",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "billingPolicyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "RemoveBillingPolicyEnvironment": {
        "path": "/{connectionId}/licensing/billingPolicies/{billingPolicyId}/environments/remove",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "billingPolicyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "RefreshProvisioningStatus": {
        "path": "/{connectionId}/licensing/billingPolicies/{billingPolicyId}/refreshProvisioningStatus",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "billingPolicyId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetCurrencyAllocationByEnvironment": {
        "path": "/{connectionId}/licensing/environments/{environmentId}/allocations",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "PatchCurrencyAllocationByEnvironment": {
        "path": "/{connectionId}/licensing/environments/{environmentId}/allocations",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetEnvironmentBillingPolicy": {
        "path": "/{connectionId}/licensing/environments/{environmentId}/billingPolicy",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "ListISVContracts": {
        "path": "/{connectionId}/licensing/isvContracts",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "CreateISVContract": {
        "path": "/{connectionId}/licensing/isvContracts",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          }
        }
      },
      "GetISVContract": {
        "path": "/{connectionId}/licensing/isvContracts/{isvContractId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "isvContractId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "UpdateISVContract": {
        "path": "/{connectionId}/licensing/isvContracts/{isvContractId}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "isvContractId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "DeleteISVContract": {
        "path": "/{connectionId}/licensing/isvContracts/{isvContractId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "isvContractId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetStorageWarningByCategory": {
        "path": "/{connectionId}/licensing/storageWarning/{storageCategory}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "storageCategory",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GetStorageWarningByCategoryAndEntity": {
        "path": "/{connectionId}/licensing/storageWarning/{storageCategory}/{entityName}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "storageCategory",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "entityName",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "ListStorageWarnings": {
        "path": "/{connectionId}/licensing/storageWarning/getAllStorageWarnings",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "RetrieveTemporaryCurrencyEntitlementCount": {
        "path": "/{connectionId}/licensing/TemporaryCurrencyEntitlement/{currencyType}/Count",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "currencyType",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "array"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetTenantCapacityDetails": {
        "path": "/{connectionId}/licensing/tenantCapacity",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "ListCurrencyReports": {
        "path": "/{connectionId}/licensing/tenantCapacity/currencyReports",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "includeAllocations",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeConsumptions",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetUserPerFlowCapacitySource": {
        "path": "/{connectionId}/licensing/UserPerFlowCapacitySource",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "pageNumber",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pageSize",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "userId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "flowContext",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "flowLicenseCategorization",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "resourceId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetUserPerFlowCapacitySourceFlowContextSummary": {
        "path": "/{connectionId}/licensing/UserPerFlowCapacitySource/FlowContextSummary",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "pageNumber",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pageSize",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "environmentId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetUserPerFlowCapacitySourceFlowContextSummaryForUserId": {
        "path": "/{connectionId}/licensing/UserPerFlowCapacitySource/FlowContextSummary/{userId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "pageNumber",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pageSize",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "environmentId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetUserPerFlowCapacitySourceTenantContextSummary": {
        "path": "/{connectionId}/licensing/UserPerFlowCapacitySource/TenantContextSummary",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "environmentId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetUserPerFlowCapacitySourceUserContextSummary": {
        "path": "/{connectionId}/licensing/UserPerFlowCapacitySource/UserContextSummary",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "pageNumber",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pageSize",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "environmentId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetUserPerFlowCapacitySourceUserContextSummaryForUserId": {
        "path": "/{connectionId}/licensing/UserPerFlowCapacitySource/UserContextSummary/{userId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "startDate",
            "in": "query",
            "required": true,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date-time"
          },
          {
            "name": "pageNumber",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pageSize",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "environmentId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "OnAlertTriggered": {
        "path": "/{connectionId}/monitoringhub/powerplatform/triggeredAlerts/poll",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "429": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "Get-AdminApps": {
        "path": "/{connectionId}/powerapps/environments/{environmentId}/apps",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer"
          },
          {
            "name": "$skiptoken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "Get-AdminApp": {
        "path": "/{connectionId}/powerapps/environments/{environmentId}/apps/{app}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "app",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListCloudFlows": {
        "path": "/{connectionId}/powerautomate/environments/{environmentId}/cloudFlows",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "workflowId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "resourceId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "createdBy",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "ownerId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "createdOnStartDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date"
          },
          {
            "name": "createdOnEndDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date"
          },
          {
            "name": "modifiedOnStartDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date"
          },
          {
            "name": "modifiedOnEndDate",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "date"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "object"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListFlowActions": {
        "path": "/{connectionId}/powerautomate/environments/{environmentId}/flowActions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "workflowId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "parentProcessStageId",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "connector",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "isTrigger",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "parameterName",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "parameterValue",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "exact",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "object"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ListFlowRuns": {
        "path": "/{connectionId}/powerautomate/environments/{environmentId}/flowRuns",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "workflowId",
            "in": "query",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "object"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetAffectedSites": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/exceptions/affectedSites",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "exceptionType",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GrantException": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/exceptions/grant",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GetExceptions": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/exceptions/list",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "exceptionType",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "RevokeException": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/exceptions/revoke",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GetWebsites": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "skip",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          }
        }
      },
      "CreateWebsite": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GetWebsiteById": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "DeleteWebsite": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Operation-Location",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "UploadCertificate": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/certificates",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "certType",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "file",
            "in": "formData",
            "required": false,
            "type": "file"
          },
          {
            "name": "password",
            "in": "formData",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GetCertificatesByPortal": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/certificates",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "certType",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "DeleteCertificateByPortal": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/certificates",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "thumbprint",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "certType",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "ConvertTrialToProduction": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/convertToProduction",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "CreateWafRules": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/createWafRules",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "ListHostNamesForPortal": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/customDomain",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "CreateCustomDomain": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/customDomain",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "customDomain",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "DeleteHostNameForPortal": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/customDomain",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "hostName",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "DeleteWafCustomRules": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/deleteWafCustomRules",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "DisableWaf": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/disableWaf",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "EnableWAF": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/enableWaf",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "409": {
            "type": "object"
          }
        }
      },
      "GetWAFRules": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/getWafRules",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "ruleType",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GetWAFStatus": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/getWafStatus",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GetAllowedIpAddresses": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/ipaddressrules",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "AddAllowedIpAddresses": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/ipaddressrules",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "RemoveAllowedIpAddresses": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/removeAllowedIpAddresses",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "RestartWebsite": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/restart",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GetSecurityScanReport": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/scan/deep/getLatestCompletedReport",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "GetSecurityScanScore": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/scan/deep/getSecurityScore",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "StartDeepScan": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/scan/deep/start",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "StartQuickScan": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/scan/quick/execute",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "lcid",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "SetPortalBootstrapV5Enabled": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/SetPortalBootstrapV5Enabled",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "SetPortalDataModelVersion": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/setPortalDataModelVersion",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "ListSslBindingsByThumbprints": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/sslBindings",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "hostName",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "AddSslBindingByPortal": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/sslBindings",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "thumbprint",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "hostName",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "DeleteSslBindingByThumbprint": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/sslBindings",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "hostName",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "thumbprint",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "StartWebsite": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/start",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "StopWebsite": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/stop",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "ToggleAFDTrafficRouting": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/toggleAFDTrafficRouting",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "enableAFD",
            "in": "query",
            "required": true,
            "type": "boolean"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "UpdatePortalSecurityGroup": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/updatePortalSecurityGroup",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "securityGroupId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "UpdateSiteVisibility": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/updateSiteVisibility",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "siteVisibility",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "UpdateWafPolicySettings": {
        "path": "/{connectionId}/powerpages/environments/{environmentId}/websites/{id}/updateWafPolicySettings",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "404": {
            "type": "object"
          }
        }
      },
      "QueryResources": {
        "path": "/{connectionId}/resourcequery/resources/query",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "429": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "ApplyAdminRole": {
        "path": "/{connectionId}/usermanagement/environments/{environmentId}/user/applyAdminRole",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          }
        }
      },
      "GetFlowRunActionsForDsr": {
        "path": "/{connectionId}/workflowsagent/aiFlows/{aiFlowId}/runs/{runId}/actions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "aiFlowId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "runId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int64"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetApprovals": {
        "path": "/{connectionId}/workflowsagent/approvals",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "DeleteApproval": {
        "path": "/{connectionId}/workflowsagent/approvals/{approvalId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "approvalId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetConnections": {
        "path": "/{connectionId}/workflowsagent/connections",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "DeleteConnection": {
        "path": "/{connectionId}/workflowsagent/connections/{connectionIdentifier}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "connectionIdentifier",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetConversationTranscriptsForDsr": {
        "path": "/{connectionId}/workflowsagent/conversationTranscripts",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetFlowRunActionsWithEnvironment": {
        "path": "/{connectionId}/workflowsagent/environments/{environmentId}/aiFlows/{aiFlowId}/runs/{runId}/actions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "aiFlowId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "runId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int64"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetConversationTranscriptsWithEnvironment": {
        "path": "/{connectionId}/workflowsagent/environments/{environmentId}/conversationTranscripts",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetFlowRunsNonSingleton": {
        "path": "/{connectionId}/workflowsagent/environments/{environmentId}/flows/{flowId}/flowRuns",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetRunHistoryDataNonSingleton": {
        "path": "/{connectionId}/workflowsagent/environments/{environmentId}/flows/{flowId}/runs/{runId}/runHistoryData",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "environmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "runId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetFlows": {
        "path": "/{connectionId}/workflowsagent/flows",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "DeleteFlow": {
        "path": "/{connectionId}/workflowsagent/flows/{flowId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetFlowRunsSingleton": {
        "path": "/{connectionId}/workflowsagent/flows/{flowId}/flowRuns",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetRunHistoryData": {
        "path": "/{connectionId}/workflowsagent/flows/{flowId}/runs/{runId}/runHistoryData",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "flowId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "runId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "GetPrompts": {
        "path": "/{connectionId}/workflowsagent/prompts",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "continuationToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "DeletePrompt": {
        "path": "/{connectionId}/workflowsagent/prompts/{promptId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "promptId",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "uuid"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          },
          "500": {
            "type": "void"
          }
        }
      },
      "mcp_EnvironmentManagement": {
        "path": "/{connectionId}/mcp/EnvironmentManagement",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_Governance": {
        "path": "/{connectionId}/mcp/Governance",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      }
    }
  },
  "webcontents": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "GetFileContent": {
        "path": "/{connectionId}/GetFileContent",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "path",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "object"
          }
        }
      },
      "InvokeHttp": {
        "path": "/{connectionId}/codeless/InvokeHttp",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "request",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "default": {
            "type": "object"
          }
        }
      }
    }
  }
};
