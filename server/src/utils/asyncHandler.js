export function asyncHandler(handler) {
  return function handleAsyncRequest(req, res, next) {
    return Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };
}
