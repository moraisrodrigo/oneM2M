export enum CustomAttributes {
    CSEBase = 'm2m:cb',
    ApplicationEntity = 'm2m:ae',
    Container = 'm2m:cnt',
    ContentInstance = 'm2m:cin',
    UriPath = 'm2m:uril',
    Management = 'm2m:mgmtCmd',
}

export enum HTTPStatusCode {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    BAD_REQUEST = 400,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    NOT_ACCEPTABLE = 406,
    REQUEST_TIMEOUT = 408,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
}

export enum StatusCode {
    OK = 2000,
    DELETED = 2002,
    UPDATED = 2004,
    CREATED = 2001,
    ACCEPTED = 1000,
    BAD_REQUEST = 4000,
    CONTENTS_UNACCEPTABLE = 4102,
    MAX_NUMBER_OF_MEMBER_EXCEEDED = 6010,
    MEMBER_TYPE_INCONSISTENT = 6011,
    INVALID_CMDTYPE = 6022,
    INVALID_ARGUMENTS = 6023,
    INSUFFICIENT_ARGUMENT = 6024,
    ALREADY_COMPLETE = 6028,
    MGMT_COMMAND_NOT_CANCELLABLE = 6029,
    SUBSCRIPTION_CREATOR_HAS_NO_PRIVILEGE = 4101,
    ORIGINATOR_HAS_NO_PRIVILEGE = 4103,
    RECEIVER_HAS_NO_PRIVILEGE = 5105,
    ALREADY_EXISTS = 5106,
    TARGET_NOT_SUBSCRIBABLE = 5203,
    SUBSCRIPTION_HOST_HAS_NO_PRIVILEGE = 5205,
    ORIGINATOR_HAS_NOT_REGISTERED = 4106,
    SECURITY_ASSOCIATION_REQUIRED = 4107,
    INVALID_CHILD_RESOURCE_TYPE = 4108,
    NO_MEMBERS = 4109,
    ESPRIM_UNSUPPORTED_OPTION = 4111,
    ESPRIM_UNKNOWN_KEY_ID = 4112,
    ESPRIM_UNKNOWN_ORIG_RAND_ID = 4113,
    ESPRIM_UNKNOWN_RECV_RAND_ID = 4114,
    ESPRIM_BAD_MAC = 4115,
    NOT_FOUND = 4004,
    TARGET_NOT_REACHABLE = 5103,
    EXTERNAL_OBJECT_NOT_REACHABLE = 6003,
    EXTERNAL_OBJECT_NOT_FOUND = 6005,
    OPERATION_NOT_ALLOWED = 4005,
    NOT_ACCEPTABLE = 5207,
    REQUEST_TIMEOUT = 4008,
    GROUP_REQUEST_IDENTIFIER_EXISTS = 4104,
    CONFLICT = 4105,
    INTERNAL_SERVER_ERROR = 5000,
    SUBSCRIPTION_VERIFICATION_INITIATION_FAILED = 5204,
    GROUP_MEMBERS_NOT_RESPONDED = 5209,
    ESPRIM_DECRYPTION_ERROR = 5210,
    ESPRIM_ENCRYPTION_ERROR = 5211,
    SPARQL_UPDATE_ERROR = 5212,
    MANAGEMENT_SESSION_CANNOT_BE_ESTABLISHED = 6020,
    MANAGEMENT_SESSION_ESTABLISHMENT_TIMEOUT = 6021,
    MGMT_CONVERSION_ERROR = 6025,
    MGMT_CANCELLATION_FAILED = 6026,
    NOT_IMPLEMENTED = 5001,
    NON_BLOCKING_REQUEST_NOT_SUPPORTED = 5206,
}

export const HTTPStatusCodeMapping: Record<StatusCode, HTTPStatusCode> = {
    // 200
    [StatusCode.OK]: HTTPStatusCode.OK,
    [StatusCode.DELETED]: HTTPStatusCode.OK,
    [StatusCode.UPDATED]: HTTPStatusCode.OK,

    // 201
    [StatusCode.CREATED]: HTTPStatusCode.CREATED,

    // 202
    [StatusCode.ACCEPTED]: HTTPStatusCode.ACCEPTED,

    // 400
    [StatusCode.BAD_REQUEST]: HTTPStatusCode.BAD_REQUEST,
    [StatusCode.CONTENTS_UNACCEPTABLE]: HTTPStatusCode.BAD_REQUEST,
    [StatusCode.MAX_NUMBER_OF_MEMBER_EXCEEDED]: HTTPStatusCode.BAD_REQUEST,
    [StatusCode.MEMBER_TYPE_INCONSISTENT]: HTTPStatusCode.BAD_REQUEST,
    [StatusCode.INVALID_CMDTYPE]: HTTPStatusCode.BAD_REQUEST,
    [StatusCode.INVALID_ARGUMENTS]: HTTPStatusCode.BAD_REQUEST,
    [StatusCode.INSUFFICIENT_ARGUMENT]: HTTPStatusCode.BAD_REQUEST,
    [StatusCode.ALREADY_COMPLETE]: HTTPStatusCode.BAD_REQUEST,
    [StatusCode.MGMT_COMMAND_NOT_CANCELLABLE]: HTTPStatusCode.BAD_REQUEST,

    //403
    [StatusCode.SUBSCRIPTION_CREATOR_HAS_NO_PRIVILEGE]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.ORIGINATOR_HAS_NO_PRIVILEGE]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.RECEIVER_HAS_NO_PRIVILEGE]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.ALREADY_EXISTS]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.TARGET_NOT_SUBSCRIBABLE]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.SUBSCRIPTION_HOST_HAS_NO_PRIVILEGE]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.ORIGINATOR_HAS_NOT_REGISTERED]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.SECURITY_ASSOCIATION_REQUIRED]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.INVALID_CHILD_RESOURCE_TYPE]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.NO_MEMBERS]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.ESPRIM_UNSUPPORTED_OPTION]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.ESPRIM_UNKNOWN_KEY_ID]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.ESPRIM_UNKNOWN_ORIG_RAND_ID]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.ESPRIM_UNKNOWN_RECV_RAND_ID]: HTTPStatusCode.FORBIDDEN,
    [StatusCode.ESPRIM_BAD_MAC]: HTTPStatusCode.FORBIDDEN,

    // 404
    [StatusCode.NOT_FOUND]: HTTPStatusCode.NOT_FOUND,
    [StatusCode.TARGET_NOT_REACHABLE]: HTTPStatusCode.NOT_FOUND,
    [StatusCode.EXTERNAL_OBJECT_NOT_REACHABLE]: HTTPStatusCode.NOT_FOUND,
    [StatusCode.EXTERNAL_OBJECT_NOT_FOUND]: HTTPStatusCode.NOT_FOUND,

    // 405
    [StatusCode.OPERATION_NOT_ALLOWED]: HTTPStatusCode.METHOD_NOT_ALLOWED,

    // 406
    [StatusCode.NOT_ACCEPTABLE]: HTTPStatusCode.NOT_ACCEPTABLE,

    // 408
    [StatusCode.REQUEST_TIMEOUT]: HTTPStatusCode.REQUEST_TIMEOUT,

    // 409
    [StatusCode.CONFLICT]: HTTPStatusCode.CONFLICT,
    [StatusCode.GROUP_REQUEST_IDENTIFIER_EXISTS]: HTTPStatusCode.CONFLICT,

    // 500
    [StatusCode.INTERNAL_SERVER_ERROR]: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    [StatusCode.SUBSCRIPTION_VERIFICATION_INITIATION_FAILED]: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    [StatusCode.GROUP_MEMBERS_NOT_RESPONDED]: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    [StatusCode.ESPRIM_DECRYPTION_ERROR]: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    [StatusCode.ESPRIM_ENCRYPTION_ERROR]: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    [StatusCode.SPARQL_UPDATE_ERROR]: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    [StatusCode.MANAGEMENT_SESSION_CANNOT_BE_ESTABLISHED]: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    [StatusCode.MANAGEMENT_SESSION_ESTABLISHMENT_TIMEOUT]: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    [StatusCode.MGMT_CONVERSION_ERROR]: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    [StatusCode.MGMT_CANCELLATION_FAILED]: HTTPStatusCode.INTERNAL_SERVER_ERROR,

    // 501
    [StatusCode.NOT_IMPLEMENTED]: HTTPStatusCode.NOT_IMPLEMENTED,
    [StatusCode.NON_BLOCKING_REQUEST_NOT_SUPPORTED]: HTTPStatusCode.NOT_IMPLEMENTED,
};
