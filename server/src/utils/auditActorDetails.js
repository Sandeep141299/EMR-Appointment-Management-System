export function getAuditActorDetails(actor, requestDetails) {
  return {
    actorId: actor?._id || null,
    role: actor?.role || null,
    ipAddress: requestDetails.ipAddress,
    userAgent: requestDetails.userAgent,
  };
}
